import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';
import { getSmartServiceRecommendation } from './src/server/geminiAdvisor.ts';
import { fetchServicesFromProvider, forwardOrderToProvider } from './src/server/providerApi.ts';
import type { UserRole, OrderStatus } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Token helper for JWT-style session management
interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

function generateToken(userId: string, role: UserRole): string {
  const payload: AuthTokenPayload = {
    userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function decodeToken(token: string): AuthTokenPayload | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.exp && parsed.exp > Date.now()) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
    username: string;
    name: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = decodeToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const user = db.getUserById(payload.userId, true);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  req.user = {
    id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
    name: user.name,
  };
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, username, name, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  const existingEmail = db.getUserByEmail(email);
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const existingUsername = db.getUserByUsername(username);
  if (existingUsername) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const newUser = db.createUser({
    email,
    username,
    name: name || username,
    password,
    role: 'user',
    balance: 0.0, // Default user balance 0.00 PKR
  });

  const token = generateToken(newUser.id, newUser.role);
  return res.json({ token, user: newUser });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  let user = db.getUserByEmail(usernameOrEmail);
  if (!user) {
    user = db.getUserByUsername(usernameOrEmail);
  }

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended' });
  }

  const token = generateToken(user.id, user.role);
  const { passwordHash, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// Google Sign-In (OAuth / One-click client integration)
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google email is required' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const created = db.createUser({
      email,
      username,
      name: name || email.split('@')[0],
      role: 'user',
      balance: 0.0,
    });
    user = db.getUserById(created.id, false);
  }

  if (!user) {
    return res.status(500).json({ error: 'Failed to authenticate user' });
  }

  const token = generateToken(user.id, user.role);
  const { passwordHash, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// Get current user profile & balance
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id, true);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

// ----------------------------------------------------
// SERVICES ENDPOINTS
// ----------------------------------------------------

// List all active services for clients (rates in PKR with 10% hidden markup)
app.get('/api/services', (_req: Request, res: Response) => {
  const services = db.getServices(false).filter((s) => s.status === 'active');
  return res.json({ services });
});

// ----------------------------------------------------
// ORDERS ENDPOINTS
// ----------------------------------------------------

// Get user orders (or all if admin requested)
app.get('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders(req.user!.role === 'admin' && req.query.all === 'true' ? undefined : req.user!.id);
  return res.json({ orders });
});

// Place new order in PKR
app.post('/api/orders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { serviceId, link, quantity } = req.body;
  const numQuantity = Number(quantity);

  if (!serviceId || !link || !numQuantity || numQuantity <= 0) {
    return res.status(400).json({ error: 'Valid Service, link, and quantity are required' });
  }

  const service = db.getServiceById(Number(serviceId));
  if (!service || service.status !== 'active') {
    return res.status(400).json({ error: 'Selected service is currently unavailable' });
  }

  if (numQuantity < service.min || numQuantity > service.max) {
    return res.status(400).json({
      error: `Quantity must be between ${service.min.toLocaleString()} and ${service.max.toLocaleString()}`,
    });
  }

  // Calculate charge in PKR based on final marked-up rate per 1000
  const charge = Number(((numQuantity / 1000) * service.rate).toFixed(2));

  // Check user balance in PKR
  const user = db.getUserById(req.user!.id, true);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.balance < charge) {
    return res.status(400).json({
      error: `Insufficient balance (Rs ${user.balance.toFixed(2)} PKR). Total cost is Rs ${charge.toFixed(2)} PKR. Please add funds via Easypaisa.`,
    });
  }

  // Deduct balance in PKR
  db.adjustUserBalance(user.id, -charge);

  // Create order
  const order = db.createOrder({
    userId: user.id,
    userEmail: user.email,
    serviceId: service.service,
    serviceName: service.name,
    category: service.category,
    link,
    quantity: numQuantity,
    charge,
    status: 'In progress',
    start_count: 0,
    remains: numQuantity,
  });

  // Forward to provider API in background
  forwardOrderToProvider(order).then((dispatch) => {
    if (dispatch.success && dispatch.providerOrderId) {
      db.updateOrder(order.id, {
        providerOrderId: dispatch.providerOrderId,
      });
    } else if (dispatch.error) {
      db.updateOrder(order.id, {
        providerError: dispatch.error,
      });
    }
  });

  const updatedUser = db.getUserById(user.id, true);
  return res.json({
    order,
    user: updatedUser,
    message: 'Order placed successfully!',
  });
});

// ----------------------------------------------------
// DEPOSITS (EASYPAISA GATEWAY IN PKR)
// ----------------------------------------------------

// Get user deposits
app.get('/api/deposits', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const deposits = db.getDeposits(req.user!.id);
  return res.json({ deposits });
});

// Submit new Easypaisa deposit in PKR
app.post('/api/deposits', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { amountPkr, trxId, senderName, senderNumber } = req.body;
  const numPkr = parseFloat(amountPkr);

  if (!numPkr || numPkr < 100) {
    return res.status(400).json({ error: 'Minimum deposit is 100 PKR' });
  }

  if (!trxId || String(trxId).trim().length < 5) {
    return res.status(400).json({ error: 'Please enter a valid Easypaisa Transaction ID (Trx ID)' });
  }

  const cleanTrxId = String(trxId).trim().toUpperCase();

  // Check duplicate Trx ID
  const existing = db.getDeposits().find((d) => d.trxId.toUpperCase() === cleanTrxId);
  if (existing) {
    return res.status(400).json({ error: 'This Transaction ID has already been submitted' });
  }

  const deposit = db.createDeposit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    amountPkr: numPkr,
    trxId: cleanTrxId,
    senderName: senderName?.trim(),
    senderNumber: senderNumber?.trim(),
  });

  return res.json({
    deposit,
    message: 'Deposit request submitted successfully! Admin will verify and credit your balance.',
  });
});

