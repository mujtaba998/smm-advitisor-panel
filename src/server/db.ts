import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { User, Service, Order, Deposit, AdminStats } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface AppSettings {
  defaultMarkupPercent: number; // 10%
  providerApiKey: string;
  providerApiUrl: string;
  currency: 'PKR';
  easypaisaDetails: {
    accountTitle: string;
    accountNumber: string;
  };
}

export interface DbSchema {
  users: (User & { passwordHash?: string })[];
  orders: Order[];
  deposits: Deposit[];
  services: Service[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultMarkupPercent: 10,
  providerApiKey: '941c5ea8cb2e0e84d2b0be7f959794f2fdd66f31',
  providerApiUrl: 'https://justanotherpanel.com/api/v2',
  currency: 'PKR',
  easypaisaDetails: {
    accountTitle: 'Sultana nisreen',
    accountNumber: '+92 316 6967334',
  },
};

// Provider base rates in Pakistani Rupees (PKR)
// Multiplied by 1.10 automatically to add 10% profit margin
const RAW_DEFAULT_SERVICES = [
  // Instagram Services (Rates in PKR per 1,000)
  {
    service: 101,
    name: 'Instagram Followers [HQ Real - 30 Days Refill - Fast 50K/Day]',
    category: 'Instagram Followers',
    platform: 'Instagram',
    original_rate: 240, // Base provider PKR per 1k
    min: 50,
    max: 100000,
    refill: true,
    cancel: true,
    qualityBadge: 'High Retention',
    description: 'High Quality Real Instagram profiles with posts and stories. Starts in 0-1 hour. 30 days automatic refill guarantee.',
  },
  {
    service: 102,
    name: 'Instagram Followers [Non-Drop - Lifetime Guarantee - Ultra HQ]',
    category: 'Instagram Followers',
    platform: 'Instagram',
    original_rate: 400,
    min: 100,
    max: 500000,
    refill: true,
    cancel: false,
    qualityBadge: 'Non-Drop',
    description: 'Top-tier zero drop Instagram followers. High retention rate for Pakistani influencers, brands, and public figures.',
  },
  {
    service: 103,
    name: 'Instagram Likes [Super Instant - Real Active Users - Max 50K]',
    category: 'Instagram Likes',
    platform: 'Instagram',
    original_rate: 50,
    min: 20,
    max: 50000,
    refill: false,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Instant start (0-5 minutes). Real organic accounts. Boosts post explore page algorithm ranking.',
  },
  {
    service: 104,
    name: 'Instagram Reels Views [Viral Push Algorithm - Fast Speed 1M/Day]',
    category: 'Instagram Reels',
    platform: 'Instagram',
    original_rate: 14,
    min: 100,
    max: 10000000,
    refill: false,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Super fast Reels views with high watch-through rate to boost algorithm recommendations and explore tab visibility.',
  },
  {
    service: 105,
    name: 'Instagram Custom Comments [Positive English / Verified Style]',
    category: 'Instagram Comments',
    platform: 'Instagram',
    original_rate: 1350,
    min: 10,
    max: 5000,
    refill: false,
    cancel: false,
    qualityBadge: 'Organic',
    description: 'Realistic tailored comments from genuine-looking active accounts. Perfect for conversion proof and brand reputation.',
  },

  // TikTok Services
  {
    service: 201,
    name: 'TikTok Followers [Organic Growth Server - 0-1h Start - Non-Drop]',
    category: 'TikTok Followers',
    platform: 'TikTok',
    original_rate: 500,
    min: 100,
    max: 100000,
    refill: true,
    cancel: true,
    qualityBadge: 'Non-Drop',
    description: 'Fast delivery TikTok followers from active worldwide accounts. Ideal for unlocking live streaming feature (1k threshold).',
  },
  {
    service: 202,
    name: 'TikTok Video Likes [Real Accounts - Instant Start - High Retention]',
    category: 'TikTok Likes',
    platform: 'TikTok',
    original_rate: 98,
    min: 50,
    max: 100000,
    refill: true,
    cancel: true,
    qualityBadge: 'High Retention',
    description: 'High quality video likes that increase TikTok FYP (For You Page) traction instantly.',
  },
  {
    service: 203,
    name: 'TikTok Views [FYP Booster - 100% Video Watchtime Simulation]',
    category: 'TikTok Views',
    platform: 'TikTok',
    original_rate: 6,
    min: 500,
    max: 50000000,
    refill: false,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Ultra cheap and lightning-fast FYP viral views in PKR. Starts within 60 seconds.',
  },
  {
    service: 204,
    name: 'TikTok Shares & Saves [Algorithm Booster - Max Viral Signals]',
    category: 'TikTok Engagement',
    platform: 'TikTok',
    original_rate: 42,
    min: 100,
    max: 200000,
    refill: false,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Massive organic signal trigger: High ratio of saves and shares tricks TikTok algorithm into ranking video higher.',
  },

  // YouTube Services
  {
    service: 301,
    name: 'YouTube Subscribers [Monetization Ready - Non-Drop - 30D Refill]',
    category: 'YouTube Subscribers',
    platform: 'YouTube',
    original_rate: 3500,
    min: 50,
    max: 25000,
    refill: true,
    cancel: false,
    qualityBadge: 'Guaranteed',
    description: 'Clean, safe subscribers compliant with YouTube Studio analytics. Perfect for reaching the 1,000 subscriber monetization milestone.',
  },
  {
    service: 302,
    name: 'YouTube Watch Time [4000 Hours Package - 15+ Min Video Safe]',
    category: 'YouTube Watchtime',
    platform: 'YouTube',
    original_rate: 2000,
    min: 100,
    max: 50000,
    refill: true,
    cancel: false,
    qualityBadge: 'Guaranteed',
    description: 'High retention watch hours from unique desktop/mobile sessions. Guaranteed YouTube Partner Program approval rate.',
  },
  {
    service: 303,
    name: 'YouTube High Retention Views [Organic Suggested Video Traffic]',
    category: 'YouTube Views',
    platform: 'YouTube',
    original_rate: 450,
    min: 500,
    max: 1000000,
    refill: true,
    cancel: true,
    qualityBadge: 'Organic',
    description: 'Views sourced from Suggested Videos and Browse Features. Average view duration 2-5+ minutes. Safe for Adsense.',
  },
  {
    service: 304,
    name: 'YouTube Video Likes [Instant - 100% Safe - No Drop]',
    category: 'YouTube Likes',
    platform: 'YouTube',
    original_rate: 250,
    min: 50,
    max: 100000,
    refill: true,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Instant delivery likes to boost video social authority and search ranking.',
  },

  // Facebook Services
  {
    service: 401,
    name: 'Facebook Page Likes + Followers [Worldwide Real Profiles]',
    category: 'Facebook Page',
    platform: 'Facebook',
    original_rate: 580,
    min: 100,
    max: 100000,
    refill: true,
    cancel: false,
    qualityBadge: 'High Retention',
    description: 'Both Page Follower count and Page Likes increase simultaneously. Stable and permanent.',
  },
  {
    service: 402,
    name: 'Facebook Post Reactions [Love / Care / Haha / Wow - Mixed]',
    category: 'Facebook Reactions',
    platform: 'Facebook',
    original_rate: 195,
    min: 50,
    max: 50000,
    refill: true,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Emoticon reactions for any public post, photo, or shared video. Instant delivery.',
  },

  // Twitter / X Services
  {
    service: 501,
    name: 'X (Twitter) Followers [NFT / Crypto / Global Real Profiles]',
    category: 'Twitter Followers',
    platform: 'Twitter',
    original_rate: 890,
    min: 100,
    max: 50000,
    refill: true,
    cancel: false,
    qualityBadge: 'High Retention',
    description: 'High-quality Twitter/X profiles with avatars, bios, and historical tweets. Great for Web3 & creators.',
  },
  {
    service: 502,
    name: 'X (Twitter) Retweets & Likes [Organic Engagement Combo]',
    category: 'Twitter Engagement',
    platform: 'Twitter',
    original_rate: 310,
    min: 50,
    max: 20000,
    refill: true,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Instant retweets and likes from active accounts. Catapults tweets into trending discussions.',
  },

  // Telegram Services
  {
    service: 601,
    name: 'Telegram Channel Members [Non-Drop - 0% Drop 60 Days]',
    category: 'Telegram Members',
    platform: 'Telegram',
    original_rate: 265,
    min: 100,
    max: 200000,
    refill: true,
    cancel: false,
    qualityBadge: 'Non-Drop',
    description: 'Permanent channel or group members with realistic English/Global names.',
  },
  {
    service: 602,
    name: 'Telegram Post Views [Last 10 Posts - Fast Auto Delivery]',
    category: 'Telegram Views',
    platform: 'Telegram',
    original_rate: 22,
    min: 100,
    max: 100000,
    refill: false,
    cancel: true,
    qualityBadge: 'Instant',
    description: 'Instant views distributed on your channel latest posts for authentic look.',
  },

  // Spotify Services
  {
    service: 701,
    name: 'Spotify Track Plays [USA / Tier 1 Streams - Royalty Eligible]',
    category: 'Spotify Streams',
    platform: 'Spotify',
    original_rate: 360,
    min: 1000,
    max: 1000000,
    refill: true,
    cancel: false,
    qualityBadge: 'Organic',
    description: 'Real user streams via algorithmic playlists. High song completion rate. Royalty eligible.',
  },
  {
    service: 702,
    name: 'Spotify Artist Followers [Verified Curator Growth]',
    category: 'Spotify Followers',
    platform: 'Spotify',
    original_rate: 310,
    min: 100,
    max: 50000,
    refill: true,
    cancel: true,
    qualityBadge: 'High Retention',
    description: 'Real music listener accounts following your artist profile. Triggers Spotify Release Radar.',
  },
];

export function calculateMarkupRate(originalRatePkr: number, markupPercent: number = 10): number {
  const final = originalRatePkr * (1 + markupPercent / 100);
  return Number(final.toFixed(2));
}

function buildInitialServices(markupPercent: number = 10): Service[] {
  return RAW_DEFAULT_SERVICES.map((item) => ({
    service: item.service,
    name: item.name,
    category: item.category,
    platform: item.platform,
    original_rate: item.original_rate,
    rate: calculateMarkupRate(item.original_rate, markupPercent),
    min: item.min,
    max: item.max,
    refill: item.refill,
    cancel: item.cancel,
    description: item.description,
    status: 'active',
    qualityBadge: item.qualityBadge as any,
  }));
}

class Database {
  private data: DbSchema;

