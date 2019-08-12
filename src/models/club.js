/* eslint-disable func-names */
import _uniq from 'lodash/uniq';

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ClubSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
  tier: {
    type: Number,
  },
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
}, {
  timestamps: true,
});

ClubSchema.method('validateRelations', function () {
  const {
    satelliteOf = null,
    friendships = [],
    agreements = [],
    positives = [],
    satellites = [],
  } = this;

  const allRelations = [satelliteOf, ...friendships, ...agreements, ...positives, ...satellites];
  const uniqueRelations = _uniq(allRelations);

  if (allRelations.length !== uniqueRelations.length) return false;

  return true;
});

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
