export interface User {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  balance: number;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
}

export interface PortfolioItem {
  id: number;
  userId: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
}

export interface Transaction {
  id: number;
  userId: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

export interface AutoTradeRule {
  id: number;
  userId: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  triggerPrice: number;
  quantity: number;
  status: 'ACTIVE' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}
