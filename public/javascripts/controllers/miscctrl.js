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

  $scope.peopleSearch = function(){
    var people = $scope.searchQuery;
    if(people == ''){
      $scope.resultList = [];
    } else {
      $http.get('/api/searchPeople?q='+people).then(function(response){
        console.log(response);
        $scope.resultList = response.data.persons;
      });
    }
  };

  $scope.select = function(button){
    angular.forEach($rootScope.buttons, function(btn){
      $(btn).css("animation", "");
      $(btn).css("box-shadow", "");
    });
    $(button).css("animation", "navSelected .5s forwards");

  };

  $scope.searchQuery = '';

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = false;

  $scope.$on('$locationChangeStart', function(event, next, current){
    $rootScope.loading = true;

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
  };

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

  };

  $scope.goToProfile = function(id){
    $scope.resultList = [];
    $scope.searchQuery = '';
    $window.location.assign('/#/profile/' + id);
  }

  $scope.mediumScreen = true;
  $(document).ready(function(){
    if ($(window).width() < 1218 || $(window).width() > 767){
      $scope.mediumScreen = false;
    }
    if ($(window).width() >= 1218 || $(window).width() <= 767){
      $scope.mediumScreen = true;
    }
    $scope.uploadSideA = $(window).width() >= 905;
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
    if ($(window).width() >= 1218 || $(window).width() <= 746){
      $scope.mediumScreen = true;
    }
    $scope.uploadSideA = $(window).width() >= 905;
    if($(window).width() < 746){
      $('#searchText').css('width', '100%');
    } else {
      $('#searchText').css('width', '100px');
    }
    $scope.$digest();
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
  };

  getAvatar();

});

photoApp.controller('ModalInstanceController', function($window, $http, $scope, $modalInstance, items) {

  $scope.appliedTags = ['photonode'];
  $scope.appliedPeople = [];
  $scope.visibility = 'public';
  $scope.items = items;
  $scope.shares = '';
  $scope.tags = '';
  $scope.selected = {
    item: $scope.items[0]
  };
  $scope.loading = false;

  $('html').click(function(e){
    if($scope.tags.length > 0 && e.target != $('#tagField')[0]){
      if($scope.appliedTags.indexOf($scope.tags) == -1) {
        $scope.appliedTags.push($scope.tags);
      }
      clearTimeout($scope.lastSent);
      $scope.tags = '';
      $scope.tagsList = [];
    } else if($scope.people && e.target != $('#peopleField')){
      $scope.addPerson(0);
    }
  });

  $scope.checkPress = function(event, context){
    if(context == 'tags' && $scope.tags.length > 20){
      event.preventDefault();
    }
    if(context == 'title' && $scope.title.length > 38){
      event.preventDefault();
    }
    if(event.keyCode == 10 || event.keyCode == 13){
      if(context == 'tags') {
        if ($scope.appliedTags.indexOf($scope.tags) == -1) {
          $scope.appliedTags.push($scope.tags);
        }
        clearTimeout($scope.lastSent);
        $scope.tags = '';
        $scope.tagsList = [];
      } else if(context == 'people'){
        $scope.addPerson(0);
      }
    }
    if(event.keyCode == 32){
      if(context == 'tags'){
        if ($scope.appliedTags.indexOf($scope.tags) == -1) {
          $scope.appliedTags.push($scope.tags);
        }
        clearTimeout($scope.lastSent);
        $scope.tags = '';
        $scope.tagsList = [];
      }
    }
  };

  $scope.peopleSearch = function(){
    var people = $scope.people;
    if(people == ''){
      $scope.peopleList = [];
    } else {
      $http.get('/api/searchPeople?q='+people).then(function(response){
        $scope.peopleList = response.data.persons;
      })
    }
  };

  $scope.initiateSearch = function(param) {
    $http.get("/api/searchTags?q="+param).then(function(response){
      $scope.tagsList = response.data.items;
      console.log(response);
      console.log($scope.tagsList);
    });
  };

  $scope.search = function(){
    if($scope.tags == ''){
      clearTimeout($scope.lastSent);
      $scope.tagsList = [];
      $scope.$digest();
    }
    clearTimeout($scope.lastSent);
    $scope.lastSent = setTimeout(function(){$scope.initiateSearch($scope.tags)}, 100);
  };

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.removeTag = function(index){
    $scope.appliedTags.splice(index, 1);
  };

  $scope.removePerson = function(index){
    $scope.appliedPeople.splice(index, 1);
  };

  $scope.addTag = function(index) {
    $scope.appliedTags.push($scope.tagsList[index].name);
    $scope.tags = '';
    $scope.tagsList = [];
  };

  $scope.addPerson = function(index){
    var person = $scope.peopleList[index];
    if($scope.appliedPeople.indexOf(person) == -1){
      person.name = person.name.replace(/<B>/, "").replace(/<\/B>/, "");
      $scope.appliedPeople.push(person);
    }
    $scope.people = '';
    $scope.peopleList = [];
  };

  $scope.uploadFile = function(){
    $scope.message = '';
    $('#uploadButton').attr('disabled', '');
    $('#uploadText').css('display', 'none');
    $('#uploadSpinner').css('display', 'inline');
    var fd = new FormData();
    fd.append("file", $scope.files[0]);

    var url = '/api/upload?visibility=' + $scope.visibility;

    if($scope.shares != ''){
      var shares = [];
      angular.forEach($scope.appliedPeople, function(person){
        shares.push(person.id);
      });
      url = url + '&share=' + shares.join();
    }

    if($scope.appliedTags.length > 0){
      url = url + '&q=' + $scope.appliedTags.join();
    }

    url += '&title=' + $scope.title;

    if($scope.caption.length > 0){
      url += '&summary=' + $scope.caption;
    }

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
