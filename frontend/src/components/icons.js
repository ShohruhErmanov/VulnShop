import {
  Database, Code2, ShieldOff, KeyRound, LockOpen, Asterisk, Settings2, Eye, Repeat, FolderTree, Shield,
  Headphones, Laptop, Smartphone, Watch, Keyboard, Gamepad2, Lightbulb, Package,
} from 'lucide-react';

export const LAB_ICONS = { Database, Code2, ShieldOff, KeyRound, LockOpen, Asterisk, Settings2, Eye, Repeat, FolderTree };
export const labIcon = (name) => LAB_ICONS[name] || Shield;

export const CATEGORY_STYLE = {
  Audio: { icon: Headphones, gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500' },
  Laptops: { icon: Laptop, gradient: 'from-sky-500 via-blue-500 to-indigo-600' },
  Phones: { icon: Smartphone, gradient: 'from-emerald-400 via-teal-500 to-cyan-600' },
  Wearables: { icon: Watch, gradient: 'from-orange-400 via-rose-500 to-pink-600' },
  Accessories: { icon: Keyboard, gradient: 'from-slate-500 via-slate-600 to-slate-800' },
  Gaming: { icon: Gamepad2, gradient: 'from-violet-500 via-purple-600 to-fuchsia-700' },
  'Smart Home': { icon: Lightbulb, gradient: 'from-amber-400 via-orange-500 to-red-500' },
};
export const categoryStyle = (c) => CATEGORY_STYLE[c] || { icon: Package, gradient: 'from-brand-500 to-violet-600' };
