import Router from 'koa-router';

import AuthController from '@controllers/authController';
import UsersController from '@controllers/usersController';
import { retrieveUser, hasCredential, isNotLogged } from '@utilities/middlewares';

const router = new Router({ prefix: '/users' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getUser'),
  UsersController.getAll,
);
router.post(
  '/register',
  isNotLogged,
  AuthController.register,
);
router.post(
  '/login',
  AuthController.login,
);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateUser'),
  UsersController.add,
);

export default router;
