(function () {
    'use strict';

    function thanksCtrl($location, $state) {
        var self = this;

        self.isError = $location.search().error != null;

        self.startSwipeRight = function(){
            $state.go('app.homepage')
        }
    }

    angular.module('app').controller('thanksCtrl', ['$location','$state', thanksCtrl]);
})();
