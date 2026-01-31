// api/history.js
import dbConnect from '../lib/dbConnect.js';
import Report from '../models/Report.js';

// Simple authentication - bisa diganti dengan JWT atau session
const HISTORY_PASSWORD = process.env.HISTORY_PASSWORD || 'owner123'; // Set di .env

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  const password = req.headers['x-password'];
  
  if (!password || password !== HISTORY_PASSWORD) {
    return res.status(401).json({
      status: false,
      message: 'Unauthorized - Password required',
      reports: []
    });
  }

  try {
    await dbConnect();

    // Get query parameters for pagination (optional)
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    const status = req.query.status; // Filter by status (optional)

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Fetch reports from database, sorted by newest first
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v') // Exclude version field
      .lean(); // Convert to plain JavaScript objects

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
