// api/history.js
import dbConnect from '../lib/dbConnect.js';
import Report from '../models/Report.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean();

    const total = await Report.countDocuments();

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
