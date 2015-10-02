'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .when('/view1', {
        templateUrl: 'views/view1.html',
        controller: 'controllers/view1'
      })
      .when('/view2', {
        templateUrl: 'views/view2.html',
        controller: 'controllers/view2'
      });
}]);