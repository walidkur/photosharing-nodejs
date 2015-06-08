var photoApp = angular.module('photoApp', ['ngRoute']);

// configure our routes
photoApp.config(function($routeProvider) {
    $routeProvider

        // route for the home page
        .when('/', {
            templateUrl : 'pages/page-home.html',
            controller  : 'mainController'
        })

        // route for the about page
        .when('/photo', {
            templateUrl : 'pages/page-photo.html',
            controller  : 'photoController'
        })

        // route for the contact page
        .when('/profile', {
            templateUrl : 'pages/page-profile.html',
            controller  : 'profileController'
        });
});

// create the controller and inject Angular's $scope
photoApp.controller('mainController', function($scope) {
    // create a message to display in our view
    $scope.message = 'Everyone come and see how good I look!';
});

photoApp.controller('photoController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

photoApp.controller('profileController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});
