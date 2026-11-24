import clsxBase, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const clsx = (...a: ClassValue[]) => twMerge(clsxBase(...a));
import { X } from 'lucide-react';
import { useEffect, type HTMLAttributes, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import type { CategoryId, Priority } from '../types';
import { categoryDot, categoryLabel, priorityLabel } from '../lib/constants';

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...p}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'bg-ink text-white hover:bg-ink-soft',
        variant === 'secondary' && 'bg-white border border-line text-ink hover:bg-stone-50',
        variant === 'ghost' && 'text-ink-soft hover:bg-stone-100',
        variant === 'danger' && 'bg-white border border-line text-crit hover:bg-crit-soft',
        className,
      )}
    />
  );
}

export function IconButton({ label, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...p}
      className={clsx('inline-grid place-items-center h-8 w-8 rounded-md text-ink-muted hover:bg-stone-100 hover:text-ink transition-colors', className)}
    />
  );
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...p} className={clsx('bg-white border border-line rounded-xl shadow-card', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const fieldBase =
  'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink-faint';

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={clsx(fieldBase, 'h-9', className)} />;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={clsx(fieldBase, 'py-2 min-h-[80px] resize-y', className)} />;
}
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={clsx(fieldBase, 'h-9 pr-8', className)}>
      {children}
    </select>
  );
}

export function Field({ label, children, className, hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="block text-xs font-medium text-ink-muted mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-faint mt-1">{hint}</span>}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={clsx(
          'bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-lift flex flex-col max-h-[92vh]',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold">{title}</h3>
          <IconButton label="Fechar" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'ok' | 'warn' | 'crit' | 'dark'; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tone === 'neutral' && 'bg-stone-100 text-ink-soft',
        tone === 'ok' && 'bg-ok-soft text-ok',
        tone === 'warn' && 'bg-warn-soft text-warn',
        tone === 'crit' && 'bg-crit-soft text-crit',
        tone === 'dark' && 'bg-ink text-white',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ p }: { p: Priority }) {
  const tone = p === 'urgent' ? 'crit' : p === 'high' ? 'warn' : 'neutral';
  return <Badge tone={tone}>{priorityLabel(p)}</Badge>;
}

export function CategoryTag({ c }: { c: CategoryId }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: categoryDot(c) }} />
      {categoryLabel(c)}
    </span>
  );
}

export function Progress({ value, tone = 'ok', className }: { value: number; tone?: 'ok' | 'dark'; className?: string }) {
  return (
    <div className={clsx('h-1.5 w-full rounded-full bg-stone-100 overflow-hidden', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx('h-full rounded-full transition-all', tone === 'ok' ? 'bg-ok' : 'bg-ink')} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-sm text-ink-faint text-center py-8 border border-dashed border-line rounded-xl">{children}</div>;
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={clsx(
            'h-7 px-2.5 rounded-md text-[13px] font-medium transition-colors inline-flex items-center gap-1.5',
            value === o.id ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
