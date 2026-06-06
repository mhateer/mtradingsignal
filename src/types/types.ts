export interface Plan {
  plan: string;
  price: number;
  duration: string;
  maxCalls: number | string;
  maxRows: number;
  note: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  price: number;
  callsUsed: number;
  maxCalls: number;
  maxRows: number;
  startsAt: string;
  expiresAt: string;
  paymentReference: string;
  paymentNote: string;
  paymentConfirmed: boolean;
  createdAt: string;
  user?: {
    email: string;
    fullName: string;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  apiKey: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface GoldSignal {
  timestamp: string;
  prev_open: number;
  predicted_open: number;
  p_up: number;
  pred_delta: number;
  signal: string;
  position_size: number;
}