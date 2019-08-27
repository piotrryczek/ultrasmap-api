import _cloneDeep from 'lodash/cloneDeep';

import { PER_PAGE } from '@config/config';
import Suggestion from '@models/suggestion';
import Activity from '@models/activity';

import ApiError from '@utilities/apiError';
import errorCodes from '@config/errorCodes';
import ImageUpload from '@services/imageUpload';

class SuggestionsController {
  getPaginated = async (ctx) => {
    const { query } = ctx;
    const {
      page = 1,
      type,
    } = query;

    const criteria = {};

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

    // const activity = new Activity({
    //   user,
    //   originalObject: null,
    //   objectType: 'suggestion',
    //   actionType: 'remove',
    //   before: suggestionToBeRemovedOriginal,
    //   after: null,
    // });

    // await activity.save();

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

    await Suggestion.deleteMany({
      _id: { $in: ids },
    });

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
