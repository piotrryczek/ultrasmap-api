import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import db from '@config/db';

import { errorHandler } from '@utilities/middlewares';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

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

app.use(errorHandler);

app.on('error', (error) => {
  console.log(error);
});

app.use(router());

export default app;
