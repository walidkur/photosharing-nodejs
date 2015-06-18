var photoApp = angular.module('photoApp', ['ngRoute', 'ngAnimate', 'ngCookies']);

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
photoApp.controller('homeController', function($scope, $http, $route, $routeParams, $window) {

  $scope.pageClass = 'page-home';
  var imgPixels = 0;
  var screenHeight = window.screen.height;

  imgPixels = screenHeight * .25;

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

    }).error(function(data, status){

      if(status === 401){
        $window.location.assign('/');
      }

    });

  }

  getFeed();


  });

  photoApp.controller('photoController', function($scope, $http, $route, $routeParams, $window) {

    $scope.pageClass = 'page-photo';

    var getPhoto = function(){

      $http({

        method:'GET',
        url:'/api/photo?lid=' + $routeParams.lid + '&pid=' + $routeParams.pid

      }).success(function(data, status){

        $scope.photo = data;
        $scope.getComments(data.uid);

      }).error(function(data, status){

        if(status === 401){
          $window.location.assign('/');
        }

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

      }).error(function(data, status){

        if(status === 401){
          $window.location.assign('/');
        }

      });
    }

    $scope.addComment = function(){

      $http({

        method: 'POST',
        url: '/api/comments?uid=' + $scope.photo.uid + '&pid=' + $routeParams.pid,
        data: {comment: $scope.content},

      }).success(function(data, status){

        $scope.getComments($scope.photo.uid);

      }).error(function(data, status){

        if(status === 401){
          $window.location.assign('/');
        }

      });
    }

    getPhoto();

  });

  photoApp.controller('profileController', function($scope, $http, $routeParams, $window) {

    $scope.pageClass = 'page-profile';

    var getProfile = function(){

      $http({

        method:'GET',
        url:'/api/profile?uid=' + $routeParams.uid,

      }).success(function(data, status){

        $scope.profile = data;

      }).error(function(data, status){

        if(status === 401){
          $window.location.assign('/');
        }

      });
    }

    var getUploadFeed = function(){

      $http({

        method:'GET',
        url:'/api/feed?uid=' + $routeParams.uid,

      }).success(function(data, status){

        $scope.uploadFeed = data;

      }).error(function(data, status){

        if(status === 401){
          $window.location.assign('/');
        }

      });
    }

    getProfile();
    getUploadFeed();

  });

  photoApp.controller('navbarController', function($scope, $http, $route, $routeParams, $cookies){

      $scope.cookie = JSON.parse($cookies.get('user'));
      $scope.displayName = $scope.cookie.displayName;
      $scope.uid = $scope.cookie.uid;

  });
