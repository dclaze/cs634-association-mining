angular.module("AssociationMining", []);

angular.module("AssociationMining").controller("Main", function($scope, $http) {
    $scope.databases = [{
        name: 'One',
        value: 1
    }, {
        name: 'Two',
        value: 2
    }, {
        name: 'Three',
        value: 3
    }, {
        name: 'Four',
        value: 4
    }, {
        name: 'Five',
        value: 5
    }];
    $scope.support = 0;
    $scope.confidence = 0;
    $scope.clear = function() {
        $scope.transactions = [];
        $scope.associationRules = [];
    }
    $scope.loadDatabase = function() {
        $http.get("http://localhost:44544/loadDatabase/" + $scope.database)
            .success(function(transactions) {
                $scope.transactions = transactions;
                debugger
            });
    }
    $scope.getAssociations = function() {
        $http.get("http://localhost:44544/getAssociationRules/" + $scope.database + "/" + $scope.support + "/" + $scope.confidence)
            .success(function(rules) {
                $scope.associationRules = rules;
            });
    }
});
