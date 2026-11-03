import { useState } from 'react'
import { errorMessageKey } from '../../api/errorMessages'
import { t } from '../../i18n'
import {
  MAX_CAGE_LOCATION_LENGTH,
  MAX_CAGE_NAME_LENGTH,
  type Cage,
  type CageInput,
} from '../../types/Cage'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import { FormError } from '../FormError/FormError'
import { TextField } from '../TextField/TextField'

interface CageFormDialogProps {
  // without it the dialog creates a new cage; with it, it renames that one
  cage?: Cage
  onSubmit: (body: CageInput) => void
  onCancel: () => void
  busy: boolean
  error: unknown
}

// Name and place of a cage, in a modal. Used to create a cage and to rename one.
export function CageFormDialog({ cage, onSubmit, onCancel, busy, error }: CageFormDialogProps) {
  const [name, setName] = useState(cage?.name ?? '')
  const [location, setLocation] = useState(cage?.location ?? '')
  const [submitted, setSubmitted] = useState(false)
  const nameError = submitted && name.trim().length === 0 ? t('cages.form.nameRequired') : undefined

  function submit() {
    setSubmitted(true)
    if (name.trim().length === 0) {
      return
    }
    onSubmit({ name: name.trim(), location: location.trim() || undefined })
  }

  return (
    <ConfirmDialog
      title={t(cage ? 'cages.form.editTitle' : 'cages.form.createTitle')}
      confirmLabel={t(cage ? 'cages.form.save' : 'cages.form.create')}
      onConfirm={submit}
      onCancel={onCancel}
      busy={busy}
    >
      <TextField
        label={t('cages.form.name')}
        hint={t('cages.form.nameHint')}
        error={nameError}
        value={name}
        maxLength={MAX_CAGE_NAME_LENGTH}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
      />
      <TextField
        label={t('cages.form.location')}
        hint={t('cages.form.locationHint')}
        value={location}
        maxLength={MAX_CAGE_LOCATION_LENGTH}
        autoComplete="off"
        onChange={(event) => setLocation(event.target.value)}
      />
      {error !== null && error !== undefined && (
        <FormError message={t(errorMessageKey(error, 'cage'))} />
      )}
    </ConfirmDialog>
  )
}
