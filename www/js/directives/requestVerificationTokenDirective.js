angular.module('app').directive('requestVerificationToken', ['$http', function ($http) {
    return function (scope, element, attrs) {
        $http.defaults.headers.common["requestVerificationToken"] = attrs.requestVerificationToken || "no request verification token";
    };
}]);