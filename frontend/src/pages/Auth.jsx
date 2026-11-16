import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../api/client';
import { Button, Field } from '../components/ui';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-violet-700 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-3"><img src="/favicon.svg" alt="" className="h-10 w-10" /><span className="text-lg font-bold">VulnShop</span></Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Xavfsizlikni real do‘kon misolida o‘rganing</h2>
          <p className="mt-4 text-white/80">10 ta OWASP laboratoriyasi, zaif va xavfsiz kod taqqoslovi, testlar va progress kuzatuvi — barchasi lokal, izolyatsiyalangan muhitda.</p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/70"><ShieldCheck className="h-4 w-4" />Faqat localhost uchun o‘quv muhiti. Barcha ma’lumotlar sun’iy.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input className="input pl-9" {...props} />
  </div>
);

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Xush kelibsiz, ${user.name}!`);
      navigate((location.state && location.state.from) || '/');
    } catch (err) {
      toast.error(errorMessage(err), 'Kirish amalga oshmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Tizimga kirish" subtitle="Lab akkauntlari INSTALLATION.md da keltirilgan." footer={<>Akkaunt yo‘qmi? <Link className="font-semibold text-brand-600" to="/register">Ro‘yxatdan o‘ting</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><IconInput icon={Mail} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alice@vulnshop.local" /></Field>
        <Field label="Parol"><IconInput icon={Lock} type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Button type="submit" loading={busy} className="w-full">Kirish</Button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success('Akkaunt yaratildi');
      navigate('/lab');
    } catch (err) {
      toast.error(errorMessage(err), 'Ro‘yxatdan o‘tib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Ro‘yxatdan o‘tish" subtitle="Faqat sun’iy ma’lumotlardan foydalaning (masalan, ism@vulnshop.local)." footer={<>Akkauntingiz bormi? <Link className="font-semibold text-brand-600" to="/login">Kirish</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ism"><IconInput icon={UserIcon} required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><IconInput icon={Mail} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Parol" hint="Parol siyosati Weak Password lab rejimiga bog‘liq."><IconInput icon={Lock} type="password" required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Button type="submit" loading={busy} className="w-full">Akkaunt yaratish</Button>
      </form>
    </Shell>
  );
}
