import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button/Button'
import { t } from '../../i18n'
import { checkScaleUsb } from './scaleUsb'

export function ScaleUsbCheck() {
  const [status, setStatus] = useState('')
  const active = useRef<AbortController | null>(null)
  useEffect(() => () => active.current?.abort(), [])
  async function check() {
    const controller = new AbortController()
    active.current = controller
    setStatus('checking')
    try {
      const result = await checkScaleUsb(controller.signal)
      if (!controller.signal.aborted) setStatus(result)
    } catch {
      if (!controller.signal.aborted) setStatus('lost')
    }
  }
  return (
    <div>
      <Button onClick={check} disabled={status === 'checking'}>
        {t('usb.button')}
      </Button>
      <p role="status">{t(`usb.${status || 'hint'}`)}</p>
    </div>
  )
}
