import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * PrimaryButton – Full-width dark-green CTA button.
 * Used for primary actions: "Calculate Tax", "Log In", "Go to Dashboard".
 *
 * @example
 * <PrimaryButton onClick={handleSubmit}>Calculate Tax</PrimaryButton>
 * <PrimaryButton disabled>Loading...</PrimaryButton>
 */
export function PrimaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="default"
      size="full"
      className={cn('rounded-full font-semibold', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * OutlineButton – Full-width outline button for secondary actions.
 * Used for "Confirm & Save Order".
 *
 * @example
 * <OutlineButton onClick={handleSave}>Confirm & Save Order</OutlineButton>
 */
export function OutlineButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      size="full"
      className={cn('rounded-full font-medium', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * DarkButton – Full-width dark/black button used on success screens.
 * Used for "Go to dashboard".
 *
 * @example
 * <DarkButton onClick={() => navigate('/')}>Go to dashboard</DarkButton>
 */
export function DarkButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="dark"
      size="full"
      className={cn('rounded-full font-semibold', className)}
      {...props}
    >
      {children}
    </Button>
  )
}
