import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import mount from 'koa-mount';
import compress from 'koa-compress';
import helmet from 'koa-helmet';
import i18n from 'i18n';

import logger from '@services/logger';
import db from '@config/db';
import {
  errorHandler,
  corsHandler,
} from '@utilities/middlewares';

import router from './routes';

i18n.configure({
  locales: ['pl', 'en', 'ru'],
  directory: `${process.cwd()}/locales`,
});

db.on('error', (error) => {
  logger.error(`Mongoose connection error: ${error}`);
});

const app = new Koa();
app.use(compress());
app.use(helmet());
app.use(cors({ origin: corsHandler }));
app.use(bodyParser());

app.use(errorHandler);

app.on('error', (error) => {
  logger.error(error);
  console.log(error);
});

app.use(mount('/images', serve(`${process.cwd()}/uploads`)));
app.use(router());

export default app;
