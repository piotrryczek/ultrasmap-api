/**
 * TODO:
 * - extend activity tests
 */

import * as http from 'http';
import supertest from 'supertest';

import '@config/env.testing';

import Activity from '@models/Activity';
import Mock from '@services/mockData';

import app from '../app';

const request = supertest(http.createServer(app.callback()));

describe('Activity', () => {
  let jwt;

  beforeAll(async () => {
    await Mock.clearAll();
    await Mock.insertRoles();
    await Mock.insertUsers();

    ({ body: { data: jwt } } = await request.post('/users/login').send({
      email: 'admin@ultrasmap.pl',
      password: 'admin12',
    }));
  });

  it('Add club', async (done) => {
    const newClubObj = {
      name: 'Club #1',
      logo: 'club1.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    };

    const { body: { data: newClubId } } = await request
      .post('/clubs')
      .set('Authorization', `Bearer ${jwt}`)
      .send(newClubObj);

    const actvity = await Activity.findOne({
      objectType: 'club',
      actionType: 'add',
      originalObject: newClubId,
    });

    expect(actvity).not.toBeNull();

    done();
  });
});
