"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string; // unique key (productId + variantId + personalization)
  productId: string;
  productTitle: string;
  productImage?: string;
  unitPrice: number;
  deliveryCharges: number;
  variantId: string | null;
  variantName: string | null;
  personalizationText: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalCount: number;
  subtotal: number;
  maxDeliveryCharges: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "mugoldsmith_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [items, isMounted]);

  function addToCart(newItem: Omit<CartItem, "id">) {
    const id = `${newItem.productId}_${newItem.variantId || "novar"}_${
      newItem.personalizationText.trim().toLowerCase()
    }`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += newItem.quantity;
        return updated;
      } else {
        return [...prev, { ...newItem, id }];
      }
    });

    setIsCartOpen(true);
  }

  function removeFromCart(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const maxDeliveryCharges =
    items.length > 0
      ? Math.max(...items.map((i) => i.deliveryCharges ?? 200))
      : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        totalCount,
        subtotal,
        maxDeliveryCharges,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
