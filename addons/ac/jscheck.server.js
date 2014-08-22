/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true, stupid: true, indent: 4 */
/*global YUI */

/**
 * Routines to report on whether the user agent has JavaScript disabled.
 *
 * @module mojito-jscheck-addon
 */

YUI.add('mojito-jscheck-addon', function (Y, NAME) {
    'use strict';

    var JS_IS_DISABLED = 'disabled',
        JS_IS_ENABLED = 'enabled',
        JS_IS_INDETERMINATE = 'indeterminate',

        path = require('path'),
        fs = require('fs'),
        qs = require('querystring'),
        UglifyJS = require('uglify-js'),

        config = {
            enabled: true,
            param: 'js',
            cookie: {
                name: 'js'
            }
        },

        nojsHandler,
        jsParamRegexp,

        initialized = false;

    /**
     * <strong>Access point:</strong> <em>ac.jscheck.*</em>
     * This server-side jscheck add-on allows you to easily determine
     * whether JavaScript is enabled or disabled on the client.
     * @class mojito.addons.ac.jscheck
     * @constructor
     */
    function Addon(command, adapter, ac) {
        var code, req;

        if (!initialized) {

            // Here, we compute a few things once, for better performance.
            // Note: the configuration is checked in the middleware, so we
            // don't need to duplicate that code...

            Y.mix(config, ac.config.getAppConfig().jscheck, true, null, 0, true);

            if (!config.hasOwnProperty('enabled') || config.enabled) {

                code = fs.readFileSync(path.join(__dirname, '../../assets/jscheck-manual-inline.js'), 'utf-8');

                if (!config.hasOwnProperty('jsmin') || config.jsmin) {
                    try {
                        code = UglifyJS.minify(code, { fromString: true }).code;
                    } catch (e) {
                        Y.log(e.message, 'warn', NAME);
                    }
                }

                nojsHandler = '<script>(' + code + ')(' + JSON.stringify(config) + ');</script>';

                jsParamRegexp = new RegExp('[?&]' + encodeURIComponent(config.param) + '=([^&]*)');
            }

            initialized = true;
        }

        this.ac = ac;
        this.originalUrl = ac.http.getRequest().url;

        req = adapter.req;

        if (!req.globals) {
            req.globals = {};
        }

        if (req.globals['jscheck.addon']) {
            // Return our per-request singleton.
            return req.globals['jscheck.addon'];
        }
    }

    Addon.prototype = {

        namespace: 'jscheck',

        /**
         * Indicates whether the user agent has JavaScript enabled.
         *
         * @method status
         * @return {String}
         */
        status: function () {
            if (config.hasOwnProperty('enabled') && !config.enabled) {
                return JS_IS_INDETERMINATE;
            }

            var v, o, m;

            v = this.ac.cookie.get(encodeURIComponent(config.cookie.name));

            if (config.cookie.sub) {
                o = qs.parse(v);
                v = o[config.cookie.sub];
            }

            if (v === '0') {
                return JS_IS_DISABLED;
            }

            m = this.originalUrl.match(jsParamRegexp);

            if (m && m[1] === '0') {
                return JS_IS_DISABLED;
            }

            return JS_IS_ENABLED;
        },

        /**
         * Depending on the status, runs certain actions, which in turn can
         * affect the reported status for that user in future requests...
         *
         * @method run
         */
        run: function () {
            // This add-on is a singleton. By doing the following, we ensure
            // that subsequent calls to the run() method will not do anything...
            this.run = function () {};

            if (config.hasOwnProperty('enabled') && !config.enabled) {
                return;
            }

            var ac = this.ac,
                status = this.status(),
                params,
                redirectUrl,
                nojsRedirect;

            Y.log('JavaScript appears to be ' + status, 'debug', NAME);

            if (status === JS_IS_DISABLED) {
                ac.assets.addBlob(nojsHandler, 'bottom');
                return;
            }

            // Do not redirect if the request comes from track.corp...
            // For more info, see bz#6124384 Note: This is Yahoo!-specific.
            // Remove when the aforementioned ticket has been closed!

            params = ac.params.url();
            if (params.hasOwnProperty('ultdebug') ||
                    params.hasOwnProperty('yhldebug')) {
                return;
            }

            redirectUrl = this.originalUrl;

            if (redirectUrl.indexOf('?') === -1) {
                redirectUrl += '?';
            } else {
                redirectUrl += '&';
            }

            redirectUrl += encodeURIComponent(config.param) + '=0';

            try {
                // Avoid XSS, but avoid double encoding...
                redirectUrl = encodeURI(redirectUrl).replace(/%25/g, '%');
            } catch (e) {
                Y.log(e.message + '\n[redirectUrl was "' + redirectUrl + '"]', 'warn', NAME);
                return;
            }

            nojsRedirect = '<noscript><meta http-equiv="refresh" content="0;url=' + redirectUrl + '"></noscript>';

            ac.assets.addBlob(nojsRedirect, 'prefetch');
        }
    };

    Y.mojito.addons.ac.jscheck = Addon;

}, '0.1.0', {
    requires: [
        'mojito',
        'mojito-config-addon',
        'mojito-params-addon',
        'mojito-cookie-addon',
        'mojito-assets-addon',
        'mojito-http-addon',
        'escape'
    ]
});
