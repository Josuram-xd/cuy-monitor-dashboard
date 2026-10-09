import {
  MAIN_RULES,
  WARNING_RULES,
  passwordProblems,
  type PasswordContext,
  type PasswordRule,
} from '../../auth/passwordRules'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './PasswordChecklist.module.css'

interface PasswordChecklistProps extends PasswordContext {
  password: string
}

// Ticks the rules of a new password while the user types, with a bar that fills as they are met.
// It never says the password is "strong": the backend has the last word.
export function PasswordChecklist({ password, username, email }: PasswordChecklistProps) {
  const broken = new Set<PasswordRule>(passwordProblems(password, { username, email }))
  const started = password.length > 0
  const met = MAIN_RULES.filter((rule) => !broken.has(rule)).length
  // the extra rules only appear when they are the problem
  const shown = [...MAIN_RULES, ...WARNING_RULES.filter((rule) => started && broken.has(rule))]

  return (
    <div className={styles.box}>
      <p className={styles.title} id="password-rules-title">
        {t('password.title')}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-labelledby="password-rules-title"
        aria-valuemin={0}
        aria-valuemax={MAIN_RULES.length}
        aria-valuenow={started ? met : 0}
        aria-valuetext={t('password.progress', {
          met: started ? met : 0,
          total: MAIN_RULES.length,
        })}
      >
        <span
          className={cx(styles.fill, met === MAIN_RULES.length && started && styles.complete)}
          style={{ width: `${started ? (met / MAIN_RULES.length) * 100 : 0}%` }}
        />
      </div>
      <ul className={styles.list}>
        {shown.map((rule) => {
          const ok = !broken.has(rule) && (started || !MAIN_RULES.includes(rule))
          return (
            <li key={rule} className={cx(styles.item, ok ? styles.ok : styles.pending)}>
              <Icon name={ok ? 'check-circle' : 'circle'} size={16} />
              <span>{t(`password.rules.${rule}`)}</span>
              <span className={styles.sr}>{ok ? t('password.met') : t('password.notMet')}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
