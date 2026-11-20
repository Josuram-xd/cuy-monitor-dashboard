import { useEffect, useState } from 'react'
import { config } from '../../config'
import { t } from '../../i18n'
import styles from './LiveSnapshot.module.css'

// the picture is asked again this often, but only while the page is on screen
const REFRESH_MS = 3_000

// The last picture the AI service got from the camera of the cage (its owner only, the session cookie goes
// with it). The address changes every few seconds, so the browser never shows an old picture.
export function LiveSnapshot({ cageId }: { cageId: string }) {
  const [tick, setTick] = useState(0)
  // the address that failed: the next tick asks for a new one
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTick((count) => count + 1)
      }
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  const src = `${config.apiUrl}/api/v1/cages/${encodeURIComponent(cageId)}/camera/latest?t=${tick}`
  const failed = failedSrc === src
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{t('camera.livePicture')}</h2>
      {failed ? (
        <p className={styles.empty}>{t('camera.noPicture')}</p>
      ) : (
        <img
          className={styles.image}
          src={src}
          alt={t('camera.livePicture')}
          onError={() => setFailedSrc(src)}
        />
      )}
    </section>
  )
}
