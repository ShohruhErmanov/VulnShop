import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Brain, Newspaper, Bug, FlaskConical, TestTube2, ShieldCheck, ListChecks, NotebookPen,
  ShieldAlert, Flag, Wrench, CheckCircle2, XCircle, Lightbulb, Target, Wrench as Tool,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import useApi from '../../utils/useApi';
import { Skeleton, ErrorState, Badge, Button, cx } from '../../components/ui';
import CodeBlock from '../../components/CodeBlock';
import { labIcon } from '../../components/icons';
import Quiz from './Quiz';
import { useLab } from '../../context/LabContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TABS = [
  ['intro', 'Kirish', BookOpen], ['theory', 'Nazariya', Brain], ['scenario', 'Real hodisa', Newspaper],
  ['vuln', 'Zaif kod', Bug], ['practical', 'Amaliy lab', FlaskConical], ['testing', 'Xavfsizlik testi', TestTube2],
  ['secure', 'Xavfsiz kod', ShieldCheck], ['quiz', 'Test', ListChecks], ['homework', 'Uy vazifasi', NotebookPen],
];

const List = ({ items, ordered, icon: Icon }) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="space-y-3">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-xs font-bold text-brand-600">{Icon ? <Icon className="h-3.5 w-3.5" /> : i + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </Tag>
  );
};

const Box = ({ title, icon: Icon, children, tone }) => (
  <div className={cx('card p-5', tone === 'warn' && 'border-amber-300 dark:border-amber-900/60')}>
    <h3 className="mb-3 flex items-center gap-2 font-semibold">{Icon && <Icon className="h-4 w-4 text-brand-500" />}{title}</h3>
    {children}
  </div>
);

