/* eslint-disable func-names */
import mongoose from 'mongoose';
import moment from 'moment';

import Match from '@models/match';
import Club from '@models/club';

import { googleMapsSearchForAddress } from '@utilities/helpers';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';
import download from '@services/download/download';
import estimateClubsAttitude from '@utilities/estimation/estimateClubsAttitude';

const { Schema } = mongoose;

const LeagueSchema = new Schema({
  name: {
    type: Schema.Types.String,
    required: true,
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country',
  },
  downloadMethod: {
    type: Schema.Types.String,
    enum: ['90minut', '90minutPucharPolski'],

  },
  downloadUrl: {
    type: Schema.Types.String,
  },
  clubs: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  }],
  importanceModifier: {
    type: Schema.Types.Number,
    default: 1,
  },
  sport: {
    type: Schema.Types.String,
    enum: ['football'],
  },
  tier: {
    type: Schema.Types.Number,
  },
  isAutomaticDownload: {
    type: Schema.Types.Boolean,
    default: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

LeagueSchema.methods.downloadMatches = async function (date = new Date()) {
  const league = this;

  const {
    downloadMethod,
    downloadUrl,
    _id: leagueId,
  } = this;

  const matches = await download(downloadMethod, downloadUrl, 'matches', {
    date,
  });

  const dbResults = await Promise.all(matches.map(({ homeClubName, awayClubName, date: matchDateTimestamp }) => new Promise(async (resolve, reject) => {
    try {
      const maybeFoundHomeClub = await Club.findByName(homeClubName);
      const maybeFoundAwayClub = await Club.findByName(awayClubName);

      if (!maybeFoundHomeClub && !maybeFoundAwayClub) return resolve();

      const finalDate = new Date(parseInt(matchDateTimestamp, 10));

      const isHomeClubReserve = maybeFoundHomeClub !== null && maybeFoundHomeClub.isReserve;
      const isAwayClubReserve = maybeFoundAwayClub !== null && maybeFoundAwayClub.isReserve;

      // Check if match already exists
      const dateToCompareFrom = moment(finalDate).subtract(8, 'days').toDate();
      const dateToCompareTo = moment(finalDate).add(8, 'days').toDate();

      const matchQuery = {
        date: {
          $lt: dateToCompareTo,
          $gt: dateToCompareFrom,
        },
        isHomeClubReserve,
        isAwayClubReserve,
      };

      if (maybeFoundHomeClub) {
        Object.assign(matchQuery, {
          homeClub: maybeFoundHomeClub.club,
        });
      } else {
        Object.assign(matchQuery, {
          unimportantHomeClubName: homeClubName,
        });
      }

      if (maybeFoundAwayClub) {
        Object.assign(matchQuery, {
          awayClub: maybeFoundAwayClub.club,
        });
      } else {
        Object.assign(matchQuery, {
          unimportantAwayClubName: awayClubName,
        });
      }

      const maybeFoundMatch = await Match.findOne(matchQuery);

      if (maybeFoundMatch) { // Just update date (in case it has changed)
        if (maybeFoundMatch.date.toString() !== finalDate.toString()) {
          Object.assign(maybeFoundMatch, {
            date: finalDate,
          });

          await maybeFoundMatch.save();
          return resolve('update');
        }

        return resolve();
      }

      const result = await estimateClubsAttitude({
        firstClubId: maybeFoundHomeClub === null ? null : maybeFoundHomeClub.club._id.toString(),
        secondClubId: maybeFoundAwayClub === null ? null : maybeFoundAwayClub.club._id.toString(),
        isFirstClubReserve: isHomeClubReserve,
        isSecondClubReserve: isAwayClubReserve,
        league,
      });

      if (result === 'unimportant') return resolve();

      const {
        importance,
        attitude,
        level,
      } = result;

      const match = new Match({
        retrievedHomeClubName: homeClubName,
        homeClub: maybeFoundHomeClub ? maybeFoundHomeClub.club : null,
        isHomeClubReserve,
        unimportantHomeClubName: maybeFoundHomeClub ? '' : homeClubName,
        retrievedAwayClubName: awayClubName,
        awayClub: maybeFoundAwayClub ? maybeFoundAwayClub.club : null,
        isAwayClubReserve,
        unimportantAwayClubName: maybeFoundAwayClub ? '' : awayClubName,
        importance,
        attitude,
        league: leagueId,
        date: finalDate,
        attitudeEstimationLevel: level,
      });

      if (maybeFoundHomeClub) {
        Object.assign(match, {
          location: maybeFoundHomeClub.club.location,
        });
      } else {
        const location = await googleMapsSearchForAddress(homeClubName);

        if (location) {
          const { lat, lng } = location;

          Object.assign(match, {
            locationNotSure: true,
            location: {
              type: 'Point',
              coordinates: [lng, lat],
            },
          });
        }
      }

      if (isHomeClubReserve) {
        Object.assign(match, {
          locationNotSure: true,
        });
      }

      await match.save();

      return resolve('add');
    } catch (error) {
      reject(new ApiError(errorCodes.Internal, error));
    }
  })));

  const {
    added,
    updated,
  } = dbResults.reduce((acc, result) => {
    if (result === 'add') {
      acc.added += 1;
    } else if (result === 'update') {
      acc.updated += 1;
    }

    return acc;
  }, { added: 0, updated: 0 });

  return {
    matches,
    added,
    updated,
    league,
  };
};

export default mongoose.models.League || mongoose.model('League', LeagueSchema);
