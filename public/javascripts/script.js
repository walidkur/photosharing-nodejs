var photoApp = angular.module('photoApp', ['ngRoute', 'ngAnimate']);

// configure our routes
photoApp.config(function($routeProvider) {
  $routeProvider

  // route for the home page
  .when('/', {
    templateUrl : 'pages/page-home.html',
    controller  : 'homeController'
  })

  // route for the about page
  .when('/photo', {
    templateUrl : 'pages/page-photo.html',
    controller  : 'photoController'
  })

  // route for the contact page
  .when('/profile', {
    templateUrl : 'pages/page-profile.html',
    controller  : 'profileController'
  });
});

// create the controller and inject Angular's $scope
photoApp.controller('homeController', function($scope, $http) {

  $scope.pageClass = 'page-home';
  $scope.entries = [];

  var getFeed = function(){

    $http({
      method:'GET',
      url:'/api/feed'
    }).success(function(data, status){
      $scope.entries = [];
      $scope.parseData(data);
    });

  }

  $scope.parseData = function(data){
    var xmlDoc = $.parseXML(data);
    var $xml = $(xmlDoc);
    var $entry = $xml.find("entry");
    var $title = $entry.find("title");
    var $uuid = $entry.find("uuid");
    for(var i = 0; i < $title.length; i++){
      var dataEntry = {
        name: $title[i].innerHTML,
        docid: $uuid[i].innerHTML,
      }
      $scope.entries.push(dataEntry)
    }
    }


    getFeed();


  });

  photoApp.controller('photoController', function($scope) {
    $scope.pageClass = 'page-photo';
    $scope.message = 'Look! I am an about page.';
  });

  photoApp.controller('profileController', function($scope) {
    $scope.pageClass = 'page-profile';
    $scope.message = 'Contact us! JK. This is just a demo.';
  });
