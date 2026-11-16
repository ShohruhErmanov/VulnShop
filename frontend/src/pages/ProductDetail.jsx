import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ShoppingCart, Truck, ShieldCheck, Star, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useApi from '../utils/useApi';
import { ProductVisual, Stars } from '../components/ProductCard';
import { Button, Skeleton, ErrorState, Badge, cx } from '../components/ui';
import { money, date, initials } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLab } from '../context/LabContext';

function ReviewForm({ productId, onCreated }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, { rating, comment });
      onCreated(data.review);
      setComment('');
      toast.success('Sharh qo‘shildi');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <p className="font-semibold">Sharh qoldirish</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Baho">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} yulduz`}>
            <Star className={cx('h-6 w-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
          </button>
        ))}
      </div>
      <textarea className="input min-h-24" required maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Mahsulot haqida fikringiz..." />
      <Button type="submit" loading={busy}>Yuborish</Button>
    </form>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { data, loading, error, reload, setData } = useApi(`/products/${id}`);
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { isVulnerable, hosted } = useLab();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="grid gap-8 lg:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-12 w-40" /></div></div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const p = data.product;
  const reviews = p.reviews || [];

  const addToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setBusy(true);
    try { await add(p.id, qty); toast.success('Savatchaga qo‘shildi'); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  const removeReview = async (rid) => {
    try {
      await api.delete(`/reviews/${rid}`);
      setData({ product: { ...p, reviews: reviews.filter((r) => r.id !== rid) } });
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div>
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Katalogga qaytish</Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductVisual category={p.category} name={p.name} large className="aspect-square rounded-3xl" />
        <div>
          <Badge tone="brand">{p.category}</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{p.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500"><Stars value={p.rating} /><span>{reviews.length} ta sharh</span></div>
          <p className="mt-5 text-3xl font-bold">{money(p.price)}</p>
          <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">{p.description}</p>
          <p className={cx('mt-4 text-sm font-medium', p.stock > 5 ? 'text-emerald-600' : 'text-amber-600')}>{p.stock > 0 ? `Omborda: ${p.stock} dona` : 'Tugagan'}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700">
              <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kamaytirish">−</button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.min(p.stock, q + 1))} aria-label="Ko‘paytirish">+</button>
            </div>
            <Button onClick={addToCart} loading={busy} icon={ShoppingCart} disabled={p.stock < 1}>Savatchaga qo‘shish</Button>
            {p.manualFile && (
              <a className="btn-secondary" href={`/api/files/download?file=${encodeURIComponent(p.manualFile)}`}>
                <Download className="h-4 w-4" />Qo‘llanma
              </a>
            )}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="card flex items-center gap-3 p-4 text-sm"><Truck className="h-5 w-5 text-brand-500" />Bepul yetkazib berish</div>
            <div className="card flex items-center gap-3 p-4 text-sm"><ShieldCheck className="h-5 w-5 text-brand-500" />24 oy kafolat</div>
          </div>
        </div>
      </div>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold">Sharhlar</h2>
          {reviews.length === 0 && <p className="text-sm text-slate-500">Hali sharh yo‘q.</p>}
          {reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/users/${r.author ? r.author.id : ''}`} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold dark:bg-slate-800">{initials(r.author && r.author.name)}</span>
                  <span><span className="block text-sm font-semibold hover:text-brand-600">{r.author ? r.author.name : 'Foydalanuvchi'}</span><span className="text-xs text-slate-500">{date(r.createdAt)}</span></span>
                </Link>
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  {user && (user.id === r.userId || user.role === 'admin') && (
                    <button type="button" className="btn-ghost p-1.5" onClick={() => removeReview(r.id)} aria-label="Sharhni o‘chirish"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
              {isVulnerable('xss') && (!hosted || (user && user.id === r.userId))
                // XSS LAB (vulnerable mode): stored review rendered as raw HTML.
                // Hosted classroom server: only the author's own reviews, so students never run each other's scripts.
                ? <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: r.comment }} />
                : <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">{r.comment}</p>}
            </article>
          ))}
        </div>
        <div>{user ? <ReviewForm productId={p.id} onCreated={(rv) => setData({ product: { ...p, reviews: [rv, ...reviews] } })} /> : <div className="card p-5 text-sm">Sharh qoldirish uchun <Link to="/login" className="font-semibold text-brand-600">tizimga kiring</Link>.</div>}</div>
      </section>
    </div>
  );
}
