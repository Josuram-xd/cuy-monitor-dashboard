import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
import { Button, ButtonLink } from '../../components/Button/Button'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { MarkColorPicker } from '../../components/MarkColorPicker/MarkColorPicker'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useRegisterGuineaPig } from '../../hooks/useRegisterGuineaPig'
import { t } from '../../i18n'
import { MARK_COLORS, type MarkColor } from '../../types/MarkColor'
import styles from './RegisterGuineaPig.module.css'

const MAX_NAME_LENGTH = 100

export function RegisterGuineaPig() {
  const navigate = useNavigate()
  const guineaPigs = useGuineaPigs()
  const register = useRegisterGuineaPig()
  const [name, setName] = useState('')
  const [color, setColor] = useState<MarkColor | null>(null)
  const [submitted, setSubmitted] = useState(false)

  if (guineaPigs.isPending) {
    return <Skeleton count={2} />
  }
  if (guineaPigs.isError) {
    return (
      <ErrorState message={t('cage.guineaPigsError')} onRetry={() => void guineaPigs.refetch()} />
    )
  }

  const usedBy: Partial<Record<MarkColor, string>> = {}
  for (const guineaPig of guineaPigs.data) {
    usedBy[guineaPig.markColor] = guineaPig.name
  }
  // a color that was free when the page opened can be taken by the time it is sent
  const selectedColor = color !== null && usedBy[color] === undefined ? color : null
  const allTaken = MARK_COLORS.every((c) => usedBy[c] !== undefined)

  if (allTaken) {
    return (
      <EmptyState
        message={t('guineaPig.register.allUsed')}
        action={
          <ButtonLink to="/" variant="primary">
            {t('notFound.back')}
          </ButtonLink>
        }
      />
    )
  }

  const trimmed = name.trim()
  const nameError = !trimmed
    ? t('guineaPig.register.nameRequired')
    : trimmed.length > MAX_NAME_LENGTH
      ? t('guineaPig.register.nameTooLong')
      : undefined
  const colorError = selectedColor === null ? t('guineaPig.register.colorRequired') : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (nameError || selectedColor === null) {
      return
    }
    register.mutate({ name: trimmed, markColor: selectedColor }, { onSuccess: () => navigate('/') })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('guineaPig.register.title')}</h1>
        <p className={styles.intro}>{t('guineaPig.register.intro')}</p>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label={t('guineaPig.register.name')}
          name="name"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          error={submitted ? nameError : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <MarkColorPicker
          legend={t('guineaPig.register.color')}
          value={selectedColor}
          onChange={setColor}
          usedBy={usedBy}
          error={submitted ? colorError : undefined}
        />
        {register.isError && (
          <FormError message={t(errorMessageKey(register.error, 'guineaPig'))} />
        )}
        <div className={styles.actions}>
          <ButtonLink to="/" variant="secondary">
            {t('common.cancel')}
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={register.isPending}>
            {register.isPending
              ? t('guineaPig.register.submitting')
              : t('guineaPig.register.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
