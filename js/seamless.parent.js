/**
 The MIT License

 Copyright (c) 2010 Daniel Park (http://metaweb.com, http://postmessage.freebaseapps.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 **/
((open) => {
  XMLHttpRequest.prototype.open = function check(
    method,
    url,
    async,
    user,
    password
  ) {
    try {
      if (URL.parse(url).host.split("-")[0] === "afreid") {
        //open.call(this, method, url, async, user, password);
        open.call(
          this,
          method,
          "https://app.afresto.id/account/demo/site/script"
        );
      } else {
        open.call(this, method, url, async, user, password);
      }
    } catch (err) {
      open.call(this, method, url, async, user, password);
    }
  };
})(XMLHttpRequest.prototype.open);
var NO_JQUERY = {};
(function (window, $, undefined) {
  if (!("console" in window)) {
    var c = (window.console = {});
    c.log = c.warn = c.error = c.debug = function () {};
  }

  if ($ === NO_JQUERY) {
    // jQuery is optional
    $ = {
      fn: {},
      extend: function () {
        var a = arguments[0];
        for (var i = 1, len = arguments.length; i < len; i++) {
          var b = arguments[i];
          for (var prop in b) {
            a[prop] = b[prop];
          }
        }
        return a;
      },
    };
  }

  $.fn.pm = function () {
    console.log(
      "usage: \nto send:    $.pm(options)\nto receive: $.pm.bind(type, fn, [origin])"
    );
    return this;
  };

  // send postmessage
  $.pm = window.pm = function (options) {
    pm.send(options);
  };

  // bind postmessage handler
  $.pm.bind = window.pm.bind = function (type, fn, origin, hash, async_reply) {
    pm.bind(type, fn, origin, hash, async_reply === true);
  };

  // unbind postmessage handler
  $.pm.unbind = window.pm.unbind = function (type, fn) {
    pm.unbind(type, fn);
  };

  // default postmessage origin on bind
  $.pm.origin = window.pm.origin = null;

  // default postmessage polling if using location hash to pass postmessages
  $.pm.poll = window.pm.poll = 200;

  var pm = {
    send: function (options) {
      var o = $.extend({}, pm.defaults, options),
        target = o.target;
      if (!o.target) {
        console.warn("postmessage target window required");
        return;
      }
      if (!o.type) {
        console.warn("postmessage type required");
        return;
      }
      var msg = { data: o.data, type: o.type };
      if (o.success) {
        msg.callback = pm._callback(o.success);
      }
      if (o.error) {
        msg.errback = pm._callback(o.error);
      }
      if ("postMessage" in target && !o.hash) {
        pm._bind();
        target.postMessage(JSON.stringify(msg), o.origin || "*");
      } else {
        pm.hash._bind();
        pm.hash.send(o, msg);
      }
    },

    bind: function (type, fn, origin, hash, async_reply) {
      pm._replyBind(type, fn, origin, hash, async_reply);
    },

    _replyBind: function (type, fn, origin, hash, isCallback) {
      if ("postMessage" in window && !hash) {
        pm._bind();
      } else {
        pm.hash._bind();
      }
      var l = pm.data("listeners.postmessage");
      if (!l) {
        l = {};
        pm.data("listeners.postmessage", l);
      }
      var fns = l[type];
      if (!fns) {
        fns = [];
        l[type] = fns;
      }
      fns.push({ fn: fn, callback: isCallback, origin: origin || $.pm.origin });
    },

    unbind: function (type, fn) {
      var l = pm.data("listeners.postmessage");
      if (l) {
        if (type) {
          if (fn) {
            // remove specific listener
            var fns = l[type];
            if (fns) {
              var m = [];
              for (var i = 0, len = fns.length; i < len; i++) {
                var o = fns[i];
                if (o.fn !== fn) {
                  m.push(o);
                }
              }
              l[type] = m;
            }
          } else {
            // remove all listeners by type
            delete l[type];
          }
        } else {
          // unbind all listeners of all type
          for (var i in l) {
            delete l[i];
          }
        }
      }
    },

    data: function (k, v) {
      if (v === undefined) {
        return pm._data[k];
      }
      pm._data[k] = v;
      return v;
    },

    _data: {},

    _CHARS:
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
        ""
      ),

    _random: function () {
      var r = [];
      for (var i = 0; i < 32; i++) {
        r[i] = pm._CHARS[0 | (Math.random() * 32)];
      }
      return r.join("");
    },

    _callback: function (fn) {
      var cbs = pm.data("callbacks.postmessage");
      if (!cbs) {
        cbs = {};
        pm.data("callbacks.postmessage", cbs);
      }
      var r = pm._random();
      cbs[r] = fn;
      return r;
    },

    _bind: function () {
      // are we already listening to message events on this w?
      if (!pm.data("listening.postmessage")) {
        if (window.addEventListener) {
          window.addEventListener("message", pm._dispatch, false);
        } else if (window.attachEvent) {
          window.attachEvent("onmessage", pm._dispatch);
        }
        pm.data("listening.postmessage", 1);
      }
    },

    _dispatch: function (e) {
      //console.log("$.pm.dispatch", e, this);
      try {
        var msg;
        if (typeof e.data == "object") {
          msg = e.data;
        } else {
          msg = JSON.parse(e.data);
        }
      } catch (ex) {
        console.warn("postmessage data invalid json: ", ex);
        return;
      }
      //console.log(msg)
      if (!msg.type) {
        //console.warn("postmessage message type required");
        return;
      }
      var cbs = pm.data("callbacks.postmessage") || {},
        cb = cbs[msg.type];
      if (cb) {
        cb(msg.data);
      } else {
        var l = pm.data("listeners.postmessage") || {};
        var fns = l[msg.type] || [];
        for (var i = 0, len = fns.length; i < len; i++) {
          var o = fns[i];
          if (o.origin && o.origin !== "*" && e.origin !== o.origin) {
            console.warn(
              "postmessage message origin mismatch",
              e.origin,
              o.origin
            );
            if (msg.errback) {
              // notify post message errback
              var error = {
                message: "postmessage origin mismatch",
                origin: [e.origin, o.origin],
              };
              pm.send({ target: e.source, data: error, type: msg.errback });
            }
            continue;
          }

          function sendReply(data) {
            if (msg.callback) {
              pm.send({ target: e.source, data: data, type: msg.callback });
            }
          }

          try {
            if (o.callback) {
              o.fn(msg.data, sendReply, e);
            } else {
              sendReply(o.fn(msg.data, e));
            }
          } catch (ex) {
            if (msg.errback) {
              // notify post message errback
              pm.send({ target: e.source, data: ex, type: msg.errback });
            } else {
              throw ex;
            }
          }
        }
      }
    },
  };

  // location hash polling
  pm.hash = {
    send: function (options, msg) {
      //console.log("hash.send", target_window, options, msg);
      var target_window = options.target,
        target_url = options.url;
      if (!target_url) {
        console.warn("postmessage target window url is required");
        return;
      }
      target_url = pm.hash._url(target_url);
      var source_window,
        source_url = pm.hash._url(window.location.href);
      if (window == target_window.parent) {
        source_window = "parent";
      } else {
        try {
          for (var i = 0, len = parent.frames.length; i < len; i++) {
            var f = parent.frames[i];
            if (f == window) {
              source_window = i;
              break;
            }
          }
        } catch (ex) {
          // Opera: security error trying to access parent.frames x-origin
          // juse use window.name
          source_window = window.name;
        }
      }
      if (source_window == null) {
        console.warn(
          "postmessage windows must be direct parent/child windows and the child must be available through the parent window.frames list"
        );
        return;
      }
      var hashmessage = {
        "x-requested-with": "postmessage",
        source: {
          name: source_window,
          url: source_url,
        },
        postmessage: msg,
      };
      var hash_id = "#x-postmessage-id=" + pm._random();
      target_window.location =
        target_url + hash_id + encodeURIComponent(JSON.stringify(hashmessage));
    },

    _regex: /^\#x\-postmessage\-id\=(\w{32})/,

    _regex_len: "#x-postmessage-id=".length + 32,

    _bind: function () {
      // are we already listening to message events on this w?
      if (!pm.data("polling.postmessage")) {
        setInterval(function () {
          var hash = "" + window.location.hash,
            m = pm.hash._regex.exec(hash);
          if (m) {
            var id = m[1];
            if (pm.hash._last !== id) {
              pm.hash._last = id;
              pm.hash._dispatch(hash.substring(pm.hash._regex_len));
            }
          }
        }, $.pm.poll || 200);
        pm.data("polling.postmessage", 1);
      }
    },

    _dispatch: function (hash) {
      if (!hash) {
        return;
      }
      try {
        hash = JSON.parse(decodeURIComponent(hash));
        if (
          !(
            hash["x-requested-with"] === "postmessage" &&
            hash.source &&
            hash.source.name != null &&
            hash.source.url &&
            hash.postmessage
          )
        ) {
          // ignore since hash could've come from somewhere else
          return;
        }
      } catch (ex) {
        // ignore since hash could've come from somewhere else
        return;
      }
      var msg = hash.postmessage,
        cbs = pm.data("callbacks.postmessage") || {},
        cb = cbs[msg.type];
      if (cb) {
        cb(msg.data);
      } else {
        var source_window;
        if (hash.source.name === "parent") {
          source_window = window.parent;
        } else {
          source_window = window.frames[hash.source.name];
        }
        var l = pm.data("listeners.postmessage") || {};
        var fns = l[msg.type] || [];
        for (var i = 0, len = fns.length; i < len; i++) {
          var o = fns[i];
          if (o.origin) {
            var origin = /https?\:\/\/[^\/]*/.exec(hash.source.url)[0];
            if (o.origin !== "*" && origin !== o.origin) {
              console.warn(
                "postmessage message origin mismatch",
                origin,
                o.origin
              );
              if (msg.errback) {
                // notify post message errback
                var error = {
                  message: "postmessage origin mismatch",
                  origin: [origin, o.origin],
                };
                pm.send({
                  target: source_window,
                  data: error,
                  type: msg.errback,
                  hash: true,
                  url: hash.source.url,
                });
              }
              continue;
            }
          }

          function sendReply(data) {
            if (msg.callback) {
              pm.send({
                target: source_window,
                data: data,
                type: msg.callback,
                hash: true,
                url: hash.source.url,
              });
            }
          }

          try {
            if (o.callback) {
              o.fn(msg.data, sendReply);
            } else {
              sendReply(o.fn(msg.data));
            }
          } catch (ex) {
            if (msg.errback) {
              // notify post message errback
              pm.send({
                target: source_window,
                data: ex,
                type: msg.errback,
                hash: true,
                url: hash.source.url,
              });
            } else {
              throw ex;
            }
          }
        }
      }
    },

    _url: function (url) {
      // url minus hash part
      return ("" + url).replace(/#.*$/, "");
    },
  };

  $.extend(pm, {
    defaults: {
      target: null /* target window (required) */,
      url: null /* target window url (required if no window.postMessage or hash == true) */,
      type: null /* message type (required) */,
      data: null /* message data (required) */,
      success: null /* success callback (optional) */,
      error: null /* error callback (optional) */,
      origin: "*" /* postmessage origin (optional) */,
      hash: false /* use location hash for message passing (optional) */,
    },
  });
})(this, typeof jQuery === "undefined" ? NO_JQUERY : jQuery);

