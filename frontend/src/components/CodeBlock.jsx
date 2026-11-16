import { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { cx } from './ui';

export default function CodeBlock({ code, file, tone = 'neutral' }) {
  const [copied, setCopied] = useState(false);
  const border = { vulnerable: 'border-rose-500/40', secure: 'border-emerald-500/40', neutral: 'border-slate-700' }[tone];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) { /* clipboard blocked */ }
  };
  return (
    <div className={cx('overflow-hidden rounded-xl border bg-slate-950 text-slate-100', border)}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
        <span className="flex min-w-0 items-center gap-2 truncate"><FileCode2 className="h-3.5 w-3.5 shrink-0" />{file}</span>
        <button type="button" onClick={copy} className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-800" aria-label="Kodni nusxalash">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Nusxalandi' : 'Nusxa'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6"><code className="font-mono">{code}</code></pre>
    </div>
  );
}
