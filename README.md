mojito-jscheck
==============

mojito-jscheck allows a [Mojito](https://github.com/yahoo/mojito) server
to know whether the user agent has JavaScript enabled while handling a request
coming from that user agent!

Build Status
------------

[![Build Status](https://secure.travis-ci.org/yahoo/mojito-jscheck.png)](http://travis-ci.org/yahoo/mojito-jscheck)

Usage
-----

In your app's package.json, add the `mojito-jscheck` package as a dependency.

In a controller, add `yahoo.addons.jscheck` as a dependency. Then, call
`ac.jscheck.run()` before `ac.done()`. This puts you into the jscheck
cycle of redirects and cookie-setting which will establish your status.

If you're running jscheck in your app, you can check status at any time with
`ac.jscheck.status()`, which returns either "enabled" or "disabled."
If jscheck itself is disabled, `ac.jscheck.status()` returns "indeterminate".

How it works
------------

* Initial state is that we know nothing about JavaScript, but we generally assume it's on.
* In a controller, `ac.jscheck.status()` will report "enabled".
* But if JavaScript is actually disabled, isn't that incorrect? Technically, yes; but practically, no: the user will be immediately redirected out of this state, because:
* The jscheck add-on applies a NOSCRIPT tag which redirects users to [originalUrl] + &js=0.
* The jscheck middleware, seeing js=0 in the url, sets a cookie (js=0).
* The jscheck add-on sees the cookie and reports the status as "disabled".
* A SCRIPT tag is applied to the output; the script will remove the cookie.
* As long as JavaScript remains disabled, the cookie persists and jscheck reports JavaScript as disabled.
* If the user ever enables JavaScript, the cookie is removed. Status returns to "enabled."
* If the user ever disables JavaScript, the redirect sets the whole cycle in motion again.

Configuration
-------------

Any part of the configuration is optional. Here is a complete example:

    "jscheck": {
        "enabled": true,
        "param": "foo",
        "cookie": {
            "name": "bar",
            "domain": "yahoo.com"
        }
    }

With `jscheck.enabled` set to false, ac.jscheck.status() will return
"indeterminate" and the run() function will not execute any meaningful code.
