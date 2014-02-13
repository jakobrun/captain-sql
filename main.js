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
    var runQurey = function(editor) {
      $scope.$apply(function() {
        $scope.status = 'executing...';
      });
      connection.execute(editor.getValue(' ')).then(function(result) {
        $scope.$apply(function() {
          $scope.errorMsg = '';
          $scope.status = 'done';
          $scope.result = result;
        });
      }).fail(function(err) {
        $scope.$apply(function() {
          $scope.result = {};
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
          'Ctrl-Enter': runQurey,
          'Ctrl-Space': assist
        }
      });
    $scope.columnWidth = function(index) {
      return Math.min(300, $scope.result.metadata.columns[index].precision * 9);
    };

  });
