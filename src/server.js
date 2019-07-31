import dotenv from 'dotenv';
import Koa from 'koa';

dotenv.config({ path: '.env' });
const app = new Koa();

app.use((ctx) => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
