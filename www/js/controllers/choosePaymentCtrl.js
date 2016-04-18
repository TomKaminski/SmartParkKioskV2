(function () {
    'use strict';

    function choosePaymentCtrl(apiFactory, $state, orderService, loadingContentService) {
        var self = this;

        self.paymentMethod = orderService.orderModel.payMethod;

        self.orderInfo = orderService.orderModel;

        self.cancelOrder = function(){
            orderService.clearModel();
            $state.go('app.homepage');
        }

        self.goToStepOne = function(){
            $state.go('app.main');
        }

        self.goToStepThree = function(){
            if(orderService.orderModel.payMethod == 2){
                $state.go('app.cardPayment');
            }else if(orderService.orderModel.payMethod == 1){
                apiFactory.genericPost(
                    function () {
                        self.disableButton = true;
                        loadingContentService.setIsLoading('buyChargesLoader', true);
                    },
                    function (data) {
                        console.log(data);
                        window.location.replace(data.Result.RedirectUri);
                    },
                    function (data) {
                        if(!data.IsValid){
                            console.log(data);
                            self.disableButton = false;
                            loadingContentService.setIsLoading('buyChargesLoader', false);
                        }

                    },
                    function () {
                        self.disableButton = false;
                        loadingContentService.setIsLoading('buyChargesLoader', false);
                    },
                    apiFactory.apiEnum.ProcessPayment, {
                        Charges: orderService.orderModel.charges,
                        UserEmail: orderService.orderModel.email,
                        UserName: orderService.orderModel.name,
                        UserLastName: orderService.orderModel.lastName,
                        UserId: orderService.orderModel.userId
                    });
            }
        }

        self.updatePaymentMethod = function(value){
            orderService.orderModel.payMethod = value;
            self.paymentMethod = orderService.orderModel.payMethod;
            console.log(self.paymentMethod);
        }
    }

    angular.module('app').controller('choosePaymentCtrl', ['apiFactory','$state','orderService', 'loadingContentService',choosePaymentCtrl]);
})();
