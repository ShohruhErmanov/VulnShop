import { useParams } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import useApi from '../utils/useApi';
import { Skeleton, ErrorState, Badge } from '../components/ui';
import { date, initials } from '../utils/format';

export default function PublicProfile() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(`/users/${id}`);
  if (loading) return <Skeleton className="mx-auto h-64 max-w-lg" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const u = data.user;
  // The UI shows only public fields. Compare with the raw API response in DevTools (Sensitive Data lab).
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-2xl font-bold text-white">{initials(u.name)}</div>
      <h1 className="mt-4 text-xl font-bold">{u.name}</h1>
      <Badge className="mt-2" tone={u.role === 'admin' ? 'violet' : 'slate'}>{u.role}</Badge>
      <p className="mt-4 text-slate-600 dark:text-slate-300">{u.bio || 'Bio kiritilmagan.'}</p>
      <p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500"><UserCircle className="h-4 w-4" />A’zo: {date(u.memberSince || u.createdAt)}</p>
    </div>
  );
}
