import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
import { Button, ButtonLink } from '../../components/Button/Button'
import { ChoiceChips } from '../../components/ChoiceChips/ChoiceChips'
import { CoatSwatch } from '../../components/CoatSwatch/CoatSwatch'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { GuineaPigPreview } from '../../components/GuineaPigPreview/GuineaPigPreview'
import { MarkColorPicker } from '../../components/MarkColorPicker/MarkColorPicker'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextAreaField } from '../../components/TextAreaField/TextAreaField'
import { TextField } from '../../components/TextField/TextField'
import { WeightField } from '../../components/WeightField/WeightField'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useRegisterGuineaPig } from '../../hooks/useRegisterGuineaPig'
import { t } from '../../i18n'
import {
  BREEDS,
  COAT_COLORS,
  MAX_NOTES_LENGTH,
  MAX_WEIGHT_GRAMS,
  MIN_WEIGHT_GRAMS,
  type Breed,
  type CoatColor,
} from '../../types/GuineaPigProfile'
import { MARK_COLORS, type MarkColor } from '../../types/MarkColor'
import styles from './RegisterGuineaPig.module.css'

const MAX_NAME_LENGTH = 100

const BREED_OPTIONS = BREEDS.map((value) => ({ value, label: t(`guineaPig.breed.${value}`) }))
const COAT_OPTIONS = COAT_COLORS.map((value) => ({
  value,
  label: t(`guineaPig.coat.${value}`),
  adornment: <CoatSwatch color={value} />,
}))

// "" = left empty (it is optional); otherwise a whole number of grams inside the limits
function weightProblem(text: string): string | undefined {
  if (text === '') {
    return undefined
  }
  const grams = Number(text)
  return Number.isInteger(grams) && grams >= MIN_WEIGHT_GRAMS && grams <= MAX_WEIGHT_GRAMS
    ? undefined
    : t('guineaPig.register.weightInvalid', { min: MIN_WEIGHT_GRAMS, max: MAX_WEIGHT_GRAMS })
}

export function RegisterGuineaPig() {
  const navigate = useNavigate()
  const guineaPigs = useGuineaPigs()
  const register = useRegisterGuineaPig()
  const [name, setName] = useState('')
  const [color, setColor] = useState<MarkColor | null>(null)
  const [breed, setBreed] = useState<Breed | null>(null)
  const [coatColor, setCoatColor] = useState<CoatColor | null>(null)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
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
  const weightError = weightProblem(weight)
  const notesError =
    notes.trim().length > MAX_NOTES_LENGTH ? t('guineaPig.register.notesTooLong') : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (nameError || selectedColor === null || weightError || notesError) {
      return
    }
    register.mutate(
      {
        name: trimmed,
        markColor: selectedColor,
        ...(breed && { breed }),
        ...(coatColor && { coatColor }),
        ...(weight !== '' && { initialWeightGrams: Number(weight) }),
        ...(notes.trim() && { notes: notes.trim() }),
      },
      { onSuccess: () => navigate('/') },
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('guineaPig.register.title')}</h1>
        <p className={styles.intro}>{t('guineaPig.register.intro')}</p>
      </header>
      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <section className={styles.section} aria-labelledby="who-heading">
            <h2 id="who-heading" className={styles.sectionTitle}>
              {t('guineaPig.register.who')}
            </h2>
            <TextField
              label={t('guineaPig.register.name')}
              name="name"
              autoComplete="off"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              error={submitted ? nameError : undefined}
              onChange={(e) => setName(e.target.value)}
            />
            <ChoiceChips
              legend={t('guineaPig.register.breed')}
              hint={t('common.optional')}
              options={BREED_OPTIONS}
              value={breed}
              onChange={setBreed}
            />
          </section>
          <section className={styles.section} aria-labelledby="look-heading">
            <h2 id="look-heading" className={styles.sectionTitle}>
              {t('guineaPig.register.look')}
            </h2>
            <ChoiceChips
              legend={t('guineaPig.register.coat')}
              hint={t('common.optional')}
              options={COAT_OPTIONS}
              value={coatColor}
              onChange={setCoatColor}
            />
            <WeightField
              label={t('guineaPig.register.weight')}
              value={weight}
              onChange={setWeight}
              error={weightError}
            />
          </section>
          <section className={styles.section} aria-labelledby="mark-heading">
            <h2 id="mark-heading" className={styles.sectionTitle}>
              {t('guineaPig.register.mark')}
            </h2>
            <p className={styles.sectionText}>{t('guineaPig.register.markText')}</p>
            <MarkColorPicker
              legend={t('guineaPig.register.color')}
              value={selectedColor}
              onChange={setColor}
              usedBy={usedBy}
              error={submitted ? colorError : undefined}
            />
          </section>
          <section className={styles.section} aria-labelledby="notes-heading">
            <h2 id="notes-heading" className={styles.sectionTitle}>
              {t('guineaPig.register.moreTitle')}
            </h2>
            <TextAreaField
              label={t('guineaPig.register.notes')}
              name="notes"
              maxLength={MAX_NOTES_LENGTH}
              placeholder={t('guineaPig.register.notesPlaceholder')}
              value={notes}
              error={notesError}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
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
        <div className={styles.side}>
          <GuineaPigPreview
            name={name}
            breed={breed}
            coatColor={coatColor}
            markColor={selectedColor}
            weightGrams={weight !== '' && !weightError ? Number(weight) : null}
          />
        </div>
      </div>
    </div>
  )
}
