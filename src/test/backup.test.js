import fs from 'fs';
import * as http from 'http';
import supertest from 'supertest';

import '@config/env.testing';
import Club from '@models/Club';
import Role from '@models/Role';
import User from '@models/User';

import app from '../app';

jest.setTimeout(30000);

const mockPassword = 'test12';

const request = supertest(http.createServer(app.callback()));

describe('Backup create and restore', () => {
  let jwt;
  let backupFileName = '';

  beforeAll(async () => {

    await request.post('/mock').send({
      password: mockPassword,
    });

    ({ body: { data: jwt } } = await request.post('/users/login').send({
      email: 'admin@ultrasmap.pl',
      password: 'admin12',
    }));
  });

  it('Create backup from Database', async (done) => {
    ({ body: { data: backupFileName } } = await request
      .post('/backups/create')
      .set('Authorization', `Bearer ${jwt}`)
      .send());

    const backupDataBufer = await fs.promises.readFile(`backups/${backupFileName}`);
    const backupData = JSON.parse(backupDataBufer);
    const {
      clubs: backupClubs,
      users: backupUsers,
      roles: backupRoles,
    } = backupData;

    const [dbClubs, dbUsers, dbRoles] = await Promise.all([Club.find({}), User.find({}), Role.find({})]);

    expect(JSON.stringify(dbClubs) === JSON.stringify(backupClubs)).toEqual(true);
    expect(JSON.stringify(dbUsers) === JSON.stringify(backupUsers)).toEqual(true);
    expect(JSON.stringify(dbRoles) === JSON.stringify(backupRoles)).toEqual(true);

    done();
  });

  it('Restore backup', async (done) => {
    const backupDataBufer = await fs.promises.readFile(`backups/${backupFileName}`);
    const backupData = JSON.parse(backupDataBufer);
    const {
      clubs: backupClubs,
      users: backupUsers,
      roles: backupRoles,
    } = backupData;

    await request
      .post('backups/restore')
      .set('Authorization', `Bearer ${jwt}`)
      .send({
        fileName: backupFileName,
      });

    const [dbClubs, dbUsers, dbRoles] = await Promise.all([Club.find({}), User.find({}), Role.find({})]);
 
    expect(JSON.stringify(dbClubs) === JSON.stringify(backupClubs)).toEqual(true);
    expect(JSON.stringify(dbUsers) === JSON.stringify(backupUsers)).toEqual(true);
    expect(JSON.stringify(dbRoles) === JSON.stringify(backupRoles)).toEqual(true);

    await fs.promises.unlink(`backups/${backupFileName}`);

    done();
  });
});
