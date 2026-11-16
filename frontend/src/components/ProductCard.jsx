import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { categoryStyle } from './icons';
import { money } from '../utils/format';
import { cx } from './ui';

/** Generated product artwork (no external images — the lab works fully offline). */
export function ProductVisual({ category, name, className, large }) {
  const { icon: Icon, gradient } = categoryStyle(category);
  return (
    <div className={cx('relative flex items-center justify-center overflow-hidden bg-gradient-to-br', gradient, className)} aria-label={name} role="img">
      <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
      <Icon className={cx('relative text-white drop-shadow-lg', large ? 'h-28 w-28' : 'h-14 w-14')} strokeWidth={1.4} />
    </div>
  );
}

export function Stars({ value, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-sm', className)}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="font-medium">{Number(value || 0).toFixed(1)}</span>
    </span>
  );
}

export default function ProductCard({ product, onAdd, adding }) {
  return (
    <div className="card card-hover group flex flex-col overflow-hidden">
      <Link to={`/products/${product.id}`} className="block">
        <ProductVisual category={product.category} name={product.name} className="aspect-[4/3] transition duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium uppercase tracking-wide text-slate-500">{product.category}</span>
          <Stars value={product.rating} />
        </div>
        <Link to={`/products/${product.id}`} className="line-clamp-2 font-semibold hover:text-brand-600 dark:hover:text-brand-400">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-bold">{money(product.price)}</span>
          {onAdd && (
            <button type="button" className="btn-primary px-3 py-2" onClick={() => onAdd(product)} disabled={adding || product.stock < 1} aria-label={`${product.name} savatchaga`}>
              <ShoppingCart className="h-4 w-4" />
              {product.stock < 1 ? 'Tugagan' : 'Savatcha'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
