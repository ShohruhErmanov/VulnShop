import { useState } from 'react';
import { Users, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import useApi from '../../utils/useApi';
import { PageHeader, Skeleton, Modal, Button } from '../../components/ui';
import { AdminGuard } from './AdminDashboard';
import { date, initials } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { data, loading, error, status, reload, setData } = useApi('/admin/users');
  const { user: me } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  if (loading) return <Skeleton className="h-96" />;
  if (error) return <AdminGuard status={status} error={error} reload={reload} />;

  const setRole = async (u, role) => {
    try {
      const res = await api.patch(`/admin/users/${u.id}/role`, { role });
      setData({ users: data.users.map((x) => (x.id === u.id ? { ...x, role: res.data.user.role } : x)) });
      toast.success(`${u.name}: rol ${role}`);
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async () => {
    try { await api.delete(`/admin/users/${confirm.id}`); setConfirm(null); toast.success('Foydalanuvchi o‘chirildi'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" subtitle={`${data.users.length} ta akkaunt`} icon={Users} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 dark:border-slate-800"><tr><th className="table-head">Foydalanuvchi</th><th className="table-head">Telefon</th><th className="table-head">Ro‘yxatdan o‘tgan</th><th className="table-head">Rol</th><th className="table-head" /></tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.users.map((u) => (
              <tr key={u.id}>
                <td className="table-cell"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold dark:bg-slate-800">{initials(u.name)}</span><span><p className="font-medium">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></span></div></td>
                <td className="table-cell text-slate-500">{u.phone || '—'}</td>
                <td className="table-cell text-slate-500">{date(u.createdAt)}</td>
                <td className="table-cell">
                  <select className="input py-1.5" value={u.role} onChange={(e) => setRole(u, e.target.value)} aria-label={`${u.name} roli`}>
                    <option value="customer">customer</option><option value="admin">admin</option>
                  </select>
                </td>
                <td className="table-cell text-right">{u.id !== me.id && <button type="button" className="btn-ghost p-2 text-rose-500" onClick={() => setConfirm(u)} aria-label="O‘chirish"><Trash2 className="h-4 w-4" /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Foydalanuvchini o‘chirish" footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Bekor</Button><Button variant="danger" onClick={remove}>O‘chirish</Button></>}>
        <p className="text-sm">{confirm && confirm.name} akkaunti va unga tegishli barcha buyurtma/sharhlar o‘chiriladi.</p>
      </Modal>
    </div>
  );
}
