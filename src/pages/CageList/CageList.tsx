import { useState } from 'react'
import { Navigate } from 'react-router'
import { Button } from '../../components/Button/Button'
import { CageCard } from '../../components/CageCard/CageCard'
import {
  CreateCageDialog,
  DeleteCageDialog,
  EditCageDialog,
} from '../../components/CageDialogs/CageDialogs'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { GuineaPigGrid, GuineaPigGridItem } from '../../components/GuineaPigGrid/GuineaPigGrid'
import { Icon } from '../../components/Icon/Icon'
import { RefreshButton } from '../../components/RefreshButton/RefreshButton'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useToast } from '../../components/Toast/useToast'
import { useCages } from '../../hooks/useCages'
import { useNow } from '../../hooks/useNow'
import { useProfile } from '../../hooks/useProfile'
import { useStartSimulations } from '../../hooks/useStartSimulation'
import { t } from '../../i18n'
import type { Cage } from '../../types/Cage'
import styles from './CageList.module.css'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; cage: Cage }
  | { kind: 'delete'; cage: Cage }
  | { kind: 'simulate' }

// "Mis jaulas": the home page. Every cage of the account with its live status; from here a cage is
// opened, created, renamed or deleted.
export function CageList() {
  const cages = useCages()
  const profile = useProfile()
  const now = useNow()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  // the name they picked, if they picked one: the greeting is exactly where it belongs
  const firstName = profile.data?.displayName.split(' ')[0]
  const close = () => setDialog(null)
  const simulations = useStartSimulations()
  const toast = useToast()

  function simulateAll(cageIds: string[]) {
    simulations.mutate(cageIds, {
      onSuccess: (started) => {
        close()
        toast.show({ message: t('toast.simulationsStarted', { count: started }) })
      },
      onError: () => {
        close()
        toast.show({ message: t('toast.simulationFailed'), tone: 'info' })
      },
    })
  }

  // an admin's home is the monitoring panel
  if (profile.data?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  let content
  if (cages.isPending) {
    content = <Skeleton count={2} />
  } else if (cages.isError) {
    content = <ErrorState message={t('cages.loadError')} onRetry={() => void cages.refetch()} />
  } else if (cages.data.length === 0) {
    content = (
      <EmptyState
        mascot="sleepy"
        message={t('cages.empty')}
        action={
          <Button variant="primary" onClick={() => setDialog({ kind: 'create' })}>
            {t('cages.createFirst')}
          </Button>
        }
      />
    )
  } else {
    content = (
      <GuineaPigGrid label={t('cages.title')} wide>
        {cages.data.map((cage, index) => (
          <GuineaPigGridItem key={cage.cageId} index={index}>
            <CageCard
              cage={cage}
              now={now}
              onEdit={(c) => setDialog({ kind: 'edit', cage: c })}
              onDelete={(c) => setDialog({ kind: 'delete', cage: c })}
            />
          </GuineaPigGridItem>
        ))}
      </GuineaPigGrid>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.greeting}>
            {firstName ? t('cage.greeting', { name: firstName }) : t('cage.greetingFallback')}
          </p>
          <h1 className={styles.title}>{t('cages.title')}</h1>
          <p className={styles.intro}>{t('cages.intro')}</p>
        </div>
        <div className={styles.headerActions}>
          <RefreshButton queryKeys={[['cages'], ['cage']]} />
          {/* for practice: the AI analyses a drawn cage in every cage at once */}
          {(cages.data?.length ?? 0) > 1 && (
            <Button onClick={() => setDialog({ kind: 'simulate' })} disabled={simulations.isPending}>
              {t('cages.simulateAll')}
            </Button>
          )}
          <Button variant="primary" onClick={() => setDialog({ kind: 'create' })}>
            <Icon name="plus" size={18} />
            {t('cages.new')}
          </Button>
        </div>
      </header>
      {content}
      {dialog?.kind === 'create' && <CreateCageDialog onClose={close} />}
      {dialog?.kind === 'edit' && <EditCageDialog cage={dialog.cage} onClose={close} />}
      {dialog?.kind === 'delete' && <DeleteCageDialog cage={dialog.cage} onClose={close} />}
      {dialog?.kind === 'simulate' && cages.data && (
        <ConfirmDialog
          title={t('cages.simulateAllTitle', { count: cages.data.length })}
          confirmLabel={t('cages.simulateAll')}
          busy={simulations.isPending}
          onConfirm={() => simulateAll(cages.data.map((cage) => cage.cageId))}
          onCancel={close}
        >
          <p>{t('cages.simulateAllExplain')}</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
