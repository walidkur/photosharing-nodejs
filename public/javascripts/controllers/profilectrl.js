var photoApp = angular.module('photoApp');

photoApp.controller('profileController', function($animate, $rootScope, $scope, $http, $routeParams, $window, apiService, profileData) {

  angular.forEach($rootScope.buttons, function(btn){
    $(btn).css("animation", "");
    $(btn).css("box-shadow", "");
  });
  $(".profileButton").css("box-shadow", "0px 2px 0px #004266");
  $rootScope.loading = false;
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
    if(status === 401){
      $window.location.assign('/');
    }
  }
});
