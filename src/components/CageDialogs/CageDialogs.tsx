import { errorMessageKey } from '../../api/errorMessages'
import { useCreateCage, useDeleteCage, useUpdateCage } from '../../hooks/useCages'
import { t } from '../../i18n'
import type { Cage } from '../../types/Cage'
import { CageFormDialog } from '../CageFormDialog/CageFormDialog'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import { FormError } from '../FormError/FormError'
import { useToast } from '../Toast/useToast'

// The three things that can be done to a cage from "Mis jaulas". Each one runs its own request,
// confirms it with a toast and closes; the page only decides which one is open.

export function CreateCageDialog({ onClose }: { onClose: () => void }) {
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

export function EditCageDialog({ cage, onClose }: { cage: Cage; onClose: () => void }) {
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

export function DeleteCageDialog({ cage, onClose }: { cage: Cage; onClose: () => void }) {
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
