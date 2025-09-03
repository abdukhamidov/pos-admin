export const TASHKENT_TZ = 'Asia/Tashkent'

export function formatDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TASHKENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
}

export function nowInTashkent(): Date {
  // JS Date always UTC internally; for most DB writes default now() is fine.
  // This helper is mostly for clarity/calling sites.
  return new Date()
}

