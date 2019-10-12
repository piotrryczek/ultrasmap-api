import combineRouters from 'koa-combine-routers';

import appRoutes from './app';
import administrationRoutes from './administration';
import userRoutes from './users';
import clubRoutes from './clubs';
import suggestionRoutes from './suggestions';
import activityRoutes from './activities';
import roleRoutes from './roles';
import mockRoutes from './mock';
import backupsRoutes from './backups';
import uploadsRoutes from './uploads';
import leaguesRoutes from './leagues';
import matchesRoutes from './matches';
import countriesRoutes from './countries';
import utilitiesRoutes from './utilities';

export default combineRouters(
  appRoutes,
  administrationRoutes,
  userRoutes,
  clubRoutes,
  suggestionRoutes,
  activityRoutes,
  roleRoutes,
  mockRoutes,
  backupsRoutes,
  uploadsRoutes,
  leaguesRoutes,
  matchesRoutes,
  countriesRoutes,
  utilitiesRoutes,
);
