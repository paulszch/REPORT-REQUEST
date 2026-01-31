import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';

const HISTORY_PASSWORD = process.env.HISTORY_PASSWORD;

const activeTokens = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { password } = req.body;

  if (password !== HISTORY_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Password salah' });
  }

  // Generate token unik
  const token = uuidv4();

  // Expiry 24 jam
  const expiresIn = 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + expiresIn;

  activeTokens.set(token, expiresAt);

  res.setHeader('Set-Cookie', serialize('hist_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiresIn / 1000,
    path: '/'
  }));

  return res.status(200).json({ success: true });
}
