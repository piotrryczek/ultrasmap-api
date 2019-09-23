/* eslint-disable no-underscore-dangle */
import _cloneDeep from 'lodash/cloneDeep';
import { __ } from 'i18n';

import { PER_PAGE } from '@config/config';
import Suggestion from '@models/suggestion';
import Activity from '@models/activity';
import Role from '@models/role';
import Club from '@models/club';

import EmailSender from '@services/emailSender';
import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';
import ImageUpload from '@services/imageUpload';

class SuggestionsController {
  getPaginated = async (ctx) => {
    const { queryParsed } = ctx;
    const {
      page = 1,
      type,
      status = 'pending',
    } = queryParsed;

    const criteria = {
      status,
    };

    if (type) {
      Object.assign(criteria, {
        type,
      });
    }

    const suggestions = await Suggestion
      .find(
        criteria,
        null,
        {
          skip: (page - 1) * PER_PAGE,
          limit: PER_PAGE,
        },
      )
      .sort({ createdAt: 'descending' })
      .populate('user')
      .populate('original')
      .populate({
        path: 'original',
        populate: {
          path: 'friendships',
        },
      })
      .populate({
        path: 'original',
        populate: {
          path: 'agreements',
        },
      })
      .populate({
        path: 'original',
        populate: {
          path: 'positives',
        },
      })
      .populate({
        path: 'original',
        populate: {
          path: 'enemies',
        },
      })
      .populate({
        path: 'original',
        populate: {
          path: 'satellites',
        },
      })
      .populate({
        path: 'original',
        populate: {
          path: 'satelliteOf',
        },
      })
      .populate('data.friendships')
      .populate('data.agreements')
      .populate('data.positives')
      .populate('data.enemies')
      .populate('data.satellites')
      .populate('data.satelliteOf');

    const allCount = await Suggestion.countDocuments(criteria);

    ctx.body = {
      data: suggestions,
      allCount,
    };
  }

  add = async (ctx) => {
    const {
      user,
      req: {
        file,
        body,
      },
    } = ctx;

    const {
      type,
      clubId,
      data,
      initialComment = null,
    } = body;

    const parsedData = JSON.parse(data);

    const { name } = parsedData;

    if (type === 'new') {
      const isClubWithName = await Club.findOne({ name });
      if (isClubWithName) throw new ApiError(errorCodes.ClubWithNameExists);
    }

    Object.assign(parsedData, {
      location: {
        type: 'Point',
        coordinates: parsedData.coordinates,
      },
    });

    if (file) {
      const logoUrl = await ImageUpload.upload(file);

      Object.assign(parsedData, {
        logo: logoUrl,
      });
    }

    const comments = initialComment ? [initialComment] : [];

    const newSuggestion = new Suggestion({
      type,
      original: clubId,
      data: parsedData,
      comments,
      user,
    });

    await newSuggestion.validate();
    await newSuggestion.save();

    ctx.body = {
      success: true,
    };
  }

  updateStatus = async (ctx) => {
    const {
      user,
      request: {
        body: {
          status,
        },
      },
      params: {
        suggestionId,
      },
    } = ctx;

    const suggestionToBeUpdated = await Suggestion.findById(suggestionId).populate('user');
    const updatedSuggestionCopy = _cloneDeep(suggestionToBeUpdated);

    Object.assign(suggestionToBeUpdated, {
      status,
    });

    await suggestionToBeUpdated.save();

    if (status === 'applied') {
      const {
        user: {
          email,
          chosenLanguage,
        },
      } = suggestionToBeUpdated;
      const clubName = await suggestionToBeUpdated.getClubName();

      const activity = new Activity({
        user,
        originalObject: null,
        objectType: 'suggestion',
        actionType: 'apply',
        before: updatedSuggestionCopy,
        after: null,
      });

      await activity.save();

      EmailSender.sendEmail({
        to: email,
        subject: __({ phrase: 'suggestionAppliedEmail.title', locale: chosenLanguage }),
        html: __({ phrase: 'suggestionAppliedEmail.content', locale: chosenLanguage }, clubName),
      });
    }

    ctx.body = {
      success: true,
    };
  }

