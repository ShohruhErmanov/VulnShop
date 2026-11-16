import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import useApi from '../../utils/useApi';
import { PageHeader, Skeleton } from '../../components/ui';
import { AdminGuard } from './AdminDashboard';
import { money, date, ORDER_STATUS } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function AdminOrders() {
  const { data, loading, error, status, reload, setData } = useApi('/admin/orders');
  const toast = useToast();
  if (loading) return <Skeleton className="h-96" />;
  if (error) return <AdminGuard status={status} error={error} reload={reload} />;

  const change = async (o, next) => {
    try {
      await api.patch(`/admin/orders/${o.id}/status`, { status: next });
      setData({ orders: data.orders.map((x) => (x.id === o.id ? { ...x, status: next } : x)) });
      toast.success(`#${o.id} holati yangilandi`);
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div>
      <PageHeader title="Buyurtmalar" subtitle={`${data.orders.length} ta buyurtma`} icon={ClipboardList} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-200 dark:border-slate-800"><tr><th className="table-head">#</th><th className="table-head">Mijoz</th><th className="table-head">Sana</th><th className="table-head">Mahsulotlar</th><th className="table-head">Jami</th><th className="table-head">Holat</th></tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.orders.map((o) => (
              <tr key={o.id}>
                <td className="table-cell font-medium"><Link className="text-brand-600" to={`/orders/${o.id}`}>#{o.id}</Link></td>
                <td className="table-cell">{o.customer ? <><p>{o.customer.name}</p><p className="text-xs text-slate-500">{o.customer.email}</p></> : '—'}</td>
                <td className="table-cell text-slate-500">{date(o.createdAt)}</td>
                <td className="table-cell">{o.items.length}</td>
                <td className="table-cell font-semibold">{money(o.total)}</td>
                <td className="table-cell">
                  <select className="input py-1.5" value={o.status} onChange={(e) => change(o, e.target.value)} aria-label={`#${o.id} holati`}>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
