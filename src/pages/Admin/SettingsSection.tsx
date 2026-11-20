import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { Icon } from '../../components/Icon/Icon'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import { useToast } from '../../components/Toast/useToast'
import {
  useAdminSettings,
  useResetSettingsMutation,
  useUpdateSettingsMutation,
} from '../../hooks/useAdmin'
import { t } from '../../i18n'
import type { AdminSetting } from '../../types/Admin'
import styles from './Admin.module.css'

export type SettingGroup = 'health' | 'message' | 'assistant'

const ICONS = { health: 'activity', message: 'bell', assistant: 'info' } as const

const label = (key: string) => t(`admin.settings.keys.${key}.label`)

/**
 * One group of "Reglas y mensajes" (the health rules, the alert texts or the assistant's limit), each in its own
 * tab of the admin panel. The backend checks every value against its range and applies them at once; the
 * defaults are one button away.
 */
export function SettingsSection({
  group,
  onAction = () => {},
}: {
  group: SettingGroup
  onAction?: (text: string, ok: boolean) => void
}) {
  const settings = useAdminSettings()
  const update = useUpdateSettingsMutation()
  const reset = useResetSettingsMutation()
  const toast = useToast()
  // only what the admin touched; everything else shows the value the backend has
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [confirmReset, setConfirmReset] = useState(false)

  if (settings.isPending) return <Skeleton count={3} />
  if (settings.isError) {
    return <ErrorState message={t('admin.loadFailed')} onRetry={() => void settings.refetch()} />
  }

  const all = settings.data.filter((s) => s.key.startsWith(`${group}.`))
  const valueOf = (s: AdminSetting) => draft[s.key] ?? s.value
  const changed = all.filter((s) => draft[s.key] !== undefined && draft[s.key].trim() !== s.value)

  function save(event: FormEvent) {
    event.preventDefault()
    if (changed.length === 0) return
    const body = Object.fromEntries(changed.map((s) => [s.key, draft[s.key].trim()]))
    const summary = changed
      .map((s) => `${label(s.key)}: «${s.value}» → «${draft[s.key].trim()}»`)
      .join('; ')
    update.mutate(body, {
      onSuccess: () => {
        setDraft({})
        toast.show({ message: t('admin.settings.saved') })
        onAction(t('admin.actions.settingsChanged', { summary }), true)
      },
      onError: () => onAction(t('admin.actions.settingsChanged', { summary }), false),
    })
  }

  function restore() {
    reset.mutate(undefined, {
      onSuccess: () => {
        setDraft({})
        setConfirmReset(false)
        toast.show({ message: t('admin.settings.restored') })
        onAction(t('admin.actions.settingsReset'), true)
      },
      onError: () => {
        setConfirmReset(false)
        onAction(t('admin.actions.settingsReset'), false)
      },
    })
  }

  return (
    <section className={styles.card} aria-labelledby={`settings-${group}-heading`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Icon name={ICONS[group]} size={22} />
        </span>
        <div>
          <h2 id={`settings-${group}-heading`}>{t(`admin.settings.groups.${group}`)}</h2>
          <p className={styles.intro}>{t(`admin.settings.intros.${group}`)}</p>
        </div>
      </div>

      <form onSubmit={save} noValidate className={styles.settingGroup}>
        {all.map((s) => (
          <SettingField
            key={s.key}
            setting={s}
            value={valueOf(s)}
            onChange={(value) => setDraft((current) => ({ ...current, [s.key]: value }))}
          />
        ))}
        {update.isError && <FormError message={t('admin.settings.saveFailed')} />}
        <div className={styles.userActions}>
          <Button
            type="submit"
            variant="primary"
            disabled={changed.length === 0 || update.isPending}
          >
            {t('admin.settings.save', { count: changed.length })}
          </Button>
          <Button type="button" onClick={() => setConfirmReset(true)} disabled={reset.isPending}>
            {t('admin.settings.reset')}
          </Button>
        </div>
      </form>

      {confirmReset && (
        <ConfirmDialog
          title={t('admin.settings.resetTitle')}
          confirmLabel={t('admin.settings.reset')}
          busy={reset.isPending}
          danger
          onConfirm={restore}
          onCancel={() => setConfirmReset(false)}
        >
          <p>{t('admin.settings.resetExplain')}</p>
        </ConfirmDialog>
      )}
    </section>
  )
}

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: AdminSetting
  value: string
  onChange: (value: string) => void
}) {
  const help = t(`admin.settings.keys.${setting.key}.help`)
  const byDefault =
    value.trim() === setting.defaultValue
      ? t('admin.settings.isDefault')
      : t('admin.settings.default', { value: setting.defaultValue })
  if (setting.kind === 'TEXT') {
    return (
      <TextField
        label={label(setting.key)}
        hint={`${help} ${byDefault}`}
        value={value}
        maxLength={setting.max}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  const range = t('admin.settings.range', { min: setting.min, max: setting.max })
  return (
    <TextField
      label={label(setting.key)}
      hint={`${help} ${range} ${byDefault}`}
      type="number"
      inputMode={setting.kind === 'DECIMAL' ? 'decimal' : 'numeric'}
      min={setting.min}
      max={setting.max}
      step={setting.kind === 'DECIMAL' ? 0.05 : 1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