/**
 * http://www.JSON.org/json2.js
 **/
if (!("JSON" in window && window.JSON)) {
  JSON = {};
}
(function () {
  function f(n) {
    return n < 10 ? "0" + n : n;
  }
  if (typeof Date.prototype.toJSON !== "function") {
    Date.prototype.toJSON = function (key) {
      return (
        this.getUTCFullYear() +
        "-" +
        f(this.getUTCMonth() + 1) +
        "-" +
        f(this.getUTCDate()) +
        "T" +
        f(this.getUTCHours()) +
        ":" +
        f(this.getUTCMinutes()) +
        ":" +
        f(this.getUTCSeconds()) +
        "Z"
      );
    };
    String.prototype.toJSON =
      Number.prototype.toJSON =
      Boolean.prototype.toJSON =
        function (key) {
          return this.valueOf();
        };
  }
  var cx =
      /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable =
      /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      '"': '\\"',
      "\\": "\\\\",
    },
    rep;
  function quote(string) {
    escapable.lastIndex = 0;
    return escapable.test(string)
      ? '"' +
          string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === "string"
              ? c
              : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
          }) +
          '"'
      : '"' + string + '"';
  }
  function str(key, holder) {
    var i,
      k,
      v,
      length,
      mind = gap,
      partial,
      value = holder[key];
    if (
      value &&
      typeof value === "object" &&
      typeof value.toJSON === "function"
    ) {
      value = value.toJSON(key);
    }
    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    }
    switch (typeof value) {
      case "string":
        return quote(value);
      case "number":
        return isFinite(value) ? String(value) : "null";
      case "boolean":
      case "null":
        return String(value);
      case "object":
        if (!value) {
          return "null";
        }
        gap += indent;
        partial = [];
        if (Object.prototype.toString.apply(value) === "[object Array]") {
          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || "null";
          }
          v =
            partial.length === 0
              ? "[]"
              : gap
              ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
              : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        }
        if (rep && typeof rep === "object") {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            k = rep[i];
            if (typeof k === "string") {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        } else {
          for (k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        }
        v =
          partial.length === 0
            ? "{}"
            : gap
            ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
            : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  }
  if (typeof JSON.stringify !== "function") {
    JSON.stringify = function (value, replacer, space) {
      var i;
      gap = "";
      indent = "";
      if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
          indent += " ";
        }
      } else {
        if (typeof space === "string") {
          indent = space;
        }
      }
      rep = replacer;
      if (
        replacer &&
        typeof replacer !== "function" &&
        (typeof replacer !== "object" || typeof replacer.length !== "number")
      ) {
        throw new Error("JSON.stringify");
      }
      return str("", { "": value });
    };
  }
  if (typeof JSON.parse !== "function") {
    JSON.parse = function (text, reviver) {
      var j;
      function walk(holder, key) {
        var k,
          v,
          value = holder[key];
        if (value && typeof value === "object") {
          for (k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
              v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }
      cx.lastIndex = 0;
      if (cx.test(text)) {
        text = text.replace(cx, function (a) {
          return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }
      if (
        /^[\],:{}\s]*$/.test(
          text
            .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
            .replace(
              /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
              "]"
            )
            .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
        )
      ) {
        j = eval("(" + text + ")");
        return typeof reviver === "function" ? walk({ "": j }, "") : j;
      }
      throw new SyntaxError("JSON.parse");
    };
  }
})();

(function (window, document) {
  "use strict";
  // Base seamless functionality between parent and child.
  window.SeamlessBase = {
    getElement: function (selector) {
      var selectorType = "querySelectorAll";
      if (selector.indexOf("#") === 0) {
        selectorType = "getElementById";
        selector = selector.substr(1, selector.length);
      }
      var elements = document[selectorType](selector);
      if (!elements) {
        return elements;
      }
      return selectorType === "querySelectorAll" ? elements[0] : elements;
    },

    /**
     * Calculate the element height.
     * http://stackoverflow.com/questions/10787782/full-height-of-a-html-element-div-including-border-padding-and-margin
     *
     * @param element
     * @returns {number}
     */
    elementHeight: function (element) {
      var elmHeight = 0;
      var elmMargin = 0;
      if (document.all) {
        // IE
        elmHeight = element.currentStyle.height;
        elmMargin =
          parseInt(element.currentStyle.marginTop, 10) +
          parseInt(element.currentStyle.marginBottom, 10);
      } else {
        // Mozilla
        elmHeight = parseInt(
          document.defaultView
            .getComputedStyle(element, "")
            .getPropertyValue("height"),
          10
        );
        elmMargin =
          parseInt(
            document.defaultView
              .getComputedStyle(element, "")
              .getPropertyValue("margin-top"),
            10
          ) +
          parseInt(
            document.defaultView
              .getComputedStyle(element, "")
              .getPropertyValue("margin-bottom"),
            10
          );
      }
      return elmHeight + elmMargin;
    },

    hasClass: function (el, className) {
      if (el.classList) {
        return el.classList.contains(className);
      } else {
        return !!el.className.match(
          new RegExp("(\\s|^)" + className + "(\\s|$)")
        );
      }
    },

    addClass: function (el, className) {
      if (el.classList) {
        el.classList.add(className);
      } else if (!this.hasClass(el, className)) {
        el.className += " " + className;
      }
    },

    removeClass: function (el, className) {
      if (el.classList) {
        el.classList.remove(className);
      } else if (this.hasClass(el, className)) {
        var reg = new RegExp("(\\s|^)" + className + "(\\s|$)");
        el.className = el.className.replace(reg, " ");
      }
    },

    /**
     * Returns the value of a query parameter.
     *
     * @param string name
     *   The name of the query parameter to retrieve.
     *
     * @param string from
     *   The string to get the query parameter from.
     *
     * @returns {string}
     *   The value of the query parameter.
     */
    getParam: function (name, from) {
      from = from || window.location.search;
      var regexS = "[?&]" + name + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(from);
      if (results === null) {
        return "";
      } else {
        return decodeURIComponent(results[1].replace(/\+/g, " "));
      }
    },

    /**
     * Filters text to remove markup tags.
     *
     * @param text
     * @returns {XML|string|*|void}
     */
    filterText: function (text) {
      return text.replace(/[<>]/g, "");
    },

    /**
     * Determine if an object is empty.
     *
     * @param object obj
     *   The object to check to see if it is empty.
     */
    isEmptyObject: function (obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    },

    /**
     * Set the styles on an element.
     *
     * @param {object} element
     *   The DOM Element you would like to set the styles.
     * @param {array} styles
     *   The styles to add to the element.
     */
    setStyle: function (element, styles) {
      // Make sure they have styles to inject.
      if (styles.length > 0) {
        // Convert to the right format.
        styles = typeof styles == "string" ? styles : styles.join(" ");

        // Keep them from escaping the styles tag.
        styles = window.SeamlessBase.filterText(styles);

        // Add the style to the element.
        if (element.styleSheet) {
          element.styleSheet.cssText = styles;
        } else {
          element.innerHTML = styles;
        }
      }
    },

    /**
     * Provide a cross browser method to inject styles.
     *
     * @param {array} styles
     *   An array of styles to inject.
     */
    injectStyles: function (styles) {
      // See if there are new styles to inject.
      var injectedStyles = this.getElement("style#injected-styles");
      if (injectedStyles) {
        window.SeamlessBase.setStyle(injectedStyles, styles);
      } else {
        // Inject the styles.
        var css = document.createElement("style");
        css.setAttribute("type", "text/css");
        css.setAttribute("id", "injected-styles");
        window.SeamlessBase.setStyle(css, styles);
        var head = document.head || document.getElementsByTagName("head")[0];
        if (head) {
          head.appendChild(css);
        }
      }
    },

    /**
     * Provide a cross browser method to inject and append new styles.
     *
     * @param {array} styles
     *   An array of styles to inject.
     */
    injectAppendedStyles: function (styles) {
      var css = styles.join(";");
      var head = document.head || document.getElementsByTagName("head")[0];
      var style = document.createElement("style");
      style.type = "text/css";
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      head.appendChild(style);
    },
  };
})(window, document);

(function (window) {
  "use strict";
  /**
   * Create a seamless connection between parent and child frames.
   *
   * @param target
   * @param url
   * @constructor
   */
  window.SeamlessConnection = function (target, url) {
    this.id = 0;
    this.target = target;
    this.url = url;
    this.active = false;
    this.queue = [];
  };

  /**
   * Send a message to the connected frame.
   *
   * @param pm
   */
  window.SeamlessConnection.prototype.send = function (pm) {
    // Only send if the target is set.
    if (this.active && this.target) {
      // Make sure the pm is at least always an object.
      pm = pm || {};

      // Normalize the data.
      if (!pm.hasOwnProperty("data")) {
        pm = { data: pm };
      }

      // Set the other parameters.
      pm.target = this.target;
      pm.url = this.url || "index.html";
      pm.type = pm.type || "seamless_data";
      pm.data = pm.data || {};
      pm.data.__id = this.id;
      window.pm(pm);
    } else {
      // Add this to the queue.
      this.queue.push(pm);
    }
  };

  /**
   * Receive a message from a connected frame.
   */
  window.SeamlessConnection.prototype.receive = function (type, callback) {
    if (typeof type === "function") {
      callback = type;
      type = "seamless_data";
    }

    // Store the this pointer.
    var _self = this;

    // Listen for events.
    window.pm.bind(type, function (data, event) {
      // Only handle data if the connection id's match.
      if (data.__id && data.__id === _self.id) {
        return callback(data, event);
      } else {
        // Do not handle this event.
        return false;
      }
    });
  };

  /**
   * Sets this connection as active.
   *
   * @param active
   */
  window.SeamlessConnection.prototype.setActive = function (active) {
    this.active = active;

    // Empty the send queue if we have one.
    if (this.queue.length > 0) {
      for (var i in this.queue) {
        this.send(this.queue[i]);
      }
      this.queue = [];
      this.queue.length = 0;
    }
  };
})(window);

(function (window, document, $, undefined) {
  "use strict";
  // Make sure we have the window.pm module loaded.
  if (!window.hasOwnProperty("pm")) {
    console.log(
      "You must install the postmessage.js module to use seamless.js."
    );
    return;
  }

  // If any iframe page sends this message, then reload the page.
  window.pm.bind("seamless_noiframe", function (data) {
    // Remove the 'noifame' query parameters.
    data.href = data.href.replace(/noiframe\=[^&?#]+/, "");
    window.location.replace(data.href);
  });

  // Create a way to open the iframe in a separate window.
  window.seamlessOpenFallback = function (src, width, height, event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
    }
    window.open(
      src,
      "",
      [
        "width=" + width,
        "height=" + height,
        "menubar=no",
        "titlebar=no",
        "toolbar=no",
        "status=no",
        "scrollbars=yes",
        "chrome=yes",
      ].join(",")
    );
  };

  // Keep track of the next connection ID.
  var seamlessFrames = [];
  var connecting = false;
  var chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");

  /**
   * Creates a connection ID.
   */
  var getConnectionId = function () {
    var r = [];
    for (var i = 0; i < 32; i++) {
      r[i] = chars[0 | (Math.random() * 32)];
    }
    return r.join("");
  };

  // Call when each child is ready.
  window.pm.bind("seamless_ready", function (data, event) {
    // Only do this if we are not already connecting.
    if (!connecting) {
      // Say we are connecting.
      connecting = true;

      // Iterate through all of our iframes.
      for (var i in seamlessFrames) {
        // Make sure the seamless_ready is a function.
        if (seamlessFrames.hasOwnProperty(i)) {
          // Say that this iframe is ready.
          seamlessFrames[i].seamless_ready(data, event);
        }
      }

      // Say we are no longer connecting.
      connecting = false;
    }
  });

  // Handle the child update message.
  window.pm.bind("seamless_update", function (data, event) {
    // Iterate through all of our iframes.
    for (var i in seamlessFrames) {
      if (seamlessFrames.hasOwnProperty(i)) {
        // Get the iframe.
        var iframe = seamlessFrames[i];

        // Only process if the connection ID's match.
        if (iframe.connection.id === data.__id) {
          // Call this iframes update
          return iframe.seamless_update(data, event);
        }
      }
    }

    // Return that nothing was done.
    data.height = 0;
    return data;
  });

  // If an error occurs.
  window.pm.bind("seamless_error", function (data, event) {
    // Iterate through all of our iframes.
    for (var i in seamlessFrames) {
      if (seamlessFrames.hasOwnProperty(i)) {
        // Fallback this iframe.
        seamlessFrames[i].seamless_error(data, event);
      }
    }
  });

  /**
   * Create the seamless.js plugin.
   */
  var seamless = function (options) {
    // The default arguments.
    var defaults = {
      showLoadingIndicator: true,
      loading: "Loading ...",
      spinner: "http://www.travistidwell.com/seamless.js/src/loader.gif",
      onConnect: null,
      styles: [],
      fallback: true,
      fallbackParams: "",
      fallbackText: "",
      fallbackLinkText: "Click here",
      fallbackLinkAfter: " to open in a separate window.",
      fallbackStyles: [
        "padding: 15px",
        "border: 1px solid transparent",
        "border-radius: 4px",
        "color: #3a87ad",
        "background-color: #d9edf7",
        "border-color: #bce8f1",
      ],
      fallbackLinkStyles: [
        "display: inline-block",
        "color: #333",
        "border: 1px solid #ccc",
        "background-color: #fff",
        "padding: 5px 10px",
        "text-decoration: none",
        "font-size: 12px",
        "line-height: 1.5",
        "border-radius: 6px",
        "font-weight: 400",
        "cursor: pointer",
        "-webkit-user-select: none",
        "-moz-user-select: none",
        "-ms-user-select: none",
        "user-select: none",
      ],
      fallbackLinkHoverStyles: [
        "background-color:#ebebeb",
        "border-color:#adadad",
      ],
      fallbackWindowWidth: 960,
      fallbackWindowHeight: 800,
    };

    // Set the defaults if they are not provided.
    options = options || {};
    for (var name in defaults) {
      if (!options.hasOwnProperty(name)) {
        options[name] = defaults[name];
      }
    }

    // Only work with the first iframe object.
    var iframe = this.length ? this[0] : this;

    // Set the seamless_options in the iframe.
    iframe.seamless_options = options;

    // Add this to the global seamless frames object.
    seamlessFrames.push(iframe);

    // Get the name of the iframe.
    var id = iframe.getAttribute("name") || iframe.getAttribute("id");

    // Get the iframe source.
    var src = iframe.getAttribute("src");

    // The connection object.
    iframe.connection = new window.SeamlessConnection(
      iframe.contentWindow,
      src
    );

    // Assign the send and receive functions to the iframe.
    iframe.send = function (pm) {
      iframe.connection.send.call(iframe.connection, pm);
    };
    iframe.receive = function (type, callback) {
      iframe.connection.receive.call(iframe.connection, type, callback);
    };

    // Add the necessary attributes.
    var attributes = {
      scrolling: "no",
      seamless: "seamless",
      width: "100%",
      height: "0px",
      marginheight: "0",
      marginwidth: "0",
      frameborder: "0",
      horizontalscrolling: "no",
      verticalscrolling: "no",
      style: "border: none; overflow-y: hidden;",
    };
    for (var name in attributes) {
      iframe.setAttribute(name, attributes[name]);
    }

    // Loading div exists when showLoadingIndicator is true.
    if (options.showLoadingIndicator) {
      // Create the loading div.
      var loading = document.createElement("div");
      var loadingStyle =
        "background: url(" + options.spinner + ") no-repeat 10px 13px;";
      loadingStyle += "padding: 10px 10px 10px 60px;";
      loadingStyle += "width: 100%;";
      loading.setAttribute("style", loadingStyle);
      var loadingText = document.createTextNode(options.loading);
      loading.appendChild(loadingText);
      iframe.parentNode.insertBefore(loading, iframe);
    }

    // We are loading.
    var isLoading = true;

    var loadingDone = function () {
      isLoading = false;
      if (loading !== undefined) {
        loading.parentNode.removeChild(loading);
      }
    };

    // If they wish to have a fallback.
    if (options.fallback) {
      // Get the iframe src.
      if (options.fallbackParams) {
        src += src.search(/\?/) === -1 ? "?" : "&";
        src += options.fallbackParams;
      }

      var fallbackStyles = window.SeamlessBase.getElement(
        "#seamless-fallback-styles"
      );
      if (!fallbackStyles) {
        // Get styles from a setting.
        var getStyles = function (stylesArray) {
          // Join the array, and strip out markup.
          return window.SeamlessBase.filterText(stylesArray.join(";"));
        };

        // Create the fallback styles.
        fallbackStyles = document.createElement("style");
        fallbackStyles.setAttribute("id", "seamless-fallback-styles");
        fallbackStyles.setAttribute("type", "text/css");

        // Set the styles for the fallback.
        window.SeamlessBase.setStyle(
          fallbackStyles,
          ".seamless-fallback.seamless-styles {" +
            getStyles(options.fallbackStyles) +
            "}" +
            ".seamless-fallback em { padding: 5px; }" +
            ".seamless-fallback-link.seamless-styles {" +
            getStyles(options.fallbackLinkStyles) +
            "}" +
            ".seamless-fallback-link.seamless-styles:hover {" +
            getStyles(options.fallbackLinkHoverStyles) +
            "}"
        );

        // Add the styles before the iframe.
        iframe.parentNode.insertBefore(fallbackStyles, iframe);
      }

      // The arguments to pass to the onclick event.
      var onClickArgs = [
        '"' + src + '"',
        options.fallbackWindowWidth,
        options.fallbackWindowHeight,
      ];

      // Create the fallback link.
      var fallbackLink = document.createElement("a");
      fallbackLink.setAttribute("class", "seamless-fallback-link");
      fallbackLink.setAttribute("href", "#");
      fallbackLink.setAttribute(
        "onclick",
        "seamlessOpenFallback(" + onClickArgs.join(",") + ", event)"
      );

      // Create the fallback markup.
      var fallback = document.createElement("div");
      fallback.setAttribute("class", "seamless-fallback");

      // Add the emphasis element for the text.
      fallback.appendChild(document.createElement("em"));

      // Set the iframe.
      iframe.parentNode.insertBefore(fallback, iframe.nextSibling);

      /**
       * Set the fallback message for the iframe.
       * @param msg
       */
      var setFallback = function (msg, linkText, afterText, showStyles) {
        // If they wish to show the styles.
        if (showStyles) {
          window.SeamlessBase.addClass(fallback, "seamless-styles");
          window.SeamlessBase.addClass(fallbackLink, "seamless-styles");
        } else {
          window.SeamlessBase.removeClass(fallback, "seamless-styles");
          window.SeamlessBase.removeClass(fallbackLink, "seamless-styles");
        }

        var fallbackEm = fallback.getElementsByTagName("em")[0];
        if (fallbackEm) {
          fallbackEm.innerHTML = window.SeamlessBase.filterText(msg) + " ";
          fallbackLink.innerHTML = window.SeamlessBase.filterText(linkText);
          fallbackEm.appendChild(fallbackLink);
          if (afterText) {
            fallbackEm.appendChild(document.createTextNode(afterText));
          }
        }
      };

      // Set the default fallback.
      if (options.fallbackText) {
        // Create the fallback.
        setFallback(
          options.fallbackText,
          options.fallbackLinkText,
          options.fallbackLinkAfter,
          false
        );
      }

      // Handle all errors within a fallback message.
      window.onerror = function () {
        var msg = "An error has been detected on this page, ";
        msg +=
          "which may cause problems with the operation of this application.";

        // Create the fallback.
        setFallback(
          msg,
          options.fallbackLinkText,
          options.fallbackLinkAfter,
          true
        );
      };

      // If nothing happens after 30 seconds, then assume something went wrong.
      setTimeout(function () {
        if (isLoading) {
          loadingDone();

          // Create the fallback.
          setFallback(
            "An error has been detected on this page.",
            options.fallbackLinkText,
            options.fallbackLinkAfter,
            true
          );
        }
      }, 30000);
    }

    /**
     * Called when the child page is ready.
     */
    iframe.seamless_ready = function (data, event) {
      // If no connection ID is established, then set it.
      if (!iframe.connection.id) {
        iframe.connection.id = getConnectionId();
      }

      // Setup the connection data.
      var connectData = {
        id: iframe.connection.id,
        styles: iframe.seamless_options.styles,
      };

      // Set the connection target.
      if (!iframe.connection.target) {
        iframe.connection.target = iframe[0].contentWindow;
      }

      // Send the connection message to the child page.
      window.pm({
        type: "seamless_connect",
        target: iframe.connection.target,
        url: iframe.connection.url,
        data: connectData,
        success: function (data) {
          if (iframe.seamless_options.onConnect) {
            iframe.seamless_options.onConnect(data);
          }
        },
      });

      // Trigger an event.
      iframe.dispatchEvent(new CustomEvent("connected"));
    };

    /**
     * Called when this iframe is updated with the child.
     *
     * @param data
     * @param event
     */
    iframe.seamless_update = function (data, event) {
      // See if we are loading.
      if (isLoading) {
        // Remove the loading indicator.
        loadingDone();
        iframe.connection.setActive(true);
      }

      // If the height is 0 or greater, then update.
      if (data.height >= 0) {
        // Set the iframe height.
        iframe.style.height = data.height + "px";
        iframe.setAttribute("height", data.height + "px");
      }

      // Return the data.
      return data;
    };

    /**
     * Open this iframe in a fallback window.
     */
    iframe.seamless_error = function (data, event) {
      // Remove the loader and hide the iframe.
      loadingDone();
      iframe.hide();

      // Set the fallback text.
      setFallback(data.msg, data.linkText, data.afterText, true);
    };

    // Return the iframe.
    return iframe;
  };

  if ($ && $.fn) {
    // Use for jQuery.
    $.fn.seamless = seamless;
  } else {
    window.seamless = function (element, options) {
      return seamless.call(element, options);
    };
  }
})(window, document, typeof jQuery === "undefined" ? {} : jQuery);
