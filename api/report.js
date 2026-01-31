// api/report.js
import formidable from 'formidable';
import fs from 'fs/promises'; 
import { Telegraf } from 'telegraf';
import moment from 'moment-timezone';
import dbConnect from '../lib/dbConnect.js';
import fsSync from 'fs';
import Report from '../models/Report.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const bot = new Telegraf(process.env.BOT_TOKEN);
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
    allowEmptyFiles: false,
    minFileSize: 0,
    filter: ({ name, originalFilename, mimetype }) => {
      if (name !== 'file') return true;

      const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/heic',
        'image/heif',

        // Videos - LENGKAP!
        'video/mp4',
        'video/mpeg',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/x-flv',
        'video/3gpp',
        'video/ogg',

        // JavaScript/Text
        'application/javascript',
        'text/javascript',
        'application/octet-stream',
        'text/plain',
      ];

      const allowedExtensions = [
        // Images
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif',
        
        // Videos
        '.mp4', '.mpeg', '.mpg', '.webm', '.mov', '.avi', '.mkv', '.flv', '.3gp', '.ogv',
        
        // Scripts
        '.js', '.txt',
      ];

      const ext = originalFilename
        ? originalFilename.toLowerCase().slice(originalFilename.lastIndexOf('.'))
        : '';

      // Accept if either mime type OR extension matches
      const mimeMatch = mimetype && allowedMimeTypes.includes(mimetype);
      const extMatch = allowedExtensions.includes(ext);

      console.log('File upload attempt:', {
        filename: originalFilename,
        mimetype,
        extension: ext,
        mimeMatch,
        extMatch,
        accepted: mimeMatch || extMatch
      });

      return mimeMatch || extMatch;
    },
  });

  try {
    const [fields, files] = await form.parse(req);

    const type      = fields.type?.[0]     || 'Request';
    const name      = fields.name?.[0]     || '';
    const userid    = fields.userid?.[0]   || '';
    const message   = fields.message?.[0]  || '';

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
        const mime = file.mimetype || 'application/octet-stream';

        console.log('Processing file:', {
          originalFilename: file.originalFilename,
          mimetype: file.mimetype,
          filepath: file.filepath,
          size: file.size
        });

        fileInfo = {
          fileName: file.originalFilename,
          fileType: mime,
        };

        try {
          if (mime.startsWith('image/')) {
            await bot.telegram.sendPhoto(
              OWNER_ID,
              { source: fsSync.createReadStream(file.filepath) },
              { caption, parse_mode: 'HTML' }
            );
            telegramMediaSent = true;

          } else if (mime.startsWith('video/')) {
            await bot.telegram.sendVideo(
              OWNER_ID,
              { 
                source: fsSync.createReadStream(file.filepath),
                filename: file.originalFilename,
              },
              { 
                caption,
                supports_streaming: true,
                parse_mode: 'HTML',
              }
            );
            telegramMediaSent = true;

          } else {
            await bot.telegram.sendDocument(
              OWNER_ID,
              { 
                source: fsSync.createReadStream(file.filepath),
                filename: file.originalFilename,
              },
              { 
                caption,
                parse_mode: 'HTML',
              }
            );
            telegramMediaSent = true;
          }

          console.log('File sent to Telegram successfully');

        } catch (err) {
          console.error('Telegram send error:', err);

        } finally {
          try {
            await fs.unlink(file.filepath);
          } catch (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr);
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
      await bot.telegram.sendMessage(OWNER_ID, caption, { parse_mode: 'HTML' });
    }

    return res.status(200).json({
      status: true,
      message: 'Pesan berhasil dikirim & disimpan',
      reportId: newReport._id,
    });

  } catch (error) {
    console.error('Error di /api/report:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
}
