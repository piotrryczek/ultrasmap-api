import md5 from 'md5';

import User from '@models/user';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class UsersController {
  getAll = (ctx) => {

  }

  add = async (ctx) => {
    const { body } = ctx.request;
    const {
      name,
      email,
      password,
      role,
    } = body;

    const isFoundUser = User.findOne({ email });

    if (isFoundUser) throw new ApiError(errorCodes.UserExists);

    const user = new User();

    Object.assign(user, {
      name,
      email,
      password: md5(password),
      role,
    });

    await user.validate();
    await user.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new UsersController();
