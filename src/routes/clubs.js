import Router from 'koa-router';

import ClubsController from '@controllers/clubsController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';
import upload from '@utilities/multer';

const router = new Router({ prefix: '/clubs' });

router.get('/', ClubsController.getPaginated);
router.get('/possibleRelations', ClubsController.getPossibleRelations);
router.get('/:clubId', ClubsController.get);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateClub'),
  upload.single('newLogo'),
  ClubsController.add,
);
router.put(
  '/:clubId',
  retrieveUser,
  hasCredential('updateClub'),
  upload.single('newLogo'),
  ClubsController.update,
);
router.delete(
  '/:clubId',
  retrieveUser,
  hasCredential('updateClub'),
  ClubsController.remove,
);
router.delete(
  '/',
  retrieveUser,
  hasCredential('updateUser'),
  ClubsController.bulkRemove,
);

export default router;
