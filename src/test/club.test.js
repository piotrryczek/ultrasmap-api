import * as http from 'http';
import supertest from 'supertest';
import md5 from 'md5';

import '@config/env.testing';

import Club from '@models/club';
import User from '@models/user';
import Role from '@models/role';

import { convertObjectsIdsToStrings } from '@utilities/helpers';

import app from '../app';

const request = supertest(http.createServer(app.callback()));

describe('POST /club', () => {
  let jwt;
  const clubIds = [];

  const clubFirstObj = {
    name: 'Club #1',
    logo: 'club1.png',
    tier: 1,
    location: {
      type: 'Point',
      coordinates: [5, 5],
    },
  };

  beforeAll(async () => {
    await Club.deleteMany({});
    await User.deleteMany({});

    const { _id: adminRoleId } = await Role.findOne({
      name: 'admin',
    });

    const adminUser = new User({
      name: 'admin',
      email: 'admin@admin.pl',
      password: md5('admin12'),
      role: adminRoleId,
    });

    await adminUser.save();

    ({ body: { data: jwt } } = await request.post('/users/login').send({
      email: 'admin@admin.pl',
      password: 'admin12',
    }));
  });

  it('Add Club #1, Club #2 (should be friends)', async (done) => {
    const { body: { data: clubFirstId } } = await request
      .post('/clubs')
      .set('Authorization', `Bearer ${jwt}`)
      .send(clubFirstObj);

    const { body: { data } } = await request.get(`/clubs/${clubFirstId}`);

    expect(data.name).toEqual(clubFirstObj.name);
    expect(data.logo).toEqual(clubFirstObj.logo);
    expect(data.tier).toEqual(clubFirstObj.tier);
    expect(data.location).toMatchObject(clubFirstObj.location);

    clubIds.push(clubFirstId);

    const clubSecondObj = {
      name: 'Club #2',
      logo: 'club2.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      friendships: [clubFirstId],
    };

    const { body: { data: clubSecondId } } = await request
      .post('/clubs')
      .set('Authorization', `Bearer ${jwt}`)
      .send(clubSecondObj);
      
    const { body: { data: firstClubData } } = await request.get(`/clubs/${clubFirstId}`);
    const { body: { data: secondClubData } } = await request.get(`/clubs/${clubSecondId}`);

    const { friendships: firstClubFriendships } = firstClubData;
    const { friendships: secondClubFriendships } = secondClubData;

    expect(convertObjectsIdsToStrings(firstClubFriendships)).toContain(clubSecondId);
    expect(firstClubFriendships.length).toEqual(1);
    expect(convertObjectsIdsToStrings(secondClubFriendships)).toContain(clubFirstId);
    expect(secondClubFriendships.length).toEqual(1);

    clubIds.push(clubSecondId);

    done();
  });

  it('Add Club #3 (friend with #1) and Club #4, then update Club #1 to be friends only with (Club #2 and Club #4)', async (done) => {
    const clubThirdObj = {
      name: 'Club #3',
      logo: 'club3.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      friendships: [clubIds[0]],
    };

    const clubFourthObj = {
      name: 'Club #4',
      logo: 'club4.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    };

    const { body: { data: clubThirdId } } = await request
      .post('/clubs')
      .set('Authorization', `Bearer ${jwt}`)
      .send(clubThirdObj);

    const { body: { data: clubFourthId } } = await request
      .post('/clubs')
      .set('Authorization', `Bearer ${jwt}`)
      .send(clubFourthObj);

    clubIds.push(clubThirdId);
    clubIds.push(clubFourthId);

    const updatedClubFirstObj = Object.assign({}, clubFirstObj, {
      friendships: [clubIds[1], clubIds[3]],
    });

    await request
      .put(`/clubs/${clubIds[0]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(updatedClubFirstObj);

    const { body: { data: firstClubData } } = await request.get(`/clubs/${clubIds[0]}`);
    const { body: { data: secondClubData } } = await request.get(`/clubs/${clubIds[1]}`);
    const { body: { data: thirdClubData } } = await request.get(`/clubs/${clubIds[2]}`);
    const { body: { data: fourthClubData } } = await request.get(`/clubs/${clubIds[3]}`);
    
    const { friendships: firstClubFriendships = [] } = firstClubData;
    const { friendships: secondClubFriendships = [] } = secondClubData;
    const { friendships: thirdClubFriendships = [] } = thirdClubData;
    const { friendships: fourthClubFriendships = [] } = fourthClubData;

    expect(convertObjectsIdsToStrings(firstClubFriendships)).toEqual([clubIds[1], clubIds[3]]);
    expect(convertObjectsIdsToStrings(secondClubFriendships)).toEqual([clubIds[0]]);
    expect(convertObjectsIdsToStrings(thirdClubFriendships)).toEqual([]);
    expect(convertObjectsIdsToStrings(fourthClubFriendships)).toEqual([clubIds[0]]);

    done();
  });
});
