(function () {
    'use strict';

    function orderService() {

        this.orderModel = {
            email: null,
            charges: 1,
            name: null,
            lastName: null,
            price: null,
            pricePerCharge: null,
            payMethod: null,
            userId: null,
            cardData: {
                cardNumber : null,
                cardCVV : null,
                cardExpirationDate: null,
                cardType : null
            }
        }

        this.pricesList = null;
        this.defaultPrice = {};

        this.clearModel = function(){
            this.orderModel = {
                email: null,
                charges: 1,
                name: null,
                lastName: null,
                price: null,
                pricePerCharge: null,
                payMethod: null,
                userId: null,
                cardData: {
                    cardNumber : null,
                    cardCVV : null,
                    cardExpirationDate: null,
                    cardType : null
                }
            }
        }
    }

    angular.module('app').service('orderService', orderService);
})();