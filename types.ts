
export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  password?: string;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
  bankId?: string; // ID do banco vinculado
}

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  balance: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AIAnalysis {
  summary: string;
  percentageChange: number;
  alerts: string[];
}
