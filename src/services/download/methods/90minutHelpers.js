import $ from 'cheerio';
import moment from 'moment';
import 'moment/locale/pl';

moment.locale('pl');

const SEASON_MONTH_UNTIL = 7; // july (season last matches in may/june, first july)
const SEASON_START_YEAR = 2019;
const SEASON_END_YEAR = 2020;

/**
 * @description
 * accepted format:
 * D MMMM, HH:mm (fe. 22 września, 11:00)
 */
export const getMatchDate = (date) => {
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
export const parseHeaderRoundDate = (date) => {
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

export const getUpcomingRoundHeader = (headers, dateToCompare) => {
  const dateToCompareMoment = moment(dateToCompare);

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

export const getMatchesFromHeader = upcomingRoundHeader => $(upcomingRoundHeader)
  .next('p')
  .find('table tbody tr')
  .filter((_, row) => $(row).find('td').length === 4)
  .map((_, row) => {
    const columns = $(row).find('td');

    const homeClubName = columns.eq(0).text().trim();
    const awayClubName = columns.eq(2).text().trim();
    const matchDate = columns.eq(3).text().trim();

    if (!matchDate) return null;

    return {
      homeClubName,
      awayClubName,
      date: getMatchDate(matchDate),
    };
  })
  .get();
