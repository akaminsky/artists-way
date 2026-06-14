// meraki — the 12 Artist's Way week themes, shown in the Week page header.
// Fixed content, the same for everyone; the backend doesn't store these, so the
// Week header maps the week number to its theme here.
export const WEEK_THEMES = {
  1: 'Recovering a Sense of Safety',
  2: 'Recovering a Sense of Identity',
  3: 'Recovering a Sense of Power',
  4: 'Recovering a Sense of Integrity',
  5: 'Recovering a Sense of Possibility',
  6: 'Recovering a Sense of Abundance',
  7: 'Recovering a Sense of Connection',
  8: 'Recovering a Sense of Strength',
  9: 'Recovering a Sense of Compassion',
  10: 'Recovering a Sense of Self-Protection',
  11: 'Recovering a Sense of Autonomy',
  12: 'Recovering a Sense of Faith',
}

export const themeForWeek = (w) => WEEK_THEMES[w] || ''
