import { GraduationCap, Flag, Wrench } from 'lucide-react';
import useApi from '../../utils/useApi';
import { PageHeader, Skeleton, ErrorState, ProgressBar, cx } from '../../components/ui';

const LABS = ['sqli', 'xss', 'bac', 'idor', 'broken-auth', 'weak-password', 'misconfig', 'sensitive-data', 'csrf', 'path-traversal'];

export default function Instructor() {
  const { data, loading, error, reload, status } = useApi('/labs/students');
  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState message={status === 403 ? 'Faqat instruktor (admin) uchun.' : error} onRetry={reload} />;
  return (
    <div>
      <PageHeader title="O‘quvchilar progressi" subtitle="Har bir o‘quvchi bo‘yicha topilgan / tuzatilgan / test natijalari" icon={GraduationCap} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="table-head">O‘quvchi</th>
              {LABS.map((l) => <th key={l} className="table-head text-center">{l}</th>)}
              <th className="table-head">Ball</th><th className="table-head w-40">Yakun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.students.map((s) => (
              <tr key={s.id}>
                <td className="table-cell"><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                {LABS.map((l) => {
                  const p = s.labs[l];
                  return (
                    <td key={l} className="table-cell text-center">
                      <div className="inline-flex gap-1" title={`Topilgan: ${p.discovered ? 'ha' : 'yo‘q'}, tuzatilgan: ${p.fixed ? 'ha' : 'yo‘q'}, test: ${p.quizScore}%`}>
                        <Flag className={cx('h-4 w-4', p.discovered ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700')} />
                        <Wrench className={cx('h-4 w-4', p.fixed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700')} />
                      </div>
                    </td>
                  );
                })}
                <td className="table-cell font-semibold">{s.points}</td>
                <td className="table-cell"><div className="flex items-center gap-2"><ProgressBar value={s.completion} /><span className="text-xs">{s.completion}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
