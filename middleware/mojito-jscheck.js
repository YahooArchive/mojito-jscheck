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
        L = Y.Lang,

        config = {
            enabled: true,
            param: 'js',
            cookie: {
                name: 'js'
            }
        };

    //-- Use default configuration attributes if needed -----------------------

    Y.mix(config, midConfig.store._appConfigStatic.jscheck, true, null, 0, true);

    //-- Validate configuration -----------------------------------------------

    if (!L.isBoolean(config.enabled) ||
            !L.isString(config.param) ||
            !L.isObject(config.cookie) ||
            !L.isString(config.cookie.name) ||
            (config.cookie.hasOwnProperty('domain') &&
                !L.isString(config.cookie.domain))) {
        throw new Error('Invalid configuration');
    }

    config.param = L.trim(config.param);
    config.cookie.name = L.trim(config.cookie.name);

    if (config.cookie.domain) {
        config.cookie.domain = L.trim(config.cookie.domain);
    }

    if (!config.param.length ||
            !config.cookie.name.length ||
            (config.cookie.hasOwnProperty('domain') &&
                !config.cookie.domain.length)) {
        throw new Error('Invalid configuration');
    }

    //-- Return a NOOP middleware if jscheck is disabled ----------------------

    if (!config.enabled) {
        return function (req, res, next) {
            next();
        };
    }

    //-- Return a full featured middleware if jscheck is enabled --------------

    return function (req, res, next) {
        try {
            var query = liburl.parse(req.url, true).query,
                cookieHdrVal,
                expiration;

            if (query[config.param] === '0' &&
                    (!req.cookies || req.cookies[config.cookie.name] !== '0')) {

                cookieHdrVal = encodeURIComponent(config.cookie.name) + '=0';

                if (config.cookie.domain) {
                    cookieHdrVal += ';domain=' + encodeURIComponent(config.cookie.domain);
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
        } catch (e) {
            Y.log(e.message, 'warn', __filename);
        }

        next();
    };
};
