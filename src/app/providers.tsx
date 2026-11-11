import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Stock } from '../types';
import { apiClient } from '../services/api/client';
import { WEBSOCKET_URL } from '../config/api';

// --- AUTH CONTEXT ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// --- WEBSOCKET CONTEXT ---
interface WebSocketContextType {
  stocks: Stock[];
  notifications: Array<{ id: string; message: string; timestamp: Date }>;
  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
  lastTradeTimestamp: number;
  triggerTradeSync: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSockets = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSockets must be used within a WebSocketProvider');
  return context;
};

// --- COMBINED PROVIDER ---
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]);
  const [lastTradeTimestamp, setLastTradeTimestamp] = useState<number>(Date.now());

  const wsRef = useRef<WebSocket | null>(null);

  // --- Auth Functions ---
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiClient.get<User>('/auth/me');
      setUser(data);
      localStorage.setItem('trade_user', JSON.stringify(data));
    } catch (e) {
      setUser(null);
      localStorage.removeItem('trade_user');
      localStorage.removeItem('trade_token');
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiClient.post<{ id: number; token: string; username: string; role: 'USER' | 'ADMIN'; balance: number }>('/auth/login', {
      username,
      password,
    });
    localStorage.setItem('trade_token', data.token);
    const loggedUser: User = {
      id: data.id || 0,
      username: data.username,
      role: data.role,
      balance: data.balance,
    };
    setUser(loggedUser);
    localStorage.setItem('trade_user', JSON.stringify(loggedUser));
    await refreshUser(); // sync with detailed profile
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (e) {
      // Ignore auth logout errors if token expired
    }
    setUser(null);
    localStorage.removeItem('trade_token');
    localStorage.removeItem('trade_user');
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Check auth on startup
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('trade_token');
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  // --- WebSocket Connection ---
  const addNotification = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [{ id, message, timestamp: new Date() }, ...prev]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch initial stocks list
  const fetchStocks = useCallback(async () => {
    try {
      const data = await apiClient.get<Stock[]>('/stocks');
      setStocks(data);
    } catch (e) {
      console.error('Failed to fetch stocks', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStocks();
    }
  }, [user, fetchStocks]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    let socket: WebSocket;
    let reconnectTimeout: number;

    const connect = () => {
      console.log('Connecting to WebSockets...');
      socket = new WebSocket(WEBSOCKET_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected successfully');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'TICK') {
            // Update stocks list in state
            const tickedStocks: Array<{ symbol: string; price: number; changePercent: number }> = payload.data;
            setStocks(prevStocks => {
              return prevStocks.map(stock => {
                const tick = tickedStocks.find(t => t.symbol === stock.symbol);
                if (tick) {
                  return {
                    ...stock,
                    currentPrice: tick.price,
                    changePercent: tick.changePercent,
                  };
                }
                return stock;
              });
            });
          } else if (payload.type === 'NOTIFICATION') {
            // Only show notification if it is meant for this user
            if (payload.userId === user.id) {
              addNotification(payload.message);
              setLastTradeTimestamp(Date.now());
              // Trigger a user balance update since a trade was executed
              refreshUser();
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket frame', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Retrying in 3 seconds...');
        reconnectTimeout = window.setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error occurred', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [user, addNotification, refreshUser]);

  const triggerTradeSync = useCallback(() => {
    setLastTradeTimestamp(Date.now());
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      <WebSocketContext.Provider value={{ stocks, notifications, addNotification, removeNotification, lastTradeTimestamp, triggerTradeSync }}>
        {children}
      </WebSocketContext.Provider>
    </AuthContext.Provider>
  );
};
