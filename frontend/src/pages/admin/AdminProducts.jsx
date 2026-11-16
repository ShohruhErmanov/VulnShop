import { useState } from 'react';
import { Boxes, Plus, Pencil, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import useApi from '../../utils/useApi';
import { PageHeader, Skeleton, Button, Modal, Field, Badge } from '../../components/ui';
import { AdminGuard } from './AdminDashboard';
import { money } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const EMPTY = { name: '', description: '', price: '', category: 'Accessories', stock: 0, isPublished: true, manualFile: '' };

export default function AdminProducts() {
  const { data, loading, error, status, reload } = useApi('/admin/products');
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const open = (p) => {
    setEditing(p ? p.id : 'new');
    setForm(p ? { name: p.name, description: p.description, price: p.price, category: p.category, stock: p.stock, isPublished: p.isPublished, manualFile: p.manualFile || '' } : EMPTY);
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), manualFile: form.manualFile || null };
    try {
      if (editing === 'new') await api.post('/admin/products', payload); else await api.put(`/admin/products/${editing}`, payload);
      toast.success('Mahsulot saqlandi');
      setEditing(null);
      reload();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await api.delete(`/admin/products/${confirm.id}`); toast.success('Mahsulot o‘chirildi'); setConfirm(null); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <AdminGuard status={status} error={error} reload={reload} />;

  return (
    <div>
      <PageHeader title="Mahsulotlar" subtitle={`${data.products.length} ta mahsulot`} icon={Boxes} actions={<Button icon={Plus} onClick={() => open(null)}>Yangi mahsulot</Button>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 dark:border-slate-800"><tr><th className="table-head">Nomi</th><th className="table-head">Kategoriya</th><th className="table-head">Narx</th><th className="table-head">Ombor</th><th className="table-head">Holat</th><th className="table-head" /></tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="table-cell font-medium">{p.name}</td>
                <td className="table-cell text-slate-500">{p.category}</td>
                <td className="table-cell">{money(p.price)}</td>
                <td className="table-cell">{p.stock}</td>
                <td className="table-cell">{p.isPublished ? <Badge tone="emerald">Chop etilgan</Badge> : <Badge tone="amber">Yashirin</Badge>}</td>
                <td className="table-cell text-right">
                  <button type="button" className="btn-ghost p-2" onClick={() => open(p)} aria-label="Tahrirlash"><Pencil className="h-4 w-4" /></button>
                  <button type="button" className="btn-ghost p-2 text-rose-500" onClick={() => setConfirm(p)} aria-label="O‘chirish"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash'} wide>
        <form id="product-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Nomi"><input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Tavsif"><textarea className="input min-h-24" required minLength={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <Field label="Narx (USD)"><input className="input" type="number" min="0.01" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Ombor"><input className="input" type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
          <Field label="Kategoriya">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Audio', 'Laptops', 'Phones', 'Wearables', 'Accessories', 'Gaming', 'Smart Home'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Qo‘llanma fayli (ixtiyoriy)"><input className="input" placeholder="manual-xyz.txt" value={form.manualFile} onChange={(e) => setForm({ ...form, manualFile: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />Katalogda chop etilsin</label>
        </form>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setEditing(null)}>Bekor</Button><Button type="submit" form="product-form" loading={busy}>Saqlash</Button></div>
      </Modal>

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Mahsulotni o‘chirish" footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Bekor</Button><Button variant="danger" onClick={remove}>O‘chirish</Button></>}>
        <p className="text-sm">“{confirm && confirm.name}” butunlay o‘chiriladi. Davom etasizmi?</p>
      </Modal>
    </div>
  );
}
