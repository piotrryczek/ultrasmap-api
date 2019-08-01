import md5 from 'md5';

import { PER_PAGE } from '@config/config';

import User from '@models/user';
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
    const { page } = query;

    const users = await User.find(
      null,
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    );

    ctx.body = {
      data: users,
    };
  }

  add = async (ctx) => {
    const { body } = ctx.request;
    const {
      name,
      email,
      password,
      role,
    } = body;

    const isUserWithEmail = User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const user = new User({
      name,
      email,
      password: md5(password),
      role,
    });

    await user.validate();
    const { _id: newUserId } = await user.save();

    ctx.body = {
      success: newUserId,
    };
  }

  update = async (ctx) => {
    const { params, request } = ctx;
    const { body } = request;
    const { userId } = params;

    const {
      name,
      email,
      role,
    } = body;

    const isUserWithEmail = await User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const user = await User.findById(userId);

    if (!user) throw new ApiError(errorCodes.UserNotExists);

    Object.assign(user, {
      name,
      email,
      role,
    });

    await user.validate();
    await user.save();

    ctx.body = {
      success: true,
    };
  }

  remove = async (ctx) => {
    const { params } = ctx;
    const { userId } = params;

    await User.findByIdAndRemove(userId);

    ctx.body = {
      success: true,
    };
  }
}

export default new UsersController();
