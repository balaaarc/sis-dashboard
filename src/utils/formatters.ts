export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    const hh = String(d.getUTCHours()).padStart(2, '0')
    const mm = String(d.getUTCMinutes()).padStart(2, '0')
    const ss = String(d.getUTCSeconds()).padStart(2, '0')
    return `${hh}:${mm}:${ss} UTC`
  } catch {
    return '--:--:-- UTC'
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch {
    return 'unknown'
  }
}

export function formatQualityScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function getThreatLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return 'var(--alert-critical)'
    case 'HIGH':
      return 'var(--alert-high)'
    case 'MEDIUM':
      return 'var(--alert-medium)'
    case 'LOW':
      return 'var(--alert-low)'
    case 'CLEAR':
      return 'var(--sensor-acoustic)'
    default:
      return 'var(--text-secondary)'
  }
}

export function getSensorFamilyColor(family: string): string {
  switch (family) {
    case 'Seismic':
      return 'var(--sensor-seismic)'
    case 'Acoustic':
      return 'var(--sensor-acoustic)'
    case 'Optical':
      return 'var(--sensor-optical)'
    case 'Radar':
      return 'var(--sensor-radar)'
    case 'Magnetic':
      return 'var(--sensor-magnetic)'
    case 'Chemical':
      return 'var(--sensor-chemical)'
    default:
      return 'var(--text-secondary)'
  }
}

export function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`
}
