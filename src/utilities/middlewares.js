import jwt from 'jsonwebtoken';

import User from '@models/user';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

export const isNotLogged = async (ctx, next) => {
  const { authorization } = ctx.headers;

  if (authorization) throw new ApiError(errorCodes.AuthorizationTokenExists);

  await next();
};

export const retrieveUser = async (ctx, next) => {
  const { authorization } = ctx.headers;

  if (!authorization.startsWith('Bearer ')) throw new ApiError(errorCodes.JWTToken);

  const [, token] = authorization.split(' ');

  const decodedToken = jwt.decode(token);

  if (!decodedToken) throw new ApiError(errorCodes.JWTToken);

  const { data: { email } } = decodedToken;

  if (!email) throw new ApiError(errorCodes.JWTToken);

  const user = await User.findOne({ email }).populate('role');

  if (!user) throw new ApiError(errorCodes.UserNotExists);

  Object.assign(ctx, {
    user,
  });

  await next();
};

export const hasCredential = credential => async (ctx, next) => {
  const { role: { credentials } } = ctx.user;

  if (!credentials.includes(credential)) throw new ApiError(errorCodes.NotAuthorized);

  await next();
};
