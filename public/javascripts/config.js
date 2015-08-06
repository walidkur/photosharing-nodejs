var photoApp = angular.module('photoApp', ['ngSanitize', 'ngRoute', 'ngAnimate', 'ngCookies', 'ui.bootstrap', 'infinite-scroll']);

photoApp.config(function($routeProvider) {
  $routeProvider

  // route for the home page
  .when('/:type', {
    templateUrl : '/partials/page-home',
    resolve     : {
      feedData  : function($rootScope, $route, $window, apiService){

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
          var images = [];
          angular.forEach(feed, function(image){
            images.push(image.thumbnail);
          });
          return apiService.resolveImages(images)
            .then(function(){
              return feed;
            }, function(){
              console.log("Done, but with errors, check image source");
              return feed;
            });
        });


        function successCallback(data, status){
          feed = data;
        }

        function errorCallback(data, status){
          if(status === 401 || status === 403){
            $window.location.assign('/');
          }
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
          resolveData.comments.reverse();
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
          if(status === 401 || status === 403){
            $window.location.assign('/');
          }
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
          if(status === 401 || status === 403){
            $window.location.assign('/');
          }
        }
      }
    },
    controller  : 'profileController'
  })

  .otherwise({
    redirectTo: '/public'
  })
});
