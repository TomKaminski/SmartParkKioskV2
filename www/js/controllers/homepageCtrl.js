(function () {
    'use strict';

    function homepageCtrl($state, apiFactory, orderService, $location) {
        var self = this;

        getPricesData();

        self.startSwipeRight = function(){
            $state.go('app.main')
        }

        function getPricesData() {
            apiFactory.genericPost(
                function () {
                },
                function (data) {
                    initPricesData(data.Result);
                },
                function (data) {
                },
                function () {
                },
                apiFactory.apiEnum.GetShopPrices);
        }

        function initPricesData(data) {
            orderService.defaultPrice = data[0];
            if (data.length > 1) {
                orderService.pricesList = data.slice(1);
            }
        }
    }

    angular.module('app').controller('homepageCtrl', ['$state','apiFactory','orderService','$location', homepageCtrl]);
})();