  constructor() {
    this.data = this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DbSchema {
    this.ensureDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
        parsed.settings.currency = 'PKR';
        if (!parsed.users) parsed.users = [];
        if (!parsed.orders) parsed.orders = [];
        if (!parsed.deposits) parsed.deposits = [];
        // Re-align services with PKR pricing
        parsed.services = buildInitialServices(parsed.settings.defaultMarkupPercent || 10);
        this.ensureAdminUser(parsed);
        return parsed;
      } catch (err) {
        console.error('Error reading db.json, reinitializing clean DB:', err);
      }
    }

    const initialDb: DbSchema = {
      users: [],
      orders: [], // Clean DB: 0 demo orders
      deposits: [], // Clean DB: 0 demo deposits
      services: buildInitialServices(DEFAULT_SETTINGS.defaultMarkupPercent),
      settings: DEFAULT_SETTINGS,
    };

    this.ensureAdminUser(initialDb);
    this.saveDirect(initialDb);
    return initialDb;
  }

  private ensureAdminUser(db: DbSchema) {
    const existing = db.users.find(
      (u) => u.username.toLowerCase() === 'mujtaba123' || u.role === 'admin'
    );
    if (!existing) {
      db.users.push({
        id: 'admin_mujtaba',
        username: 'Mujtaba123',
        passwordHash: 'Mujtaba123?',
        email: 'admin@smmadvisor.com',
        name: 'Mujtaba Admin',
        role: 'admin',
        balance: 50000.0, // Admin reserve balance in PKR
        status: 'active',
        createdAt: new Date().toISOString(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
    } else {
      existing.username = 'Mujtaba123';
      existing.passwordHash = 'Mujtaba123?';
      existing.role = 'admin';
      if (existing.balance < 1000) {
        existing.balance = 50000.0;
      }
    }
  }

  private save() {
    this.saveDirect(this.data);
  }

  private saveDirect(db: DbSchema) {
    this.ensureDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }

  // --- Users ---
  getUsers(hidePassword = true): User[] {
    return this.data.users.map((u) => {
      const { passwordHash, ...rest } = u;
      return hidePassword ? rest : (u as any);
    });
  }

  getUserById(id: string, hidePassword = true): (User & { passwordHash?: string }) | undefined {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return undefined;
    if (hidePassword) {
      const { passwordHash, ...rest } = user;
      return rest as any;
    }
    return user;
  }

  getUserByEmail(email: string): (User & { passwordHash?: string }) | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByUsername(username: string): (User & { passwordHash?: string }) | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(userData: {
    email: string;
    username: string;
    name: string;
    password?: string;
    role?: 'user' | 'admin';
    balance?: number;
  }): User {
    const newUser: User & { passwordHash?: string } = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      email: userData.email,
      username: userData.username,
      name: userData.name,
      passwordHash: userData.password || '',
      role: userData.role || 'user',
      balance: userData.balance ?? 0.0, // Default user balance 0.00 PKR
      status: 'active',
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.username)}`,
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  updateUser(id: string, updates: Partial<User & { passwordHash?: string }>): User | undefined {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.save();
    const { passwordHash, ...safe } = this.data.users[index];
    return safe;
  }

  adjustUserBalance(id: string, deltaPkr: number): User | undefined {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return undefined;
    const newBalance = Math.max(0, Number((user.balance + deltaPkr).toFixed(2)));
    user.balance = newBalance;
    this.save();
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // --- Services ---
  getServices(isAdmin = false): Service[] {
    return this.data.services.map((s) => {
      if (isAdmin) return s;
      const { original_rate, customMarkup, ...clientService } = s;
      return clientService as Service;
    });
  }

  getServiceById(id: number): Service | undefined {
    return this.data.services.find((s) => s.service === id);
  }

  updateService(id: number, updates: Partial<Service>): Service | undefined {
    const index = this.data.services.findIndex((s) => s.service === id);
    if (index === -1) return undefined;
    const existing = this.data.services[index];
    const updated = { ...existing, ...updates };

    if (updates.original_rate !== undefined || updates.customMarkup !== undefined) {
      const orig = updates.original_rate ?? existing.original_rate ?? existing.rate;
      const markup = updates.customMarkup ?? existing.customMarkup ?? this.data.settings.defaultMarkupPercent;
      updated.rate = calculateMarkupRate(orig, markup);
    }
    this.data.services[index] = updated;
    this.save();
    return updated;
  }

  applyGlobalMarkup(markupPercent: number) {
    this.data.settings.defaultMarkupPercent = markupPercent;
    this.data.services = this.data.services.map((s) => {
      const markup = s.customMarkup !== undefined ? s.customMarkup : markupPercent;
      const orig = s.original_rate ?? (s.rate / 1.1);
      return {
        ...s,
        original_rate: orig,
        rate: calculateMarkupRate(orig, markup),
      };
    });
    this.save();
  }

  setServices(newServices: Service[]) {
    this.data.services = newServices;
    this.save();
  }

  // --- Orders ---
  getOrders(userId?: string): Order[] {
    if (userId) {
      return this.data.orders.filter((o) => o.userId === userId).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    return [...this.data.orders].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
    };
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | undefined {
    const index = this.data.orders.findIndex((o) => o.id === id);
    if (index === -1) return undefined;
    this.data.orders[index] = { ...this.data.orders[index], ...updates };
    this.save();
    return this.data.orders[index];
  }

  // --- Deposits (Easypaisa Gateway in PKR) ---
  getDeposits(userId?: string): Deposit[] {
    if (userId) {
      return this.data.deposits.filter((d) => d.userId === userId).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    return [...this.data.deposits].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }

  getDepositById(id: string): Deposit | undefined {
    return this.data.deposits.find((d) => d.id === id);
  }

  createDeposit(depositData: Omit<Deposit, 'id' | 'status' | 'createdAt'>): Deposit {
    const newDeposit: Deposit = {
      ...depositData,
      id: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    this.data.deposits.unshift(newDeposit);
    this.save();
    return newDeposit;
  }

  processDeposit(depositId: string, status: 'Approved' | 'Rejected', adminNotes?: string): { deposit: Deposit; user?: User } | null {
    const deposit = this.data.deposits.find((d) => d.id === depositId);
    if (!deposit) return null;
    if (deposit.status !== 'Pending') {
      throw new Error(`Deposit ${depositId} has already been processed as ${deposit.status}`);
    }

    deposit.status = status;
    deposit.adminNotes = adminNotes || deposit.adminNotes;
    deposit.processedAt = new Date().toISOString();

    let updatedUser: User | undefined;
    if (status === 'Approved') {
      // Automatically increment user balance directly in PKR!
      updatedUser = this.adjustUserBalance(deposit.userId, deposit.amountPkr);
    }

    this.save();
    return { deposit, user: updatedUser };
  }

  // --- Settings & Stats ---
  getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    if (updates.defaultMarkupPercent !== undefined) {
      this.applyGlobalMarkup(updates.defaultMarkupPercent);
    }
    this.save();
    return { ...this.data.settings };
  }

  getAdminStats(): AdminStats {
    const nonAdminUsers = this.data.users.filter((u) => u.role !== 'admin');
    const totalOrders = this.data.orders.length;
    const totalRevenuePkr = this.data.orders.reduce((acc, o) => acc + (o.charge || 0), 0);
    const pendingDeposits = this.data.deposits.filter((d) => d.status === 'Pending');
    const pendingDepositsTotalPkr = pendingDeposits.reduce((acc, d) => acc + (d.amountPkr || 0), 0);
    const activeServicesCount = this.data.services.filter((s) => s.status === 'active').length;

    return {
      totalUsers: nonAdminUsers.length,
      totalOrders,
      totalRevenue: Number(totalRevenuePkr.toFixed(2)),
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsTotalPkr,
      activeServicesCount,
    };
  }
}

export const db = new Database();
