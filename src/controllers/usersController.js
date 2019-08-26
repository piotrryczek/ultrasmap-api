import md5 from 'md5';
import _cloneDeep from 'lodash/cloneDeep';

import { PER_PAGE } from '@config/config';
import { parseSearchQuery, singleUserRemove } from '@utilities/helpers';

import User from '@models/user';
import Activity from '@models/activity';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class UsersController {
  get = async (ctx) => {
    const { params } = ctx;
    const { userId } = params;

    const user = await User.findById(userId, '-password').populate('role');

    ctx.body = {
      data: user,
    };
  }

  getPaginated = async (ctx) => {
    const { query } = ctx;
    const {
      page = 1,
      search = '{}',
    } = query;

    const parsedSearch = parseSearchQuery(JSON.parse(search));

    const users = await User.find(
      parsedSearch,
      '-password',
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    ).populate('role');

    const allCount = await User.countDocuments(parsedSearch);

    ctx.body = {
      data: users,
      allCount,
    };
  }

  add = async (ctx) => {
    const { user, request } = ctx;
    const { body } = request;
    const {
      email,
      password,
      role,
    } = body;

    const isUserWithEmail = await User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const newUser = new User({
      email,
      password: md5(password),
      role,
    });

    await newUser.validate();
    const { _id: newUserId } = await newUser.save();

    const activity = new Activity({
      user,
      originalObject: newUser,
      objectType: 'user',
      actionType: 'add',
      before: null,
      after: newUser,
    });

    await activity.save();

    ctx.body = {
      data: newUserId,
    };
  }

  update = async (ctx) => {
    const { params, request, user } = ctx;
    const { body } = request;
    const { userId } = params;

    const {
      email,
      role,
      password = null,
    } = body;

    const userToBeUpdated = await User.findById(userId);

    if (!userToBeUpdated) throw new ApiError(errorCodes.UserNotExists);

    const isUserWithEmail = await User.findOne({ email });

    if (isUserWithEmail && userToBeUpdated.email !== email) throw new ApiError(errorCodes.UserWithEmailExists);

    const userToBeUpdatedOriginal = _cloneDeep(userToBeUpdated);

    Object.assign(userToBeUpdated, {
      email,
      role,
    });

    if (password) {
      Object.assign(userToBeUpdated, {
        password: md5(password),
      });
    }

    await userToBeUpdated.validate();
    await userToBeUpdated.save();

    const activity = new Activity({
      user,
      originalObject: userToBeUpdated,
      objectType: 'user',
      actionType: 'update',
      before: userToBeUpdatedOriginal,
      after: userToBeUpdated,
    });

    await activity.save();

    ctx.body = {
      success: true,
    };
  }

  remove = async (ctx) => {
    const { params, user } = ctx;
    const { userId } = params;

    await singleUserRemove(user, userId);

    ctx.body = {
      success: true,
    };
  }

  bulkRemove = async (ctx) => {
    const {
      user,
      request: {
        body,
      },
    } = ctx;
    const { ids } = body;

    const removePromises = ids.map(userId => new Promise(async (resolve, reject) => {
      try {
        await singleUserRemove(user, userId);

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    }));

    await Promise.all(removePromises);

    ctx.body = {
      success: true,
      data: ids,
    };
  }
}

export default new UsersController();
