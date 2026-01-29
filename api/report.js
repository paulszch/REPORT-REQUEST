import TelegramBot from 'node-telegram-bot-api'
import formidable from 'formidable'
import fs from 'fs'
import moment from 'moment-timezone'

export const config = {
  api: {
    bodyParser: false
  }
}

const bot = new TelegramBot(process.env.BOT_TOKEN)
const OWNER_ID = process.env.OWNER_ID
const TIMEZONE = 'Asia/Jakarta'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err)
      return res.status(500).json({ message: 'Form parse error' })
    }

    const type = fields.type || 'Request'
    const name = fields.name || '-'
    const userid = fields.userid || '-'
    const message = fields.message || '-'
    const file = files.file

    // ⏰ WAKTU DENGAN TIMEZONE
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
      if (file) {
        const buffer = fs.readFileSync(file.filepath)

        if (file.mimetype.startsWith('image')) {
          await bot.sendPhoto(OWNER_ID, buffer, {
            caption
          })
        } else if (file.mimetype.startsWith('video')) {
          await bot.sendVideo(OWNER_ID, buffer, {
            caption
          })
        } else {
          await bot.sendDocument(OWNER_ID, buffer, {
            caption
          })
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
