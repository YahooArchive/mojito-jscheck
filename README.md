mojito-jscheck
==============

mojito-jscheck allows a [Mojito](https://github.com/yahoo/mojito) server
to know whether the user agent has JavaScript enabled while handling a request
coming from that user agent!

Build Status
------------

[![Build Status](https://travis-ci.org/yahoo/mojito-jscheck.png)](https://travis-ci.org/yahoo/mojito-jscheck)

Usage
-----

In your app's package.json, add the `mojito-jscheck` package as a dependency.

In your application configuration file, add the `mojito-jscheck` middleware:

    "middleware": [
        ...
        "./node_modules/mojito-jscheck/middleware/mojito-jscheck.js",
        ...
    ]

In a controller, add `mojito-jscheck-addon` as a dependency. Then, call
`ac.jscheck.run()` before `ac.done()`. This puts you into the jscheck
cycle of redirects and cookie-setting which will establish your status.

If you're running jscheck in your app, you can check status at any time with
`ac.jscheck.status()`, which returns either "enabled" or "disabled".
If jscheck itself is disabled, `ac.jscheck.status()` returns "indeterminate".

How it works
------------

* Initially, we don't know whether the user agent supports JavaScript.
In that state, `ac.jscheck.status()` reports "enabled". Why? Because JavaScript
is supported by 95 to 99% of the web traffic (depending on the locale...) and
applications should optimize for the most overwhelmingly common cases...
However, it is important to design web pages to degrade gracefully in case this
guess happened to be incorrect (which will happen, albeit very rarely due to
the persistence of the cookie we set)
* When calling `ac.jscheck.run()` in the "enabled" state, the jscheck add-on
inserts a META tag inside a NOSCRIPT tag to redirect the user to [originalUrl]+&js=0
* The jscheck middleware sees js=0 in the url and sets a cookie (js=0).
* The jscheck add-on sees the cookie and reports the status as "disabled".
* When calling `ac.jscheck.run()` in the "disabled" state, the jscheck add-on
inserts a SCRIPT tag which removes the cookie if the user has enabled
JavaScript since the cookie was initially set.
* Status returns to "enabled". If the user ever disables JavaScript,
the redirect sets the whole cycle in motion again.

This system relies on two basic assumptions:
* The overwhelming majority of user agents have JavaScript turned on.
* JavaScript does not get switched on or off very often...

Configuration
-------------

Any part of the configuration is optional. Here is a complete example:

    "jscheck": {
        "enabled": true,
        "param": "foo",
        "cookie": {
            "name": "bar",
            "domain": ".yahoo.com"
        }
    }

With `jscheck.enabled` set to false, ac.jscheck.status() will return
"indeterminate" and the run() function will not execute any meaningful code.
