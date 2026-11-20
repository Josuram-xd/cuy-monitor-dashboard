import { Link } from 'react-router'
import { Logo } from '../../components/Logo/Logo'
import { t } from '../../i18n'
import styles from './Legal.module.css'

export type LegalDoc = 'privacy' | 'terms'

// the order of the sections; each one has a title and a text under legal.<doc>.sections.<key>
const SECTIONS: Record<LegalDoc, string[]> = {
  privacy: ['who', 'collect', 'use', 'providers', 'cookies', 'keep', 'rights', 'changes'],
  terms: ['accept', 'service', 'account', 'use', 'demo', 'health', 'liability', 'end', 'changes'],
}

// Public on purpose: the register page links here before there is a session.
export function Legal({ doc }: { doc: LegalDoc }) {
  const other: LegalDoc = doc === 'privacy' ? 'terms' : 'privacy'
  return (
    <div className={styles.page}>
      <Link to="/" className={styles.brand}>
        <Logo size={32} />
        <span>{t('app.shortTitle')}</span>
      </Link>
      <article className={styles.card}>
        <h1 className={styles.title}>{t(`legal.${doc}.title`)}</h1>
        <p className={styles.updated}>{t('legal.updated')}</p>
        <p>{t(`legal.${doc}.intro`)}</p>
        {SECTIONS[doc].map((key, index) => (
          <section key={key} className={styles.section}>
            <h2 className={styles.heading}>
              {index + 1}. {t(`legal.${doc}.sections.${key}.title`)}
            </h2>
            <p className={styles.text}>{t(`legal.${doc}.sections.${key}.text`)}</p>
          </section>
        ))}
      </article>
      <nav className={styles.links} aria-label={t('legal.label')}>
        <Link to={`/${other}`}>{t(`legal.${other}.title`)}</Link>
        <Link to="/">{t('legal.back')}</Link>
      </nav>
    </div>
  )
}

export function Privacy() {
  return <Legal doc="privacy" />
}

export function Terms() {
  return <Legal doc="terms" />
}
