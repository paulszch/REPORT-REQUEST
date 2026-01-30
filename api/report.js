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
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Parse error' })
    }

    const type = fields.type || 'Request'
    const name = fields.name || '-'
    const userid = fields.userid || '-'
    const message = fields.message || '-'

    const uploadedFile = files.file
      ? Array.isArray(files.file)
        ? files.file[0]
        : files.file
      : null

    const time = moment()
      .tz(TIMEZONE)
      .format('DD MMM YYYY • HH:mm:ss z')

    const caption =
`📩 ${String(type).toUpperCase()} BARU

👤 Nama : ${name}
🆔 ID   : ${userid}
🕒 Waktu: ${time}

💬 Pesan:
${message}
`

    try {
      if (uploadedFile && uploadedFile.filepath) {
        const buffer = fs.readFileSync(uploadedFile.filepath)

        if (uploadedFile.mimetype.startsWith('image')) {
          await bot.sendPhoto(OWNER_ID, buffer, { caption })
        } else if (uploadedFile.mimetype.startsWith('video')) {
          await bot.sendVideo(OWNER_ID, buffer, { caption })
        } else {
          await bot.sendDocument(OWNER_ID, buffer, { caption })
        }
      } else {
        await bot.sendMessage(OWNER_ID, caption)
      }

      res.status(200).json({ message: 'Pesan berhasil dikirim ke owner' })
    } catch (e) {
      console.error('Telegram error:', e)
      res.status(500).json({ message: 'Gagal mengirim ke Telegram' })
    }
  })
            }
