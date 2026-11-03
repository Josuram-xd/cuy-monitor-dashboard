import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './CopyCodeButton.module.css'

interface CopyCodeButtonProps {
  code: string
}

// The code of a cage as a dashed button: one tap copies it to type on the camera and the scale.
export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <button
      type="button"
      className={cx(styles.code, copied && styles.copied)}
      onClick={() => void copy(code)}
      title={t('cages.card.copyHint')}
      aria-label={t('cages.card.copy', { code })}
    >
      <Icon name={copied ? 'check' : 'copy'} size={16} />
      <span className={styles.text}>{copied ? t('cages.card.copied') : code}</span>
    </button>
  )
}
