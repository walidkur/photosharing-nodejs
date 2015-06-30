var photoApp = angular.module('photoApp', ['ngRoute', 'ngAnimate', 'ngCookies', 'ui.bootstrap', 'infinite-scroll']);

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


photoApp.controller('homeController', function($scope, $routeParams, $window, apiService) {

  //Class for ng-view in index.html
  $scope.pageClass = 'page-home';
  $scope.state = 'public';

  //Configuration for image gallery
  var galleryConfig = { rowHeight: window.screen.height * .25,  margins: 10 };
  var index = 1;
  var pageSize = 20;
  $scope.loading = false;

  $scope.getPublicFeed = function(){
    index = 1;

    $scope.state = 'public';

    //Request parameters
    //If search query: add tags to request
    var params = '?type=public';

    if($routeParams.tags){
      params += '&q=' + $routeParams.tags;
    }

    params += '&ps=20' + '&si=' + index;

    $scope.loading = true;
    //Request to Node server
    apiService.getFeed(params).then(

      //On success: bind data to scope, render image gallery
      function(data, status){
        $scope.data = data.data;

        angular.element(document).ready(function(){
          index = 21;
          $('#mygallery').justifiedGallery(galleryConfig);
          $scope.loading = false;
        });

      },

      //On error: if unauthorized redirect to '/' for relogin
      function(data, status){
        $scope.loading = false;

        if(status === 401){
          $window.location.assign('/');
        }

      }
    );
  }

  $scope.getPrivateFeed = function(){
    index = 1;
    $scope.state = 'private';
    //Request parameters
    //If search query: add tags to request
    var params = '?type=private';

    if($routeParams.tags){
      params += '&q=' + $routeParams.tags;
    }

    params += '&ps=20' + '&si=' + index;

    $scope.loading = true;
    //Request to Node server
    apiService.getFeed(params).then(

      //On success: bind data to scope, render image gallery
      function(data, status){
        $scope.data = data.data;

        angular.element(document).ready(function(){
          index = 21;
          $('#mygallery').justifiedGallery(galleryConfig);
          $scope.loading = false;
        });

      },

      //On error: if unauthorized redirect to '/' for relogin
      function(data, status){
        $scope.loading = false;

        if(status === 401){
          $window.location.assign('/');
        }

      }
    );
  }

  $scope.loadMore = function(){
    console.log('Loading more');

    if ($scope.loading) return;
    $scope.loading = true;

    var params = '?type=' + $scope.state;

    if($routeParams.tags){
      params += '&q=' + $routeParams.tags;
    }

    params += '&ps=5&si=' + index;


    apiService.getFeed(params).then(

      function(data, status){
        $scope.data = $scope.data.concat(data.data);
        index += 5;
        angular.element(document).ready(function() {
          $("#mygallery").justifiedGallery('norewind');
          $scope.loading = false;
        });
      },
      function(data, status){
        $scope.loading = false;
        if(status === 401){
          $window.location.assign('/');
        }
      }
    );
  }

  $scope.getPublicFeed();
});

photoApp.controller('photoController', function($scope, $rootScope, $http, $routeParams, $window, $cookies, apiService) {

  $scope.cookie = JSON.parse($cookies.get('user'));
  $scope.uid = $scope.cookie.uid;
  $scope.pageClass = 'page-photo';
  $scope.liked = false;

  $scope.like = function(){
    var params = '?lid=' + $routeParams.lid + '&pid=' + $routeParams.pid;
    if($scope.liked){
      params += '&r=off';
    } else {
      params =+ '&r=on';
    }
    apiService.putLike(params).then(
      function(data, status){
        console.log("Liked")
        if($scope.liked){
          $scope.liked = false;
          $scope.photo.likes -= 1;
        } else {
          $scope.liked = true;
          $scope.photo.likes += 1;
        }
      },
      function(data, status){
        if(status === 401){
          $window.location.assign('/');
        }
      }
    )
  }

  var getPhoto = function(){

    $http({

      method:'GET',
      url:'/api/photo?lid=' + $routeParams.lid + '&pid=' + $routeParams.pid

    }).success(function(data, status){

      data.published = new Date(data.published);
      data.published = data.published.toLocaleDateString();

      $scope.photo = data;
      $scope.getComments(data.uid);
      getProfile();

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
        data[i].date = data[i].date.toLocaleDateString();
      }

      $scope.comments = data;

      $scope.getProfiles();

    }).error(function(data, status){

      if(status === 401){
        $window.location.assign('/');
      }

    });
  }

  $scope.getProfiles = function(){
    $scope.comments.forEach(function(comment){
      $http({
        method:'GET',
        url:'/api/profile?uid=' + comment.uid
      }).success(function(data, status){
        comment.profileImg = data.img;
      });
    })
  }

  $scope.addComment = function(){

    $http({

      method: 'POST',
      url: '/api/comments?uid=' + $scope.photo.uid + '&pid=' + $routeParams.pid,
      data: {comment: $scope.content},

    }).success(function(data, status){

      $scope.content = '';
      $scope.getComments($scope.photo.uid);

    }).error(function(data, status){

      if(status === 401){
        $window.location.assign('/');
      }

    });
  }
  var getProfile = function () {

    $http({

      method: 'GET',
      url: '/api/profile?uid=' + $scope.photo.uid

    }).success(function(data, status){

      $scope.photo.profile = data;

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
  var imgPixels = 0;
  var screenHeight = window.screen.height;

  imgPixels = screenHeight * .25;


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
      url:'/api/feed?type=user&uid=' + $routeParams.uid,

    }).success(function(data, status){

      $scope.uploadFeed = data;

      angular.element(document).ready(function() {
        $("#profileGallery").justifiedGallery({
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

  getProfile();
  getUploadFeed();

});

photoApp.controller('navbarController', function($scope, $rootScope, $http, $route, $routeParams, $cookies, $modal, $log, $window){

  $scope.cookie = JSON.parse($cookies.get('user'));
  $scope.displayName = $scope.cookie.displayName;
  $rootScope.uid = $scope.cookie.uid;

  $scope.searchQuery = '';

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = false;

  $scope.open = function (size) {

    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceController',
      size: size,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.toggleAnimation = function () {
    $scope.animationsEnabled = !$scope.animationsEnabled;
  };

  $scope.search = function () {

    if($scope.searchQuery){

      $scope.searchTags = $scope.searchQuery.split(" ");

      $window.location.assign('/#/?tags=' + $scope.searchTags.join());

    }

  }

  var getAvatar = function () {

    $http({

      method: 'GET',
      url: '/api/profile?uid=' + $rootScope.uid

    }).success(function(data, status){

      $rootScope.avatar = data.img;

    }).error(function(data, status){

      if(status === 401){
        $window.location.assign('/');
      }

    });
  }

  getAvatar();

});


photoApp.controller('ModalInstanceController', function($http, $scope, $modalInstance, items) {

  $scope.items = items;
  $scope.shares = '';
  $scope.tags = '';
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.uploadFile = function(){
    var fd = new FormData();
    fd.append("file", $scope.files[0]);

    var url = "/api/upload?visibility=" + $scope.visibility;

    if($scope.shares != ''){
      var shares = $scope.shares;
      var shareArray = shares.split(' ');
      url = url + '&share=' + shareArray.join();
    }

    if($scope.tags != ''){
      var tags = $scope.tags;
      var tagArray = tags.split(' ');
      url = url + '&q=' + tagArray.join();
    }

    $http.post(url, fd, {
      headers: { 'Content-Type' : undefined, 'X-Content-Length' : $scope.files[0].size},
      transformRequest: angular.identity
    }).success($scope.ok);
  }
});
