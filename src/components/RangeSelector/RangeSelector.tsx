import { RANGE_PRESETS, type RangePreset } from '../../charts/timeRange'
import { t } from '../../i18n'
import { SegmentedControl } from '../SegmentedControl/SegmentedControl'

interface RangeSelectorProps {
  value: RangePreset
  onChange: (value: RangePreset) => void
}

// Today, 7 days or 30 days: one choice for every chart of the page, above them
export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <SegmentedControl
      label={t('charts.range.label')}
      options={RANGE_PRESETS.map((preset) => ({
        value: preset,
        label: t(`charts.range.${preset}`),
      }))}
      value={value}
      onChange={onChange}
    />
  )
}
