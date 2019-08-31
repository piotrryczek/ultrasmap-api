import Router from 'koa-router';
import { __ } from 'i18n';

const router = new Router({ prefix: '/app' });

router.get('/status', (ctx) => {
  ctx.body = { success: true };
});

export default router;
