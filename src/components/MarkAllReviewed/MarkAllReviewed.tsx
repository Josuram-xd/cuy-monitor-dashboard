import { useState } from 'react'
import { useMarkAllAlertsReviewed } from '../../hooks/useMarkAlertReviewed'
import { t } from '../../i18n'
import type { Alert } from '../../types/Alert'
import { Button } from '../Button/Button'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import { FormError } from '../FormError/FormError'
import { Icon } from '../Icon/Icon'
import { useToast } from '../Toast/useToast'

// every open alert of what is on screen, after a confirmation
export function MarkAllReviewed({ alerts }: { alerts: Alert[] }) {
  const markAll = useMarkAllAlertsReviewed()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        <Icon name="check-circle" size={18} />
        {t('alerts.markAll')}
      </Button>
      {confirming && (
        <ConfirmDialog
          title={t('alerts.markAllTitle', { count: alerts.length })}
          confirmLabel={t('alerts.markAllConfirm')}
          onCancel={() => setConfirming(false)}
          busy={markAll.isPending}
          onConfirm={() =>
            markAll.mutate(alerts, {
              onSuccess: () => {
                toast.show({ message: t('toast.allReviewed', { count: alerts.length }) })
                setConfirming(false)
              },
            })
          }
        >
          <p>{t('alerts.markAllText')}</p>
          {markAll.isError && <FormError message={t('alerts.markError')} />}
        </ConfirmDialog>
      )}
    </>
  )
}
