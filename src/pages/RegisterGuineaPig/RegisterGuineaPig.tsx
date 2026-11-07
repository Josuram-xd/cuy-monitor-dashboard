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
import { PhotoField } from '../../components/PhotoField/PhotoField'
import { WeightField } from '../../components/WeightField/WeightField'
import { catalogOptions } from '../../catalog/catalog'
import { cagePath, useCageId } from '../../hooks/useCageId'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useRegisterGuineaPig } from '../../hooks/useRegisterGuineaPig'
import { useToast } from '../../components/Toast/useToast'
import { t } from '../../i18n'
import { MAX_NOTES_LENGTH, MAX_WEIGHT_GRAMS, MIN_WEIGHT_GRAMS } from '../../types/GuineaPigProfile'
import { guineaPigLabel } from '../../utils/guineaPig'
import type { PreparedPhoto } from '../../utils/photo'
import styles from './RegisterGuineaPig.module.css'

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

interface RegisterGuineaPigProps {
  // how the chosen file becomes the photo sent; injectable for the tests (jsdom has no canvas)
  preparePhoto?: (file: File) => Promise<PreparedPhoto>
}

export function RegisterGuineaPig({ preparePhoto }: RegisterGuineaPigProps = {}) {
  const navigate = useNavigate()
  const cageId = useCageId()
  const guineaPigs = useGuineaPigs(cageId)
  const register = useRegisterGuineaPig(cageId)
  const toast = useToast()
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [breed, setBreed] = useState<string | null>(null)
  const [coatColor, setCoatColor] = useState<string | null>(null)
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

  const breedOptions = catalogOptions('breeds').map(({ code, label }) => ({ value: code, label }))
  const coatOptions = catalogOptions('coatColors').map(({ code, label }) => ({
    value: code,
    label,
    adornment: <CoatSwatch color={code} />,
  }))

  const usedBy: Record<string, string> = {}
  for (const guineaPig of guineaPigs.data) {
    usedBy[guineaPig.markColor] = guineaPigLabel(guineaPig)
  }
  // a color that was free when the page opened can be taken by the time it is sent
  const selectedColor = color !== null && usedBy[color] === undefined ? color : null
  const allTaken = catalogOptions('markColors').every(({ code }) => usedBy[code] !== undefined)

  if (allTaken) {
    return (
      <EmptyState
        mascot="happy"
        message={t('guineaPig.register.allUsed')}
        action={
          <ButtonLink to={cagePath(cageId)} variant="primary">
            {t('notFound.back')}
          </ButtonLink>
        }
      />
    )
  }

  // the photo replaces the name: it is how the breeder recognizes the cuy (backend contract 3.3)
  const photoError = photo === null ? t('guineaPig.register.photoRequired') : undefined
  const colorError = selectedColor === null ? t('guineaPig.register.colorRequired') : undefined
  const weightError = weightProblem(weight)
  const notesError =
    notes.trim().length > MAX_NOTES_LENGTH ? t('guineaPig.register.notesTooLong') : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (photo === null || selectedColor === null || weightError || notesError) {
      return
    }
    register.mutate(
      {
        photo: photo.base64,
        photoContentType: photo.contentType,
        markColor: selectedColor,
        ...(breed && { breed }),
        ...(coatColor && { coatColor }),
        ...(weight !== '' && { initialWeightGrams: Number(weight) }),
        ...(notes.trim() && { notes: notes.trim() }),
      },
      {
        onSuccess: (created) => {
          toast.show({ message: t('toast.guineaPigRegistered', { name: guineaPigLabel(created) }) })
          navigate(cagePath(cageId))
        },
      },
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
            <PhotoField
              label={t('guineaPig.register.photo')}
              hint={t('guineaPig.register.photoHint')}
              value={photo}
              onChange={setPhoto}
              error={submitted ? photoError : undefined}
              prepare={preparePhoto}
            />
            <ChoiceChips
              legend={t('guineaPig.register.breed')}
              hint={t('common.optional')}
              options={breedOptions}
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
              options={coatOptions}
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
            <ButtonLink to={cagePath(cageId)} variant="secondary">
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
            photo={photo?.dataUrl ?? null}
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
