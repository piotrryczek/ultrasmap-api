import Router from 'koa-router';

import LeaguesController from '@controllers/leaguesController';
import { retrieveUser, hasCredential, queryStringMiddleware } from '@utilities/middlewares';

const router = new Router({ prefix: '/leagues' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getLeague'),
  queryStringMiddleware,
  LeaguesController.getPaginated,
);
router.get(
  '/all',
  retrieveUser,
  hasCredential('getLeague'),
  LeaguesController.getAll,
);
router.get(
  '/:leagueId',
  retrieveUser,
  hasCredential('getLeague'),
  queryStringMiddleware,
  LeaguesController.get,
);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateLeague'),
  LeaguesController.add,
);
router.post(
  '/downloadMatches',
  retrieveUser,
  hasCredential('updateLeague'),
  LeaguesController.downloadMatchesForAll,
);
router.put(
  '/:leagueId',
  retrieveUser,
  hasCredential('updateLeague'),
  LeaguesController.update,
);
router.delete(
  '/',
  retrieveUser,
  hasCredential('updateLeague'),
  LeaguesController.bulkRemove,
);
router.post(
  '/:leagueId/downloadMatches',
  retrieveUser,
  hasCredential('updateLeague'),
  LeaguesController.downloadMatches,
);
router.get(
  '/:leagueId/downloadClubs',
  retrieveUser,
  hasCredential('updateLeague'),
  LeaguesController.downloadClubs,
);

export default router;
