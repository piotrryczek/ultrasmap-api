import method90Minut from './methods/90minut';
import method90MinutPucharPolski from './methods/90minutPucharPolski';

const getDownloadMethod = (method) => {
  switch (method) {
    case '90minut': return method90Minut;
    case '90minutPucharPolski': return method90MinutPucharPolski;
    default: return null;
  }
};

export default (downloadMethod, downloadUrl, dataType, additional) => {
  const methods = getDownloadMethod(downloadMethod);

  const method = dataType === 'clubs' ? methods.clubs : methods.matches;

  return method(downloadUrl, additional);
};
