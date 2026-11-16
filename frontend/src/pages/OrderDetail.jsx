import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, StickyNote, XCircle } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useApi from '../utils/useApi';
import { Skeleton, ErrorState, Button } from '../components/ui';
import { StatusBadge } from './Orders';
import { money, dateTime } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function OrderDetail() {
  const { id } = useParams();
  const { data, loading, error, reload, setData } = useApi(`/orders/${id}`);
  const { user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (loading) return <Skeleton className="h-80" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const o = data.order;
  const foreign = o.customer && o.customer.id !== user.id;

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/orders/${o.id}/cancel`);
      setData({ order: { ...o, status: res.data.order.status } });
      toast.success('Buyurtma bekor qilindi');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />Buyurtmalarga qaytish</Link>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold">Buyurtma #{o.id}</h1>
            <p className="text-sm text-slate-500">{dateTime(o.createdAt)}{o.customer ? ` · ${o.customer.name}` : ''}</p>
          </div>
          <StatusBadge status={o.status} />
        </div>
        {foreign && <div className="bg-amber-50 px-6 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Bu buyurtma boshqa foydalanuvchiga tegishli.</div>}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {o.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-6 py-4 text-sm">
              <span><span className="font-medium">{i.productName}</span> <span className="text-slate-500">× {i.quantity}</span></span>
              <span className="font-semibold">{money(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3 bg-slate-50 p-6 text-sm dark:bg-slate-900/60">
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" />{o.shippingAddress}</p>
          {o.note && <p className="flex items-start gap-2"><StickyNote className="mt-0.5 h-4 w-4 text-slate-400" />{o.note}</p>}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-bold dark:border-slate-800"><span>Jami</span><span>{money(o.total)}</span></div>
        </div>
      </div>
      {['pending', 'paid'].includes(o.status) && (
        <Button variant="secondary" icon={XCircle} loading={busy} onClick={cancel} className="mt-4">Buyurtmani bekor qilish</Button>
      )}
    </div>
  );
}
