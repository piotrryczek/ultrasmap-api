import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import db from '@config/db';
import router from './routes';

db.on('error', () => {
  console.log('Mongoose connection error');
});
db.once('open', () => {
  console.log('Mongoose connected');
});

const app = new Koa();
app.use(cors());
app.use(bodyParser());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const { status, type, message } = error;

    ctx.status = status || 500;
    ctx.body = {
      message,
      type,
    };

    app.emit('error', error);
  }
});

app.on('error', (error) => {
  console.log(error);
});

app.use(router());

export default app;
