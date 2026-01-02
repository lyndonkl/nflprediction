'use client';

import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
  interactive?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantStyles = {
  default: 'bg-white border border-slate-200',
  outlined: 'bg-white border-2 border-slate-300',
  elevated: 'bg-white shadow-md border border-slate-100',
};

export function Card({
  children,
  className,
  padding = 'md',
  variant = 'default',
  interactive = false,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={clsx(
        'rounded-lg',
        paddingStyles[padding],
        variantStyles[variant],
        interactive && 'cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm',
        onClick && 'text-left w-full',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center justify-between mb-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={clsx('text-lg font-semibold text-slate-900', className)}>
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className)}>{children}</div>;
}
