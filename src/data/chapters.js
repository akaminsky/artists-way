// meraki — Spotify audiobook chapter links, per program week.
//
// The Today screen shows a "Listen to this week's chapter" card linking to the
// matching chapter for the week you're on. Same audiobook for everyone, so these
// are just static links — no backend needed.
//
// To update a link (Spotify app or web player): open the chapter → ⋯ → Share →
// Copy link. Leave a week as '' to hide its listen card.

export const WEEK_AUDIO = {
  1:  'https://open.spotify.com/episode/38Xoj20ar3m40faw5Bs6Et?si=dbe6900836f44150',
  2:  'https://open.spotify.com/episode/2MlaVsgVHNYREoGwoh65DF?si=5ece06e53a5145a7',
  3:  'https://open.spotify.com/episode/1EBGbAjYTYqQbAqYTWWDoc?si=61c7ecd5d5a64af1',
  4:  'https://open.spotify.com/episode/3vAJeRtHIEvQFGcL5PpnBE?si=af4f696fab034af4',
  5:  'https://open.spotify.com/episode/7bPcTT0DovkS2kS7ERFrYh?si=fb8720e5f0b641da',
  6:  'https://open.spotify.com/episode/48gepNLxOIzb4ynZ4X0MUG?si=45094061ada144be',
  7:  'https://open.spotify.com/episode/5LpTH2anAamevfdlPBfhNv?si=cd32ac63786c4ea2',
  8:  'https://open.spotify.com/episode/4Wy4QCYBsC1x4dfBl10ZdB?si=c50fd7d92ad7457a',
  9:  'https://open.spotify.com/episode/1vuWtnvlIJMjsEy9UEo4af?si=f4888cc3505f4a7e',
  10: 'https://open.spotify.com/episode/5B5mqz81Sg8OsKDq6Drz17?si=7b164e075db64ad5',
  11: 'https://open.spotify.com/episode/3aANimil3PS1UdbGnLkBef?si=0ecb48865cf94189',
  12: 'https://open.spotify.com/episode/0o4aWG0rcHmbFGtNdpZQCd?si=250b520770f140ad',
}

// Optional whole-audiobook fallback (shown if a week has no specific link).
export const AUDIOBOOK_URL = ''

// Resolve the best link for a given week (specific chapter, else the audiobook).
export function audioForWeek(week) {
  return WEEK_AUDIO[week] || AUDIOBOOK_URL || ''
}
