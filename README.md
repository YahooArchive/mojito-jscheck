# JSCheck

JSCheck allows the server to know if the client has JavaScript enabled at the
time a request is being handled...

## Usage

In your app's package.json, add the `mojito-jscheck` package as a dependency.

In a controller, add `yahoo.addons.jscheck` as a dependency. Then, call
`ac.jscheck.run()` before `ac.done()`. This puts you into the JSCheck
cycle of redirects and cookie-setting which will establish your status.

If you're running jscheck in your app, you can check status at any time with
`ac.jscheck.status()`, which returns either "enabled" or "disabled."
If jscheck itself is disabled, `ac.jscheck.status()` returns "indeterminate".

## How it works

* Initial state is that we know nothing about JavaScript, but we generally assume it's on.
* In a controller, `ac.jscheck.status()` will report "enabled".
* But if JS is actually disabled, isn't that incorrect? Technically, yes; but practically, no: the user will be immediately redirected out of this state, because:
* The JSCheck add-on applies a NOSCRIPT tag which redirects users to [originalUrl] + &js=0.
* The JSCheck middleware, seeing js=0 in the url, sets a cookie (js=0).
* The JSCheck add-on sees the cookie and reports the status as "disabled".
* A SCRIPT tag is applied to the output; the script will remove the cookie.
* As long as JS remains disabled, the cookie persists and JSCheck reports JS as disabled.
* If the user ever enables JS, the cookie is removed. Status returns to "enabled."
* If the user ever disables JS, the redirect sets the whole cycle in motion again.

## Configuration

Any part of the configuration is optional. Here is a complete example:

    "jscheck": {
        "enabled": true,
        "param": "foo",
        "cookie": {
            "name": "bar",
            "domain": "yahoo.com"
        }
    }

With jscheck.enabled set to false, ac.jscheck.status() will return "indeterminate" and the run() function will not execute any meaningful code.
