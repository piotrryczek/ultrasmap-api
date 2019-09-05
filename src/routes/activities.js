import Router from 'koa-router';

import ActivitiesController from '@controllers/activitiesController';
import { retrieveUser, hasCredential, queryStringMiddleware } from '@utilities/middlewares';

const router = new Router({ prefix: '/activities' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getActivity'),
  queryStringMiddleware,
  ActivitiesController.getPaginated,
);

export default router;
