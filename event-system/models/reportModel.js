const mongoose = require('mongoose');

const REPORT_STATUS = {
  PENDING: 'pending',
  RESPONDED: 'responded',
  CLOSED: 'closed',
};

const reportSchema = new mongoose.Schema(
  {
    legacy_sql_id: { type: Number, unique: true, sparse: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
    },
    admin_reply: { type: String, default: '' },
    replied_at: { type: Date },
    replied_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = {
  Report,
  REPORT_STATUS,
};