export default function LabModule() {
  const { id } = useParams();
  const { data, loading, error, reload, setData } = useApi(`/labs/${id}`);
  const { refreshModes, appMode, hosted } = useLab();
  const { replaceToken, refresh, user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('intro');
  const [flag, setFlag] = useState('');
  const [busy, setBusy] = useState('');
  const [verify, setVerify] = useState(null);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const lab = data.lab;
  const c = lab.content;
  const Icon = labIcon(lab.icon);
  const patch = (p) => setData({ lab: { ...lab, ...p } });

  const toggle = async () => {
    setBusy('mode');
    try {
      const res = await api.put(`/labs/${id}/mode`, { vulnerable: !lab.vulnerable });
      if (res.data.token) { replaceToken(res.data.token); await refresh(); }
      patch({ vulnerable: res.data.vulnerable });
      setVerify(null);
      await refreshModes();
      toast.info(res.data.vulnerable ? 'Zaif rejim yoqildi' : 'Xavfsiz rejim yoqildi');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  };
  const submitFlag = async (e) => {
    e.preventDefault();
    setBusy('flag');
    try {
      const res = await api.post(`/labs/${id}/flag`, { flag });
      if (res.data.correct) { patch({ progress: res.data.progress }); setFlag(''); toast.success('Flag to‘g‘ri! Zaiflik topildi.'); } else toast.error('Flag noto‘g‘ri');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  };
  const runVerify = async () => {
    setBusy('verify');
    try {
      const res = await api.post(`/labs/${id}/verify`);
      setVerify(res.data);
      if (res.data.progress) patch({ progress: res.data.progress });
      if (res.data.fixed) toast.success('Himoya tasdiqlandi!'); else if (res.data.mode === 'vulnerable') toast.warning('Lab hali zaif rejimda');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(''); }
  };

  return (
    <div>
      <Link to="/lab" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />Lab Dashboard</Link>
      <div className="card mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <div className={cx('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', lab.vulnerable ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600')}><Icon className="h-7 w-7" /></div>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">Lab #{lab.order} · {lab.owasp}</p>
          <h1 className="text-2xl font-bold">{lab.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Modul: {lab.module} · <code className="font-mono text-xs">{lab.endpoint}</code></p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{lab.difficulty}</Badge><Badge tone="violet">{lab.points} ball</Badge>
            <Badge tone={lab.progress.discovered ? 'amber' : 'slate'} icon={Flag}>{lab.progress.discovered ? 'Topilgan' : 'Topilmagan'}</Badge>
            <Badge tone={lab.progress.fixed ? 'emerald' : 'slate'} icon={Wrench}>{lab.progress.fixed ? 'Tuzatilgan' : 'Tuzatilmagan'}</Badge>
            {lab.progress.quizPassed && <Badge tone="violet">Test: {lab.progress.quizScore}%</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          {lab.vulnerable ? <Badge tone="rose" icon={ShieldAlert}>Zaif rejim</Badge> : <Badge tone="emerald" icon={ShieldCheck}>Xavfsiz rejim</Badge>}
          {appMode === 'lab' && hosted && !user.instructor && <p className="max-w-[220px] text-right text-xs text-slate-500">Sinf serverida rejimni instruktor almashtiradi.</p>}
          {appMode === 'lab' && (!hosted || user.instructor) && <Button variant={lab.vulnerable ? 'primary' : 'secondary'} loading={busy === 'mode'} onClick={toggle}>{lab.vulnerable ? 'Xavfsiz rejimga o‘tish' : 'Zaif rejimga o‘tish'}</Button>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="-mx-4 mb-5 overflow-x-auto px-4">
            <div className="flex w-max gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900" role="tablist">
              {TABS.map(([key, label, TIcon], i) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                  className={cx('flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition', tab === key ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')}>
                  <TIcon className="h-4 w-4" /><span className="hidden sm:inline">{i + 1}.</span>{label}
                </button>
              ))}
            </div>
          </div>

          <div className="animate-fade-in space-y-5" key={tab}>
            {tab === 'intro' && <Box title="Kirish" icon={BookOpen}><p className="leading-7 text-slate-700 dark:text-slate-300">{c.introduction}</p></Box>}
            {tab === 'theory' && <Box title="Nazariya" icon={Brain}><List items={c.theory} /></Box>}
            {tab === 'scenario' && <Box title="Real hayotdagi hodisa" icon={Newspaper}><p className="leading-7 text-slate-700 dark:text-slate-300">{c.scenario}</p></Box>}
            {tab === 'vuln' && (
              <>
                <CodeBlock code={c.vulnerableCode.code} file={c.vulnerableCode.file} tone="vulnerable" />
                <Box title="Kod tahlili" icon={Bug}><List items={c.vulnerableCode.explanation} /></Box>
              </>
            )}
            {tab === 'practical' && (
              <>
                <Box title="Maqsad" icon={Target}><p className="text-sm leading-6">{c.practical.objective}</p></Box>
                <Box title="Vazifalar" icon={FlaskConical}><List items={c.practical.tasks} ordered /></Box>
                <Box title="Yo‘naltiruvchi savollar" icon={Lightbulb} tone="warn"><List items={c.practical.hints} icon={Lightbulb} /></Box>
              </>
            )}
            {tab === 'testing' && (
              <>
                <Box title="Vositalar" icon={Tool}><div className="flex flex-wrap gap-2">{c.testing.tools.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}</div></Box>
                <Box title="Tekshirish bosqichlari" icon={TestTube2}><List items={c.testing.steps} ordered /></Box>
                <Box title="Kutilayotgan natija" icon={CheckCircle2}><p className="text-sm leading-6">{c.testing.expected}</p></Box>
              </>
            )}
            {tab === 'secure' && (
              <>
                <CodeBlock code={c.secureCode.code} file={c.secureCode.file} tone="secure" />
                <Box title="Nima uchun bu xavfsiz?" icon={ShieldCheck}><List items={c.secureCode.explanation} /></Box>
                <Box title="Tekshiruv ro‘yxati" icon={ListChecks}><List items={c.secureCode.checklist} icon={CheckCircle2} /></Box>
              </>
            )}
            {tab === 'quiz' && <Quiz labId={id} questions={c.quiz} onGraded={(r) => patch({ progress: r.progress })} />}
            {tab === 'homework' && <Box title="Uy vazifasi" icon={NotebookPen}><List items={c.homework} ordered /></Box>}
          </div>
        </div>

        <aside className="space-y-4">
          <form onSubmit={submitFlag} className="card space-y-3 p-5">
            <h3 className="flex items-center gap-2 font-semibold"><Flag className="h-4 w-4 text-amber-500" />Flag yuborish</h3>
            <p className="text-xs text-slate-500">Zaiflikni topganingizni tasdiqlash uchun VULNSHOP{'{...}'} formatidagi flagni kiriting.</p>
            <input className="input font-mono" value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="VULNSHOP{...}" required disabled={lab.progress.discovered} />
            <Button type="submit" className="w-full" loading={busy === 'flag'} disabled={lab.progress.discovered}>{lab.progress.discovered ? 'Topilgan ✓' : 'Tekshirish'}</Button>
          </form>
          <div className="card space-y-3 p-5">
            <h3 className="flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4 text-emerald-500" />Tuzatishni tekshirish</h3>
            <p className="text-xs text-slate-500">Avtomatik test joriy kodga ma’lum xavfli kiritmani yuborib, himoya ishlayotganini tekshiradi. “Tuzatilgan” deb belgilash uchun lab xavfsiz rejimda bo‘lishi kerak.</p>
            <Button variant="secondary" className="w-full" loading={busy === 'verify'} onClick={runVerify}>Tekshirishni boshlash</Button>
            {verify && (
              <div className={cx('rounded-xl p-3 text-sm', verify.blocked ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300')}>
                <p className="flex items-center gap-2 font-semibold">{verify.blocked ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{verify.blocked ? 'Himoyalangan' : 'Zaif'}</p>
                <p className="mt-1 text-xs">{verify.detail}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
