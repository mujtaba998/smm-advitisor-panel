export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  balance: number; // in PKR (Rs)
  status: 'active' | 'suspended';
  createdAt: string;
  avatar?: string;
}

export interface Service {
  service: number; // Service ID
  name: string;
  type?: string;
  category: string;
  platform: string; // Instagram, YouTube, TikTok, Facebook, Twitter, Telegram, Spotify, Other
  rate: number; // Final customer price in PKR per 1000 (Markup already applied)
  original_rate?: number; // Provider raw rate in PKR per 1000 (server-side/admin only)
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
  description?: string;
  status: 'active' | 'disabled';
  customMarkup?: number; // optional custom % markup override
  qualityBadge?: 'Instant' | 'High Retention' | 'Non-Drop' | 'Guaranteed' | 'Organic';
}

export type OrderStatus = 'Pending' | 'In progress' | 'Completed' | 'Partial' | 'Canceled' | 'Refunded';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  serviceId: number;
  serviceName: string;
  category: string;
  link: string;
  quantity: number;
  charge: number; // PKR (Rs)
  start_count?: number;
  status: OrderStatus;
  remains?: number;
  providerOrderId?: string;
  providerError?: string;
  createdAt: string;
}

export type DepositStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  amountPkr: number; // PKR (Rs)
  trxId: string;
  senderName?: string;
  senderNumber?: string;
  status: DepositStatus;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number; // PKR
  pendingDepositsCount: number;
  pendingDepositsTotalPkr: number;
  activeServicesCount: number;
}

export interface AIRecommendationRequest {
  platform: string;
  goal: string;
  targetBudget?: number; // in PKR
  quantityNeeded?: number;
  additionalNotes?: string;
}

export interface AIRecommendationResponse {
  recommendedServiceId: number;
  serviceName: string;
  platform: string;
  pricePerK: number; // in PKR
  min: number;
  max: number;
  reason: string;
  expectedSpeed: string;
  retentionQuality: string;
  pros: string[];
  strategicTip: string;
}
