var photoApp = angular.module('photoApp', ['ngRoute', 'ngAnimate', 'ngCookies', 'ui.bootstrap', 'infinite-scroll']);

// configure our routes
photoApp.config(function($routeProvider) {
  $routeProvider

  // route for the home page
  .when('/:type', {
    templateUrl : 'pages/page-home.html',
    resolve     : {
      feedData  : function($route, apiService){

        var feed;
        var type = 'public';
        var tags = '';

        if($route.current.params.type){
          type = $route.current.params.type;
        }

        document.title = type.charAt(0).toUpperCase() + type.slice(1);

        if($route.current.params.tags){
          tags = $route.current.params.tags;
        }

        return apiService.getFeed('?type=' + type + '&q=' + tags + '&ps=20&si=1', successCallback, errorCallback)
        .then(function(){
          return feed;
        });


        function successCallback(data, status){
          feed = data;
          console.log(data);
        }

        function errorCallback(data, status){
          console.log("Error!");
        }

      }
    },
    controller  : 'homeController',
  })

  // route for the about page
  .when('/photo/:lid/:pid', {
    templateUrl : 'pages/page-photo.html',

    resolve     :  {
    photoData : function($route, apiService){

      var resolveData = {};
      var uid = '';

      return apiService.getPhoto('?pid=' + $route.current.params.pid + '&lid=' + $route.current.params.lid, photoCallback, errorCallback)

        .then(function(){

          return apiService.getProfile('?uid=' + uid, profileCallback, errorCallback)

            .then(function(){

              return apiService.getComments('?pid=' + $route.current.params.pid + '&uid=' + uid, commentCallback, errorCallback)

                .then(function(){

                  return apiService.getProfiles(resolveData.comments, profilesCallback, errorCallback)

                    .then(function(){

                        return resolveData;

                        });
                      });
                    });
                  });


        //Promise Callbacks
        function photoCallback(data, status){
          resolveData.photo = data;
          uid = data.uid;
          resolveData.photo.published = new Date(resolveData.photo.published);
          resolveData.photo.published = resolveData.photo.published.toLocaleDateString();
          document.title = data.title;
        }

        function commentCallback(data, status){
          resolveData.comments = data;
          resolveData.comments.forEach(function(comment, index){
            comment.date = new Date(comment.date);
            comment.date = comment.date.toLocaleDateString();
          })
        }

        function profileCallback(data, status){
          resolveData.profile = data;
        }

        function profilesCallback(data, status, comment){
          comment.profileImg = data.img;
        }

        function errorCallback(data, status){
          console.log("Error");
        }

      }
    },
    controller  : 'photoController'
  })

  // route for the contact page
  .when('/profile/:uid', {
    templateUrl : 'pages/page-profile.html',
    resolve     :  {
      profileData : function($route, apiService){
        var resolveData = {};

        var tags = '';

        if($route.current.params.tags){
          tags = $route.current.params.tags;
        }

        return apiService.getProfile('?uid=' + $route.current.params.uid, profileCallback, errorCallback)
        .then(function(){
          return apiService.getFeed('?type=user&uid=' + $route.current.params.uid + '&q=' + tags + '&ps=20&si=1', feedCallback, errorCallback)
          .then(function(){
            return resolveData;
          });
        });

        function profileCallback(data, status){
          console.log("Callback!!!:" + data);
          resolveData.profile = data;
          document.title = data.name;
        }
        function feedCallback(data, status){
          resolveData.feed = data;
        }
        function errorCallback(data, status){
          console.log("Error!");
        }
      }
    },
    controller  : 'profileController'
  })

  .otherwise({
    redirectTo: '/public'
  })
});


photoApp.controller('homeController', function($animate, $scope, $routeParams, $window, apiService, feedData) {

  //Class for ng-view in index.html
  $scope.pageClass = 'page-home';

  $scope.data = feedData;

  //Configuration for image gallery
  var galleryConfig = { rowHeight: window.screen.height * .25,  margins: 10 };

  var index = 21;
  var pageSize = 20;
  $scope.loading = true;

  $animate.on('enter', $('body'), function (element, phase){
    if(phase === 'close'){
      angular.element(document).ready(function(){
        $('#homeGallery').justifiedGallery(galleryConfig);
        $('#homeGallery').removeClass('hidden');
        $scope.loading = false;
      });
    }
  });

  $scope.loadMore = function(){

    if ($scope.loading){
      return;
    }
    $scope.loading = true;
    console.log("Loading!!!!!");
    var type;
    var tags = '';

    if($routeParams.type){
      type = $routeParams.type;
    }

    if($routeParams.tags){
      tags = $routeParams.tags;
    }

    apiService.getFeed('?type=' + type + '&q=' + tags + '&ps=5' + '&si=' + index, feedCallback, errorCallback)
    .then(function(){
      index += 5;
      return;
    });
  }

  function feedCallback(data, status){
    $scope.data = $scope.data.concat(data);
    angular.element(document).ready(function(){
      $('#homeGallery').justifiedGallery('norewind');
      $scope.loading = false;
    });
  }

  function errorCallback(data, status){
    console.log("Error!");
  }

});

