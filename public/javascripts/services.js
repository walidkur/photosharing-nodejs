var photoApp = angular.module('photoApp');

photoApp.factory('apiService', function($http){

  var apiService = {

    getFeed: function(params){
        var promise = $http({
          method:'GET',
          url:'/api/feed' + params
        });
        return promise;
    },

    getPhoto: function(params){
        var promise = $http({
          method:'GET',
          url:'/api/photo' + params
        });
        return promise
    },

    getComments: function(){

    },

    getProfiles: function(){

    },

    getProfile: function(){

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
    }



  };

  return apiService;

});
