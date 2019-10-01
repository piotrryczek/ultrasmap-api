
import mongoose from 'mongoose';
import _isEmpty from 'lodash/isEmpty';

import Match from '@models/match';
import Club from '@models/club';

import { PER_PAGE_MATCHES } from '@config/config';
import { parseSearchQuery } from '@utilities/helpers';

class MatchesController {
  list = async (ctx) => {
    const { queryParsed } = ctx;

    const {
      page = 1,
      search = {},
      filters = {},
    } = queryParsed;

    const parsedSearch = parseSearchQuery(search);

    const {
      date,
      isVisible,
      lackOf,
    } = filters;

    if (!_isEmpty(date)) {
      const { type, time } = date;

      const dateToCompare = new Date(parseInt(time, 10));

      if (type === 'after') {
        Object.assign(parsedSearch, {
          date: { $lt: dateToCompare },
        });
      } else { // Before
        Object.assign(parsedSearch, {
          date: { $gt: dateToCompare },
        });
      }
    }

    if (isVisible) {
      Object.assign(parsedSearch, {
        isVisible,
      });
    }

    if (!_isEmpty(lackOf)) {
      if (lackOf === 'attitude') {
        Object.assign(parsedSearch, {
          attitude: 'unknown',
        });
      }

      if (lackOf === 'location') {
        Object.assign(parsedSearch, {
          'location.coordinates': { $size: 0 },
        });
      }
    }

    const matches = await Match.find(
      parsedSearch,
      null,
      {
        skip: (page - 1) * PER_PAGE_MATCHES,
        limit: PER_PAGE_MATCHES,
      },
    )
      .populate('homeClub')
      .populate('awayClub')
      .populate('league')
      .sort({ date: 'descending' });

    const allCount = await Match.countDocuments(parsedSearch);

    ctx.body = {
      data: matches,
      allCount,
    };
  }

  add = async (ctx) => {
    const { ObjectId } = mongoose.Types;

    const {
      request: {
        body: {
          homeClub,
          isHomeClubReserve = false,
          awayClub,
          isAwayClubReserve = false,
          importance,
          attitude,
          date,
          league,
          isVisible = true,
          location,
        },
      },
    } = ctx;

    const match = new Match({
      isHomeClubReserve,
      isAwayClubReserve,
      importance,
      attitude,
      date,
      league,
      isVisible,
      attitudeEstimationLevel: 1,
    });

    if (location) {
      Object.assign(match, {
        location: {
          type: 'Point',
          coordinates: location,
        }
      });
    } else if (ObjectId.isValid(homeClub)) {
      const { location: homeClubLocation } = await Club.findById(homeClub);

      Object.assign(match, {
        location: homeClubLocation,
      });
    }

    if (ObjectId.isValid(homeClub)) {
      Object.assign(match, {
        homeClub,
        unimportantHomeClubName: '',
      });
    } else {
      Object.assign(match, {
        homeClub: null,
        unimportantHomeClubName: homeClub,
      });
    }

    if (ObjectId.isValid(awayClub)) {
      Object.assign(match, {
        awayClub,
        unimportantAwayClubName: '',
      });
    } else {
      Object.assign(match, {
        awayClub: null,
        unimportantAwayClubName: awayClub,
      });
    }

    await match.validate();
    const { _id: newMatchId } = await match.save();

    ctx.body = {
      data: newMatchId,
    };
  }

  update = async (ctx) => {
    const {
      params: {
        matchId,
      },
      request: {
        body: {
          // homeClub,
          // isHomeClubReserve = false,
          // awayClub,
          // isAwayClubReserve = false,
          importance,
          attitude,
          date,
          coordinates,
          // league,
          isVisible = true,
        },
      },
    } = ctx;

    const match = await Match.findById(matchId);

    Object.assign(match, {
      // homeClub,
      // isHomeClubReserve,
      // awayClub,
      // isAwayClubReserve,
      importance,
      attitude,
      date,
      // league,
      isVisible,
    });

    if (coordinates) {
      const { lat, lng } = coordinates;

      Object.assign(match, {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });
    }

    await match.validate();
    await match.save();

    ctx.body = {
      success: true,
    };
  }

  bulkRemove = async (ctx) => {
    const {
      request: {
        body: {
          ids,
        },
      },
    } = ctx;

    await Match.deleteMany({
      _id: { $in: ids },
    });

    ctx.body = {
      success: true,
    };
  }

  recalculate = async (ctx) => {
    ctx.body = {
      data: {},
    };
  }
}

export default new MatchesController();
