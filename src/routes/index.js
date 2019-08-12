import combineRouters from 'koa-combine-routers';

import userRoutes from './users';
import clubRoutes from './clubs';
import suggestionRoutes from './suggestions';
import activityRoutes from './activities';
import mockRoutes from './mock';
import backupsRoutes from './backups';

export default combineRouters(
  userRoutes,
  clubRoutes,
  suggestionRoutes,
  activityRoutes,
  mockRoutes,
  backupsRoutes,
);
