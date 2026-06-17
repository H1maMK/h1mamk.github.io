const DEFAULT_MAX_FILE_SIZE_BYTES = 1.4 * 1024 * 1024

const DEFAULT_OPTIONS = {
  maxWidth: 1400,
  maxHeight: 1400,
  maxFileSizeBytes: DEFAULT_MAX_FILE_SIZE_BYTES,
  outputType: 'image/jpeg',
  initialQuality: 0.88,
  minQuality: 0.55,
  qualityStep: 0.1,
}

export const resizeImageFile = (file, options = {}) => new Promise((resolve, reject) => {
  if (!(file instanceof File)) {
    resolve(file)
    return
  }

  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      let { width, height } = image
      const scale = Math.min(1, settings.maxWidth / width, settings.maxHeight / height)

      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        resolve(file)
        return
      }

      context.drawImage(image, 0, 0, width, height)

      const outputType = file.type === 'image/png' && settings.outputType === 'image/jpeg'
        ? 'image/png'
        : settings.outputType

      let quality = outputType === 'image/png' ? undefined : settings.initialQuality

      const exportBlob = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          if (
            blob.size > settings.maxFileSizeBytes &&
            outputType !== 'image/png' &&
            typeof quality === 'number' &&
            quality > settings.minQuality
          ) {
            quality = Math.max(settings.minQuality, quality - settings.qualityStep)
            exportBlob()
            return
          }

          const extension = outputType === 'image/png' ? 'png' : 'jpg'
          const resizedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '') + `-optimized.${extension}`,
            {
              type: outputType,
              lastModified: Date.now(),
            }
          )

          resolve(resizedFile.size < file.size ? resizedFile : file)
        }, outputType, quality)
      }

      exportBlob()
    }

    image.onerror = () => resolve(file)
    image.src = reader.result
  }

  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})
