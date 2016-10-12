angular.module('urlFetcherApp', ['ngRoute'])

  .config(function ($routeProvider) {
    $routeProvider.when('/', {
      templateUrl: 'home.html',
      controller: 'HomeController'
    })
    .otherwise({
      redirectTo: '/'
    })
  })

  .service('Jobs', function ($http) {
    this.createJob = function (site) {
      return $http.post('/jobs', site).
      then(function (response) {
        return response;
      });
    }
    this.getJob = function (jobId) {
      var url = '/jobs/' + jobId;
      return $http.get(url).
      then(function (response) {
        return response;
      });
    }
  })

  .controller('HomeController', function ($scope, Jobs) {
    $scope.checkJobStatus = function (job) {
      Jobs.getJob(job.id).then(function (response) {
        $scope.statusMessage = response.data;
      }, function (response) {
        $scope.statusMessage = response.data.error;
      });
    }
    $scope.fetchUrl = function (site) {
      Jobs.createJob(site).then(function (response) {
        if (response.status === 201) {
          $scope.fetchMessage = 'Your job id is ' + response.data.jobId;
        }
      }, function (response) {
        $scope.fetchMessage = response.data.error;
      });
    }
  });
