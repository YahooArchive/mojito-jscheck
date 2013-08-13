/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint indent: 4 */
/*global YUI */

/**
 * Routines to report on whether the user agent has JavaScript disabled.
 *
 * @module yahoo.addons.jscheck
 */

YUI.add('yahoo.addons.jscheck', function (Y, NAME) {
    'use strict';

    var JS_IS_DISABLED = 'disabled',
        JS_IS_ENABLED = 'enabled',
        JS_IS_INDETERMINATE = 'indeterminate',

        config = {
            enabled: true,
            param: 'js',
            cookie: {
                name: 'js'
            }
        },

        jsCookieDestroyer,
        jsParamRemover,
        jsParamRegexp,

        initialized = false;

    /**
     * <strong>Access point:</strong> <em>ac.jscheck.*</em>
     * This server-side jscheck add-on allows you to easily determine
     * whether JavaScript is enabled or disabled on the client.
     * @class ac.jscheck
     * @constructor
     */
    function Addon(command, adapter, ac) {

        if (!initialized) {

            // Here, we compute a few things once, for better performance...

            Y.mix(config, ac.config.getAppConfig().jscheck, true, null, 0, true);

            if (config.enabled) {

                jsCookieDestroyer = '<script>' +
                    'YUI().use("cookie",function(Y){' +
                        'var now=new Date().getTime();' +
                        'Y.Cookie.remove("' + config.cookie.name + '",{' +
                            'domain:"' + config.cookie.domain + '",' +
                            'removeIfEmpty:true' +
                        '});' +
                    '});' +
                    '</script>';

                jsParamRemover = '<script>' +
                    'if(document.location.toString().indexOf("&' + config.param + '=0")>=0){' +
                        'document.location=document.location.toString().replace(/&' + config.param + '=0/ig,"");' +
                    '}' +
                    '</script>';

                jsParamRegexp = new RegExp('&' + config.param + '=([^&]*)');
            }

            initialized = true;
        }

        this.ac = ac;
        this.originalUrl = ac.http.getRequest().originalUrl;
    }

    Addon.prototype = {

        namespace: 'jscheck',

        /**
         * Indicates whether JavaScript has been disabled.
         * Enquiring mojits want to know.
         *
         * @method status
         * @param {ActionContext} ac
         * @protected
         */
        status: function () {
            var cookieValue, m;

            if (!config.enabled) {
                return JS_IS_INDETERMINATE;
            }

            cookieValue = this.ac.cookie.get(config.cookie.name.toLowerCase());
            if (cookieValue === '0') {
                return JS_IS_DISABLED;
            }

            m = this.originalUrl.match(jsParamRegexp);
            if (m && m[1] === '0') {
                return JS_IS_DISABLED;
            }

            return JS_IS_ENABLED;
        },

        /**
         * Depending on the status, runs certain actions, which in turn
         * can affect the reported status.
         *
         * @method run
         * @param {ActionContext} ac
         * @protected
         */
        run: function () {
            if (!config.enabled) {
                return;
            }

            var ac = this.ac,
                status = this.status(),
                params,
                redirectUrl,
                nojsRedirect;

            Y.log('JavaScript appears to be ' + status, 'info', NAME);

            if (status === JS_IS_DISABLED) {

                // The user is cookied as having javascript off or the "js"
                // parameter is set in the url. Thus, set a script to destroy
                // the cookie if JavaScript gets turned on. Also resets URL
                // to help CSF...

                ac.assets.addBlob(jsParamRemover, 'top');
                ac.assets.addBlob(jsCookieDestroyer, 'bottom');

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

            // Without the cookie or flag in url, we presume JS is enabled.
            // Thus, in a noscript tag, redirect to a url flagged as js=0.
            // That will trigger middleware and the former case.

            if (redirectUrl.indexOf('?') === -1) {
                redirectUrl += '?';
            } else {
                redirectUrl += '&';
            }

            redirectUrl += config.param + '=0';

            try {
                // Avoid XSS...
                redirectUrl = encodeURI(redirectUrl);
            } catch (e) {
                Y.log(e.message + '\n[redirectUrl was "' + redirectUrl + '"]',
                    'warn', NAME);
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
        'mojito-http-addon'
    ]
});
