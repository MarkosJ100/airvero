export interface SkeletonProps {
    width?: string
    height?: string
    borderRadius?: string
    className?: string
}

export function Skeleton({
    width = '100%',
    height = '1rem',
    borderRadius = '0.375rem',
    className = ''
}: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'var(--color-bg-tertiary)',
                backgroundImage: 'linear-gradient(90deg, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 50%, var(--color-bg-tertiary) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite'
            }}
        />
    )
}

export function CardSkeleton() {
    return (
        <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)'
        }}>
            <Skeleton width="60%" height="1.5rem" />
            <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Skeleton width="100%" height="1rem" />
            </div>
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <Skeleton width="80%" height="1rem" />
            </div>
        </div>
    )
}

export function StatCardSkeleton() {
    return (
        <div style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)'
        }}>
            <Skeleton width="50%" height="0.875rem" />
            <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Skeleton width="40%" height="2rem" />
            </div>
        </div>
    )
}

export function TableRowSkeleton() {
    return (
        <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)'
        }}>
            <Skeleton width="30%" height="1rem" />
            <Skeleton width="25%" height="1rem" />
            <Skeleton width="20%" height="1rem" />
            <Skeleton width="25%" height="1rem" />
        </div>
    )
}
