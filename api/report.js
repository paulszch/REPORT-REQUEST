import TelegramBot from 'node-telegram-bot-api'
import formidable from 'formidable'
import fs from 'fs'
import moment from 'moment-timezone'

export const config = {
  api: { bodyParser: false }
}

const bot = new TelegramBot(process.env.BOT_TOKEN)
const OWNER_ID = process.env.OWNER_ID
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Parse error' })
    }

    // ✅ FIX FIELD (ARRAY → STRING)
    const type = fields.type?.[0] || 'Request'
    const name = fields.name?.[0] || '-'
    const userid = fields.userid?.[0] || '-'
    const message = fields.message?.[0] || '-'

    // ✅ FIX FILE (ARRAY SAFE)
    const uploadedFile = files.file
      ? Array.isArray(files.file)
        ? files.file[0]
        : files.file
      : null

    const time = moment()
      .tz(TIMEZONE)
      .format('DD MMM YYYY • HH:mm:ss z')

    const caption =
`📩 ${type.toUpperCase()} BARU

👤 Nama : ${name}
🆔 ID   : ${userid}
🕒 Waktu: ${time}

💬 Pesan:
${message}
`

    try {
      if (uploadedFile?.filepath) {
        const buffer = fs.readFileSync(uploadedFile.filepath)
        const mime = uploadedFile.mimetype || ''

        if (mime.startsWith('image')) {
          await bot.sendPhoto(OWNER_ID, buffer, { caption })

        } else if (mime.startsWith('video')) {
          await bot.sendVideo(
            OWNER_ID,
            {
              source: buffer,
              filename: uploadedFile.originalFilename || 'video.mp4'
            },
            { caption }
          )

        } else {
          await bot.sendDocument(
            OWNER_ID,
            {
              source: buffer,
              filename: uploadedFile.originalFilename || 'file'
            },
            { caption }
          )
        }

      } else {
        await bot.sendMessage(OWNER_ID, caption)
      }

      return res.status(200).json({
        status: true,
        message: 'Pesan berhasil dikirim ke owner'
      })

    } catch (e) {
      console.error('Telegram error:', e)
      return res.status(500).json({
        status: false,
        message: 'Gagal mengirim ke Telegram'
      })
    }
  })
}
