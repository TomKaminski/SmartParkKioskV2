(function () {
    'use strict';

    function payuReturnService() {

        this.isFromShop = false;
        this.isErrorFromShop = false;

        this.shouldRedirectToShop = function() {
            return this.isFromShop;
        }

        this.shouldShowShopError = function () {
            if (this.isErrorFromShop) {
                this.isErrorFromShop = false;
                this.isFromShop = false;
                return true;
            }
            return false;
        }
    }

    angular.module('app').service('payuReturnService', payuReturnService);
})();