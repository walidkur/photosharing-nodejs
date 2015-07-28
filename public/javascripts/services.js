var photoApp = angular.module('photoApp');

photoApp.factory('apiService', function($http, $q){

  var apiService = {

    getFeed: function(params, successCallback, errorCallback){
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

    addComment: function(content, params, url, successCallback, errorCallback){
      var promise = $http({
        method:'POST',
        url:'/api/comments' + params,
        data: {comment: content,
               url: url}
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

    deleteComment: function(params, successCallback, errorCallback){
      var promise = $http({
        method:'DELETE',
        url: '/api/comments' + params
      }).success(function(data, status){
        successCallback(data, status);
      }).error(function(data, status){
        errorCallback(data, status);
      })
      return promise;
    },


    editComment: function(content, params, successCallback, errorCallback){
      var promise = $http({
        method:'PUT',
        url: '/api/comments' + params,
        data: {comment: content}
      }).success(function(data, status){
        successCallback(data, status);
      }).error(function(data, status){
        errorCallback(data, status);
      });
      return promise;
    },

    editPhoto: function(url, id, params, successCallback, errorCallback){
      var promise = $http({
        method:'PUT',
        url:'/api/photo' + params,
        data: {url: url,
               id: id}
      }).success(function(data, status){
        successCallback(data, status);
      }).error(function(data, status){
        errorCallback(data, status);
      });
      return promise;
    },

    logout: function(errorCallback){
      $http.post('/logout')
           .error(errorCallback);
    },

    deletePhoto: function(params){
      var promise = $http({
        method: 'DELETE',
        url: '/api/photo' + params
      });
      return promise;
    },

    resolveImages: function(images){

        var promises = [];

        angular.forEach(images, function(img){
          var deferred = $q.defer();
          var image = new Image();

          image.src = img

          if(image.completed){
            console.log("Completed");
            deferred.resolve();
          }

          image.addEventListener('load', function(){
            console.log("Loaded!" + image.src);
            deferred.resolve();
          });

          image.addEventListener('error', function(e){
            console.log("Error: " + e.message);
            console.log("with: " + img);

            deferred.reject();
          });

          promises.push(deferred.promise);

        });

        console.log(promises.length)

        return $q.all(promises);

    }
  };
    return apiService;

});
