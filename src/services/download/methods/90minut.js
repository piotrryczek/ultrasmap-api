import $ from 'cheerio';
import { promisify } from 'util';
import request from 'request';
import iconv from 'iconv-lite';
import moment from 'moment';
import 'moment/locale/pl';

moment.locale('pl');
const requestPromisify = promisify(request);

/* --------------- */
/* Clubs */
/* --------------- */
const clubs = async (url, additional = {}) => {

  const { body } = await requestPromisify(url, {
    encoding: null,
  });
  
  const html = iconv.decode(Buffer.from(body), 'ISO-8859-2');

  const base$ = $.load(html);

  const rows = base$('.main2').first().find('tbody tr').not(':nth-child(1), :nth-child(2), :nth-child(3), :nth-child(4)');
  
  const clubsNames = rows.map((_, row) => $(row)
    .find('td')
    .eq(1)
    .find('a')
    .text()).get();

  return clubsNames;
};


/* --------------- */
/* Matches */
/* --------------- */
const SEASON_MONTH_UNTIL = 7; // july (season last matches in may/june, first july)
const SEASON_START_YEAR = 2019;
const SEASON_END_YEAR = 2020;

/**
 * @description
 * accepted format:
 * D MMMM, HH:mm (fe. 22 września, 11:00)
 */
const getMatchDate = (date) => {
  const dateMoment = moment(date, 'D MMMM, HH:mm');
  const month = dateMoment.format('M');

  const year = month >= SEASON_MONTH_UNTIL ? SEASON_START_YEAR : SEASON_END_YEAR;

  const finalDate = `${year} ${date}`;
  const finalDateMoment = moment(finalDate, 'YYYY D MMMM, HH:mm');

  return finalDateMoment.format('x'); // Timestamp
};

/**
 * @description Retrieving beginning date of the round date(s)
 * accepted formats:
 * Day-Day Month (fe. 24-25 sierpnia)
 * Day Month-Day Month (fe. 31 sierpnia-1 września)
 * Day Month (fe. 24 sierpnia)
 */
const parseHeaderRoundDate = (date) => {
  // If second date should be taken into account
  // const parts = date.split('-');
  // const endDate = parts.length === 1 ? date : parts[1];

  // return endDate;

  // If first date should be taken into account
  const parts = date.split('-');
  const beginDate = parts.length === 1 ? date : parts[0];

  const finalBeginDate = beginDate.length === 1 || beginDate.length === 2
    ? `${beginDate} ${parts[1].split(' ')[1]}`
    : beginDate;

  return finalBeginDate;
};

const getUpcomingRoundHeader = (headers, dateToCompare) => {
  const dateToCompareMoment = moment(dateToCompare);

  // const dateToCompareMoment = moment('2019-09-27 12:21');

  let upcomingRoundHeader = null;
  headers.each((index, header) => {
    const headerDate = $(header).find('table > tbody > tr:first-child > td:first-child b u').text().split(' - ')[1];
    
    const parsedDate = parseHeaderRoundDate(headerDate);

    const dateMoment = moment(parsedDate, 'D MMMM');
    const month = dateMoment.format('M');

    const year = month >= SEASON_MONTH_UNTIL ? SEASON_START_YEAR : SEASON_END_YEAR;

    const finalDate = `${year} ${parsedDate}`;
    const finalDateMoment = moment(finalDate, 'YYYY D MMMM');

    const isAfter = dateToCompareMoment.isAfter(finalDateMoment);
    if (!isAfter) {
      upcomingRoundHeader = header;
      return false;
    }
  });

  return upcomingRoundHeader;
};

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

  const roundHeaders = paragraphs.filter((_, paragraph) => {
    const headerText = $(paragraph).find('table > tbody > tr:first-child > td:first-child b u').text();

    if (headerText.includes('Kolejka')) {
      const parts = headerText.split(' - '); // Split between (Kolejka X - Date)

      if (parts.length > 1) return true;
    }

    return false;
  });

  const upcomingRoundHeader = getUpcomingRoundHeader(roundHeaders, date);

  const roundMatches = $(upcomingRoundHeader)
    .next('p')
    .find('table tbody tr')
    .filter((_, row) => $(row).find('td').length === 4)
    .map((_, row) => {
      const columns = $(row).find('td');

      const homeClub = columns.eq(0).text().trim();
      const awayClub = columns.eq(2).text().trim();
      const matchDate = columns.eq(3).text().trim();

      if (!matchDate) return null;

      return {
        homeClub,
        awayClub,
        date: getMatchDate(matchDate),
      };
    })
    .get();

  return roundMatches.filter(match => !!match);
};

export default {
  clubs,
  matches,
}