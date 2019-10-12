import Country from '@models/country';

// import ApiError from '@utilities/apiError';
// import errorCodes from '@config/errorCodes';

class CountriesController {
  getAll = async (ctx) => {
    const countries = await Country.find({});

    ctx.body = {
      data: countries,
    };
  }

  add = async (ctx) => {
    const {
      request: {
        body: {
          name,
        },
      },
    } = ctx;

    const country = new Country({
      name,
    });

    await country.validate();
    const { _id: newCountryId } = await country.save();

    ctx.body = {
      data: newCountryId,
    };
  }

  
}

export default new CountriesController();
