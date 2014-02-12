/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true, indent: 4 */

module.exports = function (midConfig) {
    'use strict';

    var liburl = require('url'),
        libqs = require('querystring'),

        Y = midConfig.Y,
        L = Y.Lang,

        config = {
            enabled: true,
            param: 'js',
            cookie: {
                name: 'js'
            }
        };

    /*
     * Returns the value of the specified cookie (or sub-cookie) from the request object.
     */
    function getCookieVal(req) {
        var s, o;

        if (req.cookies) {
            s = req.cookies[encodeURIComponent(config.cookie.name)];

            if (config.cookie.sub) {
                o = libqs.parse(s);
                return o[config.cookie.sub];
            }

            return s;
        }
    }

    /*
     * Sets the specified cookie (or sub-cookie) to the given value on the response object.
     */
    function setCookieHdrVal(req, res, value) {
        var s, o, cookieHdrVal, expiration;

        if (config.cookie.sub) {
            s = req.cookies[config.cookie.name];
            o = libqs.parse(s);
            o[config.cookie.sub] = value;
            cookieHdrVal = encodeURIComponent(config.cookie.name) + '=' + libqs.stringify(o);
        } else {
            cookieHdrVal = encodeURIComponent(config.cookie.name) + '=' + encodeURIComponent(value);
        }

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

    //-- Use default configuration attributes if needed -----------------------

    Y.mix(config, midConfig.store._appConfigStatic.jscheck, true, null, 0, true);

    //-- Return a NOOP middleware if jscheck is disabled ----------------------

    if (!config.enabled) {
        return function (req, res, next) {
            next();
        };
    }

    //-- Validate configuration -----------------------------------------------

    if (!L.isBoolean(config.enabled) ||
            !L.isString(config.param) ||
            !L.isObject(config.cookie) ||
            !L.isString(config.cookie.name) ||
            (config.cookie.hasOwnProperty('sub') &&
                (!L.isString(config.cookie.sub) ||
                 !L.isNumber(config.cookie.expiration) ||
                 config.cookie.expiration <= 0)) ||
            (config.cookie.hasOwnProperty('domain') &&
                !L.isString(config.cookie.domain))) {
        throw new Error('Invalid configuration');
    }

    config.param = L.trim(config.param);
    config.cookie.name = L.trim(config.cookie.name);

    if (config.cookie.sub) {
        config.cookie.sub = L.trim(config.cookie.sub);
    }

    if (config.cookie.domain) {
        config.cookie.domain = L.trim(config.cookie.domain);
    }

    if (!config.param.length ||
            !config.cookie.name.length ||
            (config.cookie.hasOwnProperty('sub') &&
                !config.cookie.sub.length) ||
            (config.cookie.hasOwnProperty('domain') &&
                !config.cookie.domain.length)) {
        throw new Error('Invalid configuration');
    }

    //-- Return a full-featured middleware if jscheck is enabled --------------

    return function (req, res, next) {
        try {
            var query = liburl.parse(req.url, true).query;
            if (query[config.param] === '0' && getCookieVal(req) !== '0') {
                setCookieHdrVal(req, res, '0');
            }
        } catch (e) {
            Y.log(e.message, 'warn', __filename);
        }

        next();
    };
};
