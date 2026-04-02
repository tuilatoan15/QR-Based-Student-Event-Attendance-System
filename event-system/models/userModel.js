const { mongoose } = require('../config/db');

const organizerProfileSchema = new mongoose.Schema(
  {
    organization_name: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    legacy_sql_id: {
      type: Number,
      index: true,
      default: null,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    student_code: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ['admin', 'organizer', 'student'],
      default: 'student',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      trim: true,
      default: 'https://res.cloudinary.com/dhw5zmh91/image/upload/v1/zqabiday4fmm0exkauot',
    },
    organizer_profile: {
      type: organizerProfileSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ student_code: 1 }, { sparse: true });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password_hash;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
