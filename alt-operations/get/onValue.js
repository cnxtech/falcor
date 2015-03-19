var lru = require('./../util/lru');
var clone = require('./../util/clone');
var promote = lru.promote;
var support = require('../util/support');
var updateTrailingNullCase = support.updateTrailingNullCase;
module.exports = function onValue(model, node, path, depth, seedOrFunction, outerResults, permuteRequested, permuteOptimized, permutePosition, outputFormat) {
    var i, len, k, key, curr, prev, prevK;
    if (node) {
        promote(model, node);
    }


    if (permuteRequested) {
        if (permuteRequested[permuteRequested.length - 1] !== null) {
            updateTrailingNullCase(path, depth, permuteRequested);
        }
        outerResults.requestedPaths.push(permuteRequested);
        outerResults.optimizedPaths.push(permuteOptimized);
    }
    switch (outputFormat) {

        case 'Values':
            if (typeof seedOrFunction === 'function') {
                seedOrFunction({path: permuteRequested, value: clone(model, node)});
            }
            break;

        case 'PathMap':
            if (seedOrFunction) {
                curr = seedOrFunction;
                for (i = 0, len = permuteRequested.length - 1; i < len; i++) {
                    k = permuteRequested[i];
                    if (k === null) {
                        continue;
                    }
                    if (!curr[k]) {
                        curr[k] = {};
                    }
                    prev = curr;
                    prevK = k;
                    curr = curr[k];
                }
                k = permuteRequested[i];
                if (k !== null) {
                    curr[k] = clone(model, node);
                } else {
                    prev[prevK] = clone(model, node);
                }
            }
            break;

        case 'JSON':
            if (seedOrFunction) {

                if (permutePosition.length) {
                    if (!seedOrFunction.json) {
                        seedOrFunction.json = {};
                    }
                    curr = seedOrFunction.json;
                    for (i = 0, len = permutePosition.length - 1; i < len; i++) {
                        k = permutePosition[i];
                        key = permuteRequested[k];

                        if (!curr[key]) {
                            curr[key] = {};
                        }
                        curr = curr[key];
                    }

                    // assign the last
                    k = permutePosition[i];
                    key = permuteRequested[k];
                    curr[key] = clone(model, node);
                } else {
                    seedOrFunction.json = clone(model, node);
                }
            }
            break;

        case 'JSONG':
            if (seedOrFunction) {
                curr = seedOrFunction.jsong;
                for (i = 0, len = permuteOptimized.length - 1; i < len; i++) {
                    key = permuteOptimized[i];

                    if (!curr[key]) {
                        curr[key] = {};
                    }
                    curr = curr[key];
                }

                // assign the last
                key = permuteOptimized[i];
                curr[key] = clone(model, node);
                if (permuteRequested) {
                    seedOrFunction.paths.push(permuteRequested);
                }
            }
            break;
    }
};


