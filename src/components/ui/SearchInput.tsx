import type { InputHTMLAttributes, Ref } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  /** Used as the accessible name. */
  label: string;
  ref?: Ref<HTMLInputElement>;
  containerClassName?: string;
}

export function SearchInput({ value, onChange, label, className, containerClassName, ref, ...rest }: SearchInputProps) {
  return (
    <div className={cn('relative min-w-0', containerClassName)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        ref={ref}
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation();
            onChange('');
          }
        }}
        className={cn(
          'h-8 w-full rounded-md border border-line-strong bg-surface pr-7 pl-8 text-ui text-ink transition-colors duration-100 placeholder:text-ink-3',
          'hover:bg-surface-2 focus:bg-surface-2 [&::-webkit-search-cancel-button]:hidden',
          className,
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded text-ink-3 hover:bg-surface-3 hover:text-ink"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );
}
