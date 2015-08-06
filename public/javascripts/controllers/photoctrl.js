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
  var tagsCount = 0;
  var editCount = 0;

  function commentEditOpen(){
    for(var i = 0; i < $scope.comments.length; i++){
      var comment = $scope.comments[i];
      console.log(comment.edit);
      if(comment.edit == true){
        console.log("Returning", comment.cid);
        return comment.cid;
      }
    }
    console.log("returning false");
    return false;
  }


  $('html').click(function(e){
    var cid;
    console.log("click");
    if($scope.meta && e.target != $('#tagsText')[0]){
      if(tagsCount > 0) {
        $scope.meta = !$scope.meta;
        $('#tagsText').val('');
        tagsCount = 0;
        $scope.$digest();
      } else {
        tagsCount++;
      }
    }
    cid = commentEditOpen();
    if((cid = commentEditOpen()) && (e.target != $('#editText' + cid)[0])){
      if(editCount > 0) {
        angular.forEach($scope.comments, function (comment) {
          if (comment.cid == cid) {
            comment.edit = false;
            $scope.$digest();
          }
        })
        editCount = 0;
      } else {
        editCount++;
      }
    }
  });

  $scope.peopleSearch = function(){
    var people = $scope.shareModel;
    if(people == ''){
      $scope.peopleList = [];
    } else {
      $http.get('/api/searchPeople?q='+people).then(function(response){
        var people = response.data.persons;

        $scope.peopleList = people;
      })
    }
  }

  $scope.shareClick = function(index){
    $scope.shareEdit($scope.peopleList[index].id);
    $scope.shareModel = '';
    $scope.peopleList = [];
    $scope.share = false;
  }

  $scope.change = function(event, type, content, cid, toggle){
    if((event.keyCode == 13 || event.keyCode == 10) && (event.shiftKey != 1)){
      if(type === 'tags'){
        console.log("New tags are: " + content);
        $scope.editPhoto(content);
        $('#tagsText').val('');
      }
      if(type === 'comment'){
        console.log("New comment is: " + content);
        $scope.addComment();
      }
      if(type === 'edit'){
        console.log("New Edit is: " + content);
        toggle.edit = !toggle.edit;
        $scope.editComment(content, cid);
        $scope.add = !$scope.add;
      }
    }
    if(event.keyCode == 32){
      console.log("Space");
      if(type === 'tags'){
        event.preventDefault();
        $('#tagsText').val('');
        if($scope.photo.tags.indexOf(content) == -1) {
          $scope.editPhoto(content);
        }
      }
    }
  }

  $scope.shareEdit = function(user){
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&share=' + user, successCallback, errorCallback);

    function successCallback(data, status){
      console.log("SUCCESS!!!!");
    }

    function errorCallback(data, status){
      console.log("FIALURE!!!!");
    }
  }

  $scope.editTitle = function(){
    $scope.title.loading = true;

    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&title=' + $scope.photo.title, successCallback, errorCallback);

    function successCallback(data, status){
      $scope.title.loading = false;
      $scope.title.success = true;
      $scope.title.failure = false;
      console.log(data);
    }

    function errorCallback(data, status){
      $scope.title.loading = false;
      $scope.title.success = false;
      $scope.title.failure = true;
      console.log(data);
      if(status === 401 || status === 403){
        $window.location.assign('/');
      }
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
    apiService.editPhoto($scope.photo.editurl, $scope.photo.id, '?pid=' + $scope.photo.pid + '&q=' + content, editPhotoCallback, errorCallback);

    function editPhotoCallback(data, status) {
      console.log("Pushing Data", data);
      $scope.photo.tags.push(content);
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

  $scope.deleteTag = function(tag){
    console.log("Delete tag: " + tag);
    apiService.deleteTag($scope.photo.editurl, $scope.photo.id, $scope.photo.pid, tag, deleteTagCallback, errorCallback);

    function deleteTagCallback(data, status){
      var index = $scope.photo.tags.indexOf(tag);
      $scope.photo.tags.splice(index, index+1);
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

  // $scope.editListener = function () {
  //
  //   $(document).ready(function(){
  //     if (setting === false) {
  //         setting = true;
  //         $("#addCommentText").css("display", "none");
  //         console.log("Hide");
  //
  //     }
  //     else {
  //       setting = false;
  //       $("#addCommentText").css("display", "block");
  //       console.log("Show");
  //     }
  //
  //   });
  //
  //
  // }


});
