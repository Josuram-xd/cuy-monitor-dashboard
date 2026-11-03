import { useState } from 'react'
import { errorMessageKey } from '../../api/errorMessages'
import { Button } from '../../components/Button/Button'
import { CageCard } from '../../components/CageCard/CageCard'
import { CageFormDialog } from '../../components/CageFormDialog/CageFormDialog'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { GuineaPigGrid, GuineaPigGridItem } from '../../components/GuineaPigGrid/GuineaPigGrid'
import { Icon } from '../../components/Icon/Icon'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useCages, useCreateCage, useDeleteCage, useUpdateCage } from '../../hooks/useCages'
import { useNow } from '../../hooks/useNow'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/Toast/useToast'
import { t } from '../../i18n'
import type { Cage } from '../../types/Cage'
import styles from './CageList.module.css'

function CreateCage({ onClose }: { onClose: () => void }) {
  const create = useCreateCage()
  const toast = useToast()
  return (
    <CageFormDialog
      onSubmit={(body) =>
        create.mutate(body, {
          onSuccess: (cage) => {
            toast.show({ message: t('toast.cageCreated', { name: cage.name }) })
            onClose()
          },
        })
      }
      onCancel={onClose}
      busy={create.isPending}
      error={create.error}
    />
  )
}

function EditCage({ cage, onClose }: { cage: Cage; onClose: () => void }) {
  const update = useUpdateCage(cage.cageId)
  const toast = useToast()
  return (
    <CageFormDialog
      cage={cage}
      onSubmit={(body) =>
        update.mutate(body, {
          onSuccess: () => {
            toast.show({ message: t('toast.cageSaved') })
            onClose()
          },
        })
      }
      onCancel={onClose}
      busy={update.isPending}
      error={update.error}
    />
  )
}

function DeleteCage({ cage, onClose }: { cage: Cage; onClose: () => void }) {
  const remove = useDeleteCage()
  const toast = useToast()
  return (
    <ConfirmDialog
      title={t('cages.delete.title', { name: cage.name })}
      confirmLabel={t('cages.delete.confirm')}
      onConfirm={() =>
        remove.mutate(cage.cageId, {
          onSuccess: () => {
            toast.show({ message: t('toast.cageDeleted', { name: cage.name }), tone: 'info' })
            onClose()
          },
        })
      }
      onCancel={onClose}
      busy={remove.isPending}
      danger
    >
      <p>{t('cages.delete.text')}</p>
      {remove.isError && <FormError message={t(errorMessageKey(remove.error, 'cage'))} />}
    </ConfirmDialog>
  )
}

type Dialog = { kind: 'create' } | { kind: 'edit'; cage: Cage } | { kind: 'delete'; cage: Cage }

// "Mis jaulas": the home page. Every cage of the account with its live status; from here a cage is
// opened, created, renamed or deleted.
export function CageList() {
  const cages = useCages()
  const profile = useProfile()
  const now = useNow()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const firstName = profile.data?.fullName.split(' ')[0]
  const close = () => setDialog(null)

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
      <GuineaPigGrid label={t('cages.title')}>
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
        <Button variant="primary" onClick={() => setDialog({ kind: 'create' })}>
          <Icon name="plus" size={18} />
          {t('cages.new')}
        </Button>
      </header>
      {content}
      {dialog?.kind === 'create' && <CreateCage onClose={close} />}
      {dialog?.kind === 'edit' && <EditCage cage={dialog.cage} onClose={close} />}
      {dialog?.kind === 'delete' && <DeleteCage cage={dialog.cage} onClose={close} />}
    </div>
  )
}
