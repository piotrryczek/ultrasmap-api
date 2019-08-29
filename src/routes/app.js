import Router from 'koa-router';

const router = new Router({ prefix: '/app' });

router.get('/status', (ctx) => {
  ctx.body = { success: true };
});

export default router;
