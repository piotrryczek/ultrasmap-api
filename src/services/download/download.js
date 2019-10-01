import method90Minut from './methods/90minut';

const getDownloadMethod = (method) => {
  switch (method) {
    case '90minut': return method90Minut;
    default: return null;
  }
};

export default (downloadMethod, downloadUrl, dataType, additional) => {
  const methods = getDownloadMethod(downloadMethod);

  const method = dataType === 'clubs' ? methods.clubs : methods.matches;

  return method(downloadUrl, additional);
};
