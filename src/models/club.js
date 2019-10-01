/* eslint-disable func-names */
import _ from 'lodash';
import _uniq from 'lodash/uniq';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';
import { escapeRegExp } from '@utilities/helpers';

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ClubSchema = new Schema({
  visible: {
    type: Boolean,
    default: true,
  },
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
  league: {
    type: Schema.Types.ObjectId,
    ref: 'League',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
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
  enemies: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
  }],
  derbyRivalries: [{
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
    enemies = [],
  } = this;

  const allRelations = [satelliteOf, ...friendships, ...agreements, ...positives, ...satellites, ...enemies];
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
          enemies: clubId,
          derbyRivalries: clubId,
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

ClubSchema.statics.findByName = async function (search) {
  const maybeFoundClub = await this.findOne({ name: search });

  if (maybeFoundClub) return { club: maybeFoundClub, isReserve: false };

  const searchParts = search.split(/ |-/);

  const isReserve = searchParts.some(searchPart => searchPart === 'II');

  const partResults = await Promise.all(searchParts.map(part => new Promise(async (resolve, reject) => {
    try {
      const nameRegExp = new RegExp(escapeRegExp(part), 'i');

      const clubs = await this.find({
        $or: [
          { name: nameRegExp },
          { transliterationName: nameRegExp },
          { searchName: nameRegExp },
        ],
      });

      resolve(clubs);
    } catch (error) {
      reject(new ApiError(errorCodes.Internal, error));
    }
  })));

  const finalResults = [...partResults.reduce((acc, results) => {
    acc.push(...results);

    return acc;
  }, [])];

  if (searchParts.length > 2 && finalResults.length < 3) return null;

  const groupedById = _.chain(finalResults)
    .groupBy(club => club.id.toString())
    .map((value, key) => ({ id: key, nrClubs: value.length }))
    .sortBy(groupedItem => groupedItem.nrClubs)
    .reverse()
    .value();

  const [foundGroupedItem] = groupedById;
  const { id: foundId } = foundGroupedItem;

  return {
    club: finalResults.find(result => result.id.toString() === foundId),
    isReserve,
  };
};

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
