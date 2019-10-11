import Router from 'koa-router';

import { googleMapsSearchForAddress } from '@utilities/helpers';
import { queryStringMiddleware } from '@utilities/middlewares';

const router = new Router({ prefix: '/utilities' });

router.get(
  '/address',
  queryStringMiddleware,
  async (ctx) => {
    const { queryParsed } = ctx;

    const { address } = queryParsed;

    const location = await googleMapsSearchForAddress(address);

    ctx.body = {
      data: location,
    };
  }
);

export default router;
