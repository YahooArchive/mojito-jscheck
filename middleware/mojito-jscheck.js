/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true, indent: 4 */

/*
 * Mojito middleware to check whether the user agent has JavaScript enabled.
 *
 * jscheck has three possible cases:
 *
 *  1. The incoming request has "&js=0" in the url. Definitely JavaScript
 *     is disabled. Set the "js" cookie to "0".
 *
 *  2. The incoming request has a "js" cookie set to "0". JS is definitely
 *     disabled. Set a <script> tag to remove the "js" cookie if JavaScript
 *     gets turned on.
 *
 *  3. We know nothing, but can assume JavaScript is on; otherwise case 1 would
 *     be triggered. Add a <noscript> tag with a redirect which includes
 *     "&js=0" in the url, which takes us to case 1 if JavaScript is off.
 *
 *  This middleware file handles the first case; the add-on in this package
 *  handles the rest.
 */

module.exports = function (midConfig) {
    'use strict';

    var Y = midConfig.Y,

        config = {
            enabled: true,
            param: 'js',
            cookie: {
                name: 'js'
            }
        };

    Y.mix(config, midConfig.store._appConfigStatic.jscheck, true, null, 0, true);

    return function (req, res, next) {
        var cookieValue, expiration;

        if (config.enabled &&
                req.query[config.param] === '0' &&
                (!req.cookies || req.cookies[config.cookie.name] !== '0')) {

            cookieValue = config.cookie.name + '=0';

            if (config.cookie.domain) {
                cookieValue += '; domain=' + config.cookie.domain;
            }

            // The "js" cookie will expire in 12 months. If the user agent
            // starts supporting JavaScript all of a sudden, the cookie will be
            // removed, so the exact value of the expiration date is not
            // absolutely critical...
            expiration = new Date();
            expiration.setFullYear(expiration.getFullYear() + 1);
            cookieValue += '; expires=' + expiration.toUTCString();

            res.setHeader('Set-Cookie', cookieValue);
        }

        next();
    };
};
