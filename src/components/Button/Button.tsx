import type { ButtonHTMLAttributes, PointerEvent } from 'react'
import { Link, type LinkProps } from 'react-router'
import { spawnRipple } from '../../motion/ripple'
import { cx } from '../../utils/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonStyleProps {
  variant?: ButtonVariant
  fullWidth?: boolean
}

function buttonClass(variant: ButtonVariant, fullWidth: boolean, className?: string): string {
  return cx(styles.button, styles[variant], fullWidth && styles.fullWidth, className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {}

export function Button({
  variant = 'secondary',
  fullWidth = false,
  type = 'button',
  className,
  onPointerDown,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, fullWidth, className)}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        spawnRipple(event)
        onPointerDown?.(event)
      }}
      {...rest}
    />
  )
}

interface ButtonLinkProps extends LinkProps, ButtonStyleProps {}

// navigation that looks like a button ("Registrar cuy", "Ver todas")
export function ButtonLink({
  variant = 'secondary',
  fullWidth = false,
  className,
  onPointerDown,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClass(variant, fullWidth, className)}
      onPointerDown={(event: PointerEvent<HTMLAnchorElement>) => {
        spawnRipple(event)
        onPointerDown?.(event)
      }}
      {...rest}
    />
  )
}
