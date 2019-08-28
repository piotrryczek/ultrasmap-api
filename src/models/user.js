import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  verificationCode: {
    type: String,
  },
  suggestionsDailyLimit: {
    type: Number,
    required: true,
    default: 5,
  },
  suggestionsDailyLeft: {
    type: Number,
    required: true,
    default: 5,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
