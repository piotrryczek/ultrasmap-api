/**
 * TODO:
 * - suggestion
 */

import md5 from 'md5';
import axios from 'axios';

import Club from '@models/club';
import User from '@models/user';
import Role from '@models/role';
import Suggestion from '@models/suggestion';

class MockData {
  roles = {};

  apiUrl = 'http://localhost:3000';

  postData = (url, data) => {
    return axios.post(`${this.apiUrl}${url}`, data, {
      headers: {
        Authorization: `Bearer ${this.adminToken}`,
      },
    });
  }

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
        'restoreBackup',
      ],
    };

    const moderatorRole = {
      name: 'moderator',
      credentials: [
        'updateClub',
        'getSuggestion',
        'addSuggestion',
        'updateSuggestion'
      ],
    };

    const userRole = {
      name: 'user',
      credentials: [
        'addSuggestion',
      ],
    }

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

    const { data: { data } } = await axios.post(`${this.apiUrl}/users/login`, {
      email: 'admin@ultrasmap.pl',
      password: 'admin12',
    });

    this.adminToken = data;
  }

  insertClubs = async () => {
    const legiaWarszawa = {
      name: 'Legia Warszawa',
      logo: 'legia.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    };

    const { data: { data: legiaWarszawaId } } = await this.postData('/clubs', legiaWarszawa);

    const olimpiaElblag = {
      name: 'Olimpia Elbląg',
      logo: 'olimpia.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      friendships: [legiaWarszawaId],
    };

    await this.postData('/clubs', olimpiaElblag);

    const zaglebieSosnowiec = {
      name: 'Zagłębie Sosnowiec',
      logo: 'zaglebie.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      friendships: [legiaWarszawaId],
    };

    await this.postData('/clubs', zaglebieSosnowiec);

    const radomiakRadom = {
      name: 'Radomiak Radom',
      logo: 'radomiak.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      friendships: [legiaWarszawaId],
    };

    await this.postData('/clubs', radomiakRadom);

    const pogonSzczecin = {
      name: 'Pogoń Szczecin',
      logo: 'pogon.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      positives: [legiaWarszawaId]
    };

    await this.postData('/clubs', pogonSzczecin);

    const widzewLodz = {
      name: 'Widzew Łódź',
      logo: 'widzew.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
    };

    const { data: { data: widzewLodzId } } = await this.postData('/clubs', widzewLodz);

    const ruchChorzow = {
      name: 'Ruch Chorzów',
      logo: 'ruch.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      friendships: [widzewLodzId],
    };

    const { data: { data: ruchChorzowId } } = await this.postData('/clubs', ruchChorzow);

    const wislaKrakow = {
      name: 'Wisła Kraków',
      logo: 'wisla.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      agreements: [widzewLodzId, ruchChorzowId],
    };

    await this.postData('/clubs', wislaKrakow);

    const granatSkarzysko = {
      name: 'Granat Skarżysko Kamienna',
      logo: 'granat.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      satelliteOf: widzewLodzId,
    };

    const { data: { data: granatSkarzyskoId } } = await this.postData('/clubs', granatSkarzysko);

    const starStarachowice = {
      name: 'Star Starachowice',
      logo: 'star.png',
      tier: 1,
      location: {
        type: 'Point',
        coordinates: [5, 5],
      },
      satelliteOf: widzewLodzId,
      friendships: [granatSkarzyskoId],
    };

    await this.postData('/clubs', starStarachowice);
  }

  insertSuggestions = async () => {

  }
}

export default new MockData();
