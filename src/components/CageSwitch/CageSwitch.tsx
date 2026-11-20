import { useNavigate } from 'react-router'
import { cagePath } from '../../hooks/useCageId'
import { useCages } from '../../hooks/useCages'
import { t } from '../../i18n'
import { SegmentedControl } from '../SegmentedControl/SegmentedControl'
import styles from './CageSwitch.module.css'

// "Equipo real" or "Simulación con video": the two cages of the account, one tap apart.
// Shown only when both exist.
export function CageSwitch({ cageId }: { cageId: string }) {
  const cages = useCages()
  const navigate = useNavigate()
  const kit = cages.data?.find((cage) => cage.monitored)
  const simulation = cages.data?.find((cage) => cage.simulated)
  if (!kit || !simulation) {
    return null
  }
  const value = cageId === simulation.cageId ? 'simulation' : 'real'
  return (
    <div className={styles.switch}>
      <SegmentedControl
        label={t('cage.switchLabel')}
        options={[
          { value: 'real', label: t('cage.switchReal') },
          { value: 'simulation', label: t('cage.switchSimulation') },
        ]}
        value={value}
        onChange={(next) => {
          if (next !== value) {
            navigate(cagePath(next === 'real' ? kit.cageId : simulation.cageId))
          }
        }}
      />
    </div>
  )
}
