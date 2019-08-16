import Router from 'koa-router';

import RolesController from '@controllers/rolesController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/roles' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getRole'),
  RolesController.list,
);

export default router;
