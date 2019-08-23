import mongoose from 'mongoose';

const { Schema } = mongoose;

const fullObjectData = {
  name: String,
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
  satelliteOfToCreate: String,
  satelliteOf: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
};

const SuggestionSchema = new Schema({
  type: {
    type: String,
    enum: ['new', 'edit'],
    required: true,
  },
  comments: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
    },
  }],
  original: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
  data: fullObjectData,
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);
