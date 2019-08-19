/**
 * TODO:
 * - suggestion
 */

import md5 from 'md5';
import _isEmpty from 'lodash/isEmpty';

import Club from '@models/club';
import User from '@models/user';
import Role from '@models/role';
import Suggestion from '@models/suggestion';
import Activity from '@models/activity';

class MockData {
  roles = {};

  clubs = [];

  insertAll = async () => {
    await this.clearAll();
    await this.insertRoles();
    await this.insertUsers();
    await this.insertClubs();
    await this.insertSuggestions();
  }

  clearAll = async () => {
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Club.deleteMany({}),
      Suggestion.deleteMany({}),
      Activity.deleteMany({}),
    ]);
  }

  clearRoles = async () => {
    await Role.deleteMany({});
  }

  clearUsers = async () => {
    await User.deleteMany({});
  }

  clearClubs = async () => {
    await Club.deleteMany({});
  }

  clearSuggestions = async () => {
    await Suggestion.deleteMany({});
  }

  clearActivities = async () => {
    await Activity.deleteMany({});
  }

  getRoles = async () => {
    const adminRole = await Role.findOne({ name: 'admin' });
    const moderatorRole = await Role.findOne({ name: 'moderator' });
    const userRole = await Role.findOne({ name: 'user' });

    const roles = [adminRole, moderatorRole, userRole];

    this.roles = this.parseRoles(roles);
  }

  parseRoles = roles => roles.reduce((acc, role) => {
    const {
      name,
      _id: id,
    } = role;

    acc[name] = id;

    return acc;
  }, {});

  insertRoles = async () => {
    const adminRole = {
      name: 'admin',
      credentials: [
        'uploadFile',
        'getUser',
        'updateUser',
        'getRole',
        'getClub',
        'updateClub',
        'getSuggestion', // in admin panel
        'addSuggestion', // in frontend App by user
        'updateSuggestion',
        'mockData',
        'createBackup',
        'restoreBackup',
        'getBackup',
        'getActivitiy',
      ],
    };

    const moderatorRole = {
      name: 'moderator',
      credentials: [
        'uploadFile',
        'getClub',
        'updateClub',
        'getSuggestion',
        'addSuggestion',
        'updateSuggestion',
        'createBackup',
        'getBackup',
      ],
    };

    const userRole = {
      name: 'user',
      credentials: [
        'uploadFile',
        'getClub',
        'addSuggestion',
      ],
    };

    const roles = [adminRole, moderatorRole, userRole];

    const insertedRoles = await Role.insertMany(roles);

    this.roles = this.parseRoles(insertedRoles);
  }

  insertUsers = async () => {
    if (_isEmpty(this.roles)) await this.getRoles();

    const admin = {
      name: 'admin',
      email: 'admin@ultrasmap.pl',
      password: md5('admin12'),
      role: this.roles.admin,
    };

    const moderator = {
      name: 'moderator',
      email: 'moderator@ultrasmap.pl',
      password: md5('moderator12'),
      role: this.roles.moderator,
    };

    const user1 = {
      name: 'user1',
      email: 'user1@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
    };

    const user2 = {
      name: 'user2',
      email: 'user2@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
    };

    const user3 = {
      name: 'user3',
      email: 'user3@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
    };

    const user4 = {
      name: 'user4',
      email: 'user4@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
    };

    const users = [admin, moderator, user1, user2, user3, user4];

    await User.insertMany(users);
  }

  insertClubs = async () => {
    const legiaWarszawa = new Club({
      name: 'Legia Warszawa',
      logo: 'legia.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const olimpiaElblag = new Club({
      name: 'Olimpia Elbląg',
      logo: 'olimpia.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const zaglebieSosnowiec = new Club({
      name: 'Zagłębie Sosnowiec',
      logo: 'zaglebie.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const radomiakRadom = new Club({
      name: 'Radomiak Radom',
      logo: 'radomiak.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const pogonSzczecin = new Club({
      name: 'Pogoń Szczecin',
      logo: 'pogon.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const widzewLodz = new Club({
      name: 'Widzew Łódź',
      logo: 'widzew.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const ruchChorzow = new Club({
      name: 'Ruch Chorzów',
      logo: 'ruch.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const wislaKrakow = new Club({
      name: 'Wisła Kraków',
      logo: 'wisla.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const granatSkarzysko = new Club({
      name: 'Granat Skarżysko Kamienna',
      logo: 'granat.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    const starStarachowice = new Club({
      name: 'Star Starachowice',
      logo: 'star.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    });

    await Promise.all([
      legiaWarszawa.save(),
      olimpiaElblag.save(),
      zaglebieSosnowiec.save(),
      radomiakRadom.save(),
      pogonSzczecin.save(),
      widzewLodz.save(),
      ruchChorzow.save(),
      wislaKrakow.save(),
      granatSkarzysko.save(),
      starStarachowice.save(),
    ]);

    Object.assign(legiaWarszawa, {
      friendships: [olimpiaElblag, radomiakRadom, zaglebieSosnowiec],
      positives: [pogonSzczecin],
    });

    Object.assign(olimpiaElblag, {
      friendships: [legiaWarszawa, zaglebieSosnowiec],
    });

    Object.assign(zaglebieSosnowiec, {
      friendships: [legiaWarszawa, olimpiaElblag],
    });

    Object.assign(pogonSzczecin, {
      positives: [legiaWarszawa],
    });

    Object.assign(widzewLodz, {
      friendships: [ruchChorzow],
      agreements: [wislaKrakow],
      satellites: [granatSkarzysko, starStarachowice],
    });

    Object.assign(ruchChorzow, {
      friendships: [widzewLodz],
      agreements: [wislaKrakow],
    });

    Object.assign(wislaKrakow, {
      agreements: [widzewLodz, ruchChorzow],
    });

    Object.assign(granatSkarzysko, {
      satelliteOf: widzewLodz,
      friendships: [starStarachowice],
    });

    Object.assign(starStarachowice, {
      satelliteOf: widzewLodz,
      friendships: [granatSkarzysko],
    });

    this.clubs = await Promise.all([
      legiaWarszawa.save(),
      olimpiaElblag.save(),
      zaglebieSosnowiec.save(),
      radomiakRadom.save(),
      pogonSzczecin.save(),
      widzewLodz.save(),
      ruchChorzow.save(),
      wislaKrakow.save(),
      granatSkarzysko.save(),
      starStarachowice.save(),
    ]);
  }

  insertSuggestions = async () => {
    const [
      legiaWarszawa,
      olimpiaElblag,
      zaglebieSosnowiec,
      radomiakRadom,
      pogonSzczecin,
      widzewLodz,
      ruchChorzow,
      wislaKrakow,
      granatSkarzysko,
      starStarachowice,
    ] = this.clubs;

    // const newSuggestionForLechPoznan = new Suggestion({
    //   type: 'new',
    //   status: 'pending',
    //   original: null,
    //   data: {
    //     name: 'Lech Poznań',
    //     logo: 'lech.png',
    //     tier: 1,
    //     location: {
    //       type: 'Point',
    //       coordinates: [5, 5],
    //     },
    //     friendships: [],
    //     friendshipsToCreate: ['Arka Gdynia', 'KSZO Ostrowiec Świętokrzyski', 'ŁKS Łódź', 'Cracovia Kraków'],
    //     agreements: [],
    //     agreementsToCreate: [],
    //     positives: [],
    //     positivesToCreate: ['Zagłębie Lubin', 'Górnik Zabrze'],
    //   },
    // });

    const editSuggestionForLegiaWarszawa = new Suggestion({
      type: 'edit',
      status: 'pending',
      original: legiaWarszawa,
      data: {
        name: 'Legia Warszawa modified',
        logo: 'legia_modified.jpg',
        tier: 2,
        location: {
          type: 'Point',
          coordinates: [19, 19],
        },
        friendshipsToCreate: ['Pogoń Siedlce'],
        friendships: [olimpiaElblag, radomiakRadom, pogonSzczecin, widzewLodz],
        positivesToCreate: [],
        positives: [],
        agreementsToCreate: [],
        agreements: [],
        satellites: [],
        satellitesToCreate: ['Znicz Pruszków'],
        satelliteOfToCreate: null,
        satelliteOf: starStarachowice,
      },
    });

    await Promise.all([
      // newSuggestionForLechPoznan.save(),
      editSuggestionForLegiaWarszawa.save(),
    ]);
  }
}

export default new MockData();
