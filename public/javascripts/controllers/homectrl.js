var photoApp = angular.module('photoApp');

photoApp.controller('homeController', function($animate, apiService, feedData, $routeParams, $rootScope, $scope, $window) {

  //load page-home.ejs into index.ejs, remove loading screen, bind preloaded data to scope
  $scope.pageClass = 'page-home';
  $rootScope.loading = false;
  $scope.data = feedData;

  switch ($routeParams.type){
    case 'public':
      angular.forEach($rootScope.buttons, function(btn){
        $(btn).css("animation", "");
        $(btn).css("box-shadow", "");
      });
      $(".publicButton").css("box-shadow", "0px 2px 0px #004266");
    break;
    case 'private':
      angular.forEach($rootScope.buttons, function(btn){
        $(btn).css("animation", "");
        $(btn).css("box-shadow", "");
      });
      $(".privateButton").css("box-shadow", "0px 2px 0px #004266");
    break;
    case 'myphotos':
      angular.forEach($rootScope.buttons, function(btn){
        $(btn).css("animation", "");
        $(btn).css("box-shadow", "");
      });
      $(".personalButton").css("box-shadow", "0px 2px 0px #004266");
    break;
  }

  //Configuration for image gallery
  var galleryConfig = { rowHeight: window.screen.height * .27,  margins: 10 };

  var index = 21;
  var animateCount = 1;
  $scope.loading = true;

  $animate.on('enter', $('body'), function (element, phase){
    if(animateCount > 0){
      if(phase === 'close'){
        animateCount = 0;
        angular.element(document).ready(function(){
          var $homeGallery = $('#homeGallery')
          $homeGallery.justifiedGallery(galleryConfig).on('jg.complete', function(e){
            $scope.loading = false;
          });
          $homeGallery.removeClass('hidden');
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
    });
  };

  $scope.like = function(index){
    var photo = $scope.data[index];
    var params = '?lid=' + photo.lid + '&pid=' + photo.pid;
    if(photo.liked){
      params += '&r=off';
    } else {
      params += '&r=on';
    }
    apiService.postLike(params).then(
      function(data, status){
        if(photo.liked){
          photo.liked = false;
          photo.likes -= 1;
        } else {
          photo.liked = true;
          photo.likes += 1;
        }
      },
      function(data, status){
        if(status === 401 || status === 403){
          $window.location.assign('/');
        }
      }
    )
  };

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
    if(status === 401 || status === 403){
      $window.location.assign('/');
    }
  }

});
