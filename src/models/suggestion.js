/* eslint-disable func-names */
import mongoose from 'mongoose';
import { __ } from 'i18n';
import EmailSender from '@services/emailSender';

const { Schema } = mongoose;

const fullObjectData = {
  name: String,
  searchName: String,
  transliterationName: String,
  logo: String,
  tier: Number,
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  friendshipsToCreate: [String],
  friendships: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  agreementsToCreate: [String],
  agreements: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  positivesToCreate: [String],
  positives: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  satellitesToCreate: [String],
  satellites: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  enemiesToCreate: [String],
  enemies: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  satelliteOfToCreate: String,
  satelliteOf: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
};

const SuggestionSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'applied'],
    required: true,
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['new', 'edit'],
    required: true,
  },
  comments: [{
    type: String,
  }],
  original: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
  data: fullObjectData,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  versionKey: false,
});

SuggestionSchema.method('getUser', async function () {
  const { user: userId } = this;

  const User = this.model('User');

  const user = await User.findById(userId);

  return user;
});

SuggestionSchema.method('getClubName', async function () {
  const {
    type,
    original,
    data,
  } = this;

  const Club = this.model('Club');

  if (type === 'edit') {
    const { name } = await Club.findById(original);
    return name;
  }

  return data.name;
});

SuggestionSchema.post('remove', async (document, next) => {
  const user = await document.getUser();

  if (user) {
    const { email, chosenLanguage } = user;

    const clubName = await document.getClubName();

    if (email) {
      EmailSender.sendEmail({
        to: email,
        subject: __({ phrase: 'suggestionRejectedEmail.title', locale: chosenLanguage }),
        html: __({ phrase: 'suggestionRejectedEmail.content', locale: chosenLanguage }, clubName),
      });
    }
  }

  next();
});

export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);
