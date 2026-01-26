import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    noPadding?: boolean
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
    return (
        <div
            className={`card ${className}`}
            style={noPadding ? { padding: 0 } : undefined}
            {...props}
        >
            {children}
        </div>
    )
}
