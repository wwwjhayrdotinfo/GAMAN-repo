// Downscale the photo before sending it. Smaller images upload and process much faster.
export async function fileToResizedBase64(file, maxDim = 1400, quality = 0.82) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    return { base64: dataUrl.split(',')[1], mediaType: 'image/jpeg', previewUrl: dataUrl }
  } finally {
    URL.revokeObjectURL(url)
  }
}
