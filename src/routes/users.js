import Router from 'koa-router';

import AuthController from '@controllers/authController';
import UsersController from '@controllers/usersController';
import { retrieveUser, hasCredential, isNotLogged, queryStringMiddleware } from '@utilities/middlewares';

const router = new Router({ prefix: '/users' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getUser'),
  queryStringMiddleware,
  UsersController.getPaginated,
);
router.get(
  '/emailExists',
  UsersController.emailExists,
);
router.get(
  '/adminsAndModerators',
  retrieveUser,
  hasCredential('getUser'),
  UsersController.getAdminAndModerators,
);
router.get(
  '/:userId',
  retrieveUser,
  hasCredential('getUser'),
  UsersController.get,
);
router.post(
  '/register',
  isNotLogged,
  AuthController.register,
);
router.patch(
  '/verify',
  isNotLogged,
  AuthController.verify,
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
  '/',
  retrieveUser,
  hasCredential('updateUser'),
  UsersController.bulkRemove,
);
router.delete(
  '/:userId',
  retrieveUser,
  hasCredential('updateUser'),
  UsersController.remove,
);
router.patch(
  '/updateLanguage',
  retrieveUser,
  UsersController.updateLanguage,
);

export default router;
