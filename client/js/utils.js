/*
 * General utils.
 */

(function (registry) {

    'use strict';

    var cnst = registry.cnst;
    var utils = registry.utils = {};

    /* Create a function that extracts object attribute. */
    utils.attrGetter = function (attrName) {
        return function (obj) {
            return obj[attrName];
        };
    };

    /* Sort an array with sorting key extractor function. */
    utils.sortBy = function (array, func) {

        if (typeof(func) === 'string') {
            func = utils.attrGetter(func);
        }

        var keysArray = array.map(function (item, index) {
            return {key: func(item), index: index};
        });

        keysArray.sort(function (a, b) {
            if (a.key > b.key) {
                return 1;
            }
            if (a.key < b.key) {
                return -1;
            }
            return 0;
        });

        return keysArray.map(function (keyItem) {
            return array[keyItem.index];
        });
    };

    /* Convert array to a mapping. */
    utils.indexBy = function (array, func) {

        if (typeof(func) === 'string') {
            func = utils.attrGetter(func);
        }

        var ret = {};

        array.forEach(function (item) {
            ret[func(item)] = item;
        });

        return ret;
    };

    /* Randomly rearrange a sequence (Fisher-Yates). */
    utils.shuffle = function (array) {
        array = Array.apply(null, array);
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = array[i];
            array[i] = array[j];
            array[j] = t;
        }
        return array;
    };

    /* Make a promise that resolves to result. */
    utils.pResolve = function (result) {
        var d = ayepromise.defer();
        d.resolve(result);
        return d.promise;
    };

    /* Make a promise that is rejected with the error. */
    utils.pReject = function (error) {
        var d = ayepromise.defer();
        d.reject(error);
        return d.promise;
    };

    /* Make a promise that resolves in ``delay`` milliseconds. */
    utils.pDelay = function (delay) {
        var d = ayepromise.defer();
        setTimeout(d.resolve, delay);
        return d.promise;
    };

    /* Wait for multiple promises and return array of results. */
    utils.pAll = function (promises) {
        if (promises.length === 0) {
            return utils.pResolve([]);
        } else {
            var last = promises.pop();
            return utils.pAll(promises).then(function (results) {
                if (typeof(last.then) !== 'function') {
                    last = utils.pResolve(last);
                }
                return last.then(function (lastResult) {
                    results.push(lastResult);
                    return results;
                });
            });
        }
    };

    /* Join promises. */
    utils.pJoin = function () {
        var args = Array.apply(null, arguments);
        var func = args.pop();
        return utils.pAll(args).then(function (results) {
            return func.apply(this, results);
        });
    };

    /* Extract password from URL and remove it from location. */
    utils.extractPasswordFromUrl = function () {
        var url = window.location.href;
        var parts = url.split('?');
        var base = parts[0];
        var qs = parts[1];
        if (!qs) {return;}
        var fields = qs.split('&');
        var token;
        fields.forEach(function (f) {
            var t = f.split('=');
            var name = t[0];
            var value = t[1];
            if (name === 'auth') {
                token = value;
            }
        });
        try {
            var title = $('title').text();
            window.history.replaceState(title, title, base);
        } catch (err) {
            console.log('Old browser :(');
        }
        return token;
    };

    /* Parse multiline colon-separated data. */
    utils.parseData = function (data, fields) {
        var lines = data.split('\n')
            .filter(function (l) {return l && l[0] !== '#';});
        return lines.map(function (line) {
            var ret = {};
            var values = line.split(':');
            fields.forEach(function (field, index) {
                ret[field] = values[index];
            });
            return ret;
        });
    };

    /* The opposite of parseData. */
    utils.unparseData = function (items, fields) {
        return items.map(function (item) {
            return fields.map(function (field) {
                return item[field];
            }).join(':');
        }).join('\n');
    };

    /* Parse user list (). */
    utils.parseUserList = function (data) {
        return utils.parseData(data, ['id', 'htoken', 'email', 'name', 'role']);
    };

    /* Split data (like a public key) into multiple short lines. */
    utils.wrapData = function (data, maxlen) {
        var lines = [];
        while (data.length > maxlen) {
            lines.push(data.substr(0, maxlen));
            data = data.substr(maxlen);
        }
        lines.push(data);
        return lines.join('\n');
    };

    /* Merge the wrapped data back into one line. */
    utils.unwrapData = function (wrapped) {
        return wrapped.replace(/\n/g, '');
    };

    /* Form filled ballot and encrypt it with counter public key. */
    utils.fillBallot = function (ballotToken, voterToken, vote, counterPK) {
        var voteText = [ballotToken, voterToken, vote].join('\n');
        return registry.crypto.encrypt(voteText, counterPK);
    };

    /* Join and sign filled ballots. */
    utils.collectBallots = function (filledBallots) {
        return registry.crypto.sign(filledBallots.join(cnst.ballotsSeparator));
    };

    /* Extract votes from filled ballots.
     *
     * NOTE: Cryptography needs to be initialised before calling this function.
     */
    utils.unpackBallots = function (ballots) {
        return ballots.map(function (ballot) {
            var lines = registry.crypto.decrypt(ballot).split('\n');
            return {voterToken: lines[1], vote: lines[2]};
        });
    };

    /* Calculate vote results from votes and options. */
    utils.calculateResults = function (options, votes) {
        var cnt = {};
        options.forEach(function (opt) {
            cnt[opt] = 0;
        });
        votes.forEach(function (vote) {
            if (vote.vote in cnt) {
                cnt[vote.vote] += 1;
            }
        });
        var res = options.map(function (opt) {
            return {
                option: opt,
                votesCount: cnt[opt]
            };
        });
        return utils.sortBy(res, function (i) {return -i.votesCount;});
    };

    /* Create results bundle. */
    utils.makeResults = function (votes, results) {
        var resultsData = utils.unparseData(results, ['option', 'votesCount']);
        var votesData = utils.unparseData(votes, ['voterToken', 'vote']);
        var all = [resultsData, votesData].join(cnst.ballotsSeparator);
        return registry.crypto.sign(all);
    };

    /* Derive computed from observable by taking its attribute. */
    utils.koAttr = function (observable, attrName, defaultValue) {
        return ko.pureComputed(function () {
            var observableValue = observable();
            if (observableValue) {
                var attrValue = observableValue[attrName];
                if (attrValue !== undefined) {
                    return attrValue;
                }
            }
            return defaultValue;
        });
    };

    /* Derive computed from observable by taking its length. */
    utils.koLength = function (observable) {
        return utils.koAttr(observable, 'length', 0);
    };

})(this.registry);
