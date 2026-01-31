// api/report.js
import formidable from 'formidable';
import fs from 'fs/promises'; 
import TelegramBot from 'node-telegram-bot-api';
import moment from 'moment-timezone';
import dbConnect from '../lib/dbConnect.js';
import fsSync from 'fs';
import Report from '../models/Report.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const bot = new TelegramBot(process.env.BOT_TOKEN);
const OWNER_ID = process.env.OWNER_ID;
const TIMEZONE = 'Asia/Jakarta';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

 const form = formidable({
  multiples: false,
  maxFileSize: 50 * 1024 * 1024,
  keepExtensions: true,
  allowEmptyFiles: true,
  minFileSize: 0,
  filter: ({ name, originalFilename, mimetype }) => {
  if (name !== 'file') return true;

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',

    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',

    'application/javascript',
    'text/javascript',
    'application/octet-stream',
    'text/plain',
  ];

  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic',
    '.mp4', '.webm', '.mov', '.avi',
    '.js',
  ];

  const ext = originalFilename
    ? originalFilename.toLowerCase().slice(originalFilename.lastIndexOf('.'))
    : '';

  if (
    (mimetype && allowedMimeTypes.includes(mimetype)) ||
    allowedExtensions.includes(ext)
  ) {
    return true;
  }

  return false;
},

});

  try {
    const [fields, files] = await form.parse(req);

    const type      = fields.type?.[0]     || 'Request';
    const name      = fields.name?.[0]     || '';
    const userid    = fields.userid?.[0]   || '';
    const message   = fields.message?.[0]  || '';

    // Validasi minimal
    if (!name || !userid || !message) {
      return res.status(400).json({
        status: false,
        message: 'Nama, User ID, dan Pesan wajib diisi',
      });
    }

    let fileInfo = null;
    let telegramMediaSent = false;

    const time = moment().tz(TIMEZONE).format('DD MMM YYYY • HH:mm:ss z');

    const caption = `${type.toUpperCase()} BARU\n\n` +
                    `Nama   : ${name}\n` +
                    `ID     : ${userid}\n` +
                    `Waktu  : ${time}\n\n` +
                    `Pesan:\n${message}`;
    if (files.file) {
  const file = Array.isArray(files.file) ? files.file[0] : files.file;

if (file?.filepath) {
  console.log('File info:', {
    originalFilename: file.originalFilename,
    mimetype: file.mimetype,
    filepath: file.filepath,
    size: file.size
  });
    const mime = file.mimetype || 'application/octet-stream';

    fileInfo = {
      fileName: file.originalFilename,
      fileType: mime,
    };

    try {
      if (mime.startsWith('image/')) {
        await bot.sendPhoto(
          OWNER_ID,
          fsSync.createReadStream(file.filepath),
          { caption, parse_mode: 'HTML' }
        );

      } else if (mime.startsWith('video/')) {
        await bot.sendVideo(
          OWNER_ID,
          fsSync.createReadStream(file.filepath),
          {
            caption,
            supports_streaming: true,
            parse_mode: 'HTML',
          }
        );

      } else {
        await bot.sendDocument(
          OWNER_ID,
          fsSync.createReadStream(file.filepath),
          {
            filename: file.originalFilename,
            caption,
            parse_mode: 'HTML',
          }
        );
      }

      telegramMediaSent = true;

    } catch (err) {
      console.error('Telegram send error:', err);

    } finally {
  try {
    await fs.unlink(file.filepath);
  } catch (unlinkErr) {
    // Ignore error saat hapus file
  }
}
  }
}

    
    const newReport = await Report.create({
      type,
      name,
      userid,
      message,
      ...fileInfo,
    });

    if (!telegramMediaSent) {
      await bot.sendMessage(OWNER_ID, caption, { parse_mode: 'HTML' });
    }

    return res.status(200).json({
      status: true,
      message: 'Pesan berhasil dikirim & disimpan',
      reportId: newReport._id, // optional: balikin ID report
    });

  } catch (error) {
    console.error('Error di /api/report:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
}
