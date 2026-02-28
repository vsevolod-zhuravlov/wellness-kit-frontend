import { DarkButton } from '@/components/Buttons'
import { cn } from '@/lib/utils'

interface SuccessStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

/**
 * SuccessState – Full-page centered success screen with a green check-circle icon,
 * title, optional description, and an action button. Shown after order confirmation.
 *
 * @example
 * <SuccessState
 *   title="Thank you for your order!"
 *   description="Your order is being processed. We'll notify you soon."
 *   actionLabel="Go to dashboard"
 *   onAction={() => navigate('/')}
 * />
 */
export function SuccessState({ title, description, actionLabel = 'Continue', onAction, className }: SuccessStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-5 py-16 px-6 text-center', className)}>
      {/* Check circle */}
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-green-100">
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4a7c59"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      </div>

      {/* Action */}
      {actionLabel && (
        <DarkButton
          className="w-auto px-8"
          onClick={onAction}
        >
          {actionLabel}
        </DarkButton>
      )}
    </div>
  )
}
