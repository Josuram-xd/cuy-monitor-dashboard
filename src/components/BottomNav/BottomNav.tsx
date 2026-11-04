import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './BottomNav.module.css'

interface NavItem {
  to: string
  labelKey: string
  icon: IconName
  // the addresses this tab stands for: "Jaulas" is also the tab of every page inside a cage
  owns: (pathname: string) => boolean
}

const ITEMS: NavItem[] = [
  {
    to: '/',
    labelKey: 'nav.cages',
    icon: 'home',
    owns: (path) => path === '/' || path.startsWith('/cages/'),
  },
  {
    to: '/alerts',
    labelKey: 'nav.alerts',
    icon: 'bell',
    owns: (path) => path.startsWith('/alerts'),
  },
  {
    to: '/how-it-works',
    labelKey: 'nav.help',
    icon: 'help-circle',
    owns: (path) => path.startsWith('/how-it-works'),
  },
  {
    to: '/account',
    labelKey: 'nav.account',
    icon: 'user',
    owns: (path) => path.startsWith('/account'),
  },
]

interface Indicator {
  x: number
  width: number
}

// Where the active tab is, to slide the indicator under it (none on pages without a tab, like Ajustes).
function measureActive(nav: HTMLElement): Indicator | null {
  const active = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]')
  return active ? { x: active.offsetLeft, width: active.offsetWidth } : null
}

// Bottom bar on phones; from 640px the same <nav> sits in the top bar. The indicator slides from the tab
// that was active to the new one, so the person sees where they went.
export function BottomNav() {
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const { pathname } = useLocation()

  // the indicator is moved by hand (a transform, never a layout property), so React never re-renders for it
  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) {
      return
    }
    const place = () => {
      const target = measureActive(nav)
      indicator.style.opacity = target ? '1' : '0'
      if (target) {
        indicator.style.setProperty('--indicator-x', `${target.x}px`)
        indicator.style.setProperty('--indicator-width', `${target.width}px`)
      }
    }
    place()
    addEventListener('resize', place)
    return () => removeEventListener('resize', place)
  }, [pathname])

  return (
    <nav ref={navRef} className={styles.nav} aria-label={t('nav.label')}>
      <span
        ref={indicatorRef}
        className={styles.indicator}
        style={{ '--indicator-x': '0px', '--indicator-width': '0px' } as CSSProperties}
        aria-hidden="true"
      />
      {ITEMS.map((item) => {
        const active = item.owns(pathname)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cx(styles.link, active && styles.active)}
          >
            <Icon name={item.icon} size={22} />
            <span>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
