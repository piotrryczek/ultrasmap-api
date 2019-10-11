import $ from 'cheerio';
import { promisify } from 'util';
import _uniqBy from 'lodash/uniqBy';
import request from 'request';
import iconv from 'iconv-lite';
import moment from 'moment';
import 'moment/locale/pl';

import { getUpcomingRoundHeader, getMatchesFromHeader } from './90minutHelpers';

moment.locale('pl');
const requestPromisify = promisify(request);


const matches = async (url, additional = {}) => {
  const { date } = additional;

  const { body } = await requestPromisify(url, {
    encoding: null,
  });

  const html = iconv.decode(Buffer.from(body), 'ISO-8859-2');

  const base$ = $.load(html);

  const containers = base$('td.main');

  const container = containers.filter((_, singleContainer) => $(singleContainer).find('#90minut_tabelawyniki_belka_gora').length)[0];

  const paragraphs = $(container).find('p');

  const headerCheckingRegex = new RegExp(/runda|finał/i);

  const roundHeaders = paragraphs.filter((_, paragraph) => {
    const headerText = $(paragraph).find('table > tbody > tr:first-child > td:first-child b u').text();

    if (headerText.match(headerCheckingRegex)) {
      const parts = headerText.split(' - '); // Split between (Kolejka X - Date)

      if (parts.length > 1) return true;
    }

    return false;
  });

  const upcomingRoundHeader = getUpcomingRoundHeader(roundHeaders, date);

  const roundMatches = getMatchesFromHeader(upcomingRoundHeader);

  return _uniqBy(roundMatches.filter(match => !!match), ({ homeClubName, awayClubName, date: matchDate }) => [homeClubName, awayClubName, matchDate].join());
};

export default {
  matches,
};