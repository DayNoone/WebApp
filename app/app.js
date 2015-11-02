'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
    'ngAnimate',
    'ui.bootstrap'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .when('/', {
          templateUrl: 'views/view1.html',
          controller: 'view1'
      })
      .when('/view2', {
        templateUrl: 'views/view2.html',
        controller: 'view2'
      })
      .when('/helpView', {
        templateUrl: 'views/helpView.html',
        controller: 'helpView'
      })
}]);


/*
app.provider('reload', function reload() {
    var server_url = "https://tf2.sintef.no:8084/smioTest/api/";
    var username = "sondre";
    var password = "dabchick402";
    this.$get = function($http) {
        $http.get(server_url + 'trips', {params: {username: username, password: password}}).
            success(function(data){
                console.log('Loaded');
                //trips = "Loaded" + data[0];

                /!*$scope.trips = [];
                 for(var i = 0; i < data.length; i++) {
                 $scope.calculateTrip(data[i]);
                 if(data[i].length > 10)
                 $scope.trips.push(data[i]);
                 }*!/

                //dialog.close();
            }).
            error(function(){
                //dialog.close();
                console.log('Failed');
                //trips = "Failed to load questions!";
            });
        return reload;
    };
    //var dialog = dialogs.wait(undefined, "Downloading statistics ...", undefined);
});*/
