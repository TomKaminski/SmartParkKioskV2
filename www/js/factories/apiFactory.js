(function () {
    'use strict';

    function apiFactory($http, $q, CONFIG, notificationService) {

        var apiEnum = {
            CheckAccount: "/Account/CheckAccount",
            GetShopPrices: "/Account/GetPrices",
            ProcessPayment: "/Payment/ProcessPayment"
        }

        function get(apiUrl, options) {
            var defered = $q.defer();
            $http.get(CONFIG.apiGlobalUrl + apiUrl, { params: options })
                .success(function (data) {
                    defered.resolve(data);
                }).error(function () {
                defered.reject(false);
            });
            return defered.promise;
        }


        function post(apiUrl, data, options) {
            var defered = $q.defer();
            if (options != undefined) {
                $http.post(CONFIG.apiGlobalUrl + apiUrl, data, options)
                    .success(function (data) {
                        defered.resolve(data);
                    }).error(function (err) {
                    defered.reject(err);
                });
            } else {
                $http.post(CONFIG.apiGlobalUrl + apiUrl, data)
                    .success(function (data) {
                        defered.resolve(data);
                    }).error(function (err) {
                    defered.reject(err);
                });
            }

            return defered.promise;
        }


        function genericPost(funcBefore, funcAfterValid, funcAfter, funcError, apiEnum, postData, options) {
            funcBefore();
            post(apiEnum, postData, options).then(function (data) {
                if (data.IsValid) {
                    funcAfterValid(data);
                }
                funcAfter(data);
                notificationService.showNotifications(data);
            }, function (e) {
                console.log(e);
                funcError();
                notificationService.showNotification("Wystąpił błąd podczas łączenia się z serwerem.", false);
            });
        }

        function genericGet(funcBefore, funcAfterValid, funcAfter, funcError, apiEnum, params) {
            funcBefore();
            get(apiEnum, params).then(function (data) {
                if (data.IsValid) {
                    funcAfterValid(data);
                }
                funcAfter(data);
                notificationService.showNotifications(data);
            }, function (e) {
                console.log(e);
                funcError();
                notificationService.showNotification("Wystąpił błąd podczas łączenia się z serwerem.", false);
            });
        }

        return {
            get: get,
            apiEnum: apiEnum,
            post: post,
            genericPost: genericPost,
            genericGet: genericGet
        };

        return {
            get: get,
            apiEnum: apiEnum,
            post: post,
            genericPost: genericPost,
            genericGet: genericGet
        };
    }

    angular.module('app').factory('apiFactory', ['$http', '$q','CONFIG','notificationService', apiFactory]);
})();