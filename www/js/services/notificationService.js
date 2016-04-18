(function () {
    'use strict';

    function notificationService() {

        this.showNotifications = function (model) {
            if (model != undefined) {
                if (model.SuccessNotifications != undefined) {
                    for (var i = 0; i < model.SuccessNotifications.length; i++) {
                        var $toastContent = $('<span>' + model.SuccessNotifications[i] + '</span>');
                        Materialize.toast($toastContent, 8000, 'toast-green');
                    }
                }

                if (model.ValidationErrors != undefined) {
                    for (var j = 0; j < model.ValidationErrors.length; j++) {
                        var $toastContentError = $('<span>' + model.ValidationErrors[j] + '</span>');
                        Materialize.toast($toastContentError, 8000, 'toast-red');
                    }
                }
            }
            
        }

        this.showNotification = function (text, isSuccess) {
            if (isSuccess) {
                var $toastContent = $('<span>' + text + '</span>');
                Materialize.toast($toastContent, 8000, 'toast-green');
            } else {
                var $toastContentError = $('<span>' + text + '</span>');
                Materialize.toast($toastContentError, 8000, 'toast-red');
            }
        }
    }

    angular.module('app').service('notificationService', notificationService);
})();