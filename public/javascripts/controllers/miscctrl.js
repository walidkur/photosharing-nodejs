var photoApp = angular.module('photoApp');

photoApp.controller('navbarController', function($location, $scope, $rootScope, $http, $route, $routeParams, $cookies, $modal, $log, $window, apiService){

  $scope.cookie = JSON.parse($cookies.get('user'));
  $rootScope.displayName = $scope.cookie.displayName;
  $rootScope.uid = $scope.cookie.uid;
  $rootScope.state = 'public';

  $rootScope.loading = false;
  $rootScope.loadingHues = ['#fdc162', '#7bb7fa', '#60d7a9', '#fd6a62'];
  $rootScope.hueIndex = 0;

  $rootScope.buttons = [".profileButton", ".publicButton", ".privateButton", ".personalButton", ".uploadButton"];

  $scope.select = function(button){
    angular.forEach($rootScope.buttons, function(btn){
      $(btn).css("animation", "");
      $(btn).css("box-shadow", "");
    });
    $(button).css("animation", "navSelected .5s forwards");

  }

  $scope.searchQuery = '';

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = false;

  $scope.$on('$locationChangeStart', function(event, next, current){
    $rootScope.loading = true;
    console.log("Route Changed!");

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
      templateUrl: '/partials/modal-template',
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
    if ($(window).width() < 1218 || $(window).width() > 767){
      $scope.mediumScreen = false;
    }
    if ($(window).width() >= 1218 || $(window).width() <= 767){
      $scope.mediumScreen = true;
    }
    if($(window).width() < 905){
      $scope.uploadSideA = false
    } else {
      $scope.uploadSideA = true;
    }
    if($(window).width() < 746){
      $('#searchText').css('width', '100%');
    } else {
      $('#searchText').css('width', '100px');
    }
  });

  $(window).resize(function() {
    if ($(window).width() < 1218 || $(window).width() > 767){
      $scope.mediumScreen = false;
    }
    $scope.$apply();
    if ($(window).width() >= 1218 || $(window).width() <= 746){
      $scope.mediumScreen = true;
    }
    $scope.$apply();
    if($(window).width() < 905){
      $scope.uploadSideA = false
    } else {
      $scope.uploadSideA = true;
    }
    $scope.$apply();
    if($(window).width() < 746){
      $('#searchText').css('width', '100%');
    } else {
      $('#searchText').css('width', '100px');
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

      if(status === 401 || status === 403){
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

  $scope.checkPress = function(event){
    if(event.keyCode == 10 || event.keyCode == 13){
      console.log($scope.tags);
      $scope.appliedTags.push($scope.tags);
      console.log($scope.appliedTags);
      $scope.tags = '';
      $scope.tagsList = [];
    }
  }

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
    $scope.appliedTags.push($scope.tagsList[index].name);
    console.log($scope.appliedTags);
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

    if($scope.appliedTags.length > 0){
      url = url + '&q=' + $scope.appliedTags.join();
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
