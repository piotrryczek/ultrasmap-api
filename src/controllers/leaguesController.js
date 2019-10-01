import { promisify } from 'util';
import request from 'request';

import { PER_PAGE } from '@config/config';

import Club from '@models/club';
import League from '@models/league';
import Match from '@models/match';

import { getRelationsToEdit } from '@utilities/helpers';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';
import download from '@services/download/download';
import estimateClubsAttitude from '@utilities/estimation/estimateClubsAttitude';

const requestPromisify = promisify(request);

class LeaguesController {
  get = async (ctx) => {
    const { params } = ctx;
    const { leagueId } = params;

    const league = await League.findById(leagueId).populate('clubs');

    ctx.body = {
      data: league,
    };
  }

  getAll = async (ctx) => {
    const leagues = await League.find({});

    ctx.body = {
      data: leagues,
    };
  }

  getPaginated = async (ctx) => {
    const { queryParsed } = ctx;
    const { page = 1 } = queryParsed;

    const leagues = await League.find({}, {},
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      });

    const allCount = await League.countDocuments({});

    ctx.body = {
      data: leagues,
      allCount,
    };
  }

  add = async (ctx) => {
    const {
      request: {
        body: {
          name,
          downloadMethod,
          downloadUrl,
          clubs = [],
          importanceModifier,
          sport,
          tier,
          isAutomaticDownload,
        },
      },
    } = ctx;

    const league = new League({
      name,
      downloadMethod,
      downloadUrl,
      clubs,
      importanceModifier,
      sport,
      tier,
      isAutomaticDownload,
    });

    await league.validate();
    const { _id: newLeagueId } = await league.save();

    if (clubs.length) {
      await Club.updateMany(
        {
          _id: { $in: clubs },
        },
        {
          $set: {
            league: newLeagueId,
          },
        },
      );
    }

    ctx.body = {
      data: newLeagueId,
    };
  }

  update = async (ctx) => {
    const {
      params: {
        leagueId,
      },
      request: {
        body: {
          name,
          downloadMethod,
          downloadUrl,
          clubs = [],
          importanceModifier,
          sport,
          tier,
          isAutomaticDownload,
        },
      },
    } = ctx;

    const league = await League.findById(leagueId);
    const { clubs: prevClubs } = league;

    Object.assign(league, {
      name,
      downloadMethod,
      downloadUrl,
      clubs,
      importanceModifier,
      sport,
      tier,
      isAutomaticDownload,
    });

    await league.validate();

    const prevClubsIds = prevClubs.map(({ _id: clubId }) => clubId.toString());

    const {
      toAdd: clubsToAdd,
      toRemove: clubsToRemove,
    } = getRelationsToEdit(prevClubsIds, clubs);

    if (clubsToAdd.length) {
      // Removing from other leagues as club can be in only one league
      await League.updateMany(
        {},
        {
          $pullAll: {
            clubs: clubsToAdd,
          },
        },
      );

      // Upadting all clubs with new league
      await Club.updateMany(
        {
          _id: { $in: clubs },
        },
        {
          $set: {
            league: leagueId,
          },
        },
      );
    }

    if (clubsToRemove.length) {
      // Clearing league if club has been removed from league
      await Club.updateMany(
        {
          _id: { $in: clubsToRemove },
        },
        {
          $set: {
            league: null,
          },
        },
      );
    }

    await league.save();

    ctx.body = {
      success: true,
    };
  }

  bulkRemove = async (ctx) => {
    const {
      // user,
      request: {
        body: {
          ids,
        },
      },
    } = ctx;

    await Promise.all(ids.map(id => new Promise(async (resolve, reject) => {
      try {
        const league = await League.findById(id);
        const { clubs } = league;

        await league.remove();

        await Club.updateMany(
          {
            _id: { $in: clubs },
          },
          {
            $set: {
              league: null,
            },
          },
        );

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    ctx.body = {
      success: true,
    };
  }

  downloadMatches = async (ctx) => {
    const {
      params: {
        leagueId,
      },
      request: {
        body: {
          date = Date.now(), // TODO: Przetestuj
        },
      },
    } = ctx;

    const league = await League.findById(leagueId);

    const {
      downloadMethod,
      downloadUrl,
    } = league;

    const matches = await download(downloadMethod, downloadUrl, 'matches', {
      date,
    });
    
    await Promise.all(matches.map(({ homeClub, awayClub, date: matchDateTimestamp }) => new Promise(async (resolve, reject) => {
      try {
        const maybeFoundHomeClub = await Club.findByName(homeClub);
        const maybeFoundAwayClub = await Club.findByName(awayClub);

        if (!maybeFoundHomeClub && !maybeFoundAwayClub) resolve();

        const finalDate = new Date(parseInt(matchDateTimestamp, 10));

        const isHomeClubReserve = maybeFoundHomeClub !== null && maybeFoundHomeClub.isReserve;
        const isAwayClubReserve = maybeFoundAwayClub !== null && maybeFoundAwayClub.isReserve;

        const result = await estimateClubsAttitude({
          firstClubId: maybeFoundHomeClub === null ? null : maybeFoundHomeClub.club._id.toString(),
          secondClubId: maybeFoundAwayClub === null ? null : maybeFoundAwayClub.club._id.toString(),
          isFirstClubReserve: isHomeClubReserve,
          isSecondClubReserve: isAwayClubReserve,
          league,
        });

        const {
          importance,
          attitude,
          level,
        } = result;

        const location = maybeFoundHomeClub ? maybeFoundHomeClub.club.location : null;

        const match = new Match({
          homeClub: maybeFoundHomeClub ? maybeFoundHomeClub.club : null,
          isHomeClubReserve,
          unimportantHomeClubName: maybeFoundHomeClub ? '' : homeClub,
          awayClub: maybeFoundAwayClub ? maybeFoundAwayClub.club : null,
          isAwayClubReserve,
          unimportantAwayClubName: maybeFoundAwayClub ? '' : awayClub,
          importance,
          attitude,
          league: leagueId,
          date: finalDate,
          attitudeEstimationLevel: level,
          location,
        });

        await match.save();

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    })));

    ctx.body = {
      data: matches,
    };
  }

  downloadClubs = async (ctx) => {
    const {
      params: {
        leagueId,
      },
    } = ctx;

    const { downloadMethod, downloadUrl } = await League.findById(leagueId);

    const clubsNames = await download(downloadMethod, downloadUrl, 'clubs');

    const clubs = await Promise.all(clubsNames.map(clubName => new Promise(async (resolve, reject) => {
      try {
        const club = await Club.findByName(clubName);

        resolve(club)
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }      
    })));

    ctx.body = {
      data: clubs.filter(club => !!club),
    };
  }
}

export default new LeaguesController();
