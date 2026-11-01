import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-bg text-primary-fg hover:bg-primary-bg-hover font-medium',
  secondary: 'bg-surface-2 text-ink border border-line-strong hover:bg-surface-3',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-surface-2 text-ink border border-line-strong hover:border-critical hover:bg-surface-3',
};

const SIZES: Record<Size, string> = {
  sm: 'h-7 gap-1.5 px-2 text-meta',
  md: 'h-8 gap-2 px-3 text-ui',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md whitespace-nowrap transition-colors duration-100 select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: Size;
  ref?: Ref<HTMLButtonElement>;
}

/** Square icon-only button. `label` is required so that it always has an accessible name. */
export function IconButton({ label, size = 'md', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors duration-100',
        'hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'size-7' : 'size-8',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