photoApp.controller('photoController', function($location, $scope, $rootScope, $http, $routeParams, $window, $cookies, apiService, photoData) {

  $scope.cookie = JSON.parse($cookies.get('user'));
  $scope.uid = $scope.cookie.uid;
  $scope.pageClass = 'page-photo';
  $scope.photo = photoData.photo;
  $scope.profile = photoData.profile;
  $scope.comments = photoData.comments;
  $scope.liked = $scope.photo.liked;

  $scope.editComment = function(content, cid){
    apiService.editComment(content, '?uid=' + $scope.photo.uid + '&pid=' + $scope.photo.pid + '&cid=' + cid, editCallback, errorCallback)
    .then(function(){
      apiService.getComments('?pid' + $scope.photo.pid + '&uid' + $scope.uid, commentCallback, errorCallback)
      .then(function(){
        apiService.getProfiles($scope.comments, profilesCallback, errorCallback)
        .then(function(){
          return;
        });
      });
    });
  }

  $scope.addComment = function(){
    apiService.addComment($scope.content, '?pid=' + $scope.photo.pid + '&uid=' + $scope.uid, addCommentCallback, errorCallback)
    .then(function(){
      apiService.getComments('?pid=' + $scope.photo.pid + '&uid=' + $scope.uid, commentCallback, errorCallback)
      .then(function(){
        apiService.getProfiles($scope.comments, profilesCallback, errorCallback)
        .then(function(){
          return;
        });
      });
    });
  }

  function addCommentCallback(data, status){
    $scope.content = '';
  }

  function commentCallback(data, status){
    $scope.comments = data;
  }

  function profilesCallback(data, status, comment){
    comment.profileImg = data.img;
  }

  function editCallback(data, status){
    console.log("Successfully edited!");
  }

  function errorCallback(data, status){
    console.log("Error!");
  }

  $scope.like = function(){
    var params = '?lid=' + $routeParams.lid + '&pid=' + $routeParams.pid;
    if($scope.liked){
      params += '&r=off';
    } else {
      params += '&r=on';
    }
    apiService.postLike(params).then(
      function(data, status){
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

  $scope.deletePhoto = function(){
    var params = '?pid=' + $scope.photo.pid;
    apiService.deletePhoto(params).then(
      function(data, status){
        $location.path("/#/public");
      },
      function(data, status){
        console.log('Deleting failed')
      }
    )
  }
});


photoApp.controller('profileController', function($scope, $http, $routeParams, $window, profileData) {


  $scope.pageClass = 'page-profile';
  $scope.profile = profileData.profile;
  $scope.data = profileData.feed;

  var galleryConfig = { rowHeight: window.screen.height * .25,  margins: 10 };

  angular.element(document).ready(function(){
    $('#profileGallery').justifiedGallery(galleryConfig);
  });
});

photoApp.controller('navbarController', function($location, $scope, $rootScope, $http, $route, $routeParams, $cookies, $modal, $log, $window, apiService){

  $scope.cookie = JSON.parse($cookies.get('user'));
  $scope.displayName = $scope.cookie.displayName;
  $rootScope.uid = $scope.cookie.uid;

  $scope.searchQuery = '';

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = false;

  $scope.logout = function() {
    apiService.logout(errorCallback);

    function errorCallback(data, status) {
      if(status === 302)  $window.location.href = data;
    }
  }

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

  $scope.mediumScreen = true;
  $(document).ready(function(){
    if ($(window).width() <= 1148 || $(window).width() >= 767){
      $scope.mediumScreen = false;
    }
    if ($(window).width() >= 1148 || $(window).width() <= 767){
      $scope.mediumScreen = true;
    }
  });

  $(window).resize(function() {
    if ($(window).width() <= 1148){
      $scope.mediumScreen = false;
    }
    if ($(window).width() >= 1148 || $(window).width() <= 767){
      $scope.mediumScreen = true;
    }
    $scope.$apply();
  });

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
