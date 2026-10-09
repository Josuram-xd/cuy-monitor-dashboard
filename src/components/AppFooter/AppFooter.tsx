import { Link } from 'react-router'
import { t } from '../../i18n'
import { Logo } from '../Logo/Logo'
import { Wave } from '../Wave/Wave'
import styles from './AppFooter.module.css'

const LINKS = [
  { to: '/how-it-works', labelKey: 'footer.howItWorks' },
  { to: '/', labelKey: 'nav.cage' },
  { to: '/alerts', labelKey: 'nav.alerts' },
  { to: '/guinea-pigs/new', labelKey: 'nav.register' },
  { to: '/account', labelKey: 'nav.account' },
]

// Green like the header, with the same gradient and a wave on top. The links go first and the name
// of the app closes the page.
export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.wave}>
        <Wave flip gradient={{ from: 'var(--header-from)', to: 'var(--header-to)' }} />
      </span>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label={t('footer.label')}>
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={styles.link}>
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
        <div className={styles.brand}>
          <Logo size={28} tone="light" />
          <span className={styles.name}>{t('app.shortTitle')}</span>
        </div>
        <p className={styles.legal}>{t('footer.legal', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  )
}
