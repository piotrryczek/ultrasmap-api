/**
 * TODO:
 * - suggestion
 */

import md5 from 'md5';

import Club from '@models/club';
import User from '@models/user';
import Role from '@models/role';
import Suggestion from '@models/suggestion';

class MockData {
  roles = {};

  insertAll = async () => {
    await this.clearAll();
    await this.insertRoles();
    await this.insertUsers();
    await this.insertClubs();
    // this.insertSuggestions();
  }

  clearAll = async () => {
    await Role.deleteMany({});
    await User.deleteMany({});
    await Club.deleteMany({});
    await Suggestion.deleteMany({});
  }

  insertRoles = async () => {
    const adminRole = {
      name: 'admin',
      credentials: [
        'getUser',
        'updateUser',
        'updateClub',
        'getSuggestion', // in admin panel
        'addSuggestion', // in frontend App by user
        'updateSuggestion',
        'mockData',
        'createBackup',
        'restoreBackup',
        'getBackup',
      ],
    };

    const moderatorRole = {
      name: 'moderator',
      credentials: [
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
        'addSuggestion',
      ],
    };

    const roles = [adminRole, moderatorRole, userRole];

    const insertedRoles = await Role.insertMany(roles);

    this.roles = insertedRoles.reduce((acc, role) => {
      const {
        name,
        _id: id,
      } = role;

      acc[name] = id;

      return acc;
    }, {});
  }

  insertUsers = async () => {
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

    const user = {
      name: 'user',
      email: 'user@ultrasmap.pl',
      password: md5('user12'),
      role: this.roles.user,
    };

    const users = [admin, moderator, user];

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
  }

  insertSuggestions = async () => {

  }
}

export default new MockData();
