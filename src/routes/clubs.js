import Router from 'koa-router';

import ClubsController from '@controllers/clubsController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/clubs' });

router.get('/abc', (ctx) => { ctx.body = { data: 'odpowiedz' }; });
router.get('/', ClubsController.getPaginated);
router.get('/:clubId', ClubsController.get);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateClub'),
  ClubsController.add,
);
router.put(
  '/:clubId',
  retrieveUser,
  hasCredential('updateClub'),
  ClubsController.update,
);
router.delete(
  '/:clubId',
  retrieveUser,
  hasCredential('updateClub'),
  ClubsController.remove,
);

export default router;
