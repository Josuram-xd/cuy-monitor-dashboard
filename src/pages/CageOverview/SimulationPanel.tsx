import { t } from '../../i18n'
import type { SimulationStatus } from '../../types/Simulation'
import styles from './SimulationPanel.module.css'

// the frames are one per second of video: the first minute is when the AI is still getting its first results
const FIRST_RESULTS_FRAMES = 60

// What the simulation cage is, how far its video is, and whose video it plays (the credit is required by its license)
export function SimulationPanel({ status }: { status: SimulationStatus | undefined }) {
  const credit = status?.credit
  let step: string | null = null
  if (status?.running) {
    if (status.framesSent === 0) {
      step = 'simulation.stepLoading'
    } else {
      step =
        status.framesSent < FIRST_RESULTS_FRAMES ? 'simulation.stepWatching' : 'simulation.stepRunning'
    }
  }
  return (
    <section className={styles.panel}>
      <p>{t('simulation.explain')}</p>
      {step && (
        <p role="status" className={styles.step}>
          {t(step)}
        </p>
      )}
      {credit && (
        <p className={styles.credit}>
          {t('simulation.credit', {
            title: credit.title,
            author: credit.author,
            license: credit.license,
          })}
          <span className={styles.links}>
            <a href={credit.sourceUrl} target="_blank" rel="noreferrer">
              {t('simulation.sourceLink')}
            </a>
            <a href={credit.licenseUrl} target="_blank" rel="noreferrer">
              {t('simulation.licenseLink')}
            </a>
          </span>
        </p>
      )}
    </section>
  )
}
