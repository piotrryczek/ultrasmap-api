import Router from 'koa-router';

import MockController from '@controllers/mockController';
import { checkMockPassword } from '@utilities/middlewares';

const router = new Router({ prefix: '/mock' });

router.post(
  '/',
  checkMockPassword,
  MockController.insertData,
);

export default router;
