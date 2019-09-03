import Router from 'koa-router';

import AdministrationController from '@controllers/AdministrationController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/administration' });

router.use(retrieveUser);

router.patch(
  '/searchNames',
  hasCredential('administrationTools'),
  AdministrationController.generateSearchNames,
);

export default router;
