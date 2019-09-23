import Router from 'koa-router';

import ClubsController from '@controllers/clubsController';
import { retrieveUser, hasCredential, queryStringMiddleware } from '@utilities/middlewares';
import upload from '@utilities/multer';

const router = new Router({ prefix: '/clubs' });

router.get('/', queryStringMiddleware, ClubsController.getPaginated);
router.get('/geo', queryStringMiddleware, ClubsController.getWithinArea);
router.post('/possibleRelations', ClubsController.getPossibleRelations); // POST because of query string limit
router.get('/randomClubId', ClubsController.getRandomClubId);
router.get('/estimateAttitude/:firstClubId/:secondClubId', ClubsController.estimateAttitude);
router.get('/:clubId', ClubsController.get);
router.get(
  '/:clubId/activities',
  retrieveUser,
  hasCredential('getActivity'),
  ClubsController.getActivities,
);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateClub'),
  upload.single('newLogo'),
  ClubsController.add,
);
router.post(
  '/byNames',
  retrieveUser,
  hasCredential('updateClub'),
  ClubsController.addByNames,
);
router.put(
  '/:clubId',
  retrieveUser,
  hasCredential('updateClub'),
  upload.single('newLogo'),
  ClubsController.update,
);
// Currently unused
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
