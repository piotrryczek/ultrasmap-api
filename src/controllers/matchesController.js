
import mongoose from 'mongoose';
import _isEmpty from 'lodash/isEmpty';

import Match from '@models/match';
import Club from '@models/club';
import League from '@models/league';

import { PER_PAGE_MATCHES } from '@config/config';
import { parseSearchQuery } from '@utilities/helpers';

import util from 'util';

// db.matches.update({ 'location.coordinates': [] }, { $set: { 'location.coordinates' : [0,0] } }, { multi: true} )
class MatchesController {
  list = async (ctx) => {
    const { queryParsed } = ctx;

    const {
      page = 1,
      search = {},
      filters = {},
      sort = null,
    } = queryParsed;

    const parsedSearch = parseSearchQuery(search);
    const queryOptions = {
      skip: (page - 1) * PER_PAGE_MATCHES,
      limit: PER_PAGE_MATCHES,
    };

    const {
      dateFrom,
      dateTo,
      attitudeFrom,
      attitudeTo,
      isVisible,
      lackOf,
      clubs = [],
      league = null,
      leagueTiers = [],
      radius = null,
      radiusFrom = null,
    } = filters;

    Object.assign(parsedSearch, {
      'location.coordinates': { $ne: [0, 0] },
    });

    if (sort) {
      const [sortName, sortDirection] = Object.entries(sort)[0];

      if (sortDirection) {
        Object.assign(queryOptions, {
          sort: {
            [sortName]: sortDirection,
          },
        });
      }
    }

    if (dateFrom && dateTo) {
      const dateToCompareFrom = new Date(parseInt(dateFrom, 10));
      const dateToCompareTo = new Date(parseInt(dateTo, 10));

      Object.assign(parsedSearch, {
        date: {
          $lt: dateToCompareTo,
          $gt: dateToCompareFrom,
        },
      });
    } else if (dateFrom) {
      const dateToCompareFrom = new Date(parseInt(dateFrom, 10));

      Object.assign(parsedSearch, {
        date: { $gt: dateToCompareFrom },
      });
    } else if (dateTo) {
      const dateToCompareTo = new Date(parseInt(dateTo, 10));

      Object.assign(parsedSearch, {
        date: { $lt: dateToCompareTo },
      });
    }

    if (isVisible) {
      Object.assign(parsedSearch, {
        isVisible,
      });
    }

    if (
      !isNaN(parseFloat(attitudeFrom))
      && !isNaN(parseFloat(attitudeTo))
    ) {
      Object.assign(parsedSearch, {
        attitude: {
          $gte: parseFloat(attitudeFrom),
          $lte: parseFloat(attitudeTo),
        },
      });
    } else if (!isNaN(parseFloat(attitudeFrom))) {
      Object.assign(parsedSearch, {
        attitude: { $gte: parseFloat(attitudeFrom) },
      });
    } else if (!isNaN(parseFloat(attitudeTo))) {
      Object.assign(parsedSearch, {
        attitude: { $lte: parseFloat(attitudeTo) },
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
          'location.coordinates': [0, 0],
        });
      }
    }

    if (clubs.length) {
      Object.assign(parsedSearch, {
        $or: [
          { homeClub: { $in: clubs } },
          { awayClub: { $in: clubs } }
        ],
      });
    }

    if (league) {
      Object.assign(parsedSearch, {
        league,
      });
    }

    if (leagueTiers.length) {
      const leagues = await League.find({ tier: { $in: leagueTiers } });

      Object.assign(parsedSearch, {
        league: { $in: leagues },
      });
    }

    // TODO: Refactor into proper conditional pipeline
    let matches;
    let allCount = null;
    if (radius && radiusFrom) {
      matches = await Match.find(
        parsedSearch,
        null,
        queryOptions,
      )
        .where('location')
        .near({
          center: {
            coordinates: [parseFloat(radiusFrom.longitude), parseFloat(radiusFrom.latitude)],
            type: 'Point',
          },
          maxDistance: radius * 1000,
        })
        .populate('homeClub')
        .populate('awayClub')
        .populate('league')
    } else {
      matches = await Match.find(
        parsedSearch,
        null,
        queryOptions,
      )
        .populate('homeClub')
        .populate('awayClub')
        .populate('league');

      allCount = await Match.countDocuments(parsedSearch);
    }

    const response = {
      data: matches,
    };

    if (Number.isInteger(allCount)) {
      Object.assign(response, {
        allCount,
      });
    }

    ctx.body = response;
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
