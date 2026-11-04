import { useState } from 'react'
import { errorMessageKey } from '../../api/errorMessages'
import { useDeleteGuineaPig } from '../../hooks/useDeleteGuineaPig'
import { t } from '../../i18n'
import type { GuineaPig } from '../../types/GuineaPig'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import { FormError } from '../FormError/FormError'
import { Icon } from '../Icon/Icon'
import { useToast } from '../Toast/useToast'
import styles from './DeleteGuineaPig.module.css'

interface DeleteGuineaPigProps {
  cageId: string
  guineaPig: GuineaPig
}

// A small trash button for a guinea pig card. It never deletes by itself: it opens a confirmation first.
export function DeleteGuineaPig({ cageId, guineaPig }: DeleteGuineaPigProps) {
  const remove = useDeleteGuineaPig(cageId)
  const toast = useToast()
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
    remove.reset()
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        aria-label={t('guineaPig.delete.open', { name: guineaPig.name })}
        title={t('guineaPig.delete.open', { name: guineaPig.name })}
        onClick={() => setOpen(true)}
      >
        <Icon name="trash" size={18} />
      </button>
      {open && (
        <ConfirmDialog
          title={t('guineaPig.delete.title', { name: guineaPig.name })}
          confirmLabel={t('guineaPig.delete.confirm')}
          onConfirm={() =>
            remove.mutate(guineaPig.id, {
              onSuccess: () => {
                toast.show({
                  message: t('toast.guineaPigDeleted', { name: guineaPig.name }),
                  tone: 'info',
                })
                close()
              },
            })
          }
          onCancel={close}
          busy={remove.isPending}
          danger
        >
          <p>{t('guineaPig.delete.text')}</p>
          {remove.isError && <FormError message={t(errorMessageKey(remove.error, 'guineaPig'))} />}
        </ConfirmDialog>
      )}
    </>
  )
}
