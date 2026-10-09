import { cx } from '../../utils/cx'
import styles from './Mascot.module.css'

export type MascotMood = 'happy' | 'worried' | 'alarm' | 'sleepy'

interface MascotProps {
  mood?: MascotMood
  // width in px; the height follows
  size?: number
  // the spoken description. Without it the mascot is decoration and is hidden from screen readers
  label?: string
  className?: string
}

// "Cuchi", the guinea pig of the app. Its face follows the cage: happy when all is well, worried
// or alarmed when something needs attention, sleepy when there is nothing to show yet.
export function Mascot({ mood = 'happy', size = 160, label, className }: MascotProps) {
  return (
    <svg
      className={cx(styles.mascot, styles[mood], className)}
      viewBox="0 0 200 160"
      width={size}
      height={(size * 160) / 200}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <ellipse cx="100" cy="150" rx="66" ry="7" className={styles.shadow} />
      <g className={styles.body}>
        {/* feet */}
        <ellipse cx="62" cy="136" rx="11" ry="7" className={styles.foot} />
        <ellipse cx="140" cy="136" rx="11" ry="7" className={styles.foot} />
        {/* body with a brown patch and a cream belly */}
        <ellipse cx="108" cy="100" rx="64" ry="44" className={styles.fur} />
        <ellipse cx="136" cy="84" rx="22" ry="15" className={styles.patch} />
        <ellipse cx="104" cy="120" rx="40" ry="19" className={styles.belly} />
        {/* ears */}
        <g className={styles.ear}>
          <ellipse
            cx="80"
            cy="58"
            rx="13"
            ry="17"
            transform="rotate(18 80 58)"
            className={styles.patch}
          />
          <ellipse
            cx="80"
            cy="60"
            rx="7"
            ry="10"
            transform="rotate(18 80 60)"
            className={styles.pink}
          />
        </g>
        {/* head */}
        <ellipse cx="62" cy="92" rx="42" ry="37" className={styles.fur} />
        <ellipse cx="40" cy="104" rx="22" ry="16" className={styles.belly} />
        <ellipse
          cx="46"
          cy="62"
          rx="12"
          ry="16"
          transform="rotate(-14 46 62)"
          className={styles.patch}
        />
        <ellipse
          cx="46"
          cy="64"
          rx="6"
          ry="9"
          transform="rotate(-14 46 64)"
          className={styles.pink}
        />
        {/* face */}
        <ellipse cx="46" cy="109" rx="7" ry="5" className={styles.cheek} />
        <ellipse cx="24" cy="99" rx="5" ry="4" className={styles.nose} />
        <g className={styles.eye}>
          {mood === 'sleepy' ? (
            <path d="M44 88 Q52 94 60 88" className={styles.closed} />
          ) : (
            <>
              <circle cx="52" cy="88" r={mood === 'alarm' ? 8.5 : 6.5} className={styles.pupil} />
              <circle cx="54.5" cy="85.5" r="2.4" className={styles.shine} />
            </>
          )}
        </g>
        {mood === 'worried' && <path d="M43 77 L60 73" className={styles.brow} />}
        {mood === 'alarm' && <path d="M42 74 L60 78" className={styles.brow} />}
        {mood === 'happy' && <path d="M22 106 Q31 116 41 107" className={styles.mouth} />}
        {mood === 'worried' && <path d="M23 111 Q31 104 40 110" className={styles.mouth} />}
        {mood === 'alarm' && <ellipse cx="31" cy="111" rx="5" ry="6" className={styles.open} />}
        {mood === 'sleepy' && <path d="M24 108 Q31 111 38 108" className={styles.mouth} />}
        {/* whiskers */}
        <path d="M30 98 L8 92 M30 102 L8 104 M30 106 L12 116" className={styles.whisker} />
      </g>
      {mood === 'alarm' && <path d="M92 38 q-7 11 0 16 q7 -5 0 -16z" className={styles.drop} />}
      {mood === 'sleepy' && (
        <g className={styles.zzz}>
          <text x="96" y="46" className={styles.z1}>
            z
          </text>
          <text x="112" y="30" className={styles.z2}>
            Z
          </text>
        </g>
      )}
    </svg>
  )
}
