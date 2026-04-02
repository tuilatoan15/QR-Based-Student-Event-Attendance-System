const { mongoose } = require('../config/db');

const attendanceSchema = new mongoose.Schema(
  {
    legacy_sql_id: {
      type: Number,
      index: true,
      default: null,
    },
    registration_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      unique: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checked_in_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkin_time: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

attendanceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

attendanceSchema.index({ event_id: 1, checkin_time: -1 });
attendanceSchema.index({ student_id: 1, event_id: 1 });

module.exports =
  mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
