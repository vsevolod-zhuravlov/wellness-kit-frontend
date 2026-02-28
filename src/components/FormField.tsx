import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  /** Input type. When "password", a show/hide toggle eye button is rendered automatically. */
  type?: React.HTMLInputTypeAttribute
  helperText?: string
  /** Error message — shown in red below the input, replaces helperText */
  error?: string
  /** Success state — green border + green checkmark icon + optional successText */
  success?: boolean
  /** Custom success message. Defaults to helperText when success=true. */
  successText?: string
  id?: string
  containerClassName?: string
}

/**
 * FormField – A complete form field covering every state from the design:
 *
 * | State    | How to trigger                                      |
 * |----------|-----------------------------------------------------|
 * | Default  | No extra props                                      |
 * | Filled   | Controlled `value` prop                            |
 * | Disabled | `disabled` prop                                     |
 * | Error    | `error="message"` — red border + icon + message     |
 * | Success  | `success` — green border + ✓ icon + message         |
 * | Password | `type="password"` — adds show/hide eye toggle       |
 *
 * @example
 * // Default with helper text
 * <FormField label="Latitude" placeholder="40.7580"
 *   helperText="Click on the map or enter coordinates manually" />
 *
 * // Error
 * <FormField label="Email" type="email"
 *   error="Incorrect email address. Please try again." />
 *
 * // Success
 * <FormField label="Password" type="password"
 *   success successText="Password meets all requirements" />
 *
 * // Disabled
 * <FormField label="Username" value="AMELIA" disabled />
 */
export function FormField({
  label,
  type = 'text',
  helperText,
  error,
  success,
  successText,
  id,
  containerClassName,
  className,
  ...inputProps
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const hint = successText ?? helperText

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>

      {/* Input row with optional password toggle */}
      <div className="relative">
        <Input
          id={fieldId}
          type={resolvedType}
          className={cn(
            isPassword && 'pr-10',
            error && 'border-red-400 focus:ring-red-400',
            success && 'border-green-400 focus:ring-green-400',
            className
          )}
          {...inputProps}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Hint / error / success message */}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </p>
      ) : success && hint ? (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z" />
          </svg>
          {hint}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  )
}

// ─── Form-level error ─────────────────────────────────────────────────────────

interface FormErrorProps {
  message?: string | null
  className?: string
}

/**
 * FormError – A form-level error message displayed below a submit button.
 * Shown when the whole form fails (e.g. "Bad email or password").
 *
 * @example
 * <PrimaryButton>Log In</PrimaryButton>
 * <FormError message="Bad email or password" />
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-red-500', className)}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      {message}
    </p>
  )
}
