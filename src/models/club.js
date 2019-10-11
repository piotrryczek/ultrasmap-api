/* eslint-disable func-names */
import _ from 'lodash';
import _uniq from 'lodash/uniq';
import stringSimilarity from 'string-similarity';

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

  const cleanedSearch = search.replace(new RegExp(/\(|\)/, 'g'), '');
  const searchParts = cleanedSearch.split(/ |-/);

  const isReserve = searchParts.some(searchPart => (searchPart === 'II' || searchPart === 'III'));

  const searchPartsWithoutNumbers = searchParts.filter((part) => {
    const maybeNumber = parseInt(part, 10);
    const maybeLatinNumber = (part === 'II' || part === 'III');

    return !maybeNumber && !maybeLatinNumber;
  });

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

  const groupedById = _.chain(finalResults)
    .groupBy(club => club.id.toString())
    .map((value, key) => ({ id: key, nrClubs: value.length }))
    .sortBy(groupedItem => groupedItem.nrClubs)
    .reverse()
    .value();

  if (!groupedById.length) return null;

  // Possibly use String Similarity for all situations
  if (searchPartsWithoutNumbers.length === 1) {
    const names = finalResults.map(({ name }) => name);
    const matches = stringSimilarity.findBestMatch(search, names);
    const { bestMatch: { target } } = matches;

    return {
      club: finalResults.find(result => result.name === target),
      isReserve,
    };
  }

  const [foundGroupedItem] = groupedById;
  const { id: foundId, nrClubs } = foundGroupedItem;

  const foundClub = finalResults.find(result => result.id.toString() === foundId);

  if (
    (searchPartsWithoutNumbers.length === 2 && nrClubs < 2)
    || (searchPartsWithoutNumbers.length >= 3 && nrClubs < 3)
  ) {
    const { name } = foundClub;
    
    const result = stringSimilarity.compareTwoStrings(name, search);

    if (result < 0.91) return null;
  }

  return {
    club: foundClub,
    isReserve,
  };
};

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
