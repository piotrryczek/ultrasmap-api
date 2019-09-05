import Router from 'koa-router';

import SuggestionsController from '@controllers/suggestionsController';
import { retrieveUser, hasCredential, queryStringMiddleware } from '@utilities/middlewares';
import upload from '@utilities/multer';

const router = new Router({ prefix: '/suggestions' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getSuggestion'),
  queryStringMiddleware,
  SuggestionsController.getPaginated,
);
router.post(
  '/',
  retrieveUser,
  hasCredential('addSuggestion'),
  upload.single('newLogo'),
  SuggestionsController.add,
);
router.patch(
  '/:suggestionId/status',
  retrieveUser,
  hasCredential('updateSuggestion'),
  SuggestionsController.updateStatus,
);
router.patch(
  '/:suggestionId/addComment',
  retrieveUser,
  hasCredential('addSuggestion'),
  SuggestionsController.addComment,
);
router.delete(
  '/',
  retrieveUser,
  hasCredential('updateSuggestion'),
  SuggestionsController.bulkRemove,
);
router.delete(
  '/:suggestionId',
  retrieveUser,
  hasCredential('updateSuggestion'),
  SuggestionsController.remove,
);

export default router;
