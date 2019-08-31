export default {
  Internal: {
    status: 500,
    type: 'INTERNAL',
    message: 'Internal problem with server',
  },
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
  UserNotVerified: {
    status: 403,
    type: 'USER_NOT_VERIFIED',
    message: 'User has not been verified',
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
  incompleteSuggestionComment: {
    status: 409,
    type: 'INCOMPLETE_SUGGESTION_COMMENT',
    message: 'Author or/and comment text does not exist',
  },
  incorrectMockPassword: {
    status: 403,
    type: 'INCORRECT_MOCK_PASSWORD',
    message: 'Incorrect mock password',
  },
  mockDisabled: {
    status: 403,
    type: 'MOCK_DISABLED',
    message: 'Mocking data is disabled',
  },
  UserNotItself: {
    status: 403,
    type: 'USER_NOT_ITSELF',
    message: 'User which trying to be updated is not the same as user trying to perform action',
  },
};
