import Router from 'koa-router';

const router = new Router({ prefix: '/suggestions' });

router.get('/', async (ctx, next) => {
  ctx.body = 'Suggestion Get';
});

export default router;
