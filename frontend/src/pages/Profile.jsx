import { useState } from 'react';
import { User as UserIcon, Mail, KeyRound, AlertTriangle, CreditCard, StickyNote } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Field, PageHeader, Badge } from '../components/ui';
import { date, initials } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user.name || '', phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
  const [email, setEmail] = useState(user.email);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  const run = async (key, fn, msg) => {
    setBusy(key);
    try { await fn(); toast.success(msg); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  };

  return (
    <div>
      <PageHeader title="Profil" subtitle={`A’zo bo‘lgan sana: ${date(user.createdAt)}`} icon={UserIcon} />
      {user.sharedAccount && !user.instructor && (
        <div className="card mb-6 p-4 text-sm text-slate-600 dark:text-slate-300">
          Bu umumiy lab akkaunti. Sinf serverida uning profili, emaili va paroli o‘zgartirilmaydi — bu mashqlar uchun o‘z akkauntingizni yarating.
        </div>
      )}
      {user.notice && (
        <div className="card mb-6 flex items-start gap-3 border-rose-300 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-500/10">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <p className="flex-1 break-all">{user.notice}</p>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => run('notice', async () => { const { data } = await api.delete('/account/notice'); setUser(data.user); }, 'Bildirishnoma yopildi')}>Yopish</button>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-fit p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-2xl font-bold text-white">{initials(user.name)}</div>
          <p className="mt-3 font-semibold">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <Badge tone={user.role === 'admin' ? 'violet' : 'slate'} className="mt-2">{user.role}</Badge>
          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-left text-sm dark:border-slate-800">
            <p className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-slate-400" /><span className="font-mono">{user.cardNumber || '—'}</span></p>
            {user.privateNote && <p className="flex items-start gap-2"><StickyNote className="mt-0.5 h-4 w-4 text-slate-400" /><span className="break-all">{user.privateNote}</span></p>}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); run('profile', async () => { const { data } = await api.put('/account/profile', profile); setUser(data.user); }, 'Profil yangilandi'); }}>
            <h2 className="font-semibold">Shaxsiy ma’lumotlar</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ism"><input className="input" required minLength={2} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
              <Field label="Telefon"><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            </div>
            <Field label="Manzil"><input className="input" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></Field>
            <Field label="Bio"><textarea className="input" maxLength={500} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></Field>
            <Button type="submit" loading={busy === 'profile'}>Saqlash</Button>
          </form>
          <div className="grid gap-6 md:grid-cols-2">
            <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); run('email', async () => { const { data } = await api.post('/account/email', { email }); setUser(data.user); }, 'Email yangilandi'); }}>
              <h2 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" />Emailni o‘zgartirish</h2>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" loading={busy === 'email'}>Yangilash</Button>
            </form>
            <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); run('pw', async () => { await api.post('/account/password', pw); setPw({ currentPassword: '', newPassword: '' }); }, 'Parol yangilandi'); }}>
              <h2 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" />Parolni o‘zgartirish</h2>
              <input className="input" type="password" required placeholder="Joriy parol" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              <input className="input" type="password" required placeholder="Yangi parol" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              <Button type="submit" loading={busy === 'pw'}>Yangilash</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
