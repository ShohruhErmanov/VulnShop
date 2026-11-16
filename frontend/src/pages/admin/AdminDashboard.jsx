import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Boxes, ClipboardList, DollarSign, AlertTriangle } from 'lucide-react';
import useApi from '../../utils/useApi';
import { PageHeader, StatCard, Skeleton, ErrorState, ProgressBar } from '../../components/ui';
import { StatusBadge } from '../Orders';
import { money, date, ORDER_STATUS } from '../../utils/format';

export function AdminGuard({ status, error, reload }) {
  if (status === 403) {
    return <ErrorState message="403 — Bu bo‘lim faqat administratorlar uchun. Server so‘rovni rad etdi." />;
  }
  return <ErrorState message={error} onRetry={reload} />;
}

export default function AdminDashboard() {
  const { data, loading, error, status, reload } = useApi('/admin/stats');
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (error) return <AdminGuard status={status} error={error} reload={reload} />;
  const total = data.byStatus.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Do‘kon ko‘rsatkichlari" icon={LayoutDashboard} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Daromad" value={money(data.revenue)} icon={DollarSign} tone="emerald" />
        <StatCard label="Buyurtmalar" value={data.orders} icon={ClipboardList} />
        <StatCard label="Mahsulotlar" value={data.products} icon={Boxes} tone="violet" />
        <StatCard label="Foydalanuvchilar" value={data.users} icon={Users} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold">So‘nggi buyurtmalar</h2><Link to="/admin/orders" className="text-sm font-medium text-brand-600">Barchasi</Link></div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-medium">#{o.id}</span>
                <span className="flex-1 truncate text-slate-500">{o.customer ? o.customer.name : '—'} · {date(o.createdAt)}</span>
                <StatusBadge status={o.status} />
                <span className="w-20 text-right font-semibold">{money(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-4 font-semibold">Buyurtma holatlari</h2>
            <div className="space-y-3">
              {data.byStatus.map((s) => (
                <div key={s.status}>
                  <div className="mb-1 flex justify-between text-sm"><span>{(ORDER_STATUS[s.status] || {}).label || s.status}</span><span className="font-medium">{s.count}</span></div>
                  <ProgressBar value={(s.count / total) * 100} />
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" />Kam qolganlar</h2>
            {data.lowStock.map((p) => <div key={p.id} className="flex justify-between py-1.5 text-sm"><span className="truncate">{p.name}</span><span className="font-medium">{p.stock}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
