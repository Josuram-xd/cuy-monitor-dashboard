import type { ReactNode } from 'react'
import { t } from '../../i18n'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  title: string
  children: ReactNode
  // SessionNotice, above the card
  notice?: ReactNode
  // secondary link below the card ("¿No tienes cuenta? Regístrate")
  footer?: ReactNode
}

// Shell of /login, /register and /verify: no navigation, one centered column.
export function AuthLayout({ title, children, notice, footer }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <main className={styles.column}>
        <header className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <p className={styles.appName}>{t('app.shortTitle')}</p>
          <p className={styles.tagline}>{t('auth.tagline')}</p>
        </header>
        {notice}
        <section className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </section>
        {footer && <div className={styles.footer}>{footer}</div>}
      </main>
    </div>
  )
}
