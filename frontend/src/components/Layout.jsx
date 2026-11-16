import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Store, ShoppingCart, Package, User, LayoutDashboard, Users, Boxes, ClipboardList, Settings, ShieldCheck,
  GraduationCap, Moon, Sun, LogOut, LogIn, Menu, X, ShieldAlert, WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLab } from '../context/LabContext';
import { cx, Badge } from './ui';
import { initials } from '../utils/format';

function NavItem({ to, icon: Icon, children, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cx(
        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
        isActive
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{children}</span>
      {badge ? <span className="rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">{badge}</span> : null}
    </NavLink>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function Sidebar({ onNavigate }) {
  const { user, isAdmin } = useAuth();
  const { cart } = useCart();
  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto px-3 pb-6" onClick={onNavigate}>
      <Section title="Do‘kon">
        <NavItem to="/" end icon={Store}>Katalog</NavItem>
        <NavItem to="/cart" icon={ShoppingCart} badge={cart.count}>Savatcha</NavItem>
        <NavItem to="/orders" icon={Package}>Buyurtmalarim</NavItem>
        <NavItem to="/profile" icon={User}>Profil</NavItem>
      </Section>
      <Section title="Security Lab">
        <NavItem to="/lab" end icon={ShieldCheck}>Lab Dashboard</NavItem>
        {user && user.instructor && <NavItem to="/lab/instructor" icon={GraduationCap}>O‘quvchilar progressi</NavItem>}
      </Section>
      {/* Admin menu is only HIDDEN for customers — authorization is enforced (or not) by the API. See BAC lab. */}
      {isAdmin && (
        <Section title="Administrator">
          <NavItem to="/admin" end icon={LayoutDashboard}>Dashboard</NavItem>
          <NavItem to="/admin/products" icon={Boxes}>Mahsulotlar</NavItem>
          <NavItem to="/admin/orders" icon={ClipboardList}>Buyurtmalar</NavItem>
          <NavItem to="/admin/users" icon={Users}>Foydalanuvchilar</NavItem>
          <NavItem to="/admin/settings" icon={Settings}>Sozlamalar</NavItem>
        </Section>
      )}
      {!user && (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white">
          <p className="text-sm font-semibold">Laboratoriyani boshlang</p>
          <p className="mt-1 text-xs text-white/80">Tizimga kiring va 10 ta xavfsizlik modulini o‘rganing.</p>
          <Link to="/login" className="mt-3 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">Kirish</Link>
        </div>
      )}
    </nav>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <div>
        <p className="font-bold leading-tight">VulnShop</p>
        <p className="text-[11px] font-medium text-slate-500">Security Lab</p>
      </div>
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { vulnerableCount, appMode, online } = useLab();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
        <Logo />
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-slide-in flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between pr-3">
              <Logo />
              <button type="button" className="btn-ghost p-2" onClick={() => setOpen(false)} aria-label="Menyuni yopish"><X className="h-5 w-5" /></button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
          <button type="button" className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Menyuni ochish"><Menu className="h-5 w-5" /></button>
          <div className="flex flex-1 items-center gap-2">
            {!online ? (
              <Badge tone="rose" icon={WifiOff}>API offline</Badge>
            ) : appMode === 'production' ? (
              <Badge tone="emerald" icon={ShieldCheck}>Production — barcha lablar xavfsiz</Badge>
            ) : (
              <Link to="/lab" title="Security Lab holati">
                <Badge tone={vulnerableCount ? 'rose' : 'emerald'} icon={vulnerableCount ? ShieldAlert : ShieldCheck}>
                  <span className="hidden sm:inline">LAB MODE ·</span> {vulnerableCount}/10 zaif
                </Badge>
              </Link>
            )}
          </div>
          <button type="button" onClick={toggle} className="btn-ghost p-2" aria-label="Mavzuni almashtirish">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-bold text-white">{initials(user.name)}</span>
                <span className="hidden text-sm font-medium md:block">{user.name}</span>
              </Link>
              <button type="button" onClick={doLogout} className="btn-ghost p-2" aria-label="Chiqish"><LogOut className="h-5 w-5" /></button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary py-2"><LogIn className="h-4 w-4" />Kirish</Link>
          )}
        </header>
        <main className="mx-auto max-w-7xl animate-fade-in px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
