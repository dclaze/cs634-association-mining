// Given a list of transations
//  First group by item

// Calculate Frequency
//  # of occurences / # of transactions

// Calculate the support of an association
//  # of occurences of all items / # of transactions

// Calculate the confidence of an association
//  support of association / support of item

// Apriori Principle
// - Any subset of a frequent itemset must be frequent.
// - Any superset of a non-frequent itemset must be non-frequent.

// Frequent item set === more than occurences

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

function FakeTransactionDatabase() {
    this.index = 0;
    this.transactions = [];
}
FakeTransactionDatabase.prototype.getNewTransactionId = function() {
    return ++this.index;
}
FakeTransactionDatabase.prototype.store = function(itemsArgsArray) {
    var newItems = [];
    for (var i = 0; i < arguments.length; i++) {
        newItems.push(arguments[i]);
    }
    this.transactions.push({
        id: this.getNewTransactionId(),
        items: newItems
    });

    return this;
};

FakeTransactionDatabase.prototype.query = function(items) {
    return this.transactions.filter(function(transaction) {
        return items.every(function(item) {
            return transaction.items.indexOf(item) != -1;
        });
    })
};

FakeTransactionDatabase.prototype.getAllDistinctItems = function() {
    var distinctItems = {};
    this.transactions.forEach(function(transaction) {
        transaction.items.forEach(function(item) {
            distinctItems[item] = 0;
        })
    });

    return distinctItems;
};

FakeTransactionDatabase.prototype.getAllTransactions = function() {
    return this.transactions;
};

FakeTransactionDatabase.prototype.getAllItems = function() {
    return this.transactions.map(function(transaction) {
        return transaction.items;
    }).reduce(function(a, b) {
        return a.concat(b);
    });
};

var database = new FakeTransactionDatabase();
database.store("B", "C")
    .store("B", "C", "D")
    .store("A", "D")
    .store("A", "B", "C", "D")
    .store("C", "D")
    .store("C", "D", "E")
    .store("A", "B");


var Apriori = function() {
    var transactions = database.getAllTransactions();
    var allSets = [];
    for (var i = 0; i < transactions.length; i++) {
        allSets = allSets.concat(getAllItemSets(transactions[i].items));
    }

    var maxItemSet = Math.max.apply(Math, allSets.map(function(set) {
        return set.length;
    }));

    var frequentSets = [];

    for (var k = 0; k < maxItemSet; k++) {
        var kItemSets = getKItemSets(allSets, k + 1).distinctSets();
        for (var i = 0; i < kItemSets.length; i++) {
            var set = kItemSets[i];
            if (isFrequent(set))
                frequentSets.push(set);
            else
                removeNonFrequentSuperSets(allSets, set);
        }
    }

    var allAssociationRules = getAssociationRules(frequentSets);

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

var isFrequent = function(set) {
    return database.query(set).length > 1;
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
var getAssociationRules = function(frequentSets) {
    var index = frequentSets.length;
    var rulePairs = [];
    while (index > -1) {
        var leftSet = frequentSets.pop();
        for (var i = 0; i < frequentSets.length; i++) {
            var rightSet = frequentSets[i];

            var associativity = calculateItemSetAssociativity(leftSet, rightSet);

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

var calculateItemSetSupport = function(itemSet) {
    var numberOfTransactions = database.getAllTransactions().length;
    var numberOfContainingTransactions = database.query(itemSet).length;
    return numberOfContainingTransactions / numberOfTransactions;
};

var calculateItemSetAssociativity = function(leftSet, rightSet) {
    var totalSetSupport = calculateItemSetSupport([].concat(leftSet, rightSet));
    var leftSetSupport = calculateItemSetSupport(leftSet);
    return {
        support: totalSetSupport,
        confidence: totalSetSupport / leftSetSupport
    }
}
