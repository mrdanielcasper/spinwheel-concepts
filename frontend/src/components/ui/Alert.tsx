import { ReactNode } from 'react';

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive-foreground',
  warning: 'border-amber-500/30 bg-amber-950/30 text-amber-200',
  info: 'border-primary/30 bg-primary/10 text-primary-foreground',
  success: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200',
};

const iconByVariant: Record<AlertVariant, string> = {
  error: '⚠',
  warning: '⚡',
  info: 'ℹ',
  success: '✓',
};

export function Alert({
  children,
  variant = 'info',
  title,
}: {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]}`} role="alert">
      <div className="flex items-start gap-3">
        <span className="text-lg">{iconByVariant[variant]}</span>
        <div>
          {title && <p className="font-semibold">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
