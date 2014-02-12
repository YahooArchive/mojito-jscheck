/*jslint browser: true, plusplus: true */

// Note: Don't get too anal about the size of this file because it is inlined
// in the page only when JS is disabled, which represents < 5% of the traffic
// and we want to optimize for the 95% case!

// Note: Within the jscheck addon, this file is "uglified" and the addon
// config is passed to the function f.

// After uglification, this file is roughly 1KB uncompressed.

function f(config) {
    'use strict';

    var d = document,
        l = location,
        log = window.console ? window.console.log : function () {},
        encode = encodeURIComponent,
        decode = decodeURIComponent,
        ck = config.cookie,
        exp,
        s,
        o;

    function getcookie(name) {
        name = encode(name);

        var a = d.cookie.split(/;\s/g),
            i = a.length;

        while (--i >= 0) {
            if (a[i].indexOf(name + '=') === 0) {
                return a[i].substr(3);
            }
        }
    }

    function parse(s) {
        var o = {},
            a = s.split('&'),
            i = a.length,
            p;

        while (--i >= 0) {
            p = a[i].split('=');
            o[decode(p[0])] = decode(p[1]);
        }

        return o;
    }

    function stringify(o) {
        var a = [], k;

        for (k in o) {
            if (o.hasOwnProperty(k)) {
                a.push(encode(k) + '=' + encode(o[k]));
            }
        }

        return a.join('&');
    }

    if (ck.sub) {

        s = getcookie(ck.name);

        if (s) {
            o = parse(s);

            delete o[ck.sub];

            exp = new Date();
            exp.setTime(exp.getTime() + ck.expiration * 1000);

            d.cookie = encode(ck.name) + '=' + stringify(o) +
                ';expires=' + exp.toUTCString() +
                (ck.domain ? ';domain=' + encode(ck.domain) : '');

            // See description below to understand what the following test is about...

            s = getcookie(ck.name);
            o = parse(s);

            if (!o.hasOwnProperty(ck.sub)) {
                l.replace(l.href.replace(new RegExp('[?&]' + encode(config.param) + '=0', 'g'), ''));
            } else {
                log('[mojito-jscheck] Sub-cookie could not be removed - Check your application settings!');
            }
        }

    } else {

        d.cookie = encode(ck.name) + '=' +
            ';expires=' + new Date(0).toUTCString() +
            (ck.domain ? ';domain=' + encode(ck.domain) : '');

        // This test is there to address misconfigured applications!
        //
        // * Let's consider the following two applications:
        //   - A is accessible from domain A.example.com
        //   - B is accessible from domain B.example.com
        // * Both applications use mojito-jscheck.
        // * A sets the "js" cookie on .example.com.
        // * B does not have a domain configured for the "js" cookie.
        // * Let's consider that the user-agent has the "js" cookie
        //   set after visiting application A.
        // * Let's also consider that the user-agent has since
        //   re-enabled JavaScript...
        //
        // -> When visiting application B, the client-side snippet
        // will not be able to remove the "js" cookie and the
        // browser will start refreshing the page in an infinite
        // loop...

        if (!getcookie(ck.name)) {
            l.replace(l.href.replace(new RegExp('[?&]' + encode(config.param) + '=0', 'g'), ''));
        } else {
            log('[mojito-jscheck] Cookie could not be removed - Check your application settings!');
        }
    }

}
