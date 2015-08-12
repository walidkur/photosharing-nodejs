var photoApp = angular.module('photoApp');

photoApp.controller('photoController', function($location, $scope, $rootScope, $http, $routeParams, $window, $cookies, apiService, photoData) {

  angular.forEach($rootScope.buttons, function(btn){
    $(btn).css("animation", "");
    $(btn).css("box-shadow", "");
  });

  $rootScope.loading = false;
  $scope.add = true;
  $scope.pageClass = 'page-photo';
  $scope.photo = photoData.photo;
  $scope.profile = photoData.profile;
  $scope.comments = photoData.comments;
  $scope.liked = $scope.photo.liked;
  $scope.visibility = {};
  $scope.visibility.loading = false;
  $scope.visibility.success = false;
  $scope.visibility.failure = false;
  $scope.title = {};
  $scope.title.loading = false;
  $scope.title.success = false;
  $scope.title.failure = false;
  $scope.peopleList = [];
  var tagsCount = 0;
  var editCount = 0;
  var shareCount = 0;
  var titleCount = 0;
  var captionCount = 0;

  function scrollComments(){
    var $commentBox = $('#commentBox');
    $commentBox.animate({
      scrollTop: $commentBox.get(0).scrollHeight
    }, 2000);
  }

  angular.element(document).ready(function() {
    scrollComments();
  });

  function commentEditOpen(){
    for(var i = 0; i < $scope.comments.length; i++){
      var comment = $scope.comments[i];
      if (comment.edit) {
        return comment.cid;
      }
    }
    return false;
  }


  $('html').click(function(e){
    var cid;
    var $tagsText = $('#tagsText');
    if($scope.meta && e.target != $tagsText[0]) {
      if (tagsCount > 0) {
        $scope.meta = !$scope.meta;
        $tagsText.val('');
        tagsCount = 0;
      } else {
        tagsCount++;
      }
    } else if((cid = commentEditOpen()) && (e.target != $('#editText' + cid)[0])) {
      if (editCount > 0) {
        angular.forEach($scope.comments, function (comment) {
          if (comment.cid == cid) {
            comment.edit = false;
          }
        });
        editCount = 0;
      } else {
        editCount++;
      }
    } else if($scope.titleEdit && e.target != $('#titleText')[0]) {
      if(titleCount > 0) {
        $scope.titleEdit = false;
        titleCount = 0;
      } else {
        titleCount++;
      }
    } else if($scope.share && e.target != $('#shareInput')[0]){
      if(shareCount > 0) {
        $scope.peopleList = [];
        delete $scope.shareModel;
        $scope.share = false;
        shareCount = 0;
      } else {
        shareCount++;
      }
    } else if($scope.captionEdit && e.target != $('#captionText')[0]){
      if(captionCount > 0){
        $scope.captionEdit = false;
        captionCount = 0;
      } else {
        captionCount++;
      }
    }
    $scope.$digest();
  });

  $scope.peopleSearch = function(){
    var people = $scope.shareModel;
    if(people == ''){
      $scope.peopleList = [];
    } else {
      $http.get('/api/searchPeople?q='+people).then(function(response){
        $scope.peopleList = response.data.persons;
      })
    }
  };

  $scope.shareClick = function(index){
    if($scope.peopleList[index]){
      $scope.shareEdit($scope.peopleList[index].id);
    }
    delete $scope.peopleList;
    delete $scope.shareModel;
    $scope.share = false;
  };

  $scope.change = function(event, type, content, cid, toggle){
    if(type === 'tags'){
      if(content.length > 20){
        console.log('preventing');
        event.preventDefault();
      }
    }
    if((event.keyCode == 13 || event.keyCode == 10) && (!event.shiftKey)){
      if(type === 'share'){
        console.log('content', content);
        if(content == ''){
          console.log('empty clear')
          delete $scope.shareModel;
          $scope.peopleList = [];
          $scope.share = false;
        } else {
          console.log('Otherwise')
          $scope.shareClick(0);
        }
      }
      if(type === 'tags'){
        $scope.editPhoto(content);
        $('#tagsText').val('');
      }
      if(type === 'comment'){
        $scope.addComment();
        event.preventDefault();
      }
      if(type === 'edit'){
        console.log('rediting');
        toggle.edit = !toggle.edit;
        $scope.editComment(content, cid);
        $scope.add = !$scope.add;
        event.preventDefault();
      }
      if(type === 'titleEdit'){
        $scope.titleEdit = false;
        $scope.editTitle();
      }
      if(type === 'caption'){
        $scope.captionEdit = false;
        $scope.editCaption();
      }
    }
    if(event.keyCode == 32){
      if(type === 'tags'){
        event.preventDefault();
        $('#tagsText').val('');
        if($scope.photo.tags.indexOf(content) == -1) {
          $scope.editPhoto(content);
        }
      }
    }
  };

  $scope.shareEdit = function(user){
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&share=' + user, successCallback, errorCallback);

    function successCallback(data, status){
      console.log("SUCCESS!!!!");
    }

    function errorCallback(data, status){
      console.log("FAILURE!!!!");
    }
  };

  $scope.editTitle = function(){
    $scope.title.loading = true;

    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&title=' + $scope.photo.title, successCallback, errorCallback);

    function successCallback(data, status){
      $scope.title.loading = false;
      $scope.title.success = true;
      $scope.title.failure = false;
    }

    function errorCallback(data, status){
      $scope.title.loading = false;
      $scope.title.success = false;
      $scope.title.failure = true;
      if(status === 401 || status === 403){
        $window.location.assign('/');
      }
    }

  };

  $scope.editCaption = function(){
    console.log($scope.photo.summary);
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&caption=' + $scope.photo.summary, successCallback, errorCallback);

    function successCallback(data, status){
      console.log("Success!!!!");
    }

    function errorCallback(data, sttus){
      cosole.log('Failrue !!!!')
    }
  }

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
      if(status === 401 || status === 403){
        $window.location.assign('/');
      }
    }

  };

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
  };

  $scope.editPhoto = function(content){
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&q=' + content, editPhotoCallback, errorCallback);

    function editPhotoCallback(data, status) {
      $scope.photo.tags.push(content);
    }
  };

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

  };

  $scope.deleteTag = function(tag){
    apiService.deleteTag($scope.photo.editurl, $scope.photo.id, $scope.photo.pid, tag, deleteTagCallback, errorCallback);

    function deleteTagCallback(data, status){
      var index = $scope.photo.tags.indexOf(tag);
      $scope.photo.tags.splice(index, index+1);
    }

  };


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
    $scope.comments.push(comment);
    scrollComments();
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
  };

  function errorCallback(data, status){
    if(status === 401 || status === 403){
      $window.location.assign('/');
    }
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
        if(status === 401 || status === 403){
          $window.location.assign('/');
        }
      }
    )
  };

  $scope.deletePhoto = function(){
    var r = confirm("Delete this photo?");
    if(r == true) {
      var params = '?pid=' + $scope.photo.pid;
      apiService.deletePhoto(params).then(
          function (data, status) {
            $location.path("/#/public");
          },
          function (data, status) {
            console.log('Deleting failed')
          }
      )
    }
  };
});
