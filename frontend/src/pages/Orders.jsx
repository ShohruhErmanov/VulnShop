import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import useApi from '../utils/useApi';
import { PageHeader, Skeleton, EmptyState, ErrorState, Badge } from '../components/ui';
import { money, date, ORDER_STATUS } from '../utils/format';

export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export default function Orders() {
  const { data, loading, error, reload } = useApi('/orders');
  return (
    <div>
      <PageHeader title="Buyurtmalarim" subtitle="Barcha buyurtmalaringiz tarixi" icon={Package} />
      {loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        : error ? <ErrorState message={error} onRetry={reload} />
          : data.orders.length === 0 ? <EmptyState icon={Package} title="Buyurtmalar yo‘q" action={<Link to="/" className="btn-primary">Xarid qilish</Link>} />
            : (
              <div className="space-y-3">
                {data.orders.map((o) => (
                  <Link key={o.id} to={`/orders/${o.id}`} className="card card-hover flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600"><Package className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Buyurtma #{o.id}</p>
                      <p className="truncate text-sm text-slate-500">{date(o.createdAt)} · {o.items.length} ta mahsulot</p>
                    </div>
                    <StatusBadge status={o.status} />
                    <p className="hidden w-24 text-right font-semibold sm:block">{money(o.total)}</p>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
    </div>
  );
}
