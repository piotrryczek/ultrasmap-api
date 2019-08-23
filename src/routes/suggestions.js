import Router from 'koa-router';

import SuggestionsController from '@controllers/suggestionsController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/suggestions' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getSuggestion'),
  SuggestionsController.getPaginated,
);

router.post(
  '/',
  retrieveUser,
  hasCredential('addSuggestion'),
  SuggestionsController.add,
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
