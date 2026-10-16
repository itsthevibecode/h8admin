import * as React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-offset-2'

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-xs',
      lg: 'px-5 py-2.5 text-sm',
    }

    const variantStyles = {
      primary:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500',
      secondary:
        'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 focus:ring-emerald-400',
      outline:
        'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-xs focus:ring-gray-300',
      ghost:
        'bg-transparent hover:bg-gray-100 text-gray-600 focus:ring-gray-200',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'