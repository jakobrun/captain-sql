import { useInMemoryDb, connect as connectToDb } from 'node-jt400';
import { defer } from 'q';
import { createWriteStream } from 'fs';
import { createFakedata } from './fakedata'
import * as JSONStream from 'JSONStream';
import { exportSchema } from './export-schema';

function connection(db, settings) {
  let statement;
  return {
    settings: function () {
      return settings;
    },
    execute: function (sqlStatement) {
      const buffer: any[] = [];

      //close previous statement
      if (statement) {
        statement.close();
        statement = undefined;
      }

      return db.execute(sqlStatement).then(function (st) {
        statement = st;
        return {
          isQuery: st.isQuery,
          metadata: st.metadata,
          updated: st.updated,
          query: function () {
            let deffered = defer();
            const stream = st.asStream({
              bufferSize: 130
            }).pipe(JSONStream.parse([true]));

            stream.on('data', function (data) {
              buffer.push(data);
              if (buffer.length >= 131) {
                deffered.fulfill({
                  data: buffer.splice(0, 131),
                  more: function () {
                    stream.resume();
                    deffered = defer();
                    return deffered.promise;
                  }
                });
                stream.pause();
              }
            });

            stream.on('end', function () {
              statement = undefined;
              deffered.fulfill({
                data: buffer
              });
            });

            stream.on('error', (err) => deffered.reject(err));
            return deffered.promise;
          }
        };
      });
    },
    close: function () {
      db.close();
    },
    exportSchemaToFile: function (opt) {
      const stream = exportSchema(db, opt);
      stream.pipe(createWriteStream(opt.file));
      stream.on('end', () => console.log('schema to file done'));
      return stream;
    }
  };
}

export function connect(options, settings) {

  console.log('connecting...');
  if (options.host === 'hsql:inmemory') {
    const db = useInMemoryDb();
    return createFakedata(db).then(function () {
      console.log('connected to inmemory hsql!!');
      return connection(db, settings);
    }, function () {
      //ignore error
      return connection(db, settings);
    });
  } else {
    return connectToDb(options).then(function (conn) {
      console.log('connected!!');
      return connection(conn, settings);
    });
  }
}
