import mongoose from 'mongoose';

const { Schema } = mongoose;

const fullObjectData = {
  name: String,
  logo: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  friendships: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  agreements: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  positives: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  satellites: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
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
  status: {
    type: String,
    enum: ['pending', 'applied', 'rejected'],
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
  objectDataBefore: fullObjectData,
  objectDataAfter: fullObjectData,
}, {
  timestamps: true,
});

export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);
