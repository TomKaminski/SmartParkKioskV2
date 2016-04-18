(function () {
    'use strict';

    function loadingContentService($rootScope) {
        this.setIsLoading = function (name, value) {
            if (typeof $rootScope.loadingContainer === 'undefined') {
                $rootScope.loadingContainer = {}
            }
            $rootScope.loadingContainer[name] = value;
        }

        this.isContentLoading = function(name) {
            return $rootScope.loadingContainer[name];
        }
    }

    angular.module('app').service('loadingContentService',['$rootScope', loadingContentService]);
})();