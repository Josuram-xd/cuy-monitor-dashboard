import { Icon } from '../../components/Icon/Icon'
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl'
import { useToast } from '../../components/Toast/useToast'
import { t } from '../../i18n'
import { LANGUAGES, type Language, type Theme } from '../../preferences/storage'
import { usePreferences } from '../../preferences/usePreferences'
import styles from './Settings.module.css'

const THEME_ICONS = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
} as const

// Ajustes > Preferencias: language and appearance. Each change applies at once.
export function Settings() {
  const { language, theme, setLanguage, setTheme } = usePreferences()
  const toast = useToast()

  function chooseLanguage(next: Language) {
    if (next !== language) {
      setLanguage(next)
    }
  }

  function chooseTheme(next: Theme) {
    if (next !== theme) {
      setTheme(next)
      toast.show({ message: t('settings.saved') })
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('settings.title')}</h1>
      </header>
      <section className={styles.card} aria-labelledby="preferences-heading">
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon} aria-hidden="true">
            <Icon name="settings" size={22} />
          </span>
          <div>
            <h2 id="preferences-heading">{t('settings.preferences')}</h2>
            <p className={styles.intro}>{t('settings.preferencesIntro')}</p>
          </div>
        </div>
        <SegmentedControl
          label={t('settings.language')}
          // each language is written in itself, so it can be found whatever the current one is
          options={LANGUAGES.map((value) => ({
            value,
            label: t(`languages.${value}`),
            icon: <Icon name="globe" size={18} />,
          }))}
          value={language}
          onChange={chooseLanguage}
        />
        <SegmentedControl
          label={t('settings.appearance')}
          hint={t('settings.themeHint')}
          options={(['system', 'light', 'dark'] as const).map((value) => ({
            value,
            label: t(`settings.theme.${value}`),
            icon: <Icon name={THEME_ICONS[value]} size={18} />,
          }))}
          value={theme}
          onChange={chooseTheme}
        />
      </section>
    </div>
  )
}
