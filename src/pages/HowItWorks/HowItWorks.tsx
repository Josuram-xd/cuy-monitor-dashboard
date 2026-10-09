import { ButtonLink } from '../../components/Button/Button'
import { Icon, type IconName } from '../../components/Icon/Icon'
import { Mascot } from '../../components/Mascot/Mascot'
import { Reveal } from '../../components/Reveal/Reveal'
import { t } from '../../i18n'
import styles from './HowItWorks.module.css'

const STEPS: { key: string; icon: IconName }[] = [
  { key: 'mark', icon: 'circle' },
  { key: 'watch', icon: 'eye' },
  { key: 'analyse', icon: 'activity' },
  { key: 'panel', icon: 'bell' },
]

// What the app does, in four steps. It describes the product; the cage page shows it working.
export function HowItWorks() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <Mascot mood="happy" size={150} className={styles.mascot} />
        <div>
          <h1 className={styles.title}>{t('howItWorks.title')}</h1>
          <p className={styles.intro}>{t('howItWorks.intro')}</p>
        </div>
      </header>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <Reveal key={step.key} delay={index * 90}>
            <li className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.icon} aria-hidden="true">
                <Icon name={step.icon} size={24} />
              </span>
              <div>
                <h2 className={styles.stepTitle}>{t(`howItWorks.steps.${step.key}.title`)}</h2>
                <p className={styles.stepText}>{t(`howItWorks.steps.${step.key}.text`)}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      <div className={styles.actions}>
        <ButtonLink to="/guinea-pigs/new" variant="primary">
          {t('howItWorks.register')}
        </ButtonLink>
        <ButtonLink to="/" variant="secondary">
          {t('howItWorks.seeCage')}
        </ButtonLink>
      </div>
    </div>
  )
}
