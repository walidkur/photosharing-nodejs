var photoApp = angular.module('photoApp', ['ngRoute', 'ngAnimate', 'ngCookies', 'ui.bootstrap', 'infinite-scroll']);

// configure our routes
photoApp.config(function($routeProvider) {
  $routeProvider

  // route for the home page
  .when('/:type', {
    templateUrl : '/partials/page-home',
    resolve     : {
      feedData  : function($rootScope, $route, apiService){

        var feed;
        var type = 'public';
        var tags = '';

        if($route.current.params.type){
          type = $route.current.params.type;
        }

        $rootScope.state = type;

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
    templateUrl : '/partials/page-photo',

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

                      var images = [];
                      images.push(resolveData.photo.link);
                      images.push(resolveData.profile.img);
                      angular.forEach(resolveData.comments, function(comment){
                        images.push(comment.profileImg);
                      });

                      return apiService.resolveImages(images)

                        .then(function(){

                          return resolveData;

                          });
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

        }

      }
    },
    controller  : 'photoController'
  })

  // route for the contact page
  .when('/profile/:uid', {
    templateUrl : 'partials/page-profile',
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


photoApp.controller('homeController', function($animate,$rootScope, $scope, $routeParams, $window, apiService, feedData) {


  $rootScope.loading = false;
  //Class for ng-view in index.html
  $scope.pageClass = 'page-home';

  $scope.data = feedData;

  //Configuration for image gallery
  var galleryConfig = { rowHeight: window.screen.height * .25,  margins: 10 };

  var index = 21;
  var animateCount = 1;
  $scope.loading = true;

  $animate.on('enter', $('body'), function (element, phase){
    if(animateCount > 0){
      if(phase === 'close'){
        animateCount = 0;
        angular.element(document).ready(function(){
          $('#homeGallery').justifiedGallery(galleryConfig).on('jg.complete', function(e){
            $scope.loading = false;
          });
          $('#homeGallery').removeClass('hidden');
        });
      }
    }
  });

  $scope.loadMore = function(){

    if ($scope.loading){
      return;
    }
    $scope.loading = true;
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
    if(data.length != 0){
      $scope.data = $scope.data.concat(data);
      angular.element(document).ready(function(){
        $('#homeGallery').justifiedGallery('norewind').on('jg.complete', function(e){
          $scope.loading = false;
        });
      });
    }
  }

  function errorCallback(data, status){
    console.log("Error!");
  }

});

photoApp.controller('photoController', function($location, $scope, $rootScope, $http, $routeParams, $window, $cookies, apiService, photoData) {

  $rootScope.loading = false;
  $scope.pageClass = 'page-photo';
  $scope.photo = photoData.photo;
  $scope.profile = photoData.profile;
  $scope.comments = photoData.comments;
  $scope.liked = $scope.photo.liked;
  $scope.visibility = {};
  $scope.visibility.loading = false;
  $scope.visibility.success = false;
  $scope.visibility.failure = false;

  $scope.updateVisibility = function(visibility){
    $scope.visibility.loading = true;
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&visibility=' + visibility, successCallback, errorCallback);

    function successCallback(data, status){
      $scope.visibility.loading = false;
      $scope.visibility.success = true;
      $scope.visibility.failure = false;
      $scope.photo.visibility = visibility;
    }

    function errorCallback(data, status){
      $scope.visibility.loading = false;
      $scope.visibility.success = false;
      $scope.visibility.failure = true;
    }
  }

  console.log(isCached($scope.photo.link));

  function isCached(src){
    var image = new Image();
    image.src = src;

    return image.complete;
  }

  $scope.editComment = function(content, cid){
    var comment = $scope.comments.filter(function(el){
      return el.cid == cid;
    }).pop();
    var commentContent = comment.content;

    comment.loading = true;
    comment.content = content;
    apiService.editComment(content, '?uid=' + $scope.photo.uid + '&pid=' + $scope.photo.pid + '&cid=' + cid, editCallback, editErrorCallback);

    function editCallback(data, status){
      if(status == 200){
        comment.loading = false;
        comment.success = true;
      }
    }

    function editErrorCallback(data, status){
      comment.loading = false;
      comment.failure = true;
      comment.content = commentContent;
    }
  }

  $scope.editPhoto = function(content){
    var tags = content.replace(/ /g, ",");
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&q=' + tags, editPhotoCallback, errorCallback);

    function editPhotoCallback(data, status) {

    }
  }

  $scope.deleteComment = function(cid){
    var comment = $scope.comments.filter(function(el){
      return el.cid == cid;
    }).pop();
    comment.loading = true;
    apiService.deleteComment('?cid=' + cid + '&pid=' + $scope.photo.pid + '&uid=' + $scope.photo.uid, deleteCallback, errorCallback);

    function deleteCallback(data, status){
      if(status == 200){
        $scope.comments = $scope.comments.filter(function(el) {
          return el.cid != cid;
        });
      }
    }

  }

  $scope.addComment = function(){
    var comment = {};
    comment.content = $scope.content;
    comment.author = $rootScope.displayName;
    comment.profileImg = $rootScope.avatar;
    comment.date = new Date();
    comment.date = comment.date.toLocaleDateString();
    comment.loading = true;
    comment.sucess = false;
    comment.failure = false;
    comment.uid = $rootScope.uid;
    $scope.comments.unshift(comment);
    $scope.content = '';
    apiService.addComment(comment.content, '?pid=' + $scope.photo.pid + '&uid=' + $scope.uid, $scope.photo.commenturl, addCommentCallback, addCommentErrorCallback);

    function addCommentCallback(data, status){
      if(status == 200) {
        comment.cid = data.cid;
        comment.success = true;
        comment.loading = false;
      }
    }

    function addCommentErrorCallback(data, status){
      comment.failure = true;
      comment.loading = false;
    }
  }

  function getProfileCallback(data, status){
    $scope.comments[0].profileImg = data.img;
  }

  function editPhotoCallback(data, status){
    $scope.photo.tags = $scope.photo.tags.concat($scope.newMeta.split(" "));
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

  var setting = false;

  $scope.editListener = function () {
    $(document).ready(function(){
      if (setting === false) {
          setting = true;
          $("#addCommentText").css("display", "none");
          console.log("Hide");

      }
      else {
        setting = false;
        $("#addCommentText").css("display", "block");
        console.log("Show");
      }

    });


  }


});


photoApp.controller('profileController', function($animate, $scope, $http, $routeParams, $window, apiService, profileData) {


  var index = 21;
  $scope.pageClass = 'page-profile';
  $scope.profile = profileData.profile;
  $scope.data = profileData.feed;
  $scope.loading = true;
  var animateCount = 1;

  var galleryConfig = { rowHeight: window.screen.height * .25,  margins: 10 };

  $animate.on('enter', $('body'), function (element, phase){
    if(animateCount > 0){
      if(phase === 'close'){
        animateCount = 0;
        angular.element(document).ready(function(){
          $('#profileGallery').justifiedGallery(galleryConfig).on('jg.complete', function(e){
            $scope.loading = false;
          });
          $('#profileGallery').removeClass('hidden');
        });
      }
    }
  });

  $scope.loadMore = function(){

    if ($scope.loading){
      return;
    }
    $scope.loading = true;
    var tags = '';

    if($routeParams.tags){
      tags = $routeParams.tags;
    }

    apiService.getFeed('?type=user&uid=' + $routeParams.uid + '&q=' + tags + '&ps=5' + '&si=' + index, feedCallback, errorCallback)
    .then(function(){
      index += 5;
      return;
    });
  }

  function feedCallback(data, status){
    if(data.length != 0) {
      $scope.data = $scope.data.concat(data);
      angular.element(document).ready(function(){
        $('#profileGallery').justifiedGallery('norewind').on('jg.complete', function(e){
          $scope.loading = false;
        });
      });
    }
  }

  function errorCallback(data, status){
    console.log("Error!");
  }
});

photoApp.controller('navbarController', function($location, $scope, $rootScope, $http, $route, $routeParams, $cookies, $modal, $log, $window, apiService){

  $scope.cookie = JSON.parse($cookies.get('user'));
  $rootScope.displayName = $scope.cookie.displayName;
  $rootScope.uid = $scope.cookie.uid;
  $rootScope.state = 'public';


  $rootScope.loading = false;
  $rootScope.loadingHues = ['#fdc162', '#7bb7fa', '#60d7a9', '#fd6a62'];
  $rootScope.hueIndex = 0;

  $scope.searchQuery = '';

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = false;

  $scope.$on('$locationChangeStart', function(event, next, current){
    $rootScope.loading = true;
    console.log("Index: " + $rootScope.hueIndex + " Color: " + $rootScope.loadingHues[$rootScope.hueIndex]);
    if($rootScope.hueIndex > 2){
      $rootScope.hueIndex = 0;
    }
    else{
      $rootScope.hueIndex++;
    }
  });

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

      $window.location.assign('/#/' + $scope.state + '?tags=' + $scope.searchTags.join());

    }

  }

  $scope.mediumScreen = true;
  $(document).ready(function(){
    if ($(window).width() < 1148 || $(window).width() > 767){
      $scope.mediumScreen = false;
    }
    if ($(window).width() >= 1148 || $(window).width() <= 767){
      $scope.mediumScreen = true;
    }
  });

  $(window).resize(function() {
    if ($(window).width() < 1148 || $(window).width() > 767){
      $scope.mediumScreen = false;
    }
    $scope.$apply();
    if ($(window).width() >= 1127 || $(window).width() <= 746){
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


photoApp.controller('ModalInstanceController', function($window, $http, $scope, $modalInstance, items) {

  $scope.appliedTags = [];
  $scope.items = items;
  $scope.shares = '';
  $scope.tags = '';
  $scope.selected = {
    item: $scope.items[0]
  };
  $scope.loading = false;

  $scope.initiateSearch = function(param) {
    $http.get("/api/searchTags?q="+param).then(function(response){
      $scope.tagsList = response.data.items;
    });
  }

  $scope.search = function(){
    if($scope.tags == ''){
      $scope.tagsList = [];
      clearTimeout($scope.lastSent);
    }
    clearTimeout($scope.lastSent);
    $scope.lastSent = setTimeout(function(){$scope.initiateSearch($scope.tags)}, 100);
  }

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.removeTag = function(index){
    $scope.appliedTags.splice(index, 1);
  }

  $scope.addTag = function(index) {
    $scope.appliedTags.push($scope.tagsList[index]);
    $scope.tags = '';
    $scope.tagsList = [];
  }

  $scope.uploadFile = function(){
    $scope.message = '';
    $('#uploadButton').attr('disabled', '');
    $('#uploadText').css('display', 'none');
    $('#uploadSpinner').css('display', 'inline');
    var fd = new FormData();
    fd.append("file", $scope.files[0]);

    var url = '/api/upload?visibility=' + $scope.visibility;

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

    url += '&title=' + $scope.title;

    $http.post(url, fd, {
      headers: { 'Content-Type' : undefined, 'X-Content-Length' : $scope.files[0].size},
      transformRequest: angular.identity
    }).success(function(data, status){
      $scope.ok();
      $window.location.assign('/#/photo/' + data.lid + '/' + data.pid);
    }).error(function(data, status){
      if(status === 409){
        $scope.message = 'You already have a photo with this name; please select another name.';
        $('#uploadButton').removeAttr('disabled');
        $('#uploadText').css('display', 'inline');
        $('#uploadSpinner').css('display', 'none');
      }
    });
  }
});
