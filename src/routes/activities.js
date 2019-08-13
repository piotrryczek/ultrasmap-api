import Router from 'koa-router';

import ActivitiesController from '@controllers/activitiesController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/activities' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getActivities'),
  ActivitiesController.getPaginated,
);

export default router;
