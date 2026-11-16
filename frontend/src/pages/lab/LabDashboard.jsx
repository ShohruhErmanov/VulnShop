import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Flag, Wrench, Trophy, Target, RotateCcw, Lock, Unlock, Activity } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import useApi from '../../utils/useApi';
import { PageHeader, StatCard, Skeleton, ErrorState, ProgressRing, ProgressBar, Badge, Button, Modal, cx } from '../../components/ui';
import { labIcon } from '../../components/icons';
import { useLab } from '../../context/LabContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dateTime } from '../../utils/format';

export default function LabDashboard() {
  const { data, loading, error, reload } = useApi('/labs/dashboard');
  const { refreshModes, hosted } = useLab();
  const { replaceToken, user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { summary: s, labs, owasp, activity, appMode } = data;

  const setAll = async (vulnerable) => {
    setBusy(vulnerable ? 'vuln' : 'secure');
    try {
      const res = await api.put('/labs/modes', { vulnerable });
      replaceToken(res.data.token);
      await Promise.all([reload(), refreshModes()]);
      toast.success(vulnerable ? 'Barcha lablar zaif rejimga o‘tkazildi' : 'Barcha lablar xavfsiz rejimga o‘tkazildi');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  };
  const resetProgress = async () => {
    try { await api.delete('/labs/progress'); setConfirmReset(false); await reload(); toast.success('Progress tozalandi'); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div>
      <PageHeader
        title="Security Lab Dashboard"
        subtitle="OWASP Top 10 asosidagi 10 ta amaliy laboratoriya"
        icon={ShieldCheck}
        actions={appMode === 'lab' && (
          <>
            {(!hosted || user.instructor) && <Button variant="secondary" icon={Lock} loading={busy === 'secure'} onClick={() => setAll(false)}>Hammasini xavfsiz</Button>}
            {(!hosted || user.instructor) && <Button variant="secondary" icon={Unlock} loading={busy === 'vuln'} onClick={() => setAll(true)}>Hammasini zaif</Button>}
            <Button variant="ghost" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Progressni tozalash</Button>
          </>
        )}
      />
      {hosted && <div className="card mb-6 border-brand-300 p-4 text-sm text-slate-600 dark:border-brand-900 dark:text-slate-300">Siz umumiy sinf serveridasiz. Lab rejimlarini instruktor boshqaradi; boshqa o‘quvchilarga zarar yetkazadigan amallar (mahsulot/akkauntlarni o‘chirish va h.k.) bloklangan. Profil, email va CSRF mashqlari uchun o‘z akkauntingizni yarating.</div>}
      {appMode === 'production' && <div className="card mb-6 border-emerald-300 p-4 text-sm text-emerald-700 dark:text-emerald-300">Production rejimi: barcha zaifliklar avtomatik o‘chirilgan, rejimlarni o‘zgartirib bo‘lmaydi.</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami zaifliklar" value={s.total} icon={Target} />
        <StatCard label="Topilgan (flag)" value={`${s.discovered}/${s.total}`} icon={Flag} tone="amber" />
        <StatCard label="Tuzatilgan (tasdiqlangan)" value={`${s.fixed}/${s.total}`} icon={Wrench} tone="emerald" />
        <StatCard label="Ballar" value={s.points} icon={Trophy} tone="violet" hint={`Maksimal: ${s.maxPoints}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center gap-6 p-6 sm:flex-row lg:flex-col xl:flex-row">
          <ProgressRing value={s.securityScore} label="Security score" />
          <div className="w-full space-y-4">
            <div><div className="mb-1 flex justify-between text-sm"><span>Lab yakunlanishi</span><span className="font-semibold">{s.completion}%</span></div><ProgressBar value={s.completion} /></div>
            <div><div className="mb-1 flex justify-between text-sm"><span>Testlar topshirilgan</span><span className="font-semibold">{s.quizzes}/{s.total}</span></div><ProgressBar value={(s.quizzes / s.total) * 100} tone="emerald" /></div>
            <p className="text-xs text-slate-500">Security score = xavfsiz rejimdagi lablar ulushi ({s.secured}/{s.total}).</p>
          </div>
        </div>
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">OWASP Top 10 kategoriyalari</h2>
          <div className="space-y-4">
            {owasp.map((o) => (
              <div key={o.category}>
                <div className="mb-1 flex justify-between gap-2 text-sm"><span className="truncate">{o.category}</span><span className="shrink-0 text-slate-500">{o.discovered} topilgan · {o.fixed} tuzatilgan / {o.labs}</span></div>
                <div className="flex gap-1">
                  <ProgressBar value={(o.discovered / o.labs) * 100} tone="amber" />
                  <ProgressBar value={(o.fixed / o.labs) * 100} tone="emerald" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold">Laboratoriyalar</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {labs.map((lab) => {
          const Icon = labIcon(lab.icon);
          return (
            <Link key={lab.id} to={`/lab/${lab.id}`} className="card card-hover group p-5">
              <div className="flex items-start justify-between">
                <div className={cx('flex h-11 w-11 items-center justify-center rounded-xl', lab.vulnerable ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600')}><Icon className="h-5 w-5" /></div>
                {lab.vulnerable ? <Badge tone="rose" icon={ShieldAlert}>Zaif</Badge> : <Badge tone="emerald" icon={ShieldCheck}>Xavfsiz</Badge>}
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500">#{lab.order} · {lab.owasp}</p>
              <h3 className="mt-1 font-semibold group-hover:text-brand-600">{lab.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{lab.module}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone={lab.progress.discovered ? 'amber' : 'slate'} icon={Flag}>{lab.progress.discovered ? 'Topilgan' : 'Topilmagan'}</Badge>
                <Badge tone={lab.progress.fixed ? 'emerald' : 'slate'} icon={Wrench}>{lab.progress.fixed ? 'Tuzatilgan' : 'Tuzatilmagan'}</Badge>
                {lab.progress.quizPassed && <Badge tone="violet">Test {lab.progress.quizScore}%</Badge>}
                <Badge>{lab.difficulty} · {lab.points} ball</Badge>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card mt-8 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Activity className="h-4 w-4" />So‘nggi faollik</h2>
        {activity.length === 0 ? <p className="text-sm text-slate-500">Hali faollik yo‘q — birinchi laboratoriyani boshlang.</p> : (
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={`${a.labId}-${a.type}`} className="flex items-center gap-3 text-sm">
                {a.type === 'fixed' ? <Wrench className="h-4 w-4 text-emerald-500" /> : <Flag className="h-4 w-4 text-amber-500" />}
                <span className="flex-1">{a.title} — {a.type === 'fixed' ? 'tuzatish tasdiqlandi' : 'flag topildi'}</span>
                <span className="text-xs text-slate-500">{dateTime(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Progressni tozalash" footer={<><Button variant="secondary" onClick={() => setConfirmReset(false)}>Bekor</Button><Button variant="danger" onClick={resetProgress}>Tozalash</Button></>}>
        <p className="text-sm">Barcha topilgan flaglar, tasdiqlangan tuzatishlar va test natijalaringiz o‘chiriladi.</p>
      </Modal>
    </div>
  );
}
