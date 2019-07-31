import Router from 'koa-router';

const router = new Router({ prefix: '/activities' });

router.get('/', async (ctx, next) => {
  ctx.body = 'Activity Get';
});

export default router;
