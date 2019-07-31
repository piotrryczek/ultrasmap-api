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
  relations: [{
    _from: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },
    _to: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },
    direction: {
      type: String,
      enum: ['one-way', 'two-way'],
    },
    type: {
      type: String,
      enum: ['friendship', 'agreement', 'satellite', 'positive', 'hostility'],
    },
  }],
};

const SuggestionSchema = new Schema({
  _objectFor: {
    type: Schema.Types.ObjectId,
    ref: 'ObjectFor',
  },
  type: {
    type: String,
    enum: ['new', 'edit'],
  },
  objectDataBefore: fullObjectData,
  objectDataUpdated: fullObjectData,
}, {
  timestamps: true,
});

export default mongoose.model('Suggestion', SuggestionSchema);
