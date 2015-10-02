'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .when('/', {
          templateUrl: 'views/view1.html',
          controller: 'view1'
      })
      .when('/view2', {
        templateUrl: 'views/view2.html',
        controller: 'view2'
      })
      .when('/view3', {
        templateUrl: 'views/view3.html',
        controller: 'view3'
      });
}]);