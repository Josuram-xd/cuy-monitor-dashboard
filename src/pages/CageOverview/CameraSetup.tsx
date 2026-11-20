import { useState } from 'react'
import { ApiError } from '../../api/ApiError'
import { Button } from '../../components/Button/Button'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import { useSaveStationCamera, useStationCamera } from '../../hooks/useStationCamera'
import { dateLocale, t } from '../../i18n'
import type {
  CameraStream,
  CameraType,
  StationCamera,
  StationCameraInput,
} from '../../types/StationCamera'
import pageStyles from './CageOverview.module.css'
import styles from './CameraSetup.module.css'

const PRIVATE_IPV4 = /^(10\.\d{1,3}|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}$/
const TAPO_STEPS = ['tapo1', 'tapo2', 'tapo3', 'tapo4', 'tapo5', 'tapo6', 'tapo7'] as const
const PHONE_STEPS = ['phone1', 'phone2', 'phone3'] as const

// the same rule as the backend: an address of the home network, never a name or an internet address
function isHomeAddress(host: string): boolean {
  return PRIVATE_IPV4.test(host) && host.split('.').every((octet) => Number(octet) <= 255)
}

function saveErrorKey(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) return 'camera.invalid'
  if (error instanceof ApiError && error.status === 409) return 'camera.notConnected'
  return 'camera.saveFailed'
}

function PortField({
  value,
  invalid,
  onChange,
}: {
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  return (
    <TextField
      label={t('camera.port')}
      error={invalid ? t('camera.portInvalid') : undefined}
      value={value}
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function CameraForm({
  cageId,
  camera,
  onDone,
  onCancel,
}: {
  cageId: string
  camera: StationCamera
  onDone: () => void
  onCancel: () => void
}) {
  const save = useSaveStationCamera(cageId)
  const [type, setType] = useState<CameraType>(camera.type ?? 'RTSP')
  const [host, setHost] = useState(camera.host ?? '')
  const [port, setPort] = useState(camera.port ? String(camera.port) : '')
  const [username, setUsername] = useState(camera.username ?? '')
  // never prefilled: the saved password does not go back to the browser
  const [password, setPassword] = useState('')
  const [stream, setStream] = useState<CameraStream>(camera.stream ?? 'stream2')
  const [submitted, setSubmitted] = useState(false)

  const rtsp = type === 'RTSP'
  const portNumber = port.trim() === '' ? undefined : Number(port)
  const hostOk = isHomeAddress(host.trim())
  const portOk =
    portNumber === undefined ||
    (Number.isInteger(portNumber) && portNumber >= 1 && portNumber <= 65535)
  const usernameOk = username.trim().length > 0
  const valid = hostOk && portOk && (!rtsp || usernameOk)

  function submit() {
    setSubmitted(true)
    if (!valid) return
    // a blank password is left out: the backend keeps the one already saved
    const body: StationCameraInput = rtsp
      ? {
          type,
          host: host.trim(),
          port: portNumber,
          username: username.trim(),
          stream,
          ...(password ? { password } : {}),
        }
      : { type, host: host.trim(), port: portNumber }
    save.mutate(body, { onSuccess: onDone })
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <SegmentedControl<CameraType>
        label={t('camera.typeLabel')}
        options={[
          { value: 'RTSP', label: t('camera.type.RTSP') },
          { value: 'PHONE', label: t('camera.type.PHONE') },
        ]}
        value={type}
        onChange={setType}
      />
      <TextField
        label={t('camera.host')}
        hint={t('camera.hostHint')}
        error={submitted && !hostOk ? t('camera.invalid') : undefined}
        value={host}
        inputMode="decimal"
        autoComplete="off"
        maxLength={15}
        onChange={(event) => setHost(event.target.value)}
      />
      {rtsp ? (
        // the port is almost always the default, so it stays under the advanced options
        <details className={styles.advanced}>
          <summary className={styles.summary}>{t('camera.advanced')}</summary>
          <div className={styles.advancedBody}>
            <PortField value={port} invalid={submitted && !portOk} onChange={setPort} />
          </div>
        </details>
      ) : (
        <PortField value={port} invalid={submitted && !portOk} onChange={setPort} />
      )}
      {rtsp && (
        <>
          <TextField
            label={t('camera.username')}
            error={submitted && !usernameOk ? t('camera.usernameRequired') : undefined}
            value={username}
            autoComplete="off"
            maxLength={64}
            onChange={(event) => setUsername(event.target.value)}
          />
          <PasswordField
            label={t('camera.password')}
            hint={camera.hasPassword ? t('camera.passwordKeep') : undefined}
            value={password}
            autoComplete="new-password"
            maxLength={64}
            onChange={(event) => setPassword(event.target.value)}
          />
          <SegmentedControl<CameraStream>
            label={t('camera.quality')}
            options={[
              { value: 'stream1', label: t('camera.stream.stream1') },
              { value: 'stream2', label: t('camera.stream.stream2') },
            ]}
            value={stream}
            onChange={setStream}
          />
        </>
      )}
      {save.isError && <FormError message={t(saveErrorKey(save.error))} />}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {t('camera.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}

// The farm camera of the cage's station: its status, the form to change it and a guide to set it up
export function CameraSetup({ cageId }: { cageId: string }) {
  const camera = useStationCamera(cageId)
  const [editing, setEditing] = useState(false)

  return (
    <section className={pageStyles.panel} aria-label={t('camera.title')}>
      <h2 className={pageStyles.sectionTitle}>{t('camera.title')}</h2>
      {camera.isPending ? (
        <Skeleton variant="line" count={2} />
      ) : camera.isError ? (
        <ErrorState message={t('camera.loadError')} onRetry={() => void camera.refetch()} />
      ) : (
        <>
          <p role="status">{t(`camera.status.${camera.data.status}`)}</p>
          {camera.data.status === 'CONNECTED' && camera.data.statusAt && (
            <small>
              <time dateTime={camera.data.statusAt}>
                {new Date(camera.data.statusAt).toLocaleString(dateLocale())}
              </time>
            </small>
          )}
          {editing ? (
            <CameraForm
              cageId={cageId}
              camera={camera.data}
              onDone={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div>
              <Button onClick={() => setEditing(true)}>
                {t(camera.data.status === 'NOT_CONFIGURED' ? 'camera.configure' : 'camera.change')}
              </Button>
            </div>
          )}
          <details className={styles.help} open={camera.data.status === 'NOT_CONFIGURED'}>
            <summary className={styles.summary}>{t('camera.help.title')}</summary>
            <div className={styles.helpBody}>
              <h3 className={styles.helpTitle}>{t('camera.help.tapoTitle')}</h3>
              <ol className={styles.steps}>
                {TAPO_STEPS.map((key) => (
                  <li key={key}>{t(`camera.help.${key}`)}</li>
                ))}
              </ol>
              <h3 className={styles.helpTitle}>{t('camera.help.phoneTitle')}</h3>
              <ol className={styles.steps}>
                {PHONE_STEPS.map((key) => (
                  <li key={key}>{t(`camera.help.${key}`)}</li>
                ))}
              </ol>
            </div>
          </details>
        </>
      )}
    </section>
  )
}
