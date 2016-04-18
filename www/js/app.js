(function () {
    'use strict';

    var app = angular.module('app', ['ui.router', 'ngMessages','ngTouch', 'angular-virtual-keyboard']);

    app.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $locationProvider.html5Mode(false);

        $stateProvider
            .state('app', {
                abstract: true,
                url: "/app",
                views: {
                    'layout': {
                        templateUrl: 'templates/layout.html',
                        controller: "layoutCtrl",
                        controllerAs: "layout"
                    }
                },
                cache: false
            })
            .state('app.homepage', {
                url: "/home",
                cache: false,
                views: {
                    'content': {
                        templateUrl: 'templates/home.html',
                        controller: "homepageCtrl",
                        controllerAs: "home"
                    }
                }
            })
            .state('app.homepage.alias', {
                url: "/",
                cache: false
            })
            .state('app.main', {
                url: "/main",
                cache: false,
                views: {
                    'content': {
                        templateUrl: 'templates/main.html',
                        controller: "mainCtrl",
                        controllerAs: "main"
                    }
                }
            })
            .state('app.choosePayment', {
                url: "/choosePayment",
                cache: false,
                views: {
                    'content': {
                        templateUrl: 'templates/choosePayment.html',
                        controller: "choosePaymentCtrl",
                        controllerAs: "cp"
                    }
                }
            })
            .state('app.cardPayment', {
                url: "/cardPayment",
                cache: false,
                views: {
                    'content': {
                        templateUrl: 'templates/cardPayment.html',
                        controller: "cardPaymentCtrl",
                        controllerAs: "cap"
                    }
                }
            })
            .state('app.thanks', {
                url: "/thanks",
                cache: false,
                views: {
                    'content': {
                        templateUrl: 'templates/thanks.html',
                        controller: "thanksCtrl",
                        controllerAs: "thanks"
                    }
                }
            })

        $urlRouterProvider.otherwise("/app/home");
    });

    app.constant('CONFIG', {
        apiGlobalUrl: "http://smartparkath.azurewebsites.net/Api",
        ConnectivityProblemMessage: "Wystąpił błąd połączenia, sprawdź łączność z internetem.",
        notificationEnum: {
            "error": "error",
            "success": "success"
        }
    });

    app.run(function ($rootScope) {
        $rootScope.loadingContainer = {};
    });
})();

