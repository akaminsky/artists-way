// tend — derived week.
// The program is self-paced and week is DERIVED from each person's start date,
// not stored or manually advanced. One source of truth, used for you and for
// every friend on the Circle screen.
export const TOTAL_WEEKS = 12

// started_on: a 'YYYY-MM-DD' date string (memberships.started_on).
// Returns 1..12 (clamped). Day 0–6 = week 1, day 7–13 = week 2, etc.
export function weekFromStart(startedOn, today = new Date()) {
  if (!startedOn) return 1
  const start = new Date(startedOn + 'T00:00:00')
  const ms = today - start
  const days = Math.floor(ms / 86400000)
  const week = Math.floor(days / 7) + 1
  return Math.min(TOTAL_WEEKS, Math.max(1, week))
}

// Which day of the current week is it (0 = first day of their week .. 6)?
export function dayOfWeek(startedOn, today = new Date()) {
  if (!startedOn) return 0
  const start = new Date(startedOn + 'T00:00:00')
  const days = Math.floor((today - start) / 86400000)
  return ((days % 7) + 7) % 7
}

// ── Calendar-week helpers (the Mon–Sun strip on Today) ──
// Local-time based, so "today" matches what the user sees on their phone.

// 'YYYY-MM-DD' in local time (morning_pages.date is a plain date).
export function isoDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Index of today within a Mon-first week: Mon = 0 … Sun = 6.
export function weekdayIndexMon(today = new Date()) {
  return (today.getDay() + 6) % 7
}

// The 7 ISO dates of the Mon–Sun week containing `today`.
export function currentWeekDates(today = new Date()) {
  const monday = new Date(today)
  monday.setDate(today.getDate() - weekdayIndexMon(today))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return isoDate(d)
  })
}

// Return a new Date n days from `date` (n may be negative).
export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// A member's program week, honoring a pause. When pausedOn is set the week is
// frozen by deriving it from the pause date instead of today.
export function memberWeek(startedOn, pausedOn, today = new Date()) {
  const ref = pausedOn ? new Date(pausedOn + 'T00:00:00') : today
  return weekFromStart(startedOn, ref)
}
