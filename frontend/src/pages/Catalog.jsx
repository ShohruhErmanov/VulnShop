import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import ProductCard from '../components/ProductCard';
import { Skeleton, EmptyState, ErrorState, cx } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLab } from '../context/LabContext';

const SORTS = [['newest', 'Yangilari'], ['price_asc', 'Arzon → qimmat'], ['price_desc', 'Qimmat → arzon'], ['rating', 'Reyting']];

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const [term, setTerm] = useState(search);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(null);
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { isVulnerable } = useLab();

  useEffect(() => { api.get('/products/categories').then((r) => setCategories(r.data.categories)).catch(() => {}); }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api.get('/products', { params: { search, category, sort } })
      .then((r) => alive && setProducts(r.data.products))
      .catch((err) => alive && setError(errorMessage(err, 'Mahsulotlarni yuklab bo‘lmadi')))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [search, category, sort]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next);
  };

  const onAdd = async (p) => {
    if (!user) { navigate('/login'); return; }
    setAdding(p.id);
    try { await add(p.id, 1); toast.success(`${p.name} savatchaga qo‘shildi`); } catch (err) { toast.error(errorMessage(err)); } finally { setAdding(null); }
  };

  return (
    <div>
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-8 text-white sm:p-10">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <p className="text-sm font-medium text-white/80">VulnShop Electronics</p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Premium gadjetlar — xavfsizlik laboratoriyasi ichida</h1>
        <form className="relative mt-6 flex max-w-xl gap-2" onSubmit={(e) => { e.preventDefault(); setParam('search', term.trim()); }}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Mahsulot qidirish..." className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none ring-4 ring-white/20" aria-label="Qidiruv" />
          </div>
          <button type="submit" className="rounded-xl bg-slate-950/80 px-5 text-sm font-semibold hover:bg-slate-950">Qidirish</button>
        </form>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} type="button" onClick={() => setParam('category', c)}
              className={cx('rounded-full px-3.5 py-1.5 text-sm font-medium transition', category === c ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800')}>
              {c || 'Barchasi'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal className="h-4 w-4" />
          <select className="input w-auto py-2" value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Saralash">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      {search && (
        isVulnerable('xss')
          // XSS LAB (vulnerable mode): search term rendered as HTML — DOM-based XSS sink.
          ? <h2 className="mb-4 text-lg font-semibold" dangerouslySetInnerHTML={{ __html: `“${search}” bo‘yicha natijalar` }} />
          : <h2 className="mb-4 text-lg font-semibold">“{search}” bo‘yicha natijalar</h2>
      )}

      {error ? <ErrorState message={error} onRetry={() => setParam('search', search)} /> : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-8 w-full" /></div></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Hech narsa topilmadi" text="Boshqa so‘z bilan qidirib ko‘ring yoki filtrni olib tashlang." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} onAdd={onAdd} adding={adding === p.id} />)}
        </div>
      )}
    </div>
  );
}
