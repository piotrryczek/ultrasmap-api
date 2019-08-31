import mongoose from 'mongoose';
import { LANGUAGES, DEFAULT_LANGUAGE } from '@config/config';

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
  chosenLanguage: {
    type: String,
    enum: LANGUAGES,
    required: true,
    default: DEFAULT_LANGUAGE,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
