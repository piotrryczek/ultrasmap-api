import jwt from 'jsonwebtoken';
import md5 from 'md5';
import { v4 } from 'uuid';

import User from '@models/user';
import Role from '@models/role';
import EmailSender from '@services/emailSender';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class AuthController {
  register = async (ctx) => {
    const { body } = ctx.request;

    const { email, password } = body;

    const isUserWithEmail = await User.findOne({ email });

    if (isUserWithEmail) throw new ApiError(errorCodes.UserWithEmailExists);

    const hashedPassword = md5(password);

    const verificationCode = v4().replace(new RegExp('-', 'g'), '');

    const userRole = await Role.findOne({ name: 'user' });

    await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      role: userRole,
    });

    await EmailSender.sendEmail({
      to: email,
      subject: 'UltrasMap: Potwierdź swój email',
      html: `<a href="${process.env.APP_URL}/confirm?code=${verificationCode}">Kliknij ten link</a>`,
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
    }).populate('role');

    if (!user) throw new ApiError(errorCodes.AuthenticationFailed);
    if (!user.verified) throw new ApiError(errorCodes.UserNotVerified);

    const token = jwt.sign({
      data: {
        email,
      },
    }, process.env.JWT_SECRET);

    const {
      role: {
        credentials,
      },
    } = user;

    ctx.body = {
      data: token,
      credentials,
    };
  }

  verify = async (ctx) => {
    const {
      body: {
        verificationCode,
      }
    } = ctx.request;

    const user = await User.findOne({
      verificationCode,
    });

    if (!user) throw new ApiError(errorCodes.UserNotExists);

    Object.assign(user, {
      verified: true,
    });

    await user.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new AuthController();
