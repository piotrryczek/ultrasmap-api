import Router from 'koa-router';

const router = new Router({ prefix: '/relations' });

router.get('/', async (ctx, next) => {
  ctx.body = 'Relation Get';
});

export default router;
