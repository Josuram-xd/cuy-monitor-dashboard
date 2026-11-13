import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Icon } from '../../components/Icon/Icon'
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import { useToast } from '../../components/Toast/useToast'
import {
  useAdminCatalog,
  useDeactivateCatalogOptionMutation,
  useSaveCatalogOptionMutation,
} from '../../hooks/useAdmin'
import { t } from '../../i18n'
import type { AdminCatalogKind, AdminCatalogOption } from '../../types/Admin'
import { codeFromLabel, isValidCode, isValidHex, MAX_CODE_LENGTH, needsHex } from './catalogCode'
import styles from './Admin.module.css'

const KINDS: readonly AdminCatalogKind[] = ['BREED', 'COAT_COLOR', 'MARK_COLOR']
const DEFAULT_HEX = '#2e9e44'

// What the professor asked for: the breeds and colors the pickers show are rows in the database, and this
// is where they are edited. Adding "Cuy colombiano" here makes it appear in the pickers with no release.
export function CatalogSection() {
  const catalog = useAdminCatalog()
  const save = useSaveCatalogOptionMutation()
  const deactivate = useDeactivateCatalogOptionMutation()
  const toast = useToast()

  const [kind, setKind] = useState<AdminCatalogKind>('BREED')
  const [label, setLabel] = useState('')
  // the code follows the label until the admin edits it by hand
  const [code, setCode] = useState('')
  const [codeEdited, setCodeEdited] = useState(false)
  const [hex, setHex] = useState(DEFAULT_HEX)
  const [error, setError] = useState<string | null>(null)
  const [turningOff, setTurningOff] = useState<AdminCatalogOption | null>(null)

  const options = (catalog.data ?? []).filter((option) => option.kind === kind)
  const effectiveCode = codeEdited ? code : codeFromLabel(label)
  const duplicate = options.some((option) => option.code === effectiveCode && option.active)

  function changeLabel(value: string) {
    setLabel(value)
    setError(null)
    if (!codeEdited) setCode(codeFromLabel(value))
  }

  function reset() {
    setLabel('')
    setCode('')
    setCodeEdited(false)
    setHex(DEFAULT_HEX)
    setError(null)
  }

  function submit() {
    if (!label.trim()) return setError(t('admin.catalog.labelRequired'))
    if (!isValidCode(effectiveCode)) return setError(t('admin.catalog.codeInvalid'))
    if (duplicate) return setError(t('admin.catalog.codeTaken'))
    if (needsHex(kind) && !isValidHex(hex)) return setError(t('admin.catalog.hexInvalid'))

    save.mutate(
      {
        kind,
        code: effectiveCode,
        label: label.trim(),
        hex: needsHex(kind) ? hex : null,
        // last, so a new option lands at the end of the picker instead of in the middle of it
        sortOrder: options.length + 1,
      },
      {
        onSuccess: (option) => {
          reset()
          toast.show({ message: t('admin.catalog.added', { label: option.label }) })
        },
        onError: () => setError(t('admin.catalog.saveFailed')),
      },
    )
  }

  function confirmTurnOff() {
    if (!turningOff) return
    const option = turningOff
    deactivate.mutate(
      { kind: option.kind, code: option.code },
      {
        onSuccess: () => {
          setTurningOff(null)
          toast.show({ message: t('admin.catalog.turnedOff', { label: option.label }) })
        },
        onError: () => {
          setTurningOff(null)
          toast.show({ message: t('admin.catalog.turnOffFailed') })
        },
      },
    )
  }

  function turnBackOn(option: AdminCatalogOption) {
    save.mutate(
      { ...option, active: true },
      {
        onSuccess: () =>
          toast.show({ message: t('admin.catalog.turnedOn', { label: option.label }) }),
      },
    )
  }

  if (catalog.isPending) return <Skeleton count={3} />
  if (catalog.isError) return (
      <ErrorState
        message={t('admin.loadFailed')}
        onRetry={() => void catalog.refetch()}
      />
    )

  return (
    <section className={styles.card} aria-labelledby="catalog-heading" data-spotlight>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Icon name="inbox" size={22} />
        </span>
        <div>
          <h2 id="catalog-heading">{t('admin.catalog.title')}</h2>
          <p className={styles.intro}>{t('admin.catalog.intro')}</p>
        </div>
      </div>

      <SegmentedControl
        label={t('admin.catalog.kind')}
        options={KINDS.map((value) => ({ value, label: t('admin.catalog.kinds.' + value) }))}
        value={kind}
        onChange={(value) => {
          setKind(value)
          setError(null)
        }}
      />

      <ul className={styles.options}>
          {options.map((option) => (
            <li
              key={option.code}
              className={styles.option}
              data-off={option.active ? undefined : true}
            >
              {option.hex && (
                <span className={styles.dot} style={{ background: option.hex }} aria-hidden="true" />
              )}
              <span className={styles.optionLabel}>{option.label}</span>
              <code className={styles.code}>{option.code}</code>
              {option.active ? (
                <Button
                  className={styles.optionAction}
                  onClick={() => setTurningOff(option)}
                  aria-label={t('admin.catalog.turnOffOne', { label: option.label })}
                >
                  {t('admin.catalog.turnOff')}
                </Button>
              ) : (
                <Button
                  className={styles.optionAction}
                  onClick={() => turnBackOn(option)}
                  aria-label={t('admin.catalog.turnOnOne', { label: option.label })}
                >
                  {t('admin.catalog.turnOn')}
                </Button>
              )}
            </li>
          ))}
      </ul>

      <div className={styles.addForm}>
        <h3 className={styles.addTitle}>{t('admin.catalog.addTitle')}</h3>
        <TextField
          label={t('admin.catalog.label')}
          hint={t('admin.catalog.labelHint')}
          value={label}
          maxLength={60}
          onChange={(event) => changeLabel(event.target.value)}
        />
        <TextField
          label={t('admin.catalog.code')}
          hint={t('admin.catalog.codeHint')}
          value={effectiveCode}
          maxLength={MAX_CODE_LENGTH}
          onChange={(event) => {
            setCodeEdited(true)
            setCode(event.target.value.toUpperCase())
            setError(null)
          }}
        />
        {needsHex(kind) && (
          <label className={styles.colorRow}>
            <span>{t('admin.catalog.color')}</span>
            <input
              type="color"
              className={styles.colorInput}
              value={hex}
              onChange={(event) => setHex(event.target.value.toLowerCase())}
            />
            <code className={styles.code}>{hex}</code>
          </label>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button variant="primary" onClick={submit} disabled={save.isPending}>
          {save.isPending ? t('admin.catalog.adding') : t('admin.catalog.add')}
        </Button>
      </div>

      {turningOff && (
        <ConfirmDialog
          title={t('admin.catalog.turnOffTitle', { label: turningOff.label })}
          confirmLabel={t('admin.catalog.turnOff')}
          busy={deactivate.isPending}
          onConfirm={confirmTurnOff}
          onCancel={() => setTurningOff(null)}
        >
          <p>{t('admin.catalog.turnOffExplain')}</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
