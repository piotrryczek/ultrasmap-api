import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import mount from 'koa-mount';
import compress from 'koa-compress';
import helmet from 'koa-helmet';

import db from '@config/db';

import { errorHandler } from '@utilities/middlewares';

import router from './routes';

db.on('error', () => {
  console.log('Mongoose connection error');
});

const app = new Koa();
app.use(compress());
app.use(helmet());
app.use(cors());
app.use(bodyParser());

app.use(errorHandler);

app.on('error', (error) => {
  console.log(error);
});

app.use(mount('/images', serve('./uploads')));
app.use(router());


export default app;
