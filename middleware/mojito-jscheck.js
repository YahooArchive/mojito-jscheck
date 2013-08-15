/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true, indent: 4 */

module.exports = function (midConfig) {
    'use strict';

    var liburl = require('url'),

        Y = midConfig.Y,

        config = {
            enabled: true,
            param: 'js',
            cookie: {
                name: 'js'
            }
        };

    Y.mix(config, midConfig.store._appConfigStatic.jscheck, true, null, 0, true);

    if (!config.enabled) {
        // Very slight optimization...
        return function (req, res, next) {
            next();
        };
    }

    return function (req, res, next) {
        var query = liburl.parse(req.url, true).query,
            cookieHdrVal,
            expiration;

        if (query[config.param] === '0' &&
                (!req.cookies || req.cookies[config.cookie.name] !== '0')) {

            cookieHdrVal = config.cookie.name + '=0';

            if (config.cookie.domain) {
                cookieHdrVal += ';domain=' + config.cookie.domain;
            }

            // The "js" cookie will expire in 12 months. If the user agent
            // starts supporting JavaScript all of a sudden, the cookie will
            // be removed, so the exact value of the expiration date is not
            // absolutely critical...

            expiration = new Date();
            expiration.setFullYear(expiration.getFullYear() + 1);
            cookieHdrVal += ';expires=' + expiration.toUTCString();

            res.setHeader('Set-Cookie', cookieHdrVal);
        }

        next();
    };
};
