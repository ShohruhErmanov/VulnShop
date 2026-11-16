import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Minus, Plus } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ProductVisual } from '../components/ProductCard';
import { Button, EmptyState, PageHeader, Skeleton, Field } from '../components/ui';
import { money } from '../utils/format';

export default function Cart() {
  const { cart, loading, update, remove, load } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user.address || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const act = async (fn) => { try { await fn(); } catch (err) { toast.error(errorMessage(err)); } };

  const checkout = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/orders', { shippingAddress: address, note });
      await load();
      toast.success(`Buyurtma #${data.order.id} rasmiylashtirildi`);
      navigate(`/orders/${data.order.id}`);
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  if (loading && !cart.items.length) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;

  return (
    <div>
      <PageHeader title="Savatcha" subtitle={`${cart.count} ta mahsulot`} icon={ShoppingBag} />
      {cart.items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Savatcha bo‘sh" text="Katalogdan mahsulot tanlang." action={<Link to="/" className="btn-primary">Katalogga o‘tish</Link>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {cart.items.map((i) => (
              <div key={i.id} className="card flex items-center gap-4 p-4">
                <ProductVisual category={i.product.category} name={i.product.name} className="h-20 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${i.product.id}`} className="font-semibold hover:text-brand-600">{i.product.name}</Link>
                  <p className="text-sm text-slate-500">{money(i.product.price)}</p>
                </div>
                <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700">
                  <button type="button" className="p-2" disabled={i.quantity <= 1} onClick={() => act(() => update(i.id, i.quantity - 1))} aria-label="Kamaytirish"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                  <button type="button" className="p-2" onClick={() => act(() => update(i.id, i.quantity + 1))} aria-label="Ko‘paytirish"><Plus className="h-4 w-4" /></button>
                </div>
                <p className="hidden w-24 text-right font-semibold sm:block">{money(i.product.price * i.quantity)}</p>
                <button type="button" className="btn-ghost p-2 text-rose-500" onClick={() => act(() => remove(i.id))} aria-label="O‘chirish"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <form onSubmit={checkout} className="card h-fit space-y-4 p-5">
            <h2 className="font-semibold">Buyurtmani rasmiylashtirish</h2>
            <Field label="Yetkazish manzili"><input className="input" required minLength={5} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
            <Field label="Izoh (ixtiyoriy)"><textarea className="input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-bold dark:border-slate-800"><span>Jami</span><span>{money(cart.subtotal)}</span></div>
            <p className="text-xs text-slate-500">To‘lov simulyatsiya qilinadi (sandbox). Real karta ma’lumotlarini kiritmang.</p>
            <Button type="submit" loading={busy} className="w-full">Buyurtma berish</Button>
          </form>
        </div>
      )}
    </div>
  );
}
