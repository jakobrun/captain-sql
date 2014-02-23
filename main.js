'use strict';
var connection = require('./js/remoteconnection'),
  fs = require('fs'),
  tables = [],
  settings = require(process.env.HOME + '/.gandalf/settings');

angular.module('gandalf', ['ngRoute'])
  .config(function($routeProvider) {
    $routeProvider.when('/', {
      controller: 'LoginCtrl',
      templateUrl: 'views/login.html'
    }).when('/sql', {
      controller: 'SqlCtrl',
      templateUrl: 'views/sql.html'
    }).otherwise({
      redirectTo: '/'
    });
  }).controller('LoginCtrl', function($scope, $location) {

    $scope.connections = settings.connections;

    $scope.login = function() {
      //Load schema
      tables = {};
      $scope.conn.schema.forEach(function(schemaFile) {
        fs.readFile(schemaFile, function(err, schema) {
          if (err) {
            console.log(err);
          } else {
            JSON.parse(schema).forEach(function(table) {
              tables[table.table] = table.columns.map(function(column) {
                return column.name;
              });
            });
          }
        });
      });

      //Connect
      connection.connect({
        host: $scope.conn.host,
        user: $scope.conn.user,
        password: $scope.password
      }).then(function() {
        $scope.$apply(function() {
          $location.path('/sql');
        });
      }).fail(function(err) {
        $scope.$apply(function() {
          $scope.errorMsg = err;
        });
      });

    };
  }).controller('SqlCtrl', function($scope) {

    $scope.status = 'connected!';
    var batchSize = 100;
    var sqlStream;

    //Run query
    var runQuery = function(editor) {
      var t = Date.now(),
        metaTime;
      if (sqlStream) {
        sqlStream.close();
      }
      $scope.$apply(function() {
        $scope.metadata = null;
        $scope.data = [];
        $scope.status = 'executing...';
      });

      sqlStream = connection.executeAsStream(editor.getValue(' '));

      var data = [];

      sqlStream.on('data', function(row) {
          if (!$scope.metadata) {
            metaTime = Date.now() - t;
            //Metadata
            $scope.metadata = row;
          } else {
            //data
            data.push(row);
          }
      });

      sqlStream.on('end', function() {
        var time = Date.now() - t;

        $scope.$apply(function() {
          $scope.data = data;
          $scope.status = 'done, time: (' + metaTime + ', ' + time + ')';
        });
      });

      //Error
      sqlStream.on('error', function(err) {
        $scope.$apply(function() {
          $scope.errorMsg = err.message;
        });
      });
    },
      assist = function() {
        CodeMirror.showHint(cm, null, {
          tables: tables
        });
      },
      cm = CodeMirror(document.getElementById('editor'), {
        value: 'SELECT * FROM ',
        mode: 'text/x-sql',
        lineNumbers: true,
        autofocus: true,
        theme: 'base16-dark',
        extraKeys: {
          'Ctrl-Enter': runQuery,
          'Ctrl-Space': assist
        }
      });
    $scope.columnWidth = function(index) {
      if ($scope.metadata) {
        return Math.min(300, $scope.metadata[index].precision * 9);
      } else {
        return 300;
      }
    };

  });
