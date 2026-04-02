const { mongoose } = require('../config/db');

const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  ATTENDED: 'attended',
  CANCELLED: 'cancelled',
};

const registrationSchema = new mongoose.Schema(
  {
    legacy_sql_id: {
      type: Number,
      index: true,
      default: null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    qr_token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.REGISTERED,
    },
    registered_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

registrationSchema.index({ user_id: 1, event_id: 1 }, { unique: true });
registrationSchema.index({ event_id: 1, status: 1 });
registrationSchema.index({ user_id: 1, status: 1 });

registrationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Registration =
  mongoose.models.Registration || mongoose.model('Registration', registrationSchema);

module.exports = {
  Registration,
  REGISTRATION_STATUS,
};
