import { NavLink } from 'react-router'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './BottomNav.module.css'

interface NavItem {
  to: string
  labelKey: string
  icon: IconName
}

// "Cuenta" joins in Task 14.5
const ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.cage', icon: 'home' },
  { to: '/alerts', labelKey: 'nav.alerts', icon: 'bell' },
  { to: '/guinea-pigs/new', labelKey: 'nav.register', icon: 'plus-circle' },
]

// Bottom bar on phones; from 640px the same <nav> sits in the top bar.
export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label={t('nav.label')}>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => cx(styles.link, isActive && styles.active)}
        >
          <Icon name={item.icon} size={22} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
