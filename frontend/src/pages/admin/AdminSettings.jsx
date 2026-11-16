import { Settings } from 'lucide-react';
import useApi from '../../utils/useApi';
import { PageHeader, Skeleton } from '../../components/ui';
import { AdminGuard } from './AdminDashboard';

const LABELS = { storeName: 'Do‘kon nomi', currency: 'Valyuta', paymentGateway: 'To‘lov shlyuzi', maintenanceMode: 'Texnik xizmat rejimi', internalFlag: 'Ichki kod', note: 'Izoh' };

export default function AdminSettings() {
  const { data, loading, error, status, reload } = useApi('/admin/settings');
  if (loading) return <Skeleton className="h-64" />;
  if (error) return <AdminGuard status={status} error={error} reload={reload} />;
  const entries = Object.entries(data.settings).filter(([, v]) => v !== undefined && v !== null);
  return (
    <div>
      <PageHeader title="Sozlamalar" subtitle="Do‘konning ichki konfiguratsiyasi" icon={Settings} />
      <div className="card divide-y divide-slate-200 dark:divide-slate-800">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-slate-500">{LABELS[k] || k}</span>
            <span className="break-all font-mono text-sm">{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
