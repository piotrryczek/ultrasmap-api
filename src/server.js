/**
 * TODO:
 * - reseting password
 * - removing files while deleting club
 * - removing suggestions from user while removing it
 */

import '@config/env';
import cronManager from '@services/cronManager';
import app from './app';

app.listen(5000, () => {
  cronManager.initBackups();
  cronManager.initSuggestionsSummary();
});
