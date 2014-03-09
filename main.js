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

    //Run query
    var runQuery = function(editor) {
      var t = Date.now();

      $scope.$apply(function() {
        $scope.errorMsg = '';
        $scope.metadata = null;
        $scope.data = [];
        $scope.status = 'executing...';
      });

      var sqlStream = connection.execute(editor.getValue(' '));

      sqlStream.metadata(function (err, metadata) {
        $scope.$apply(function () {
          if (err) {
            $scope.errorMsg = err;
          } else {
            $scope.metadata = metadata;
          }          
        });
      });

      sqlStream.next(function(err, dataBuffer, more) {
        $scope.$apply(function() {
          var time = Date.now() - t;
          if (err) {
            $scope.errorMsg = err;
          } else {
            $scope.data = $scope.data.concat(dataBuffer);
            $scope.more = more;
          }
          $scope.status = 'done, time: (' + time + ')';
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
      if ($scope.metadata && $scope.metadata[index] && $scope.metadata[index].precision) {
        return Math.min(300, $scope.metadata[index].precision * 9);
      } else {
        return 300;
      }
    };

  });
