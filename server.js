const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 9 } })

/**
 * Server Config
 */
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


/**
 * Format Bytes
 * Params: Bytes, Decimals
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return '0 Bytes'
  } else {
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}

/**
 * Upload Middleware
 * Params: req, res, next
 */
function uploadMiddleware(req, res, next) {
  upload.array('files', 9)(req, res, function(uploadError) {
    if (uploadError) {
      return res.render('index', { files: [], error: 'Upload error: ' + uploadError.message, info: null })
    } else {
      next()
    }
  })
}

/**
 * Express Routes
 */
app.get('/', (req, res) => {
  res.render('index', { files: [], info: null, error: null })
})
app.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    if (!(req.files) || !(req.files.length)) {
      return res.render('index', { files: [], error: 'No files uploaded', info: null })
    } else {
      const processedImages = await Promise.all(
        req.files.map(async (currentFile, currentIndex) => {
          const resultBuffer = await sharp(currentFile.buffer).webp({ quality: 100 }).toBuffer()
          const resultBase64 = resultBuffer.toString('base64')
          const savedPercent = Math.floor((1 - (resultBuffer.length / currentFile.size)) * 100)
          return {
            filename: 'optimized-' + (currentIndex + 1) + '.webp',
            dataUrl: 'data:image/webp;base64,' + resultBase64,
            originalSize: formatBytes(currentFile.size),
            minifiedSize: formatBytes(resultBuffer.length),
            savedPercent: savedPercent
          }
        })
      )
      res.render('index', { files: processedImages, error: null })
    }
  } catch (processingError) {
    console.log('Processing Error:', processingError)
    res.render('index', { files: [], error: 'Processing error', info: null })
  }
})

/**
 * Server Listen
 */
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})