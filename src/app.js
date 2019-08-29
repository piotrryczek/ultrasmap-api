import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import mount from 'koa-mount';
import compress from 'koa-compress';
import helmet from 'koa-helmet';

import logger from '@services/logger';
import db from '@config/db';
import { errorHandler } from '@utilities/middlewares';

import router from './routes';

db.on('error', (error) => {
  logger.error(`Mongoose connection error: ${error}`);
});

const app = new Koa();
app.use(compress());
app.use(helmet());
app.use(cors());
app.use(bodyParser());

app.use(errorHandler);

app.on('error', (error) => {
  logger.error(error);
});

app.use(mount('/images', serve(`${process.cwd()}/uploads`)));
app.use(router());


export default app;
