/*jslint nomen:true, indent: 4 */
/*global YUI, YUITest, require, __dirname */

YUI.add('yahoo.middleware.mojito-jscheck-tests', function (Y, NAME) {
    'use strict';

    var A = YUITest.Assert,
        suite = new YUITest.TestSuite(NAME),
        mid,

        midConfig = {
            Y: Y,
            store: {
                _appConfigStatic: {
                    jscheck: {
                        cookie: {
                            domain: '.yahoo.com'
                        }
                    }
                }
            }
        };

    suite.add(new YUITest.TestCase({

        name: 'unit tests',

        setUp: function () {
            var midPath = require('path').join(__dirname, '../middleware/mojito-jscheck.js');
            mid = require(midPath)(midConfig);
        },

        'js=0 is in the url, so the middleware should set the cookie': function () {
            var headers = {},

                req = {
                    url: '/search?p=whatever&js=0'
                },

                res = {
                    setHeader: function (key, val) {
                        headers[key.toLowerCase()] = val;
                    }
                };

            mid(req, res, function () {
                A.areSame(headers.hasOwnProperty('set-cookie'), true);
                A.areSame(0, headers['set-cookie'].indexOf('js=0;domain=.yahoo.com;expires='));
            });
        }
    }));

    YUITest.TestRunner.add(suite);
});
