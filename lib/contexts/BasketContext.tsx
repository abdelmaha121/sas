'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BasketItem {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string;
  basePrice: number;
  currency: string;
  providerId: string;
  providerName: string;
  providerBusinessName?: string;
  image?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isUrgent: boolean;
  urgentFee?: number;
  recurringType: 'daily' | 'weekly' | 'monthly' | null;
  notes?: string;
  addons: Array<{
    id: string;
    name: string;
    nameAr: string;
    price: number;
  }>;
  finalPrice: number;
  createdAt: Date;
}

interface BasketContextType {
  items: BasketItem[];
  totalItems: number;
  totalPrice: number;
  addToBasket: (item: Omit<BasketItem, 'id' | 'createdAt'>) => void;
  removeFromBasket: (itemId: string) => void;
  updateBasketItem: (itemId: string, updates: Partial<BasketItem>) => void;
  clearBasket: () => void;
  getBasketItem: (itemId: string) => BasketItem | undefined;
  isInBasket: (serviceId: string) => boolean;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

const BASKET_STORAGE_KEY = 'service-basket';

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);

  // Load basket from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BASKET_STORAGE_KEY);
      if (stored) {
        const parsedItems = JSON.parse(stored);
        // Convert createdAt back to Date objects
        const itemsWithDates = parsedItems.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        setItems(itemsWithDates);
      }
    } catch (error) {
      console.error('Error loading basket from localStorage:', error);
    }
  }, []);

  // Save basket to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving basket to localStorage:', error);
    }
  }, [items]);

  const addToBasket = (itemData: Omit<BasketItem, 'id' | 'createdAt'>) => {
    const newItem: BasketItem = {
      ...itemData,
      id: `basket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setItems(prev => [...prev, newItem]);
  };

  const removeFromBasket = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateBasketItem = (itemId: string, updates: Partial<BasketItem>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, ...updates }
          : item
      )
    );
  };

  const clearBasket = () => {
    setItems([]);
  };

  const getBasketItem = (itemId: string) => {
    return items.find(item => item.id === itemId);
  };

  const isInBasket = (serviceId: string) => {
    return items.some(item => item.serviceId === serviceId);
  };

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + item.finalPrice, 0);

  return (
    <BasketContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToBasket,
        removeFromBasket,
        updateBasketItem,
        clearBasket,
        getBasketItem,
        isInBasket,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}
