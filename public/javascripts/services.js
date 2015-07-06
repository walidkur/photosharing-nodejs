var photoApp = angular.module('photoApp');

photoApp.factory('apiService', function($http, $q){

  var apiService = {

    getFeed: function(params, successCallback, errorCallback){

        console.log("SERVICE!!!!");
        var promise = $http({
          method:'GET',
          url:'/api/feed' + params
        }).success(function(data, status){
          successCallback(data, status);
        }).error(function(data, status){
          errorCallback(data, status);
        });

        return promise;
    },

    getPhoto: function(params, successCallback, errorCallback){
        var promise = $http({
          method:'GET',
          url:'/api/photo' + params
        }).success(function(data, status){
           successCallback(data, status);
        }).error(function(data, status){
          errorCallback(data, status);
        });

        return promise
    },

    getComments: function(params, successCallback, errorCallback){
        var promise = $http({
          method:'GET',
          url:'/api/comments' + params
        }).success(function(data, status){
          successCallback(data, status);
        }).error(function(data, status){
          errorCallback(data, status);
        });

        return promise;
    },

    getProfiles: function(comments, successCallback, errorCallback){
        var promises = [];
        angular.forEach(comments, function(comment){

          var promise = $http({
            method:'GET',
            url:'/api/profile' + '?uid=' + comment.uid
          }).success(function(data, status){
            successCallback(data, status, comment);
          }).error(function(data, status){
            errorCallback(data, status);
          });

          promises.push(promise);
        });

        return $q.all(promises);

    },

    getProfile: function(params, successCallback, errorCallback){
      var promise = $http({
        method:'GET',
        url: '/api/profile' + params,
      }).success(function(data, status){
        successCallback(data, status);
      }).error(function(data, status){
        errorCallback(data, status);
      });
        return promise;
    },

    addComment: function(content, params, successCallback, errorCallback){
      var promise = $http({
        method:'POST',
        url:'/api/comments' + params,
        data: {comment: content}
      }).success(function(data, status){
        successCallback(data, status);
      }).error(function(data, status){
        errorCallback(data, status);
      });
      return promise;
    },

    postLike: function(params){
      var promise = $http({
        method:'post',
        url: '/api/like' + params
      });
      return promise;
    },

    deleteComment: function(params){
      var promise = $http({
        method:'DELETE',
        url: '/api/comments' + params
      });
      return promise;
    },

    logout: function(errorCallback){
      $http.post('/logout')
           .error(errorCallback);
    }


  };

  return apiService;

});
