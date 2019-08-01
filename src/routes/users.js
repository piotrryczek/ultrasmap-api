import Router from 'koa-router';

import AuthController from '@controllers/authController';
import UsersController from '@controllers/usersController';
import { retrieveUser, hasCredential, isNotLogged } from '@utilities/middlewares';

const router = new Router({ prefix: '/users' });

router.get(
  '/:userId',
  retrieveUser,
  hasCredential('getUser'),
  UsersController.get,
);
router.get(
  '/',
  retrieveUser,
  hasCredential('getUser'),
  UsersController.getPaginated,
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
router.put(
  '/:userId',
  retrieveUser,
  hasCredential('updateUser'),
  UsersController.update,
);
router.delete(
  '/:userId',
  retrieveUser,
  hasCredential('updateUser'),
  UsersController.remove,
);

export default router;
