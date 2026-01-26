import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', fullWidth = true, ...props }, ref) => {
        return (
            <div className={`input-wrapper ${fullWidth ? 'w-full' : ''} ${className}`}>
                {label && <label className="input-label" htmlFor={props.id}>{label}</label>}
                <input
                    ref={ref}
                    className={`input-field ${error ? 'error' : ''}`}
                    {...props}
                />
                {error && <span className="input-error-msg">{error}</span>}
            </div>
        )
    }
)

Input.displayName = 'Input'
