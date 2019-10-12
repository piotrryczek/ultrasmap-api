import Router from 'koa-router';

import CountriesController from '@controllers/countriesController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';

const router = new Router({ prefix: '/countries' });

router.get(
  '/',
  retrieveUser,
  hasCredential('getCountry'),
  CountriesController.getAll,
);
router.post(
  '/',
  retrieveUser,
  hasCredential('updateCountry'),
  CountriesController.add,
);

export default router;
