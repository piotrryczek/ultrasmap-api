import Router from 'koa-router';

import AuthController from '@controllers/authController';
import ClubsController from '@controllers/clubsController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/clubs' });

router.get('/', ClubsController.getAll);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateClub'),
  ClubsController.add,
);

export default router;
