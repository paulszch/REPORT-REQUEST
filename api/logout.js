import { serialize } from 'cookie';

const activeTokens = require('./unlock').activeTokens || new Map();

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const token = req.cookies?.hist_token;

  if (token) {
    activeTokens.delete(token);
  }

  res.setHeader('Set-Cookie', serialize('hist_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  }));

  return res.status(200).json({ success: true });
}
