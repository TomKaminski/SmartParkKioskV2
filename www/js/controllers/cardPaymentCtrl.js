(function () {
    'use strict';

    function cardPaymentCtrl($state, $location, apiFactory, orderService) {
        var self = this;

        self.goToStepTwo = function(){
            $state.go('app.choosePayment')
        }

        self.cardModel = {
            cardCVV: null,
            cardNumber: null,
            expireDateYear: null,
            expireDateMonth: null
        }

        self.orderInfo = orderService.orderModel;

        self.cancelOrder = function(){
            orderService.clearModel();
            $state.go('app.homepage');
        }
    }

    angular.module('app').controller('cardPaymentCtrl', ['$state','$location','apiFactory','orderService',cardPaymentCtrl]);
})();
