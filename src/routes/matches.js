import Router from 'koa-router';

import MatchesController from '@controllers/matchesController';
import { retrieveUser, hasCredential, queryStringMiddleware } from '@utilities/middlewares';

const router = new Router({ prefix: '/matches' });

router.get(
  '/',
  queryStringMiddleware,
  MatchesController.list,
);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateMatch'),
  MatchesController.add,
);
router.patch(
  '/recalculate',
  retrieveUser,
  hasCredential('updateMatch'),
  MatchesController.recalculate,
);
router.put(
  '/:matchId',
  retrieveUser,
  hasCredential('updateMatch'),
  MatchesController.update,
);
router.delete(
  '/',
  retrieveUser,
  hasCredential('updateMatch'),
  MatchesController.bulkRemove,
);

export default router;