  remove = async (ctx) => {
    const {
      user,
      params: {
        suggestionId,
      },
      request: {
        body: {
          withMute,
        },
      },
    } = ctx;

    const suggestionToBeRemoved = await Suggestion.findById(suggestionId);

    if (withMute) {
      const { credentials: userCredentials } = user;
      const suggestionUser = await suggestionToBeRemoved.getUser();
      const suggestionUserCopy = _cloneDeep(suggestionUser);
      const roles = await Role.find({});

      const suggestionUserRoleId = suggestionUser.role.toString();
      const userRoleId = roles.find(role => role.name === 'user')._id.toString();
      const userDisabledRoleId = roles.find(role => role.name === 'userDisabled')._id.toString();

      if ( // Moderators can only mute users (not other moderators)
        (suggestionUserRoleId !== userRoleId && suggestionUserRoleId !== userDisabledRoleId)
        && !userCredentials.includes('updateUser')
      ) {
        throw new ApiError(errorCodes.NotAuthorized);
      }

      Object.assign(suggestionUser, {
        role: userDisabledRoleId,
      });

      await suggestionUser.save();

      const activityUpdatingUser = new Activity({
        user,
        originalObject: null,
        objectType: 'user',
        actionType: 'update',
        before: suggestionUserCopy,
        after: suggestionUser,
      });

      await activityUpdatingUser.save();

      const userSuggestions = await Suggestion.find({
        user: suggestionUser,
      });

      await Promise.all(userSuggestions.map(suggestion => new Promise(async (resolve, reject) => {
        try {
          const activity = new Activity({
            user,
            originalObject: null,
            objectType: 'suggestion',
            actionType: 'remove',
            before: suggestion,
            after: null,
          });

          await activity.save();

          resolve();
        } catch (error) {
          reject(new ApiError(errorCodes.Internal, error));
        }
      })));

      await Suggestion.deleteMany({
        user: suggestionUser,
      });

      const { email, chosenLanguage } = suggestionUser;
      EmailSender.sendEmail({
        to: email,
        subject: __({ phrase: 'userDisabledEmail.title', locale: chosenLanguage }),
        html: __({ phrase: 'userDisabledEmail.content', locale: chosenLanguage }),
      });
    } else {
      const suggestionToBeRemovedCopy = _cloneDeep(suggestionToBeRemoved);
      await suggestionToBeRemoved.remove();

      const activity = new Activity({
        user,
        originalObject: null,
        objectType: 'suggestion',
        actionType: 'remove',
        before: suggestionToBeRemovedCopy,
        after: null,
      });

      await activity.save();
    }

    ctx.body = {
      success: true,
    };
  }

  bulkRemove = async (ctx) => {
    const {
      user,
      request: {
        body: {
          ids,
        },
      },
    } = ctx;

    const removePromises = ids.map(id => new Promise(async (resolve, reject) => {
      try {
        const suggestion = await Suggestion.findById(id); // Because of firing middleware
        const suggestionCopy = _cloneDeep(suggestion);
        await suggestion.remove();

        const activity = new Activity({
          user,
          originalObject: null,
          objectType: 'suggestion',
          actionType: 'remove',
          before: suggestionCopy,
          after: null,
        });

        await activity.save();

        resolve();
      } catch (error) {
        reject(new ApiError(errorCodes.Internal, error));
      }
    }));

    await Promise.all(removePromises);

    ctx.body = {
      success: true,
    };
  }

  addComment = async (ctx) => {
    const {
      params: {
        suggestionId,
      },
      request: {
        body,
      },
    } = ctx;

    const { authorId, text } = body;

    if (!authorId || !text) throw new ApiError(errorCodes.incompleteSuggestionComment);

    const suggestionToBeUpdated = await Suggestion.findById(suggestionId);
    const { comments } = suggestionToBeUpdated;

    Object.assign(suggestionToBeUpdated, {
      comments: [...comments, {
        author: authorId,
        text,
      }],
    });

    await suggestionToBeUpdated.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new SuggestionsController();
