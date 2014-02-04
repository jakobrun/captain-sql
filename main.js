'use strict';
var connection = require('./js/connection');

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
    $scope.login = function() {
      connection.connect({
        host: $scope.host,
        user: $scope.username,
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
    var runQurey = function(editor) {
      connection.execute(editor.getValue(' ')).then(function(result) {
        $scope.$apply(function() {
          $scope.result = result;
        });
      }).fail(function(err) {
        alert('got error: ' + err);
      });

    },
      cm = CodeMirror(document.getElementById('editor'), {
        value: 'SELECT * FROM ',
        mode: 'text/x-sql',
        lineNumbers: true,
        autofocus: true,
        theme: 'base16-dark',
        extraKeys: {
          'Ctrl-Enter': runQurey
        }
      });

  });
