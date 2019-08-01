export default {
  JWTToken: {
    status: 500,
    type: 'JWT_TOKEN',
    message: 'Incorrect JWT Token',
  },
  AuthenticationFailed: {
    status: 403,
    type: 'LOGIN_FAILED',
    message: 'Authentication failed',
  },
  UserWithEmailExists: {
    status: 409,
    type: 'USER_WITH_EMAIL_EXISTS',
    message: 'User with this email already exists',
  },
  UserNotExists: {
    status: 403,
    type: 'USER_NOT_EXISTS',
    message: 'User not exists',
  },
  NotAuthorized: {
    status: 403,
    type: 'NOT_AUTHORIZED',
    message: 'User is not permitted to perform action',
  },
  AuthorizationTokenExists: {
    status: 409,
    type: 'AUTHORIZATION_TOKEN_EXISTS',
    message: 'User try to be logged in',
  },
  ClubWithNameExists: {
    status: 409,
    type: 'CLUB_WITH_NANE_EXISTS',
    message: 'Club with this name already exists',
  },
  RelationsNotUnique: {
    status: 409,
    type: 'RELATIONS_NOT_UNIQUE',
    message: 'Relations have to be unique, club cannot have two different relations to the same club',
  },
};
