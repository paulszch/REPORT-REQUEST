import TelegramBot from 'node-telegram-bot-api'
import formidable from 'formidable'
import fs from 'fs'
import moment from 'moment-timezone'

export const config = {
  api: { bodyParser: false }
}

const bot = new TelegramBot(process.env.BOT_TOKEN)
const OWNER_ID = process.env.OWNER_ID
const TIMEZONE = 'Asia/Jakarta'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const form = formidable({ 
    multiples: false,
    maxFileSize: 50 * 1024 * 1024, // 50MB limit
    keepExtensions: true
  })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err)
      return res.status(500).json({ 
        status: false,
        message: 'Gagal memproses form data' 
      })
    }

    try {
      // ✅ PERBAIKAN: Ambil nilai dari fields dengan benar
      const type = Array.isArray(fields.type) ? fields.type[0] : fields.type || 'Request'
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name || '-'
      const userid = Array.isArray(fields.userid) ? fields.userid[0] : fields.userid || '-'
      const message = Array.isArray(fields.message) ? fields.message[0] : fields.message || '-'

      // ✅ PERBAIKAN: Handle file lebih aman
      let uploadedFile = null
      if (files.file) {
        if (Array.isArray(files.file)) {
          uploadedFile = files.file[0]
        } else {
          uploadedFile = files.file
        }
      }

      const time = moment()
        .tz(TIMEZONE)
        .format('DD MMM YYYY • HH:mm:ss z')

      const caption = `📩 ${type.toUpperCase()} BARU

👤 Nama : ${name}
🆔 ID   : ${userid}
🕒 Waktu: ${time}

💬 Pesan:
${message}`

      if (uploadedFile?.filepath && fs.existsSync(uploadedFile.filepath)) {
        const buffer = fs.readFileSync(uploadedFile.filepath)
        const mime = uploadedFile.mimetype || ''
        const filename = uploadedFile.originalFilename || 'file'

        // Hapus file temp setelah digunakan
        setTimeout(() => {
          fs.unlink(uploadedFile.filepath, () => {})
        }, 3000)

        if (mime.startsWith('image/')) {
          await bot.sendPhoto(OWNER_ID, buffer, { 
            caption,
            parse_mode: 'HTML'
          })

        } else if (mime.startsWith('video/')) {
          await bot.sendVideo(OWNER_ID, buffer, { 
            caption,
            supports_streaming: true, // ✅ PERBAIKAN: Tambahkan ini untuk video streaming
            filename,
            parse_mode: 'HTML'
          })

        } else {
          await bot.sendDocument(OWNER_ID, buffer, { 
            caption,
            filename,
            parse_mode: 'HTML'
          })
        }

      } else {
        await bot.sendMessage(OWNER_ID, caption, { parse_mode: 'HTML' })
      }

      return res.status(200).json({
        status: true,
        message: 'Pesan berhasil dikirim ke owner'
      })

    } catch (error) {
      console.error('Telegram error:', error)
      return res.status(500).json({
        status: false,
        message: 'Gagal mengirim ke Telegram: ' + error.message
      })
    }
  })
      }
