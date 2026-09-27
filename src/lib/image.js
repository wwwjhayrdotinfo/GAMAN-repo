// Preserve small menu text while keeping the image within the model's normal image budget.
export function resizedDimensions(width, height, maxDim = 1400, maxPixels = 1_150_000) {
  if (!(width > 0 && height > 0)) throw new Error('This photo has no readable image data.')
  const scale = Math.min(1, maxDim / Math.max(width, height), Math.sqrt(maxPixels / (width * height)))
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) }
}

export async function fileToResizedBase64(file, maxDim = 1400, quality = 0.78) {
  const started = performance.now()
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Could not read this photo. Try a JPEG or PNG image.'))
      i.src = url
    })
    const dimensions = resizedDimensions(img.naturalWidth, img.naturalHeight, maxDim)
    const canvas = document.createElement('canvas')
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo processing is unavailable in this browser.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(img, 0, 0, canvas.width, canvas.height)
    // Async encoding avoids a synchronous toDataURL call blocking the UI.
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not prepare this photo.')), 'image/jpeg', quality)
    })
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Could not prepare this photo.'))
      reader.readAsDataURL(blob)
    })
    return { base64: dataUrl.split(',')[1], mediaType: 'image/jpeg', previewUrl: dataUrl }
  } finally {
    URL.revokeObjectURL(url)
    performance.measure('gaman-photo-prepare', { start: started, end: performance.now() })
  }
}
