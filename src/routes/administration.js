import Router from 'koa-router';

import AdministrationController from '@controllers/administrationController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/administration' });

router.use(retrieveUser);

router.patch(
  '/searchNames',
  hasCredential('administrationTools'),
  AdministrationController.generateSearchNames,
);

router.patch(
  '/reverseGeo',
  hasCredential('administrationTools'),
  AdministrationController.reverseGeo,
);

export default router;
