
/* globals _ */

function isint (value) {
    return (parseFloat(value, 10) == parseInt(value, 10)) && !isNaN(value);
}

// Generates ``k`` combinations for the set of provided ``elements``.
function getCombinations (elements, min) {
    var c, kind, kinds;
    c = new CombinationGenerator(elements, min);
    kinds = [];
    while (true) {
        kind = c.next();
        if (!kind) break;
        kinds.push(kind);
    }
    return kinds;
}

function nextCombination (num, n, k) {
    var changed, finished, i, j, _ref;
    changed = finished = false;
    if (k > 0) {
        i = k - 1;
        while (!finished && !changed) {
            if (num[i] < (n - 1) - (k - 1) + i) {
                num[i]++;
                if (i < k - 1) {
                    for (j = _ref = i + 1; _ref <= k ? j < k : j > k; _ref <= k ? j++ : j--) {
                        num[j] = num[j - 1] + 1;
                    }
                }
                changed = true;
            }
            finished = i === 0;
            i--;
        }
    }
    return changed;
}

function CombinationGenerator(elements, k) {
    var i, _ref,
        _this = this;
    this.elements = elements;
    this.k = k;
    this.size = this.elements.length;
    this.numbers = [];
    _.times(this.k, function() {
        return _this.numbers.push(0);
    });
    for (i = 0, _ref = this.k; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        this.numbers[i] = i;
    }
    this.calledNext = false;
}

CombinationGenerator.prototype.next = function() {
    var _this = this;
    if (this.calledNext) {
        if (!nextCombination(this.numbers, this.size, this.k)) return false;
    }
    if (!this.calledNext) this.calledNext = true;
    return _.map(this.numbers, function(n) {
        return _this.elements[n];
    });
};
