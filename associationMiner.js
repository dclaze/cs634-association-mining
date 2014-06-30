var Q = require('Q');
Array.prototype.equals = function(otherArray) {
    return (this.length == otherArray.length) && this.every(function(item, i) {
        return item === otherArray[i];
    });
};

Array.prototype.distinctSets = function() {
    var sets = this;
    sets.forEach(function(item, i) {
        var index = sets.length - 1;
        while (index > -1) {
            var otherItem = sets[index];
            if (index != i && item.sort().equals(otherItem.sort())) {
                sets.splice(index, 1);
            }
            index--;
        }
    });
    return sets;
};

var AssociationMiner = function(database) {
    this.database = database;
    this.transactions = null;
};
AssociationMiner.prototype.mine = function(supportMin, confidenceMin, callback) {
    var self = this;
    this.getAllTransactions()
        .then(function(documents) {
            self.transactions = documents;
            var rules = Apriori(self, self.transactions, supportMin, confidenceMin);
            callback(rules);
        });
};


AssociationMiner.prototype.getAllTransactions = function() {
    var deferred = Q.defer();

    this.database.find(function(err, docs) {
        deferred.resolve(docs)
    });

    return deferred.promise;
};

AssociationMiner.prototype.query = function(query) {
    var deferred = Q.defer();

    this.database
        .find()
        .where("products._id")
        .all(query)
        .exec(function(err, docs) {
            deferred.resolve(docs);
        });

    return deferred.promise;
}

AssociationMiner.prototype.querySync = function(self, query) {
    return self.transactions.filter(function(transaction) {
        return query.every(function(id) {
            var result = transaction.products.map(function(product) {
                return product.name;
            }).indexOf(id) != -1;
            return result;
        });
    });
};

var Apriori = function(self, transactions, supportMinimum, confidenceMinimum) {
    var allSets = [];
    for (var i = 0; i < transactions.length; i++) {
        allSets = allSets.concat(getAllItemSets(transactions[i].products.map(function(product) {
            return product.name;
        })));
    }

    var maxItemSet = Math.max.apply(Math, allSets.map(function(set) {
        return set.length;
    }));

    var frequentSets = [];

    for (var k = 0; k < maxItemSet; k++) {
        var kItemSets = getKItemSets(allSets, k + 1).distinctSets();
        for (var i = 0; i < kItemSets.length; i++) {
            var set = kItemSets[i];
            if (isFrequent(self, set))
                frequentSets.push(set);
            else
                removeNonFrequentSuperSets(allSets, set);
        }
    }


    var allAssociationRules = getAssociationRules(self, frequentSets).filter(function(rule) {
        return rule.support > supportMinimum && rule.confidence > confidenceMinimum;
    });

    return allAssociationRules;
}

var getAllItemSets = function(set) {
    var result = [];
    var combos = function(item, set) {
        for (var i = 0; i < set.length; i++) {
            result.push([].concat(item, set[i]));
            combos([].concat(item, set[i]), set.slice(i + 1));
        }
    }
    combos([], set);

    return result;
}

var getKItemSets = function(allSets, k) {
    var index = allSets.length - 1;
    var kItemSet = [];
    while (index > -1) {
        if (allSets[index].length == k) {
            kItemSet.push.apply(kItemSet, allSets.splice(index, 1));
        }
        index--;
    }
    return kItemSet;
}

var isFrequent = function(self, set) {
    var isFrequent = self.querySync(self, set).length > 1;
    return isFrequent;
}

var removeNonFrequentSuperSets = function(allSets, nonFrequentSet) {
    for (var i = 0; i < nonFrequentSet.length; i++) {
        var index = allSets.length - 1;
        while (index > -1) {
            var nextSet = allSets[index];
            var overlap = nextSet.every(function(item) {
                return item == nonFrequentSet[i];
            });
            if (overlap)
                allSets.splice(index, 1);

            index--;
        }
    }
}

//TODO: HANDLE LARGE AMOUNTS OF DATA USING THREADING
var getAssociationRules = function(self, frequentSets) {
    var index = frequentSets.length;
    var rulePairs = [];
    while (index > -1) {
        var leftSet = frequentSets.pop();
        for (var i = 0; i < frequentSets.length; i++) {
            var rightSet = frequentSets[i];

            var associativity = calculateItemSetAssociativity(self, leftSet, rightSet);

            rulePairs.push({
                left: leftSet,
                right: rightSet,
                support: associativity.support,
                confidence: associativity.confidence
            });
        }
        index--;
    }

    return rulePairs;
}

var calculateItemSetSupport = function(self, itemSet) {
    var numberOfTransactions = self.transactions.length;
    var numberOfContainingTransactions = self.querySync(self, itemSet).length;
    return numberOfContainingTransactions / numberOfTransactions;
};

var calculateItemSetAssociativity = function(self, leftSet, rightSet) {
    var totalSetSupport = calculateItemSetSupport(self, [].concat(leftSet, rightSet));
    var leftSetSupport = calculateItemSetSupport(self, leftSet);
    return {
        support: totalSetSupport,
        confidence: totalSetSupport / leftSetSupport
    }
}

module.exports = AssociationMiner;