// Public / User settings for Easypaisa details
app.get('/api/settings/easypaisa', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json({
    easypaisaDetails: settings.easypaisaDetails,
    currency: 'PKR',
  });
});

// ----------------------------------------------------
// AI SMART ADVISOR
// ----------------------------------------------------
app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  const { platform, goal, targetBudget, quantityNeeded, additionalNotes } = req.body;
  if (!platform || !goal) {
    return res.status(400).json({ error: 'Platform and goal are required' });
  }

  try {
    const recommendation = await getSmartServiceRecommendation({
      platform,
      goal,
      targetBudget: targetBudget ? Number(targetBudget) : undefined,
      quantityNeeded: quantityNeeded ? Number(quantityNeeded) : undefined,
      additionalNotes,
    });
    return res.json({ recommendation });
  } catch (err: any) {
    console.error('AI Recommend Error:', err);
    return res.status(500).json({ error: 'Failed to generate AI recommendation' });
  }
});

// ----------------------------------------------------
// ADMIN PANEL ENDPOINTS
// ----------------------------------------------------

// Admin Stats
app.get('/api/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const stats = db.getAdminStats();
  return res.json({ stats });
});

// Admin Users
app.get('/api/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers(true);
  return res.json({ users });
});

// Admin Adjust User Balance (in PKR)
app.post('/api/admin/users/:id/balance', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { amount, action } = req.body;
  const delta = action === 'subtract' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ error: 'Invalid adjustment amount' });
  }

  const updated = db.adjustUserBalance(req.params.id, delta);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: updated, message: `Balance adjusted by ${delta > 0 ? '+' : ''}Rs ${delta.toFixed(2)} PKR` });
});

// Admin Update User Status
app.post('/api/admin/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updated = db.updateUser(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: updated });
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  return res.json({ orders });
});

// Admin Update Order Status
app.post('/api/admin/orders/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses: OrderStatus[] = ['Pending', 'In progress', 'Completed', 'Partial', 'Canceled', 'Refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existingOrder = db.getOrderById(req.params.id);
  if (!existingOrder) return res.status(404).json({ error: 'Order not found' });

  // Handle refund in PKR if changed to Refunded/Canceled
  if ((status === 'Refunded' || status === 'Canceled') && existingOrder.status !== 'Refunded' && existingOrder.status !== 'Canceled') {
    db.adjustUserBalance(existingOrder.userId, existingOrder.charge);
  }

  const updated = db.updateOrder(req.params.id, { status });
  return res.json({ order: updated });
});

// Admin Resend Order to Provider API
app.post('/api/admin/orders/:id/resend', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const result = await forwardOrderToProvider(order);
  if (result.success && result.providerOrderId) {
    const updated = db.updateOrder(order.id, {
      providerOrderId: result.providerOrderId,
      providerError: undefined,
      status: 'In progress',
    });
    return res.json({ order: updated, message: 'Order re-sent to API successfully' });
  } else {
    return res.status(500).json({ error: result.error || 'Failed to dispatch order to API' });
  }
});

// Admin Deposits
app.get('/api/admin/deposits', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const deposits = db.getDeposits();
  return res.json({ deposits });
});

// Admin Process Deposit (Approve / Reject) in PKR
app.post('/api/admin/deposits/:id/process', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, adminNotes } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }

  try {
    const result = db.processDeposit(req.params.id, status, adminNotes);
    if (!result) return res.status(404).json({ error: 'Deposit not found' });
    return res.json({
      deposit: result.deposit,
      user: result.user,
      message: `Deposit ${status.toLowerCase()} successfully! ${status === 'Approved' ? `User balance was credited with Rs ${result.deposit.amountPkr.toLocaleString()} PKR.` : ''}`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin Services Management
app.get('/api/admin/services', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const services = db.getServices(true);
  const settings = db.getSettings();
  return res.json({ services, defaultMarkupPercent: settings.defaultMarkupPercent });
});

// Admin Update Service
app.post('/api/admin/services/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const serviceId = Number(req.params.id);
  const { status, customMarkup, name, min, max, qualityBadge } = req.body;

  const updated = db.updateService(serviceId, {
    status,
    customMarkup: customMarkup !== undefined ? Number(customMarkup) : undefined,
    name,
    min: min !== undefined ? Number(min) : undefined,
    max: max !== undefined ? Number(max) : undefined,
    qualityBadge,
  });

  if (!updated) return res.status(404).json({ error: 'Service not found' });
  return res.json({ service: updated });
});

// Admin Sync Services from Provider
app.post('/api/admin/services/sync', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const result = await fetchServicesFromProvider();
  return res.json(result);
});

// Admin Settings
app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

app.post('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  return res.json({ settings: updated, message: 'Settings saved successfully' });
});

// ----------------------------------------------------
// VITE SPA DEV & PROD SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SMM Panel server running on port ${PORT} (Currency: PKR)`);
  });
}

startServer();
