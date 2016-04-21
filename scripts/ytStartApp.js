angular.module('ytStartApp', ['ytVideos','ngRoute','ui.router'])
  .config(['$urlRouterProvider','$stateProvider', 
    function($urlRouterProvider,$stateProvider) {
      $stateProvider
        .state("home", {
          url: "/home",
          templateUrl: 'SearchList.html'
        })
        .state("play", {
          url: "/play?videoId",
          templateUrl: 'playVideo.html',  
        })
    }])
  .run([function () {
}])