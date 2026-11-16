import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY = { items: [], subtotal: 0, count: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setCart(EMPTY); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (_) {
      setCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post('/cart', { productId, quantity });
    setCart(data);
  }, []);
  const update = useCallback(async (itemId, quantity) => {
    const { data } = await api.patch(`/cart/${itemId}`, { quantity });
    setCart(data);
  }, []);
  const remove = useCallback(async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    setCart(data);
  }, []);

  const value = useMemo(() => ({ cart, loading, load, add, update, remove, reset: () => setCart(EMPTY) }), [cart, loading, load, add, update, remove]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
