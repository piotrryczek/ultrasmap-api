import md5 from 'md5';
import _cloneDeep from 'lodash/cloneDeep';

import { PER_PAGE } from '@config/config';
import { parseSearchQuery } from '@utilities/helpers';

import User from '@models/user';
import Activity from '@models/activity';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class UsersController {
  get = async (ctx) => {
    const { params } = ctx;
    const { userId } = params;

    const user = await User.findById(userId).populate('role');

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
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    ).populate('role', 'name');

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
      name,
      email,
      password,
      role,
    } = body;

    const isUserWithEmail = User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const newUser = new User({
      name,
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
      success: newUserId,
    };
  }

  update = async (ctx) => {
    const { params, request, user } = ctx;
    const { body } = request;
    const { userId } = params;

    const {
      name,
      email,
      role,
    } = body;

    const isUserWithEmail = await User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const userToBeUpdated = await User.findById(userId);

    if (!userToBeUpdated) throw new ApiError(errorCodes.UserNotExists);

    const userToBeUpdatedOriginal = _cloneDeep(userToBeUpdated);

    Object.assign(userToBeUpdated, {
      name,
      email,
      role,
    });

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

    const userToBeRemoved = await User.findById(userId);
    const userToBeRemovedOriginal = _cloneDeep(userToBeRemoved);
    await userToBeRemoved.remove();

    const activity = new Activity({
      user,
      originalObject: null,
      objectType: 'user',
      actionType: 'remove',
      before: userToBeRemovedOriginal,
      after: null,
    });

    await activity.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new UsersController();
