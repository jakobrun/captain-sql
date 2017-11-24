import { useInMemoryDb, connect as connectToDb } from 'node-jt400';
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
            return new Promise((resolve, reject) => {
              let currentResolve = resolve
              let currentReject = reject
              const handleError = (err) => currentReject(err)
              const stream = st.asStream({
                bufferSize: 130
              })
              .on('error', handleError)
              .pipe(JSONStream.parse([true]))
              .on('error', handleError);
  
              stream.on('data', function (data) {
                buffer.push(data);
                if (buffer.length >= 131) {
                  stream.pause();
                  currentResolve({
                    data: buffer.splice(0, 131),
                    more: function () {
                      stream.resume();
                      return new Promise((resolve, reject) => {
                        currentResolve = resolve
                        currentReject = reject
                      })
                    }
                  });
                }
              });
  
              stream.on('end', function () {
                statement = undefined;
                currentResolve({
                  data: buffer
                });
              });
  
            })
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
