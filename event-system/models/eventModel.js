const { mongoose } = require('../config/db');

const eventSchema = new mongoose.Schema(
  {
    legacy_sql_id: {
      type: Number,
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    max_participants: {
      type: Number,
      required: true,
      min: 1,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    google_sheet_id: {
      type: String,
      trim: true,
      default: null,
    },
    google_sheet_name: {
      type: String,
      trim: true,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

eventSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

eventSchema.index({ is_active: 1, start_time: 1 });
eventSchema.index({ created_by: 1, createdAt: -1 });

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
