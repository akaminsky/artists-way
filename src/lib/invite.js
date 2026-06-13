// tend — invite-link plumbing.
// An invite link looks like  https://<app>/?join=ABC234 .
// Two wrinkles this handles:
//   1. The magic-link sign-in round-trips through email and redirects back to
//      the bare origin, dropping the query string. So we stash the code in
//      localStorage the moment we see it, and read it back after sign-in.
//   2. We strip ?join= from the address bar once captured so it doesn't linger
//      or get re-applied on later loads.
const PENDING_KEY = 'tend.pendingInvite'

// Call once at startup. Returns the pending code (just-seen or previously
// stashed), or null.
export function capturePendingInvite() {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('join')
    if (code) {
      localStorage.setItem(PENDING_KEY, code.trim().toUpperCase())
      const url = new URL(window.location.href)
      url.searchParams.delete('join')
      // keep path + hash (the hash may carry the auth token) intact
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
    return localStorage.getItem(PENDING_KEY)
  } catch (e) {
    return null
  }
}

export function getPendingInvite() {
  try { return localStorage.getItem(PENDING_KEY) } catch (e) { return null }
}

export function clearPendingInvite() {
  try { localStorage.removeItem(PENDING_KEY) } catch (e) { /* ignore */ }
}

// The URL the app is actually served from — origin + the directory of the
// current page. This keeps invite links and the magic-link redirect correct on
// a GitHub Pages subpath (e.g. /artists-way/) AND on a custom domain at root,
// where bare window.location.origin would drop the subpath.
export function appBaseUrl() {
  const dir = window.location.pathname.replace(/[^/]*$/, '') // strip filename, keep trailing slash
  return window.location.origin + dir
}

export function inviteUrl(code) {
  return `${appBaseUrl()}?join=${encodeURIComponent(code)}`
}
