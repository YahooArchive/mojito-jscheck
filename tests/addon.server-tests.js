/*jslint nomen: true, indent: 4 */
/*global YUI, YUITest */

YUI.add('mojito-jscheck-addon-tests', function (Y, NAME) {
    'use strict';

    var A = YUITest.Assert,
        Value = YUITest.Mock.Value,

        addon = 'mojito-jscheck-addon',

        suite = new YUITest.TestSuite(NAME),

        JS_IS_ENABLED = 'enabled',
        JS_IS_DISABLED = 'disabled',
        JS_IS_INDETERMINATE = 'indeterminate',

        command = {},

        adapter = {
            req: {}
        },

        ac;

    Y.applyConfig({
        useSync: true
    });

    suite.add(new YUITest.TestCase({

        name: 'unit tests',

        setUp: function () {

            Y.use(addon);

            ac = new Y.mojito.MockActionContext({
                addons: ['config', 'params', 'cookie', 'assets', 'http']
            });

            ac.config.expect({
                method: 'getAppConfig',
                returns: {
                    jscheck: {
                        enabled: true,
                        param: 'js',
                        cookie: {
                            name: 'js',
                            domain: '.yahoo.com'
                        }
                    }
                }
            });

            ac.params.expect({
                method: 'url',
                returns: {}
            });

            ac.http.expect({
                method: 'getRequest',
                returns: {
                    originalUrl: '/search?p=query'
                }
            });

            ac.cookie.expect({
                method: 'get',
                args: [Value.String],
                returns: null
            });

            ac.assets.expect({
                method: 'addBlob',
                args: [Value.String, Value.String]
            });

            ac.jscheck = new Y.mojito.addons.ac.jscheck(command, adapter, ac);
        },

        tearDown: function () {
            delete Y.Env._attached[addon];
        },

        'status() should return JS_IS_INDETERMINATE if jscheck is disabled': function () {

            ac.config.expect({
                method: 'getAppConfig',
                returns: {
                    jscheck: {
                        enabled: false
                    }
                }
            });

            // For this test only, we have to recreate the addon because the
            // config is cached after the first instantiation of the addon...
            delete Y.Env._attached[addon];
            Y.use(addon);
            ac.jscheck = new Y.mojito.addons.ac.jscheck(command, adapter, ac);

            A.areSame(JS_IS_INDETERMINATE, ac.jscheck.status());
            ac.jscheck.run();
        },

        'status() should return JS_IS_ENABLED by default (no js=0 in url and no "js" cookie set)': function () {

            A.areSame(JS_IS_ENABLED, ac.jscheck.status());
            ac.jscheck.run();
        },

        'status() should return JS_IS_DISABLED if the "js" cookie is set to "0"': function () {

            ac.cookie.expect({
                method: 'get',
                args: [Value.String],
                returns: '0'
            });

            A.areSame(JS_IS_DISABLED, ac.jscheck.status());
            ac.jscheck.run();
        },

        'status() should return JS_IS_DISABLED with js=0 in url': function () {

            ac.http.expect({
                method: 'getRequest',
                returns: {
                    originalUrl: '/search?p=query&js=0'
                }
            });

            // For this test only, we have to recreate the addon because the
            // URL is computed in the constructor (as a slight optimization)
            ac.jscheck = new Y.mojito.addons.ac.jscheck(command, adapter, ac);

            A.areSame(JS_IS_DISABLED, ac.jscheck.status());
        }
    }));

    YUITest.TestRunner.add(suite);
});
