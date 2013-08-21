/*jslint nomen:true, indent: 4 */
/*global YUI, YUITest, require, __dirname */

YUI.add('yahoo.middleware.mojito-jscheck-tests', function (Y, NAME) {
    'use strict';

    var A = YUITest.Assert,
        suite = new YUITest.TestSuite(NAME),

        midPath = require('path').join(__dirname, '../middleware/mojito-jscheck.js'),

        appConfig = {
            jscheck: {
                cookie: {
                    domain: '.yahoo.com'
                }
            }
        },

        midConfig = {
            Y: Y,
            store: {
                _appConfigStatic: appConfig
            }
        },

        mid;

    suite.add(new YUITest.TestCase({

        name: 'unit tests',

        'the middleware should just pass through if jscheck is disabled': function () {
            appConfig.jscheck.enabled = false;
            mid = require(midPath)(midConfig);

            var req = {},
                res = {},
                next = function () {
                    A.pass();
                };

            mid(req, res, next);
        },

        'js=0 is in the url, so the middleware should set the cookie': function () {
            appConfig.jscheck.enabled = true;
            mid = require(midPath)(midConfig);

            var headers = {},

                req = {
                    url: '/search?p=whatever&js=0',
                    cookies: {}
                },

                res = {
                    setHeader: function (key, val) {
                        headers[key.toLowerCase()] = val;
                    }
                },

                next = function () {
                    A.areSame(headers.hasOwnProperty('set-cookie'), true);
                    A.areSame(0, headers['set-cookie'].indexOf('js=0;domain=.yahoo.com;expires='));
                };

            mid(req, res, next);
        }
    }));

    YUITest.TestRunner.add(suite);
});
