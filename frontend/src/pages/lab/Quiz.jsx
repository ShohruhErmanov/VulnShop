import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { Button, cx } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function Quiz({ labId, questions, onGraded }) {
  const [answers, setAnswers] = useState(() => questions.map(() => null));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const complete = answers.every((a) => a !== null);

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/labs/${labId}/quiz`, { answers });
      setResult(data);
      onGraded(data);
      if (data.passed) toast.success(`${data.correct}/${data.total} to‘g‘ri — test topshirildi!`); else toast.warning(`${data.correct}/${data.total} to‘g‘ri. O‘tish uchun 70% kerak.`);
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => {
        const r = result && result.results[qi];
        return (
          <fieldset key={qi} className="card p-5">
            <legend className="sr-only">{q.q}</legend>
            <p className="font-medium">{qi + 1}. {q.q}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                const isCorrect = r && r.answer === oi;
                return (
                  <label key={oi} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition',
                    r ? (isCorrect ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : chosen ? 'border-rose-400 bg-rose-50 dark:bg-rose-500/10' : 'border-slate-200 dark:border-slate-800')
                      : chosen ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800')}>
                    <input type="radio" name={`q${qi}`} className="accent-brand-600" checked={chosen} disabled={Boolean(r)} onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))} />
                    {opt}
                  </label>
                );
              })}
            </div>
            {r && (
              <p className={cx('mt-3 flex items-start gap-2 text-sm', r.correct ? 'text-emerald-600' : 'text-rose-600')}>
                {r.correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span className="text-slate-600 dark:text-slate-300">{r.explanation}</span>
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="flex items-center gap-3">
        {result ? (
          <>
            <p className={cx('text-sm font-semibold', result.passed ? 'text-emerald-600' : 'text-rose-600')}>Natija: {result.score}%</p>
            <Button variant="secondary" onClick={() => { setResult(null); setAnswers(questions.map(() => null)); }}>Qayta topshirish</Button>
          </>
        ) : <Button onClick={submit} loading={busy} disabled={!complete}>Javoblarni yuborish</Button>}
      </div>
    </div>
  );
}
