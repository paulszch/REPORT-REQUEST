import dbConnect from '../lib/dbConnect.js';
import Report from '../models/Report.js';

import { activeTokens } from './unlock.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies?.hist_token;

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({
      status: false,
      message: 'Unauthorized - Silakan masukkan password terlebih dahulu',
      reports: []
    });
  }

  const expiresAt = activeTokens.get(token);
  if (Date.now() > expiresAt) {
    activeTokens.delete(token);
    return res.status(401).json({
      status: false,
      message: 'Sesi kadaluarsa',
      reports: []
    });
  }

  try {
    await dbConnect();

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean(); 

    const total = await Report.countDocuments(query);

    return res.status(200).json({
      status: true,
      reports,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + reports.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch history: ' + error.message,
      reports: []
    });
  }
}
