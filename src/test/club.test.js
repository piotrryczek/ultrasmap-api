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

    expect(convertObjectsIdsToStrings(firstClubFriendships).sort()).toEqual([clubIds[1], clubIds[3]].sort());
    expect(convertObjectsIdsToStrings(secondClubFriendships)).toEqual([clubIds[0]]);
    expect(convertObjectsIdsToStrings(thirdClubFriendships)).toEqual([]);
    expect(convertObjectsIdsToStrings(fourthClubFriendships)).toEqual([clubIds[0]]);

    done();
  });

  it('Clear friendships and set Club #1 satellites [Club #2], Club #3 satellites [Club #4]', async (done) => {
    const { body: { data: firstClubData } } = await request.get(`/clubs/${clubIds[0]}`);
    const { body: { data: secondClubData } } = await request.get(`/clubs/${clubIds[1]}`);
    const { body: { data: thirdClubData } } = await request.get(`/clubs/${clubIds[2]}`);
    const { body: { data: fourthClubData } } = await request.get(`/clubs/${clubIds[3]}`);

    Object.assign(firstClubData, {
      friendships: [],
    });

    Object.assign(secondClubData, {
      friendships: [],
    });

    Object.assign(thirdClubData, {
      friendships: [],
    });

    Object.assign(fourthClubData, {
      friendships: [],
    });

    await request
      .put(`/clubs/${clubIds[0]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(firstClubData);

    await request
      .put(`/clubs/${clubIds[1]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(secondClubData);

    await request
      .put(`/clubs/${clubIds[2]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(thirdClubData);

    await request
      .put(`/clubs/${clubIds[3]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(fourthClubData);

    // Satellites updates
    const updatedFirstClubData = Object.assign({}, firstClubData, {
      satellites: [clubIds[1]],
    });

    await request
      .put(`/clubs/${clubIds[0]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(updatedFirstClubData);

    const updatedThirdClubData = Object.assign({}, thirdClubData, {
      satellites: [clubIds[3]],
    });

    await request
      .put(`/clubs/${clubIds[2]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(updatedThirdClubData);

    const { body: { data: newFirstClubData } } = await request.get(`/clubs/${clubIds[0]}`);
    const { body: { data: newSecondClubData } } = await request.get(`/clubs/${clubIds[1]}`);
    const { body: { data: newThirdClubData } } = await request.get(`/clubs/${clubIds[2]}`);
    const { body: { data: newFourthClubData } } = await request.get(`/clubs/${clubIds[3]}`);

    expect(convertObjectsIdsToStrings(newFirstClubData.satellites)).toEqual([clubIds[1]]);
    expect(newSecondClubData.satelliteOf.toString()).toEqual(clubIds[0]);
    expect(convertObjectsIdsToStrings(newThirdClubData.satellites)).toEqual([clubIds[3]]);
    expect(newFourthClubData.satelliteOf.toString()).toEqual(clubIds[2]);

    done();
  });

  it('Edit satelliteOf should implicate change in satellites of object: Club #2 satelliteOf Club #3', async (done) => {
    const { body: { data: secondClubData } } = await request.get(`/clubs/${clubIds[1]}`);

    const updatedSecondClubData = Object.assign({}, secondClubData, {
      satelliteOf: clubIds[2],
    });

    await request
      .put(`/clubs/${clubIds[1]}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send(updatedSecondClubData);

    const { body: { data: firstClubData } } = await request.get(`/clubs/${clubIds[0]}`);
    const { body: { data: thirdClubData } } = await request.get(`/clubs/${clubIds[2]}`);

    expect(convertObjectsIdsToStrings(firstClubData.satellites)).toEqual([]);
    expect(convertObjectsIdsToStrings(thirdClubData.satellites).sort()).toEqual([clubIds[1], clubIds[3]].sort());

    done();
  });
});
