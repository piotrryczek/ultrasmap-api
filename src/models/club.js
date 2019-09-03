/* eslint-disable func-names */
import _uniq from 'lodash/uniq';

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ClubSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  transliterationName: {
    type: String,
  },
  searchName: {
    type: String,
  },
  logo: {
    type: String,
  },
  tier: {
    type: Number,
    default: 3,
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
  versionKey: false,
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

ClubSchema.post('remove', async function (document, next) {
  const { _id: clubId } = document;

  const Club = this.model('Club');

  await Promise.all([
    Club.updateMany(
      {},
      {
        $pull: {
          agreements: clubId,
          friendships: clubId,
          positives: clubId,
          satellites: clubId,
        },
      },
      {
        multi: true,
      },
    ),
    Club.updateMany(
      {
        satelliteOf: clubId,
      },
      {
        $unset: {
          satelliteOf: null,
        },
      },
    ),
  ]);

  next();
});

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
