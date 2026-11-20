import { useEffect, useState } from 'react'
import { ApiError } from '../../api/ApiError'
import { Button } from '../../components/Button/Button'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { Icon } from '../../components/Icon/Icon'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import { useSaveStationCamera, useStationCamera } from '../../hooks/useStationCamera'
import { dateLocale, t } from '../../i18n'
import type {
  CameraStatus,
  CameraStream,
  CameraType,
  StationCamera,
  StationCameraInput,
} from '../../types/StationCamera'
import { cx } from '../../utils/cx'
import pageStyles from './CageOverview.module.css'
import styles from './CameraSetup.module.css'

const PRIVATE_IPV4 = /^(10\.\d{1,3}|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}$/
const TAPO_STEPS = ['tapo1', 'tapo2', 'tapo3', 'tapo4', 'tapo5', 'tapo6', 'tapo7'] as const
const PHONE_STEPS = ['phone1', 'phone2', 'phone3'] as const
// the edge agent has no progress to report, so the steps are a guess that stops at the last one
const PROGRESS_STEPS = ['search', 'login', 'video'] as const
const PROGRESS_STEP_MS = 2_500

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
  // the backend keeps a saved password; without one (first RTSP save, or after a phone) it is required
  const passwordOk = camera.hasPassword || password.length > 0
  const valid = hostOk && portOk && (!rtsp || (usernameOk && passwordOk))

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
            error={submitted && !passwordOk ? t('camera.passwordRequired') : undefined}
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

type StepState = 'done' | 'current' | 'pending'

// Simulated progress while the edge agent tests the camera. It shows from the first PENDING of this visit,
// so the outcome stays on screen after the test; a visit that finds the camera already settled shows nothing.
function CameraProgress({ status }: { status: CameraStatus }) {
  const [tested, setTested] = useState(status === 'PENDING')
  const [step, setStep] = useState(0)
  const [prevStatus, setPrevStatus] = useState(status)
  // a new test starts again from the first step (state adjusted while rendering, not in an effect)
  if (status !== prevStatus) {
    setPrevStatus(status)
    if (status === 'PENDING') {
      setTested(true)
      setStep(0)
    }
  }

  const running = status === 'PENDING'
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(
      () => setStep((current) => Math.min(current + 1, PROGRESS_STEPS.length - 1)),
      PROGRESS_STEP_MS,
    )
    return () => window.clearInterval(id)
  }, [running])

  if (!tested) return null
  const connected = status === 'CONNECTED'
  // a finished test ticks every step (CONNECTED), or stops where it was (an error)
  const done = connected ? PROGRESS_STEPS.length : step
  const stateOf = (index: number): StepState =>
    index < done ? 'done' : index === step && running ? 'current' : 'pending'

  return (
    <div className={styles.progress}>
      <div role="status" aria-live="polite">
        {running && (
          <>
            <span className={styles.pulse} aria-hidden="true" />
            {/* the steps list below shows the text; this copy is for screen readers only */}
            <span className={styles.visuallyHidden}>
              {t(`camera.progress.${PROGRESS_STEPS[step]}`)}
            </span>
          </>
        )}
        {connected && (
          <p className={styles.success}>
            <Icon name="check-circle" size={18} />
            {t('camera.progress.done')}
          </p>
        )}
      </div>
      <ol className={styles.progressSteps}>
        {PROGRESS_STEPS.map((key, index) => {
          const state = stateOf(index)
          return (
            <li key={key} data-state={state} className={cx(styles.progressStep, styles[state])}>
              <span className={styles.stepMark} aria-hidden="true">
                {state === 'done' && <Icon name="check" size={14} />}
              </span>
              {t(`camera.progress.${key}`)}
            </li>
          )
        })}
      </ol>
    </div>
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
          <CameraProgress status={camera.data.status} />
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
