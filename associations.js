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



// A B C D
// 4*3*2=24

// The set of subsets of {1} is {{}, {1}}
// For {1, 2}, take {{}, {1}}, add 2 to each subset to get {{2}, {1, 2}} and take the union with {{}, {1}} to get {{}, {1}, {2}, {1, 2}}
// Repeat till you reach n

var factorial = function(number) {
    if (number === 0) {
        return 1;
    } else {
        return number * factorial(number - 1);
    }
}

var Apriori = function() {
    var transactions = database.getAllTransactions();
    var allSets = [];
    for (var i = 0; i < transactions.length; i++) {
        allSets = allSets.concat(getItemSets(transactions[i].items));
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

var getItemSets = function(set) {
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

//HANDLE LARGE AMOUNTS OF DATA USING THREADING
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

var isFrequent = function(set) {
    return database.query(set).length > 1;
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

var findSubsets = function(nextSet) {
    var allSets = [];
    allSets.push(nextSet);

    var nextItem = nextSet.pop();
    allSets.push([nextItem]);
    if (nextSet.length) {
        for (var i = 0; i < nextSet.length; i++) {
            allSets.push([].concat(nextItem, nextSet[i]));
        }

        allSets.concat(findSubsets(nextSet));
    }

    return allSets;
}

var getAllItemSetPermutations = function() {
    var permutations = [];
    var transactions = database.getAllTransactions();
    for (var i = 0; i < transactions.length; i++) {
        var items = transactions[i].items;
        var permutations = getPerumatations(items);
        permutations.push();
    }

    return permutations;
}

var getPerumatations = function(items) {
    var newPermutations = [];
    for (var i = 0; i < items.length; i++) {
        for (var j = i + 1; j < items.length; j++) {
            newPermutations.push([items[i], items[j]]);
        }
    }
}
