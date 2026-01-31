
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: { type: String, default: 'Request' },
  name: { type: String, required: true },
  userid: { type: String, required: true },
  message: { type: String, required: true },
  fileUrl: { type: String },          // kalau nanti upload ke cloud (opsional)
  fileName: { type: String },
  fileType: { type: String },
  status: { type: String, default: 'baru', enum: ['baru', 'diproses', 'selesai'] },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
