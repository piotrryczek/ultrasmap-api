import jwt from 'jsonwebtoken';
import md5 from 'md5';

import User from '@models/user';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class AuthController {
  register = async (ctx) => {
    const { body } = ctx.request;

    const { name, email, password } = body;

    const isUserWithEmail = await User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const hashedPassword = md5(password);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    ctx.body = {
      success: true,
    };
  }

  login = async (ctx) => {
    const { body } = ctx.request;
    const { email, password } = body;

    const hashedPassword = md5(password);

    const user = await User.findOne({
      password: hashedPassword,
      email,
    });

    if (!user) throw new ApiError(errorCodes.AuthenticationFailed);

    const token = jwt.sign({
      data: {
        email,
      },
    }, process.env.JWT_SECRET);

    ctx.body = {
      data: token,
    };
  }
}

export default new AuthController();
