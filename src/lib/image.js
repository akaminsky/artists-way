// meraki — client-side image downscale before upload.
// Phone photos are 3–5 MB; we resize to a max dimension and re-encode as JPEG so
// each upload is ~200–400 KB. This protects the Supabase free-tier storage and
// (more importantly) egress limits, and makes the photos load fast. Falls back
// to the original file if the browser can't decode it (e.g. an odd format).
export async function resizeImage(file, maxDim = 1280, quality = 0.82) {
  try {
    const dataUrl = await new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result)
      fr.onerror = rej
      fr.readAsDataURL(file)
    })
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = dataUrl
    })
    let { width, height } = img
    if (Math.max(width, height) > maxDim) {
      const scale = maxDim / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
    return blob && blob.size > 0 ? blob : file
  } catch {
    return file
  }
}
