import type { ReactNode } from 'react'
import { t } from '../../i18n'
import { Icon, type IconName } from '../Icon/Icon'
import { Logo } from '../Logo/Logo'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  title: string
  children: ReactNode
  // SessionNotice, above the card
  notice?: ReactNode
  // secondary link below the card ("¿No tienes cuenta? Regístrate")
  footer?: ReactNode
}

const POINTS: { icon: IconName; text: string }[] = [
  { icon: 'eye', text: 'auth.hero.point1' },
  { icon: 'bell', text: 'auth.hero.point2' },
  { icon: 'activity', text: 'auth.hero.point3' },
]

// Shell of /login, /register and /verify: no navigation. A green welcome panel (on a phone just
// the brand, on a wide screen with the benefits) next to the form.
export function AuthLayout({ title, children, notice, footer }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div className={styles.heroInner}>
          <Logo size={56} tone="light" />
          <p className={styles.appName}>{t('app.shortTitle')}</p>
          <p className={styles.tagline}>{t('auth.tagline')}</p>
          <p className={styles.pitch}>{t('auth.hero.title')}</p>
          <ul className={styles.points}>
            {POINTS.map((point) => (
              <li key={point.text} className={styles.point}>
                <span className={styles.pointIcon}>
                  <Icon name={point.icon} size={20} />
                </span>
                {t(point.text)}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className={styles.formArea}>
        <div className={styles.column}>
          {notice}
          <section className={styles.card}>
            <h1 className={styles.title}>{title}</h1>
            {children}
          </section>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </main>
    </div>
  )
}
