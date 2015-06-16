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
  .when('/photo/:lid/:pid', {
    templateUrl : 'pages/page-photo.html',
    controller  : 'photoController'
  })

  // route for the contact page
  .when('/profile/:uid', {
    templateUrl : 'pages/page-profile.html',
    controller  : 'profileController'
  });
});

// create the controller and inject Angular's $scope
photoApp.controller('homeController', function($scope, $http, $route, $routeParams) {

  $scope.pageClass = 'page-home';
  var imgPixels = 0;
  var screenHeight = window.screen.height;

  imgPixels = screenHeight * .35;

  // $(window).resize(function () {
  //   var screenHeight = window.screen.height;
  //   imgPixels = screenHeight * .25;
  //   $("#mygallery").justifiedGallery({
  //     rowHeight : imgPixels,
  //     margins: 10
  //   });
  // });

  var getFeed = function(){

    $http({
      method:'GET',
      url:'/api/feed'
    }).success(function(data, status){
      $scope.data = data;
      angular.element(document).ready(function() {
        $("#mygallery").justifiedGallery({
          rowHeight : imgPixels,
          margins: 10
        });
      });

    });

  }

  getFeed();


  });

  photoApp.controller('photoController', function($scope, $http, $route, $routeParams) {

    $scope.pageClass = 'page-photo';

    var getPhoto = function(){

      $http({
        method:'GET',
        url:'/api/photo?lid=' + $routeParams.lid + '&pid=' + $routeParams.pid
      }).success(function(data, status){
        $scope.photo = data;
        $scope.getComments(data.uid);
      });

    }

    $scope.getComments = function(userid){

      $http({
        method:'GET',
        url:'/api/comments?uid=' + userid + '&pid=' + $routeParams.pid
      }).success(function(data, status){

        for(var i = 0; i < data.length; i++){
          data[i].date = new Date(data[i].date);
          data[i].date = (data[i].date.getMonth() + 1) + '/' + data[i].date.getDate() + '/' + data[i].date.getFullYear();
        }

        $scope.comments = data;

      });

    }

    $scope.addComment = function(){
      $http({
        method: 'POST',
        url: '/api/comments?uid=' + $scope.photo.uid + '&pid=' + $routeParams.pid,
        data: {comment: $scope.content},
      }).success(function(data, status){
        $scope.getComments($scope.photo.uid);
      });
    }

    getPhoto();

  });

  photoApp.controller('profileController', function($scope) {

    $scope.pageClass = 'page-profile';

    var getProfile = function(){

      $http({
        method:'GET',
        url:'/api/profile?uid=' + $routeParams.uid,
      }).success(function(data, status){
        $scope.profile = data;
      });
    }

    getProfile();

  });
