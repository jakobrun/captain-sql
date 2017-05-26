import * as q from 'q';
import { writeFile, readFile }
  from 'fs';

export function getHistoryModel(options) {
  let buffer: any[] = [];
  let promise = q();
  const fileName = process.env.HOME + '/.gandalf/' + options.file;
  const history = {
    push: function (item) {
      promise = promise.then(function () {
        buffer.splice(0, 0, item);
        if (buffer.length > options.max) {
          buffer = buffer.slice(0, options.min);
        }
        return q.nfcall(writeFile, fileName, buffer.map(obj => JSON.stringify(obj)).join(','));
      });
      return promise;
    },
    list: () => buffer
  };
  return q.nfcall(readFile, fileName).then(function (content) {
    buffer = JSON.parse('[' + content + ']');
    return history;
  }, function () {
    return history;
  });
}
