import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    fullWidth?: boolean
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {

    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full' : '',
        isLoading ? 'loading' : '',
        className
    ].filter(Boolean).join(' ')

    return (
        <button className={classes} disabled={disabled || isLoading} {...props}>
            {isLoading && <span className="spinner"></span>}
            {children}
        </button>
    )
}
