export const money = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v || 0));

export const date = (v) =>
  v ? new Intl.DateTimeFormat('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(v)) : '—';

export const dateTime = (v) =>
  v ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—';

export const ORDER_STATUS = {
  pending: { label: 'Kutilmoqda', tone: 'amber' },
  paid: { label: 'To‘langan', tone: 'blue' },
  shipped: { label: 'Yo‘lda', tone: 'violet' },
  delivered: { label: 'Yetkazilgan', tone: 'emerald' },
  cancelled: { label: 'Bekor qilingan', tone: 'rose' },
};

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
