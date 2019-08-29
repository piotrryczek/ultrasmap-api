import combineRouters from 'koa-combine-routers';

import appRoutes from './app';
import userRoutes from './users';
import clubRoutes from './clubs';
import suggestionRoutes from './suggestions';
import activityRoutes from './activities';
import roleRoutes from './roles';
import mockRoutes from './mock';
import backupsRoutes from './backups';
import uploadsRoutes from './uploads';

export default combineRouters(
  appRoutes,
  userRoutes,
  clubRoutes,
  suggestionRoutes,
  activityRoutes,
  roleRoutes,
  mockRoutes,
  backupsRoutes,
  uploadsRoutes,
);
