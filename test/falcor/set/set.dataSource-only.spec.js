var falcor = require("./../../../lib/");
var Model = falcor.Model;
var noOp = function() {};
var LocalDataSource = require('./../../data/LocalDataSource');
var Cache = require('./../../data/Cache');
var strip = require('./../../cleanData').stripDerefAndVersionKeys;
var MaxRetryExceededError = require('./../../../lib/errors/MaxRetryExceededError');
var isAssertionError = require('./../../isAssertionError');
var toObservable = require('../../toObs');

describe('DataSource.', function() {
    it('should validate args are sent to the dataSource collapsed.', function(done) {
        var onSet = jest.fn(function(source, tmpGraph, jsonGraphFromSet) {
            return jsonGraphFromSet;
        });
        var dataSource = new LocalDataSource(Cache(), {
            onSet: onSet
        });
        var model = new Model({
            source: dataSource
        });

        toObservable(model.
            set({
                json: {
                    videos: {
                        1234: {
                            rating: 5
                        },
                        444: {
                            rating: 3
                        }
                    }
                }
            })).
            doAction(noOp, noOp, function() {
                expect(onSet).toHaveBeenCalledTimes(1);

                var cleaned = onSet.mock.calls[0][2];
                cleaned.paths[0][1] = cleaned.paths[0][1].concat();
                expect(cleaned).toEqual({
                    jsonGraph: {
                        videos: {
                            1234: {
                                rating: 5
                            },
                            444: {
                                rating: 3
                            }
                        }
                    },
                    paths: [
                        ['videos', [444, 1234], 'rating']
                    ]
                });
            }).
            subscribe(noOp, done, done);
    });

    it('should send off an empty string on a set to the server.', function(done) {
        var onSet = jest.fn(function(source, tmpGraph, jsonGraphFromSet) {
            return jsonGraphFromSet;
        });
        var dataSource = new LocalDataSource(Cache(), {
            onSet: onSet
        });
        var model = new Model({
            source: dataSource
        });
        toObservable(model.
            setValue('videos[1234].another_prop', '')).
            doAction(noOp, noOp, function() {
                expect(onSet).toHaveBeenCalledTimes(1);

                var cleaned = onSet.mock.calls[0][2];
                expect(cleaned).toEqual({
                    jsonGraph: {
                        videos: {
                            1234: {
                                another_prop: ''
                            }
                        }
                    },
                    paths: [
                        ['videos', 1234, 'another_prop']
                    ]
                });
            }).
            subscribe(noOp, done, done);
    });

    it('should send off undefined on a set to the server.', function(done) {
        var onSet = jest.fn(function(source, tmpGraph, jsonGraphFromSet) {
            return jsonGraphFromSet;
        });
        var dataSource = new LocalDataSource(Cache(), {
            onSet: onSet
        });
        var model = new Model({
            source: dataSource
        });
        toObservable(model.
            set({
                json: {
                    videos: {
                        1234: {
                            another_prop: undefined
                        }
                    }
                }
            })).
            doAction(noOp, noOp, function() {
                expect(onSet).toHaveBeenCalledTimes(1);

                var cleaned = onSet.mock.calls[0][2];
                expect(cleaned).toEqual({
                    jsonGraph: {
                        videos: {
                            1234: {
                                another_prop: {
                                    $type: 'atom'
                                }
                            }
                        }
                    },
                    paths: [
                        ['videos', 1234, 'another_prop']
                    ]
                });
            }).
            subscribe(noOp, done, done);
    });

    it('should report paths progressively.', function(done) {
        var onSet = function(source, tmpGraph, jsonGraphFromSet) {
            jsonGraphFromSet.jsonGraph.videos[444].rating = 5;
            return jsonGraphFromSet;
        };
        var dataSource = new LocalDataSource(Cache(), {
            onSet: onSet
        });
        var model = new Model({
            source: dataSource
        });

        var count = 0;
        toObservable(model.
            set({
                json: {
                    videos: {
                        1234: {
                            rating: 5
                        },
                        444: {
                            rating: 3
                        }
                    }
                }
            }).
            progressively()).
            doAction(function(x) {
                if (count === 0) {
                    expect(strip(x)).toEqual({
                        json: {
                            videos: {
                                1234: {
                                    rating: 5
                                },
                                444: {
                                    rating: 3
                                }
                            }
                        }
                    });
                }

                else {
                    expect(strip(x)).toEqual({
                        json: {
                            videos: {
                                1234: {
                                    rating: 5
                                },
                                444: {
                                    rating: 5
                                }
                            }
                        }
                    });
                }

                count++;
            }, noOp, function() {
                expect(count === 2).toBe(true);
            }).
            subscribe(noOp, done, done);
    });

    it('should return missing optimized paths with a MaxRetryExceededError.', function(done) {
        var onSet = function(source, tmpGraph, jsonGraphFromSet) {
            model.invalidate('videos[1234].title');
            return {
              jsonGraph: {
                videos: {
                  1234: {}
                }
              },
              paths: []
            };
        };
        var dataSource = new LocalDataSource(Cache(), {
            onSet: onSet
        });
        var model = new Model({
            source: dataSource
        });

        toObservable(model.
            set({
                json: {
                    videos: {
                        1234: {
                            title: 'Nowhere to be found'
                        }
                    }
                }
            })).
            doAction(noOp, function(e) {
              expect(MaxRetryExceededError.is(err), 'MaxRetryExceededError expected').toBe(true);
              expect(err.missingOptimizedPaths).toEqual([['videos', '1234', 'title']]);
            }).
            subscribe(noOp, function(e) {
              if (isAssertionError(e)) {
                return done(e);
              }
              return done();
            }, done.bind(null, new Error('should not complete')));
    });
});

