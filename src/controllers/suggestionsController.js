import _cloneDeep from 'lodash/cloneDeep';

import { suggestionStatuses, PER_PAGE } from '@config/config';
import Suggestion from '@models/suggestion';
import Activity from '@models/activity';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';

class SuggestionsController {
  getPaginated = async (ctx) => {
    const { query } = ctx;
    const {
      page = 1,
      status = suggestionStatuses.pending,
    } = query;

    const suggestions = await Suggestion.find(
      {
        status,
      },
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    );

    ctx.body = {
      data: suggestions,
    };
  }

  updateStatus = async (ctx) => {
    const {
      params: {
        suggestionId,
      },
      request: {
        body,
      },
    } = ctx;

    const { status } = body;

    await Suggestion.findByIdAndUpdate(
      suggestionId,
      {
        $set: {
          status,
        },
      },
      {
        new: true,
      },
    );

    ctx.body = {
      success: true,
    };
  }

  add = async (ctx) => {
    const { body } = ctx.request;

    const {
      type,
      objectDataBefore,
      objectDataAfter,
      initialComment = null,
    } = body;

    const comments = initialComment ? [initialComment] : [];

    const newSuggestion = new Suggestion({
      type,
      status: suggestionStatuses.pending,
      objectDataBefore,
      objectDataAfter,
      comments,
    });

    await newSuggestion.validate();
    await newSuggestion.save();

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
    } = ctx;

    const suggestionToBeRemoved = await Suggestion.findById(suggestionId);
    const suggestionToBeRemovedOriginal = _cloneDeep(suggestionToBeRemoved);
    await suggestionToBeRemoved.remove();

    const activity = new Activity({
      user,
      originalObject: null,
      objectType: 'suggestion',
      actionType: 'remove',
      before: suggestionToBeRemovedOriginal,
      after: null,
    });

    await activity.save();

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
