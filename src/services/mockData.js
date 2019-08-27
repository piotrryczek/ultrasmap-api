/**
 * TODO:
 * - suggestion
 */

// ZACZYNAMY OD TEGO DLACZEGO TRACIMY SATELITE

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
        'getActivity',
        'regenerateImages',
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

    const userDisabledRole = {
      name: 'userDisabled',
      credentials: [
        'getClub',
      ],
    };

    const roles = [adminRole, moderatorRole, userRole, userDisabledRole];

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
      verified: true,
    };

    const moderator = {
      name: 'moderator',
      email: 'moderator@ultrasmap.pl',
      password: md5('moderator12'),
      role: this.roles.moderator,
      verified: true,
    };

    const user1 = {
      name: 'user1',
      email: 'user1@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
      verified: true,
    };

    const user2 = {
      name: 'user2',
      email: 'user2@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
      verified: true,
    };

    const user3 = {
      name: 'user3',
      email: 'user3@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
      verified: true,
    };

    const user4 = {
      name: 'user4',
      email: 'user4@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
      verified: true,
    };

    const users = [admin, moderator, user1, user2, user3, user4];

    this.users = await User.insertMany(users);
  }

  insertClubs = async () => {
    const legiaWarszawa = new Club({
      name: 'Legia Warszawa',
      logo: 'legia_warszawa.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [52.2240298487845, 21.0043334960938],
      },
    });

    const olimpiaElblag = new Club({
      name: 'Olimpia Elbląg',
      logo: 'olimpia_elblag.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [54.1507888138239, 19.4085693359375],
      },
    });

    const zaglebieSosnowiec = new Club({
      name: 'Zagłębie Sosnowiec',
      logo: 'zaglebie_sosnowiec.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [50.2871622295774, 19.1201782226563],
      },
    });

    const radomiakRadom = new Club({
      name: 'Radomiak Radom',
      logo: 'radomiak_radom.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [51.4107869228815, 21.14990234375],
      },
    });

    const pogonSzczecin = new Club({
      name: 'Pogoń Szczecin',
      logo: 'pogon_szczecin.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [53.4238704988048, 14.5416259765625],
      },
    });

    const widzewLodz = new Club({
      name: 'Widzew Łódź',
      logo: 'widzew_lodz.jpg',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [51.7619065082185, 19.5067596435547],
      },
    });

    const ruchChorzow = new Club({
      name: 'Ruch Chorzów',
      logo: 'ruch_chorzow.jpg',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [50.3011993720648, 18.9553833007813],
      },
    });

    const wislaKrakow = new Club({
      name: 'Wisła Kraków',
      logo: 'wisla_krakow.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [50.0478968281156, 19.94140625],
      },
    });

    const granatSkarzysko = new Club({
      name: 'Granat Skarżysko Kamienna',
      logo: 'granat_skarzysko_kamienna.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [51.1048316572674, 20.8518981933594],
      },
    });

    const starStarachowice = new Club({
      name: 'Star Starachowice',
      logo: 'star_starachowice.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [51.0323428818477, 21.0743713378906],
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

    Object.assign(radomiakRadom, {
      friendships: [legiaWarszawa],
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
      // ruchChorzow,
      wislaKrakow,
      granatSkarzysko,
      starStarachowice,
    ] = this.clubs;

    const newSuggestionForLechPoznan = new Suggestion({
      type: 'new',
      original: null,
      data: {
        name: 'Lech Poznań',
        logo: 'lech.png',
        tier: 1,
        location: {
          type: 'Point',
          coordinates: [5, 5],
        },
        friendships: [legiaWarszawa],
        friendshipsToCreate: ['Arka Gdynia', 'KSZO Ostrowiec Świętokrzyski', 'ŁKS Łódź', 'Cracovia Kraków'],
        agreements: [pogonSzczecin],
        agreementsToCreate: [],
        positives: [],
        positivesToCreate: ['Zagłębie Lubin', 'Górnik Zabrze', 'Wisła Kraków'],
        satelliteOf: wislaKrakow,
      },
      user: this.users[3],
    });

    const editSuggestionForLegiaWarszawa = new Suggestion({
      type: 'edit',
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
      user: this.users[4],
    });

    const editSuggestionForStarStarachowice = new Suggestion({
      type: 'edit',
      original: starStarachowice,
      data: {
        name: 'Star Starachowice modified',
        logo: 'star.png',
        tier: 1,
        location: {
          type: 'Point',
          coordinates: [5, 5],
        },
        friendshipsToCreate: [],
        friendships: [granatSkarzysko],
        positivesToCreate: [],
        positives: [],
        agreementsToCreate: [],
        agreements: [],
        satellites: [],
        satellitesToCreate: [],
        satelliteOfToCreate: null,
        satelliteOf: radomiakRadom,
      },
      user: this.users[3],
    });

    const editSuggestionForStarStarachowice2 = new Suggestion({
      type: 'edit',
      original: starStarachowice,
      data: {
        name: 'Star Starachowice modified',
        logo: 'star.png',
        tier: 1,
        location: {
          type: 'Point',
          coordinates: [5, 5],
        },
        friendshipsToCreate: [],
        friendships: [granatSkarzysko],
        positivesToCreate: [],
        positives: [],
        agreementsToCreate: [],
        agreements: [],
        satellites: [],
        satellitesToCreate: [],
        satelliteOfToCreate: null,
        satelliteOf: widzewLodz,
      },
      user: this.users[5],
    });

    const editSuggestionForGranatSkarzysko = new Suggestion({
      type: 'edit',
      original: granatSkarzysko,
      data: {
        name: 'Granat Skarżysko Kamienna',
        logo: 'granat.png',
        tier: 1,
        location: {
          type: 'Point',
          coordinates: [5, 5],
        },
        friendshipsToCreate: ['Korona Kielce'],
        friendships: [starStarachowice, widzewLodz],
        positivesToCreate: [],
        positives: [],
        agreementsToCreate: [],
        agreements: [],
        satellites: [zaglebieSosnowiec],
        satellitesToCreate: ['Proch Pionki'],
        satelliteOfToCreate: 'Motor Lublin',
        satelliteOf: null,
      },
      user: this.users[4],
    });

    await Promise.all([
      editSuggestionForStarStarachowice2.save(),
      editSuggestionForGranatSkarzysko.save(),
      newSuggestionForLechPoznan.save(),
      editSuggestionForLegiaWarszawa.save(),
      editSuggestionForStarStarachowice.save(),
    ]);
  }
}

export default new MockData();
