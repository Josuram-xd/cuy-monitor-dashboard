// motion ships its features separately from the components: `m` carries no feature code, and
// LazyMotion loads this bundle once, in its own chunk, after the page is interactive. Importing
// `motion` directly instead would put all of it in the initial bundle — about 48 kB gzipped, on
// the one chunk every visit downloads, which a breeder on a phone pays for before seeing anything.
// domMax and not domAnimation because the alert list animates its layout when an alert is removed.
export async function loadMotionFeatures() {
  return (await import('motion/react')).domMax
}
