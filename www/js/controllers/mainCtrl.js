(function () {
    'use strict';

    function mainCtrl(apiFactory, loadingContentService, $state, orderService) {
        var self = this;

        getPricesData();

        self.prices = orderService.pricesList;
        self.defaultPrice = orderService.defaultPrice;

        self.stepOneModel = {
            email: orderService.orderModel.email,
            charges: orderService.orderModel.charges,
            disableButton: false,
            pricePerCharge: orderService.orderModel.pricePerCharge != null ? orderService.orderModel.pricePerCharge : self.defaultPrice.PricePerCharge,
            price: orderService.orderModel.price != null?orderService.orderModel.price:self.defaultPrice.PricePerCharge*orderService.orderModel.charges
        }

        self.cancelOrder = function(){
            orderService.clearModel();
            $state.go('app.homepage');
        }


        self.goToStepTwo = function(){
            apiFactory.genericPost(
                function () {
                    self.stepOneModel.disableButton = true;
                    loadingContentService.setIsLoading('checkLogin', true);
                },
                function (data) {
                    orderService.orderModel.email = data.Result.Email;
                    orderService.orderModel.name = data.Result.Name;
                    orderService.orderModel.lastName = data.Result.LastName;
                    orderService.orderModel.userId = data.Result.Id;
                    orderService.orderModel.charges = self.stepOneModel.charges;
                    orderService.orderModel.pricePerCharge = self.stepOneModel.pricePerCharge;
                    orderService.orderModel.price = self.stepOneModel.price;
                    $state.go('app.choosePayment');
                },
                function (data) {
                    self.stepOneModel.disableButton = false;
                    loadingContentService.setIsLoading('checkLogin', false);
                },
                function () {
                    self.stepOneModel.disableButton = false;
                    loadingContentService.setIsLoading('checkLogin', false);
                },
                apiFactory.apiEnum.CheckAccount, { Email: self.stepOneModel.email });
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

        self.chargesOnChange = function () {
            computePrices();
        }

        function computePrices() {
            if (!computeFromUp()) {
                orderService.orderModel.pricePerCharge = self.defaultPrice.PricePerCharge;
                orderService.orderModel.price = self.defaultPrice.PricePerCharge * self.stepOneModel.charges;
                self.stepOneModel.price = orderService.orderModel.price;
                self.stepOneModel.pricePerCharge = orderService.orderModel.pricePerCharge;

            }
        }

        function computeFromUp() {
            if (orderService.pricesList!=null) {
                for (var i = orderService.pricesList.length; i > 0; i--) {
                    var price = orderService.pricesList[i - 1];
                    if (price.MinCharges <= self.stepOneModel.charges) {
                        orderService.orderModel.pricePerCharge = price.PricePerCharge;
                        orderService.orderModel.price = price.PricePerCharge * self.stepOneModel.charges;
                        self.stepOneModel.price = orderService.orderModel.price;
                        self.stepOneModel.pricePerCharge = orderService.orderModel.pricePerCharge;
                        return true;
                    }
                }
            }
            return false;
        }
    }

    angular.module('app').controller('mainCtrl', ['apiFactory', 'loadingContentService', '$state','orderService', mainCtrl]);
})();
