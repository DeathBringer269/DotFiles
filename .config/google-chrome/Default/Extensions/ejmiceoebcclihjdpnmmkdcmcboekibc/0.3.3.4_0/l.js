/*!

 handlebars v2.0.0

Copyright (C) 2011-2014 by Yehuda Katz

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

@license
*/
/* exported Handlebars */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Handlebars = root.Handlebars || factory();
  }
}(this, function () {
// handlebars/safe-string.js
var __module3__ = (function() {
  "use strict";
  var __exports__;
  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = function() {
    return "" + this.string;
  };

  __exports__ = SafeString;
  return __exports__;
})();

// handlebars/utils.js
var __module2__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  /*jshint -W004 */
  var SafeString = __dependency1__;

  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /[&<>"'`]/g;
  var possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr];
  }

  function extend(obj /* , ...source */) {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          obj[key] = arguments[i][key];
        }
      }
    }

    return obj;
  }

  __exports__.extend = extend;var toString = Object.prototype.toString;
  __exports__.toString = toString;
  // Sourced from lodash
  // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
  var isFunction = function(value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  /* istanbul ignore next */
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  __exports__.isFunction = isFunction;
  /* istanbul ignore next */
  var isArray = Array.isArray || function(value) {
    return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
  };
  __exports__.isArray = isArray;

  function escapeExpression(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof SafeString) {
      return string.toString();
    } else if (string == null) {
      return "";
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = "" + string;

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }

  __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  __exports__.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
    return (contextPath ? contextPath + '.' : '') + id;
  }

  __exports__.appendContextPath = appendContextPath;
  return __exports__;
})(__module3__);

// handlebars/exception.js
var __module4__ = (function() {
  "use strict";
  var __exports__;

  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  function Exception(message, node) {
    var line;
    if (node && node.firstLine) {
      line = node.firstLine;

      message += ' - ' + line + ':' + node.firstColumn;
    }

    var tmp = Error.prototype.constructor.call(this, message);

    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }

    if (line) {
      this.lineNumber = line;
      this.column = node.firstColumn;
    }
  }

  Exception.prototype = new Error();

  __exports__ = Exception;
  return __exports__;
})();

// handlebars/base.js
var __module1__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;

  var VERSION = "2.0.0";
  __exports__.VERSION = VERSION;var COMPILER_REVISION = 6;
  __exports__.COMPILER_REVISION = COMPILER_REVISION;
  var REVISION_CHANGES = {
    1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
    2: '== 1.0.0-rc.3',
    3: '== 1.0.0-rc.4',
    4: '== 1.x.x',
    5: '== 2.0.0-alpha.x',
    6: '>= 2.0.0-beta.1'
  };
  __exports__.REVISION_CHANGES = REVISION_CHANGES;
  var isArray = Utils.isArray,
      isFunction = Utils.isFunction,
      toString = Utils.toString,
      objectType = '[object Object]';

  function HandlebarsEnvironment(helpers, partials) {
    this.helpers = helpers || {};
    this.partials = partials || {};

    registerDefaultHelpers(this);
  }

  __exports__.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
    constructor: HandlebarsEnvironment,

    logger: logger,
    log: log,

    registerHelper: function(name, fn) {
      if (toString.call(name) === objectType) {
        if (fn) { throw new Exception('Arg not supported with multiple helpers'); }
        Utils.extend(this.helpers, name);
      } else {
        this.helpers[name] = fn;
      }
    },
    unregisterHelper: function(name) {
      delete this.helpers[name];
    },

    registerPartial: function(name, partial) {
      if (toString.call(name) === objectType) {
        Utils.extend(this.partials,  name);
      } else {
        this.partials[name] = partial;
      }
    },
    unregisterPartial: function(name) {
      delete this.partials[name];
    }
  };

  function registerDefaultHelpers(instance) {
    instance.registerHelper('helperMissing', function(/* [args, ]options */) {
      if(arguments.length === 1) {
        // A missing field in a {{foo}} constuct.
        return undefined;
      } else {
        // Someone is actually trying to call something, blow up.
        throw new Exception("Missing helper: '" + arguments[arguments.length-1].name + "'");
      }
    });

    instance.registerHelper('blockHelperMissing', function(context, options) {
      var inverse = options.inverse,
          fn = options.fn;

      if(context === true) {
        return fn(this);
      } else if(context === false || context == null) {
        return inverse(this);
      } else if (isArray(context)) {
        if(context.length > 0) {
          if (options.ids) {
            options.ids = [options.name];
          }

          return instance.helpers.each(context, options);
        } else {
          return inverse(this);
        }
      } else {
        if (options.data && options.ids) {
          var data = createFrame(options.data);
          data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
          options = {data: data};
        }

        return fn(context, options);
      }
    });

    instance.registerHelper('each', function(context, options) {
      if (!options) {
        throw new Exception('Must pass iterator to #each');
      }

      var fn = options.fn, inverse = options.inverse;
      var i = 0, ret = "", data;

      var contextPath;
      if (options.data && options.ids) {
        contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
      }

      if (isFunction(context)) { context = context.call(this); }

      if (options.data) {
        data = createFrame(options.data);
      }

      if(context && typeof context === 'object') {
        if (isArray(context)) {
          for(var j = context.length; i<j; i++) {
            if (data) {
              data.index = i;
              data.first = (i === 0);
              data.last  = (i === (context.length-1));

              if (contextPath) {
                data.contextPath = contextPath + i;
              }
            }
            ret = ret + fn(context[i], { data: data });
          }
        } else {
          for(var key in context) {
            if(context.hasOwnProperty(key)) {
              if(data) {
                data.key = key;
                data.index = i;
                data.first = (i === 0);

                if (contextPath) {
                  data.contextPath = contextPath + key;
                }
              }
              ret = ret + fn(context[key], {data: data});
              i++;
            }
          }
        }
      }

      if(i === 0){
        ret = inverse(this);
      }

      return ret;
    });

    instance.registerHelper('if', function(conditional, options) {
      if (isFunction(conditional)) { conditional = conditional.call(this); }

      // Default behavior is to render the positive path if the value is truthy and not empty.
      // The `includeZero` option may be set to treat the condtional as purely not empty based on the
      // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
      if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });

    instance.registerHelper('unless', function(conditional, options) {
      return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
    });

    instance.registerHelper('with', function(context, options) {
      if (isFunction(context)) { context = context.call(this); }

      var fn = options.fn;

      if (!Utils.isEmpty(context)) {
        if (options.data && options.ids) {
          var data = createFrame(options.data);
          data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
          options = {data:data};
        }

        return fn(context, options);
      } else {
        return options.inverse(this);
      }
    });

    instance.registerHelper('log', function(message, options) {
      var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
      instance.log(level, message);
    });

    instance.registerHelper('lookup', function(obj, field) {
      return obj && obj[field];
    });
  }

  var logger = {
    methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

    // State enum
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    level: 3,

    // can be overridden in the host environment
    log: function(level, message) {
      if (logger.level <= level) {
        var method = logger.methodMap[level];
        if (typeof console !== 'undefined' && console[method]) {
          console[method].call(console, message);
        }
      }
    }
  };
  __exports__.logger = logger;
  var log = logger.log;
  __exports__.log = log;
  var createFrame = function(object) {
    var frame = Utils.extend({}, object);
    frame._parent = object;
    return frame;
  };
  __exports__.createFrame = createFrame;
  return __exports__;
})(__module2__, __module4__);

// handlebars/runtime.js
var __module5__ = (function(__dependency1__, __dependency2__, __dependency3__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;
  var COMPILER_REVISION = __dependency3__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency3__.REVISION_CHANGES;
  var createFrame = __dependency3__.createFrame;

  function checkRevision(compilerInfo) {
    var compilerRevision = compilerInfo && compilerInfo[0] || 1,
        currentRevision = COMPILER_REVISION;

    if (compilerRevision !== currentRevision) {
      if (compilerRevision < currentRevision) {
        var runtimeVersions = REVISION_CHANGES[currentRevision],
            compilerVersions = REVISION_CHANGES[compilerRevision];
        throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
              "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
      } else {
        // Use the embedded version info since the runtime doesn't know about this revision yet
        throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
              "Please update your runtime to a newer version ("+compilerInfo[1]+").");
      }
    }
  }

  __exports__.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

  function template(templateSpec, env) {
    /* istanbul ignore next */
    if (!env) {
      throw new Exception("No environment passed to template");
    }
    if (!templateSpec || !templateSpec.main) {
      throw new Exception('Unknown template object: ' + typeof templateSpec);
    }

    // Note: Using env.VM references rather than local var references throughout this section to allow
    // for external users to override these as psuedo-supported APIs.
    env.VM.checkRevision(templateSpec.compiler);

    var invokePartialWrapper = function(partial, indent, name, context, hash, helpers, partials, data, depths) {
      if (hash) {
        context = Utils.extend({}, context, hash);
      }

      var result = env.VM.invokePartial.call(this, partial, name, context, helpers, partials, data, depths);

      if (result == null && env.compile) {
        var options = { helpers: helpers, partials: partials, data: data, depths: depths };
        partials[name] = env.compile(partial, { data: data !== undefined, compat: templateSpec.compat }, env);
        result = partials[name](context, options);
      }
      if (result != null) {
        if (indent) {
          var lines = result.split('\n');
          for (var i = 0, l = lines.length; i < l; i++) {
            if (!lines[i] && i + 1 === l) {
              break;
            }

            lines[i] = indent + lines[i];
          }
          result = lines.join('\n');
        }
        return result;
      } else {
        throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
      }
    };

    // Just add water
    var container = {
      lookup: function(depths, name) {
        var len = depths.length;
        for (var i = 0; i < len; i++) {
          if (depths[i] && depths[i][name] != null) {
            return depths[i][name];
          }
        }
      },
      lambda: function(current, context) {
        return typeof current === 'function' ? current.call(context) : current;
      },

      escapeExpression: Utils.escapeExpression,
      invokePartial: invokePartialWrapper,

      fn: function(i) {
        return templateSpec[i];
      },

      programs: [],
      program: function(i, data, depths) {
        var programWrapper = this.programs[i],
            fn = this.fn(i);
        if (data || depths) {
          programWrapper = program(this, i, fn, data, depths);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = program(this, i, fn);
        }
        return programWrapper;
      },

      data: function(data, depth) {
        while (data && depth--) {
          data = data._parent;
        }
        return data;
      },
      merge: function(param, common) {
        var ret = param || common;

        if (param && common && (param !== common)) {
          ret = Utils.extend({}, common, param);
        }

        return ret;
      },

      noop: env.VM.noop,
      compilerInfo: templateSpec.compiler
    };

    var ret = function(context, options) {
      options = options || {};
      var data = options.data;

      ret._setup(options);
      if (!options.partial && templateSpec.useData) {
        data = initData(context, data);
      }
      var depths;
      if (templateSpec.useDepths) {
        depths = options.depths ? [context].concat(options.depths) : [context];
      }

      return templateSpec.main.call(container, context, container.helpers, container.partials, data, depths);
    };
    ret.isTop = true;

    ret._setup = function(options) {
      if (!options.partial) {
        container.helpers = container.merge(options.helpers, env.helpers);

        if (templateSpec.usePartial) {
          container.partials = container.merge(options.partials, env.partials);
        }
      } else {
        container.helpers = options.helpers;
        container.partials = options.partials;
      }
    };

    ret._child = function(i, data, depths) {
      if (templateSpec.useDepths && !depths) {
        throw new Exception('must pass parent depths');
      }

      return program(container, i, templateSpec[i], data, depths);
    };
    return ret;
  }

  __exports__.template = template;function program(container, i, fn, data, depths) {
    var prog = function(context, options) {
      options = options || {};

      return fn.call(container, context, container.helpers, container.partials, options.data || data, depths && [context].concat(depths));
    };
    prog.program = i;
    prog.depth = depths ? depths.length : 0;
    return prog;
  }

  __exports__.program = program;function invokePartial(partial, name, context, helpers, partials, data, depths) {
    var options = { partial: true, helpers: helpers, partials: partials, data: data, depths: depths };

    if(partial === undefined) {
      throw new Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    }
  }

  __exports__.invokePartial = invokePartial;function noop() { return ""; }

  __exports__.noop = noop;function initData(context, data) {
    if (!data || !('root' in data)) {
      data = data ? createFrame(data) : {};
      data.root = context;
    }
    return data;
  }
  return __exports__;
})(__module2__, __module4__, __module1__);

// handlebars.runtime.js
var __module0__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var base = __dependency1__;

  // Each of these augment the Handlebars object. No need to setup here.
  // (This is done to easily share code between commonjs and browse envs)
  var SafeString = __dependency2__;
  var Exception = __dependency3__;
  var Utils = __dependency4__;
  var runtime = __dependency5__;

  // For compatibility and usage outside of module systems, make the Handlebars object a namespace
  var create = function() {
    var hb = new base.HandlebarsEnvironment();

    Utils.extend(hb, base);
    hb.SafeString = SafeString;
    hb.Exception = Exception;
    hb.Utils = Utils;
    hb.escapeExpression = Utils.escapeExpression;

    hb.VM = runtime;
    hb.template = function(spec) {
      return runtime.template(spec, hb);
    };

    return hb;
  };

  var Handlebars = create();
  Handlebars.create = create;

  Handlebars['default'] = Handlebars;

  __exports__ = Handlebars;
  return __exports__;
})(__module1__, __module3__, __module4__, __module2__, __module5__);

  return __module0__;
}));

(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['postview.comments'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div id=\"CommentContent\">\n  <div class=\"bigLoadingText downloadingComments\"> loading comments </div>\n</div>\n";
  },"useData":true});
templates['postview'] = template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <button class=\"openSubreddit openContainer\">\n      <i class=\"icon-list-ul\"></i>   /r/"
    + escapeExpression(((helper = (helper = helpers.subreddit || (depth0 != null ? depth0.subreddit : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"subreddit","hash":{},"data":data}) : helper)))
    + "<div id=\"inner\"></div>\n    </button>\n";
},"3":function(depth0,helpers,partials,data) {
  return "    <button class=\"subscribeToSubreddit openContainer\">\n      <i class=\"icon-heart\"></i>   Subscribe<div id=\"inner\"></div>\n    </button>\n";
  },"5":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "    <button class=\"galleryFromPost openContainer\">\n      <i class=\"icon-camera\"></i>   "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.locale : depth0)) != null ? stack1.Gallery : stack1), depth0))
    + "\n      <div id=\"inner\"></div>\n    </button>\n";
},"7":function(depth0,helpers,partials,data) {
  return "    <button class=\"editPost openContainer\"><i class=\"icon-pencil\"></i>   Edit Post</button>\n";
  },"9":function(depth0,helpers,partials,data) {
  return "    <button class=\"removePost openContainer\"><i class=\"icon-trash\"></i>   Remove</button>\n    <button class=\"deletePost openContainer\"><i class=\"icon-trash\"></i>   Delete</button>\n";
  },"11":function(depth0,helpers,partials,data) {
  return "      <i class=\"icon-lock\"></i>\n      <span class=\"tooltip\">Locked</span>\n";
  },"13":function(depth0,helpers,partials,data) {
  return "        <i class=\"icon-comments-alt\"></i>\n        <span class=\"tooltip\">Reply</span>\n";
  },"15":function(depth0,helpers,partials,data) {
  return "        (Locked)\n";
  },"17":function(depth0,helpers,partials,data) {
  return "        <a data-ignore=true type=\"Friend\" class=\"setNavigateType commentButton Button\"><i class=\"icon-group\"></i>   Friend<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Me\" class=\"setNavigateType commentButton Button\"><i class=\"icon-user\"></i>   Me<div id=\"inner\"></div></a>\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", helperMissing=helpers.helperMissing, buffer = "<div class=\"header\">\n	<a data-ignore=\"true\" id=\"closePostView\" class=\"closeButton Button\">\n    <i class=\"icon-remove\"></i>\n    <div id=\"inner\"></div>\n  </a>\n  <div id=\"mainPostTitle\" class=\"posttitle\">\n    <span class=\"domain\">("
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.domain : stack1), depth0))
    + ")</span>\n    <span class=\"actualTitle\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.title : stack1), depth0))
    + "</span>\n  </div>\n	<div class=\"politics\">\n		<div class=\"upbutton "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.vote : depth0)) != null ? stack1.up_button_class : stack1), depth0))
    + "\">\n      <i class=\"icon-arrow-up\"></i>\n      <span>\n        &nbsp;&nbsp;\n        <span class=\"count\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.vote : depth0)) != null ? stack1.ups : stack1), depth0))
    + "</span>\n      </span>\n      "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.locale : depth0)) != null ? stack1.up : stack1), depth0))
    + "\n    </div>\n		<div class=\"downbutton "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.vote : depth0)) != null ? stack1.down_button_class : stack1), depth0))
    + "\">\n      <i class=\"icon-arrow-down\"></i>\n      <span>\n        &nbsp;&nbsp;\n        <span class=\"count\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.vote : depth0)) != null ? stack1.downs : stack1), depth0))
    + "</span>\n      </span>"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.locale : depth0)) != null ? stack1.down : stack1), depth0))
    + "</div>\n		<div style=\"clear: both\"></div>\n	</div>\n</div>\n\n<div class=\"headerStatistics\">\n	<div class=\"datedata\">\n    submitted \n    <span class=\""
    + escapeExpression(((helper = (helper = helpers.timestamp_text || (depth0 != null ? depth0.timestamp_text : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"timestamp_text","hash":{},"data":data}) : helper)))
    + "\" data-timestamp=\""
    + escapeExpression(((helper = (helper = helpers.timestamp || (depth0 != null ? depth0.timestamp : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"timestamp","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.timestamp_text || (depth0 != null ? depth0.timestamp_text : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"timestamp_text","hash":{},"data":data}) : helper)))
    + "</span>\n    by\n    <span class=\"Author\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.author : stack1), depth0))
    + "</span>\n    <span class=\""
    + escapeExpression(((helper = (helper = helpers.authorLowercase || (depth0 != null ? depth0.authorLowercase : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"authorLowercase","hash":{},"data":data}) : helper)))
    + " userTagList\"></span></div>\n	<div class=\"comments\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.num_comments : stack1), depth0))
    + " comments</div>\n</div>\n\n<div class=\"contentPreview\">\n  <div class=\"bigLoadingText\">\n    loading post content\n  </div>\n</div>\n\n<div id=\"buttonContainer\">\n\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.show_browse_subreddit : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.show_subscribe : stack1), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.show_gallery : stack1), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.show_edit : stack1), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.show_mod : stack1), {"name":"if","hash":{},"fn":this.program(9, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n  <button class=\"savePost openContainer "
    + escapeExpression(lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.save : stack1)) != null ? stack1.button_class : stack1), depth0))
    + "\">\n    <i class=\"icon-save\"></i>   "
    + escapeExpression(lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.save : stack1)) != null ? stack1.text : stack1), depth0))
    + "\n    <div id=\"inner\"></div>\n  </button>\n\n  <button data-clipboard-text=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.buttons : depth0)) != null ? stack1.copy_url : stack1), depth0))
    + "\" id=\"copyLink\" class=\"copyLink openContainer\">\n    <i class=\"icon-copy\"></i>   "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.locale : depth0)) != null ? stack1.Copy_URL : stack1), depth0))
    + "\n    <div id=\"inner\"></div>\n  </button>\n\n  <button class=\"visitLink openContainer\">\n    <i class=\"icon-eye-open\"></i>   "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.locale : depth0)) != null ? stack1.Open_Link : stack1), depth0))
    + "\n    <div id=\"inner\"></div>\n  </button>\n\n  <button class=\"moreOptions openContainer\">\n    <i class=\"icon-arrow-down\"></i>   "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.locale : depth0)) != null ? stack1.More_Options : stack1), depth0))
    + "\n    <div id=\"inner\"></div>\n  </button>\n\n</div>\n\n<div class=\"commentsStickPlaceholder\"></div>\n<div class=\"commentsHeader commentsStick\">\n	<div class=\"title\">\n    <a data-ignore=true class=\"commentButton Button\" id=\"replyGlobal\">\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.locked : stack1), {"name":"if","hash":{},"fn":this.program(11, data),"inverse":this.program(13, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      <div id=\"inner\"></div>\n    </a>\n		<div class=\"commentAmount\">\n      "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.num_comments : stack1), depth0))
    + " Comments\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.post : depth0)) != null ? stack1.locked : stack1), {"name":"if","hash":{},"fn":this.program(15, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "    </div>\n	</div>\n	<div id=\"commentButtonsContainer\">\n		<span id=\"navigateControls\">\n			<span id=\"navigateByIterator\"></span>\n			<div class=\"navigateByTypeContainer\">\n				<div class=\"upper\">\n					<a data-ignore=true type=\"Hot\" class=\"setNavigateType commentButton Button\"><i class=\"icon-fire\"></i>   Hot<div id=\"inner\"></div></a>\n					<a data-ignore=true type=\"Time\" class=\"setNavigateType commentButton Button\"><i class=\"icon-dashboard\"></i>   Time<div id=\"inner\"></div></a>\n					<a data-ignore=true type=\"DirectReplies\" class=\"setNavigateType commentButton Button\"><i class=\"icon-sitemap\"></i>   Direct Replies<div id=\"inner\"></div></a>\n				</div>\n				<a data-ignore=true type=\"Search\" class=\"setNavigateTypeSearch commentButton Button\"><i class=\"icon-search\"></i>   Search<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Submitter\" class=\"setNavigateType commentButton Button\"><i class=\"icon-user-md\"></i>   Poster<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"New\" class=\"setNavigateType commentButton Button\"><i class=\"icon-asterisk\"></i>   New<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Mod\" class=\"setNavigateType commentButton Button\"><i class=\"icon-legal\"></i>   Mod<div id=\"inner\"></div></a>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.logged_in : depth0), {"name":"if","hash":{},"fn":this.program(17, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n				<a data-ignore=true type=\"Links\" class=\"setNavigateTypeUser commentButton Button\"><i class=\"icon-link\"></i>   User<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Deleted\" class=\"setNavigateType commentButton Button\"><i class=\"icon-remove-sign\"></i>   Deleted<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Answered\" class=\"setNavigateType commentButton Button\"><i class=\"icon-check\"></i>   Answer<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Images\" class=\"setNavigateType commentButton Button\"><i class=\"icon-picture\"></i>   Pic<div id=\"inner\"></div></a>\n				<a data-ignore=true type=\"Links\" class=\"setNavigateType commentButton Button\"><i class=\"icon-link\"></i>   Link<div id=\"inner\"></div></a>\n			</div>\n			<a data-ignore=true id=\"navigateDone\" class=\"commentButton Button\"><i class=\"icon-ok\"></i>   Done<div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"navigateNext\" class=\"commentButton Button\"><i class=\"icon-arrow-right\"></i>   Next<div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"navigatePrev\" class=\"commentButton Button\"><i class=\"icon-arrow-left\"></i>   Prev<div id=\"inner\"></div></a>\n		</span>\n		<span id=\"primaryControls\">\n			<a data-ignore=true id=\"navigateBy\" class=\"commentButton Button\"><i class=\"icon-globe\"></i><span class=\"tooltip\">Navigate By</span><div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"scrollToTop\" class=\"commentButton Button\"><i class=\"icon-circle-arrow-up\"></i><span class=\"tooltip\">Scroll Top</span><div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"highlightNewToggle\" class=\"commentButton Button\"><i class=\"icon-magic\"></i><span class=\"tooltip\">"
    + escapeExpression(((helper = (helper = helpers.highlight_new_text || (depth0 != null ? depth0.highlight_new_text : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"highlight_new_text","hash":{},"data":data}) : helper)))
    + "</span><div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"loadAllComments\" class=\"commentButton Button\"><i class=\"icon-asterisk\"></i><span class=\"tooltip\">Load All</span><div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"reloadComments\" class=\"commentButton Button\"><i class=\"icon-refresh\"></i><span class=\"tooltip\">Reload</span><div id=\"inner\"></div></a>\n			<a data-ignore=true id=\"commentSort\" class=\"commentButton Button\">"
    + escapeExpression(((helper = (helper = helpers.sort || (depth0 != null ? depth0.sort : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"sort","hash":{},"data":data}) : helper)))
    + "<div id=\"inner\"></div></a>\n			<div id=\"commentSortTypes\" class=\"right dropDown\">\n				<div class=\"item\">hot</div>\n				<div class=\"item\">new</div>\n				<div class=\"item\">controversial</div>\n				<div class=\"item\">top</div>\n				<div class=\"item\">old</div>\n				<div class=\"item\">best</div>\n			</div>\n		</span>\n	</div>\n</div>\n";
},"useData":true});
templates['stream.ad'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"post ad withComments\" data-href=\""
    + escapeExpression(((helper = (helper = helpers.banner_link || (depth0 != null ? depth0.banner_link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"banner_link","hash":{},"data":data}) : helper)))
    + "\" style=\"padding-bottom: 2px; padding-left: 6px\"> \n	<div class=\"postContent\">\n		<div class=\"title\" style=\"display: inline-block\">\n			";
  stack1 = ((helper = (helper = helpers.banner_text || (depth0 != null ? depth0.banner_text : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"banner_text","hash":{},"data":data}) : helper));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n		</div> \n		<div class=\"smartContent withSmartContent\" style=\"float: left; display: inline-block\"><img src=\""
    + escapeExpression(((helper = (helper = helpers.image_address || (depth0 != null ? depth0.image_address : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"image_address","hash":{},"data":data}) : helper)))
    + "\" style=\"box-shadow: none; margin-right: 10px\"></div>\n		<div class=\"comments\"><span class=\"link removeAds\">Remove Ads</span></div>\n		<div style=\"clear: both\"></div>\n	</div>\n</div>";
},"useData":true});
templates['stream.contentPreviews'] = template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "		<div class='option loadAllComments'> \n			<span class=\"icon-list\"></span> View all \n			<span class='commentCount'>"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, (depth0 != null ? depth0.num_comments : depth0), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span> comments\n			";
  stack1 = ((helpers.newCommentBuffer || (depth0 && depth0.newCommentBuffer) || helperMissing).call(depth0, (depth0 != null ? depth0.name : depth0), (depth0 != null ? depth0.num_comments : depth0), {"name":"newCommentBuffer","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n		</div>\n		<div class='option makeReply'> <span class=\"icon-reply\"></span> Reply to post</div>\n";
},"3":function(depth0,helpers,partials,data) {
  return "		<div class='option makeReply firstToComment'> <span class=\"icon-rocket\"></span> Be the first to comment</div>\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"topComments\" data-num_comments=\""
    + escapeExpression(((helper = (helper = helpers.num_comments || (depth0 != null ? depth0.num_comments : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"num_comments","hash":{},"data":data}) : helper)))
    + "\">\n	<div class='commentContainer'> <div class=\"loading\"></div> </div>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.num_comments : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>";
},"useData":true});
templates['stream.contentPreviews.list'] = template({"1":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = "	<div class=\"comment\" data-permalink=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.permalink : stack1), depth0))
    + "\" data-id=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.id : stack1), depth0))
    + "\" data-name=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.name : stack1), depth0))
    + "\">\n		<div class=\"streamPoliticsContainer\">\n			<div class=\"streamPolitics\">\n				<div class=\"ups "
    + escapeExpression(((helpers.politicsClass || (depth0 && depth0.politicsClass) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.likes : stack1), {"name":"politicsClass","hash":{},"data":data})))
    + "\">\n					<span class=\"icon-arrow-up\"></span>\n					<span class=\"number\">"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.ups : stack1), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span>\n				</div>\n				<div class=\"downs "
    + escapeExpression(((helpers.politicsClass || (depth0 && depth0.politicsClass) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.likes : stack1), {"name":"politicsClass","hash":{},"data":data})))
    + "\">\n					<span class=\"icon-arrow-down\"></span>\n					<span class=\"number\">"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.downs : stack1), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span>\n				</div>\n			</div>\n		</div>\n		<span class=\"author\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.author : stack1), depth0))
    + "</span> \n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.gilded : stack1), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "		";
  stack1 = ((helpers.tagsForUser || (depth0 && depth0.tagsForUser) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.author : stack1), {"name":"tagsForUser","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n		<span class=\"reply cmtOption\"><span class=\"icon-reply\"></span> Reply</span> \n";
  stack1 = ((helpers.iAmAuthor || (depth0 && depth0.iAmAuthor) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.author : stack1), {"name":"iAmAuthor","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "		";
  stack1 = ((helpers.streamParseEntities || (depth0 && depth0.streamParseEntities) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.body_html : stack1), {"name":"streamParseEntities","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n	</div>\n";
},"2":function(depth0,helpers,partials,data) {
  return "			<span class='icon-star gilded'></span>\n";
  },"4":function(depth0,helpers,partials,data) {
  return "			<span class=\"edit cmtOption\"><span class=\"icon-pencil\"></span> Edit</span>\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.comments : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});
templates['stream'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"stream\" data-url=\""
    + escapeExpression(((helper = (helper = helpers.url || (depth0 != null ? depth0.url : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"url","hash":{},"data":data}) : helper)))
    + "\">  \n	<div class=\"fixedOrFluid\">\n		<a class=\"fixed\">Narrow</a>\n		<div class=\"spacer\">|</div>\n		<a class=\"fluid\">Wide</a>\n	</div>\n	";
  stack1 = ((helper = (helper = helpers.content || (depth0 != null ? depth0.content : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"content","hash":{},"data":data}) : helper));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n</div>";
},"useData":true});
templates['stream.header'] = template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "			<select class=\"multiTitle\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.allsubs : depth0), {"name":"each","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "			</select>\n";
},"2":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "					<option value=\""
    + escapeExpression(lambda((data && data.index), depth0))
    + ":"
    + escapeExpression(lambda(depth0, depth0))
    + "\">"
    + escapeExpression(lambda(depth0, depth0))
    + "</option>\n";
},"4":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "			<div class=\"title\">/r/"
    + escapeExpression(((helper = (helper = helpers.display_name || (depth0 != null ? depth0.display_name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"display_name","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"6":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "		<div class='fakeInput'>\n			Start typing a title here to make a post to "
    + escapeExpression(((helper = (helper = helpers.display_name || (depth0 != null ? depth0.display_name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"display_name","hash":{},"data":data}) : helper)))
    + "...\n		</div>\n		<div data-name='"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "' class='subscribe ";
  stack1 = ((helper = (helper = helpers.user_is_subscriber || (depth0 != null ? depth0.user_is_subscriber : depth0)) != null ? helper : helperMissing),(options={"name":"user_is_subscriber","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.user_is_subscriber) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "'></div>\n		<div class='openSidebar'>Sidebar</div>\n		<div style='clear: both'></div>\n";
},"7":function(depth0,helpers,partials,data) {
  return "unsubscribe";
  },"9":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "		<div class='pleaseLogin'>\n			<span class='icon-lock'></span> Login to your Reddit account in the top right of Reditr to create new posts and subscribe to "
    + escapeExpression(((helper = (helper = helpers.display_name || (depth0 != null ? depth0.display_name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"display_name","hash":{},"data":data}) : helper)))
    + "\n		</div>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div data-selectedSubreddit=\""
    + escapeExpression(((helper = (helper = helpers.selectedSubreddit || (depth0 != null ? depth0.selectedSubreddit : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"selectedSubreddit","hash":{},"data":data}) : helper)))
    + "\" class=\"headerElement post withComments\" data-href=\"http://reddit.com/r/"
    + escapeExpression(((helper = (helper = helpers.display_name || (depth0 != null ? depth0.display_name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"display_name","hash":{},"data":data}) : helper)))
    + "\"> \n	<div class=\"postContent\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.multisub : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(4, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "		<div class=\"infoDescription noStyle\">\n			";
  stack1 = ((helper = (helper = helpers.public_description || (depth0 != null ? depth0.public_description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"public_description","hash":{},"data":data}) : helper));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n		</div> \n		<div class='activeUsers'>\n			"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, (depth0 != null ? depth0.accounts_active : depth0), {"name":"numberWithCommas","hash":{},"data":data})))
    + " <span class='icon-male'></span>\n		</div>\n		<div class='comments'>\n			<span class='subscriberCount'>"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, (depth0 != null ? depth0.subscribers : depth0), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span> <span class='icon-heart'></span>\n		</div>\n	</div>\n</div>\n\n<div class='topComments headerElement'>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.loggedin : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.program(9, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>";
},"useData":true});
templates['stream.list'] = template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.isUniquePost || (depth0 && depth0.isUniquePost) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.id : stack1), {"name":"isUniquePost","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.notFiltered || (depth0 && depth0.notFiltered) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.subreddit : stack1), {"name":"notFiltered","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = "  <div class=\"post\" data-id=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.id : stack1), depth0))
    + "\" data-href=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.url : stack1), depth0))
    + "\" data-permalink=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.permalink : stack1), depth0))
    + "\" data-num_comments=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.num_comments : stack1), depth0))
    + "\" data-name=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.name : stack1), depth0))
    + "\"> \n			<div class=\"postContent\">\n				<div class=\"streamPostOptions\"><i class=\"icon-angle-down\"></i></div>\n				<div class=\"streamPolitics\">\n					<div class=\"ups "
    + escapeExpression(((helpers.politicsClass || (depth0 && depth0.politicsClass) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.likes : stack1), {"name":"politicsClass","hash":{},"data":data})))
    + "\">\n						<span class=\"icon-arrow-up\"></span>\n						<span class=\"number\">"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.ups : stack1), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span>\n					</div>\n					<div class=\"downs "
    + escapeExpression(((helpers.politicsClass || (depth0 && depth0.politicsClass) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.likes : stack1), {"name":"politicsClass","hash":{},"data":data})))
    + "\">\n						<span class=\"icon-arrow-down\"></span>\n						<span class=\"number\">"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.downs : stack1), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span>\n					</div>\n				</div>\n				<a class=\"title\" href=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.url : stack1), depth0))
    + "\">\n					";
  stack1 = lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.title : stack1), depth0);
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n					<div class=\"domain\">(";
  stack1 = lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.domain : stack1), depth0);
  if (stack1 != null) { buffer += stack1; }
  buffer += ")</div> \n				</a> \n				<div class=\"smartContent nsfw_"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.over_18 : stack1), depth0))
    + "\" data-url=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.url : stack1), depth0))
    + "\" data-preview=\""
    + escapeExpression(lambda(((stack1 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.preview : stack1)) != null ? stack1.images : stack1)) != null ? stack1['0'] : stack1)) != null ? stack1.source : stack1)) != null ? stack1.url : stack1), depth0))
    + "\"></div>\n				<div class=\"meta\">";
  stack1 = ((helpers.streamTime || (depth0 && depth0.streamTime) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.created_utc : stack1), {"name":"streamTime","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += " by <span class=\"author link\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.author : stack1), depth0))
    + "</span>";
  stack1 = ((helpers.tagsForUser || (depth0 && depth0.tagsForUser) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.author : stack1), {"name":"tagsForUser","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + " in <span class=\"sub link\">/r/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.subreddit : stack1), depth0))
    + "</span></div>\n				<div class=\"comments\">\n					<span class=\"commentCount\">"
    + escapeExpression(((helpers.numberWithCommas || (depth0 && depth0.numberWithCommas) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.data : depth0)) != null ? stack1.num_comments : stack1), {"name":"numberWithCommas","hash":{},"data":data})))
    + "</span>\n					<span class=\"icon-comments\"></span>\n				</div>\n			</div>\n			<div class=\"unhidePrompt\">Unhide this post</div>\n		</div>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers.each.call(depth0, depth0, {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});
templates['stream.sidebar.sortby'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"node guest member sortStreamBy\">\n	<i class=\"icon-sort-by-attributes nodeIcon\"></i>Sort by \n	<span>\n		<select>\n			<option>hot</option>\n			<option>top</option>\n			<option>new</option>\n			<option>controversial</option>\n		</select>\n		<i class=\"icon-caret-down\"></i>\n	</span> \n</div>";
  },"useData":true});
templates['stream.subsidebar'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, buffer = "<div id=\"subs\" class=\"group open\">\n	<div class=\"node title\">Subreddits<div class=\"icon-chevron-up\"></div></div>\n		<div class=\"node search guest member\">\n			<input class=\"streamSubSearch\" placeholder=\"enter subreddit such as pics\">\n		</div>\n	";
  stack1 = lambda(depth0, depth0);
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n</div>";
},"useData":true});
templates['stream.subsidebar.list'] = template({"1":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "	<div data-flags='"
    + escapeExpression(((helpers.toJSON || (depth0 && depth0.toJSON) || helperMissing).call(depth0, (depth0 != null ? depth0.flags : depth0), {"name":"toJSON","hash":{},"data":data})))
    + "' data-id=\""
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\" class=\"node guest member\" data-url=\""
    + escapeExpression(((helpers.formatURL || (depth0 && depth0.formatURL) || helperMissing).call(depth0, (depth0 != null ? depth0.url : depth0), {"name":"formatURL","hash":{},"data":data})))
    + "\" data-name=\""
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "\" style=\"display: block;\">";
  stack1 = ((helpers.sidebarIcon || (depth0 && depth0.sidebarIcon) || helperMissing).call(depth0, (depth0 != null ? depth0.url : depth0), {"name":"sidebarIcon","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + " <span class=\"title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</span> <span class=\"icon-cog\"></span> </div>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers.each.call(depth0, depth0, {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"useData":true});
templates['stream.subsidebar.prefs'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"sidebarPrefs\">\n	<button data-message=\"changeTitle\">\n		<i class=\"icon-pencil\"></i>\n		<span class='label'>Change Title</span>\n	</button>\n	<button data-message=\"manageSubreddits\">\n		<i class=\"icon-tasks\"></i>\n		<span class='label'>Manage Subreddits</span>\n	</button>\n	<button data-message=\"remove\">\n		<i class=\"icon-trash\"></i>\n		<span class='label'>Remove</span>\n		</button>\n	<button data-message=\"unsubscribe\" class=\"subUnsub\">\n		<i class=\"icon-heart-empty\"></i>\n		<span class='label'>Unsubscribe</span>\n	</button>\n</div>";
  },"useData":true});
templates['stream.tutorial'] = template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"tutorial\">\n	<i class=\"close icon-remove\"></i>\n	<div class=\"title\">\n		<i class=\"icon-info-sign\"></i>  Welcome to Reditr, Here's Some Helpful Tips\n	</div>\n	<div class=\"content\">\n		<ul>\n			<li> <strong>Below is your frontpage.</strong> To change to another subreddit use the sidebar on the left. </li>\n			<li> <strong>Column View</strong> is the other main feature of Reditr. This can be access from the activities dropdown on the sidebar. </li>\n			<li> <strong>Multiple Accounts</strong> can be added from the dropdown in the top right of the app. </li>\n			<li> <strong>Switching subreddits</strong> is easy. Just start typing in the searchbox in the sidebar on the left, and then hit enter. </li>\n			<li> <strong>Customize the sidebar</strong> by dragging around subreddits, hitting the cog to remove subreddits, or subscribe to new subreddits to add them the sidebar. </li>\n			<li> <strong>Change Themes</strong> by clicking the settings cog at the top of the app, and then selecting 'Theme' </li>\n		</ul>\n	</div>\n</div>";
  },"useData":true});
})();
/*! jQuery v2.0.0 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/
(function(e,undefined){var t,n,r=typeof undefined,i=e.location,o=e.document,s=o.documentElement,a=e.jQuery,u=e.$,l={},c=[],f="2.0.0",p=c.concat,h=c.push,d=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=f.trim,x=function(e,n){return new x.fn.init(e,n,t)},b=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^-ms-/,N=/-([\da-z])/gi,E=function(e,t){return t.toUpperCase()},S=function(){o.removeEventListener("DOMContentLoaded",S,!1),e.removeEventListener("load",S,!1),x.ready()};x.fn=x.prototype={jquery:f,constructor:x,init:function(e,t,n){var r,i;if(!e)return this;if("string"==typeof e){if(r="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:T.exec(e),!r||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof x?t[0]:t,x.merge(this,x.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:o,!0)),C.test(r[1])&&x.isPlainObject(t))for(r in t)x.isFunction(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return i=o.getElementById(r[2]),i&&i.parentNode&&(this.length=1,this[0]=i),this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?n.ready(e):(e.selector!==undefined&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return d.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,t,n,r,i,o,s=arguments[0]||{},a=1,u=arguments.length,l=!1;for("boolean"==typeof s&&(l=s,s=arguments[1]||{},a=2),"object"==typeof s||x.isFunction(s)||(s={}),u===a&&(s=this,--a);u>a;a++)if(null!=(e=arguments[a]))for(t in e)n=s[t],r=e[t],s!==r&&(l&&r&&(x.isPlainObject(r)||(i=x.isArray(r)))?(i?(i=!1,o=n&&x.isArray(n)?n:[]):o=n&&x.isPlainObject(n)?n:{},s[t]=x.extend(l,o,r)):r!==undefined&&(s[t]=r));return s},x.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=a),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){(e===!0?--x.readyWait:x.isReady)||(x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(o,[x]),x.fn.trigger&&x(o).trigger("ready").off("ready")))},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray,isWindow:function(e){return null!=e&&e===e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if("object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(t){return!1}return!0},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:JSON.parse,parseXML:function(e){var t,n;if(!e||"string"!=typeof e)return null;try{n=new DOMParser,t=n.parseFromString(e,"text/xml")}catch(r){t=undefined}return(!t||t.getElementsByTagName("parsererror").length)&&x.error("Invalid XML: "+e),t},noop:function(){},globalEval:function(e){var t,n=eval;e=x.trim(e),e&&(1===e.indexOf("use strict")?(t=o.createElement("script"),t.text=e,o.head.appendChild(t).parentNode.removeChild(t)):n(e))},camelCase:function(e){return e.replace(k,"ms-").replace(N,E)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,s=j(e);if(n){if(s){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(s){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:function(e){return null==e?"":v.call(e)},makeArray:function(e,t){var n=t||[];return null!=e&&(j(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:g.call(t,e,n)},merge:function(e,t){var n=t.length,r=e.length,i=0;if("number"==typeof n)for(;n>i;i++)e[r++]=t[i];else while(t[i]!==undefined)e[r++]=t[i++];return e.length=r,e},grep:function(e,t,n){var r,i=[],o=0,s=e.length;for(n=!!n;s>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,s=j(e),a=[];if(s)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(a[a.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(a[a.length]=r);return p.apply([],a)},guid:1,proxy:function(e,t){var n,r,i;return"string"==typeof t&&(n=e[t],t=e,e=n),x.isFunction(e)?(r=d.call(arguments,2),i=function(){return e.apply(t||this,r.concat(d.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):undefined},access:function(e,t,n,r,i,o,s){var a=0,u=e.length,l=null==n;if("object"===x.type(n)){i=!0;for(a in n)x.access(e,t,a,n[a],!0,o,s)}else if(r!==undefined&&(i=!0,x.isFunction(r)||(s=!0),l&&(s?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(x(e),n)})),t))for(;u>a;a++)t(e[a],n,s?r:r.call(e[a],a,t(e[a],n)));return i?e:l?t.call(e):u?t(e[0],n):o},now:Date.now,swap:function(e,t,n,r){var i,o,s={};for(o in t)s[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=s[o];return i}}),x.ready.promise=function(t){return n||(n=x.Deferred(),"complete"===o.readyState?setTimeout(x.ready):(o.addEventListener("DOMContentLoaded",S,!1),e.addEventListener("load",S,!1))),n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function j(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}t=x(o),function(e,undefined){var t,n,r,i,o,s,a,u,l,c,f,p,h,d,g,m,y="sizzle"+-new Date,v=e.document,b={},w=0,T=0,C=ot(),k=ot(),N=ot(),E=!1,S=function(){return 0},j=typeof undefined,D=1<<31,A=[],L=A.pop,q=A.push,H=A.push,O=A.slice,F=A.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},P="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",R="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",W=M.replace("w","w#"),$="\\["+R+"*("+M+")"+R+"*(?:([*^$|!~]?=)"+R+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+W+")|)|)"+R+"*\\]",B=":("+M+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+$.replace(3,8)+")*)|.*)\\)|)",I=RegExp("^"+R+"+|((?:^|[^\\\\])(?:\\\\.)*)"+R+"+$","g"),z=RegExp("^"+R+"*,"+R+"*"),_=RegExp("^"+R+"*([>+~]|"+R+")"+R+"*"),X=RegExp(R+"*[+~]"),U=RegExp("="+R+"*([^\\]'\"]*)"+R+"*\\]","g"),Y=RegExp(B),V=RegExp("^"+W+"$"),G={ID:RegExp("^#("+M+")"),CLASS:RegExp("^\\.("+M+")"),TAG:RegExp("^("+M.replace("w","w*")+")"),ATTR:RegExp("^"+$),PSEUDO:RegExp("^"+B),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+R+"*(even|odd|(([+-]|)(\\d*)n|)"+R+"*(?:([+-]|)"+R+"*(\\d+)|))"+R+"*\\)|)","i"),"boolean":RegExp("^(?:"+P+")$","i"),needsContext:RegExp("^"+R+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+R+"*((?:-\\d)?\\d*)"+R+"*\\)|)(?=[^-]|$)","i")},J=/^[^{]+\{\s*\[native \w/,Q=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,K=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,et=/'|\\/g,tt=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,nt=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{H.apply(A=O.call(v.childNodes),v.childNodes),A[v.childNodes.length].nodeType}catch(rt){H={apply:A.length?function(e,t){q.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function it(e){return J.test(e+"")}function ot(){var e,t=[];return e=function(n,i){return t.push(n+=" ")>r.cacheLength&&delete e[t.shift()],e[n]=i}}function st(e){return e[y]=!0,e}function at(e){var t=c.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function ut(e,t,n,r){var i,o,s,a,u,f,d,g,x,w;if((t?t.ownerDocument||t:v)!==c&&l(t),t=t||c,n=n||[],!e||"string"!=typeof e)return n;if(1!==(a=t.nodeType)&&9!==a)return[];if(p&&!r){if(i=Q.exec(e))if(s=i[1]){if(9===a){if(o=t.getElementById(s),!o||!o.parentNode)return n;if(o.id===s)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(s))&&m(t,o)&&o.id===s)return n.push(o),n}else{if(i[2])return H.apply(n,t.getElementsByTagName(e)),n;if((s=i[3])&&b.getElementsByClassName&&t.getElementsByClassName)return H.apply(n,t.getElementsByClassName(s)),n}if(b.qsa&&(!h||!h.test(e))){if(g=d=y,x=t,w=9===a&&e,1===a&&"object"!==t.nodeName.toLowerCase()){f=gt(e),(d=t.getAttribute("id"))?g=d.replace(et,"\\$&"):t.setAttribute("id",g),g="[id='"+g+"'] ",u=f.length;while(u--)f[u]=g+mt(f[u]);x=X.test(e)&&t.parentNode||t,w=f.join(",")}if(w)try{return H.apply(n,x.querySelectorAll(w)),n}catch(T){}finally{d||t.removeAttribute("id")}}}return kt(e.replace(I,"$1"),t,n,r)}o=ut.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},l=ut.setDocument=function(e){var t=e?e.ownerDocument||e:v;return t!==c&&9===t.nodeType&&t.documentElement?(c=t,f=t.documentElement,p=!o(t),b.getElementsByTagName=at(function(e){return e.appendChild(t.createComment("")),!e.getElementsByTagName("*").length}),b.attributes=at(function(e){return e.className="i",!e.getAttribute("className")}),b.getElementsByClassName=at(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),b.sortDetached=at(function(e){return 1&e.compareDocumentPosition(c.createElement("div"))}),b.getById=at(function(e){return f.appendChild(e).id=y,!t.getElementsByName||!t.getElementsByName(y).length}),b.getById?(r.find.ID=function(e,t){if(typeof t.getElementById!==j&&p){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},r.filter.ID=function(e){var t=e.replace(tt,nt);return function(e){return e.getAttribute("id")===t}}):(r.find.ID=function(e,t){if(typeof t.getElementById!==j&&p){var n=t.getElementById(e);return n?n.id===e||typeof n.getAttributeNode!==j&&n.getAttributeNode("id").value===e?[n]:undefined:[]}},r.filter.ID=function(e){var t=e.replace(tt,nt);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),r.find.TAG=b.getElementsByTagName?function(e,t){return typeof t.getElementsByTagName!==j?t.getElementsByTagName(e):undefined}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},r.find.CLASS=b.getElementsByClassName&&function(e,t){return typeof t.getElementsByClassName!==j&&p?t.getElementsByClassName(e):undefined},d=[],h=[],(b.qsa=it(t.querySelectorAll))&&(at(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||h.push("\\["+R+"*(?:value|"+P+")"),e.querySelectorAll(":checked").length||h.push(":checked")}),at(function(e){var t=c.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&h.push("[*^$]="+R+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||h.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),h.push(",.*:")})),(b.matchesSelector=it(g=f.webkitMatchesSelector||f.mozMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&at(function(e){b.disconnectedMatch=g.call(e,"div"),g.call(e,"[s!='']:x"),d.push("!=",B)}),h=h.length&&RegExp(h.join("|")),d=d.length&&RegExp(d.join("|")),m=it(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},S=f.compareDocumentPosition?function(e,n){if(e===n)return E=!0,0;var r=n.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(n);return r?1&r||!b.sortDetached&&n.compareDocumentPosition(e)===r?e===t||m(v,e)?-1:n===t||m(v,n)?1:u?F.call(u,e)-F.call(u,n):0:4&r?-1:1:e.compareDocumentPosition?-1:1}:function(e,n){var r,i=0,o=e.parentNode,s=n.parentNode,a=[e],l=[n];if(e===n)return E=!0,0;if(!o||!s)return e===t?-1:n===t?1:o?-1:s?1:u?F.call(u,e)-F.call(u,n):0;if(o===s)return lt(e,n);r=e;while(r=r.parentNode)a.unshift(r);r=n;while(r=r.parentNode)l.unshift(r);while(a[i]===l[i])i++;return i?lt(a[i],l[i]):a[i]===v?-1:l[i]===v?1:0},c):c},ut.matches=function(e,t){return ut(e,null,null,t)},ut.matchesSelector=function(e,t){if((e.ownerDocument||e)!==c&&l(e),t=t.replace(U,"='$1']"),!(!b.matchesSelector||!p||d&&d.test(t)||h&&h.test(t)))try{var n=g.call(e,t);if(n||b.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return ut(t,c,null,[e]).length>0},ut.contains=function(e,t){return(e.ownerDocument||e)!==c&&l(e),m(e,t)},ut.attr=function(e,t){(e.ownerDocument||e)!==c&&l(e);var n=r.attrHandle[t.toLowerCase()],i=n&&n(e,t,!p);return i===undefined?b.attributes||!p?e.getAttribute(t):(i=e.getAttributeNode(t))&&i.specified?i.value:null:i},ut.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},ut.uniqueSort=function(e){var t,n=[],r=0,i=0;if(E=!b.detectDuplicates,u=!b.sortStable&&e.slice(0),e.sort(S),E){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)e.splice(n[r],1)}return e};function lt(e,t){var n=t&&e,r=n&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function ct(e,t,n){var r;return n?undefined:(r=e.getAttributeNode(t))&&r.specified?r.value:e[t]===!0?t.toLowerCase():null}function ft(e,t,n){var r;return n?undefined:r=e.getAttribute(t,"type"===t.toLowerCase()?1:2)}function pt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ht(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function dt(e){return st(function(t){return t=+t,st(function(n,r){var i,o=e([],n.length,t),s=o.length;while(s--)n[i=o[s]]&&(n[i]=!(r[i]=n[i]))})})}i=ut.getText=function(e){var t,n="",r=0,o=e.nodeType;if(o){if(1===o||9===o||11===o){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=i(e)}else if(3===o||4===o)return e.nodeValue}else for(;t=e[r];r++)n+=i(t);return n},r=ut.selectors={cacheLength:50,createPseudo:st,match:G,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(tt,nt),e[3]=(e[4]||e[5]||"").replace(tt,nt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||ut.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&ut.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return G.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&Y.test(n)&&(t=gt(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(tt,nt).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=C[e+" "];return t||(t=RegExp("(^|"+R+")"+e+"("+R+"|$)"))&&C(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=ut.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),s="last"!==e.slice(-4),a="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,f,p,h,d,g=o!==s?"nextSibling":"previousSibling",m=t.parentNode,v=a&&t.nodeName.toLowerCase(),x=!u&&!a;if(m){if(o){while(g){f=t;while(f=f[g])if(a?f.nodeName.toLowerCase()===v:1===f.nodeType)return!1;d=g="only"===e&&!d&&"nextSibling"}return!0}if(d=[s?m.firstChild:m.lastChild],s&&x){c=m[y]||(m[y]={}),l=c[e]||[],h=l[0]===w&&l[1],p=l[0]===w&&l[2],f=h&&m.childNodes[h];while(f=++h&&f&&f[g]||(p=h=0)||d.pop())if(1===f.nodeType&&++p&&f===t){c[e]=[w,h,p];break}}else if(x&&(l=(t[y]||(t[y]={}))[e])&&l[0]===w)p=l[1];else while(f=++h&&f&&f[g]||(p=h=0)||d.pop())if((a?f.nodeName.toLowerCase()===v:1===f.nodeType)&&++p&&(x&&((f[y]||(f[y]={}))[e]=[w,p]),f===t))break;return p-=i,p===r||0===p%r&&p/r>=0}}},PSEUDO:function(e,t){var n,i=r.pseudos[e]||r.setFilters[e.toLowerCase()]||ut.error("unsupported pseudo: "+e);return i[y]?i(t):i.length>1?(n=[e,e,"",t],r.setFilters.hasOwnProperty(e.toLowerCase())?st(function(e,n){var r,o=i(e,t),s=o.length;while(s--)r=F.call(e,o[s]),e[r]=!(n[r]=o[s])}):function(e){return i(e,0,n)}):i}},pseudos:{not:st(function(e){var t=[],n=[],r=s(e.replace(I,"$1"));return r[y]?st(function(e,t,n,i){var o,s=r(e,null,i,[]),a=e.length;while(a--)(o=s[a])&&(e[a]=!(t[a]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:st(function(e){return function(t){return ut(e,t).length>0}}),contains:st(function(e){return function(t){return(t.textContent||t.innerText||i(t)).indexOf(e)>-1}}),lang:st(function(e){return V.test(e||"")||ut.error("unsupported lang: "+e),e=e.replace(tt,nt).toLowerCase(),function(t){var n;do if(n=p?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===c.activeElement&&(!c.hasFocus||c.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!r.pseudos.empty(e)},header:function(e){return Z.test(e.nodeName)},input:function(e){return K.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:dt(function(){return[0]}),last:dt(function(e,t){return[t-1]}),eq:dt(function(e,t,n){return[0>n?n+t:n]}),even:dt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:dt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:dt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:dt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(t in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})r.pseudos[t]=pt(t);for(t in{submit:!0,reset:!0})r.pseudos[t]=ht(t);function gt(e,t){var n,i,o,s,a,u,l,c=k[e+" "];if(c)return t?0:c.slice(0);a=e,u=[],l=r.preFilter;while(a){(!n||(i=z.exec(a)))&&(i&&(a=a.slice(i[0].length)||a),u.push(o=[])),n=!1,(i=_.exec(a))&&(n=i.shift(),o.push({value:n,type:i[0].replace(I," ")}),a=a.slice(n.length));for(s in r.filter)!(i=G[s].exec(a))||l[s]&&!(i=l[s](i))||(n=i.shift(),o.push({value:n,type:s,matches:i}),a=a.slice(n.length));if(!n)break}return t?a.length:a?ut.error(e):k(e,u).slice(0)}function mt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function yt(e,t,r){var i=t.dir,o=r&&"parentNode"===i,s=T++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,r,a){var u,l,c,f=w+" "+s;if(a){while(t=t[i])if((1===t.nodeType||o)&&e(t,r,a))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[y]||(t[y]={}),(l=c[i])&&l[0]===f){if((u=l[1])===!0||u===n)return u===!0}else if(l=c[i]=[f],l[1]=e(t,r,a)||n,l[1]===!0)return!0}}function vt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,s=[],a=0,u=e.length,l=null!=t;for(;u>a;a++)(o=e[a])&&(!n||n(o,r,i))&&(s.push(o),l&&t.push(a));return s}function bt(e,t,n,r,i,o){return r&&!r[y]&&(r=bt(r)),i&&!i[y]&&(i=bt(i,o)),st(function(o,s,a,u){var l,c,f,p=[],h=[],d=s.length,g=o||Ct(t||"*",a.nodeType?[a]:a,[]),m=!e||!o&&t?g:xt(g,p,e,a,u),y=n?i||(o?e:d||r)?[]:s:m;if(n&&n(m,y,a,u),r){l=xt(y,h),r(l,[],a,u),c=l.length;while(c--)(f=l[c])&&(y[h[c]]=!(m[h[c]]=f))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(f=y[c])&&l.push(m[c]=f);i(null,y=[],l,u)}c=y.length;while(c--)(f=y[c])&&(l=i?F.call(o,f):p[c])>-1&&(o[l]=!(s[l]=f))}}else y=xt(y===s?y.splice(d,y.length):y),i?i(null,s,y,u):H.apply(s,y)})}function wt(e){var t,n,i,o=e.length,s=r.relative[e[0].type],u=s||r.relative[" "],l=s?1:0,c=yt(function(e){return e===t},u,!0),f=yt(function(e){return F.call(t,e)>-1},u,!0),p=[function(e,n,r){return!s&&(r||n!==a)||((t=n).nodeType?c(e,n,r):f(e,n,r))}];for(;o>l;l++)if(n=r.relative[e[l].type])p=[yt(vt(p),n)];else{if(n=r.filter[e[l].type].apply(null,e[l].matches),n[y]){for(i=++l;o>i;i++)if(r.relative[e[i].type])break;return bt(l>1&&vt(p),l>1&&mt(e.slice(0,l-1)).replace(I,"$1"),n,i>l&&wt(e.slice(l,i)),o>i&&wt(e=e.slice(i)),o>i&&mt(e))}p.push(n)}return vt(p)}function Tt(e,t){var i=0,o=t.length>0,s=e.length>0,u=function(u,l,f,p,h){var d,g,m,y=[],v=0,x="0",b=u&&[],T=null!=h,C=a,k=u||s&&r.find.TAG("*",h&&l.parentNode||l),N=w+=null==C?1:Math.random()||.1;for(T&&(a=l!==c&&l,n=i);null!=(d=k[x]);x++){if(s&&d){g=0;while(m=e[g++])if(m(d,l,f)){p.push(d);break}T&&(w=N,n=++i)}o&&((d=!m&&d)&&v--,u&&b.push(d))}if(v+=x,o&&x!==v){g=0;while(m=t[g++])m(b,y,l,f);if(u){if(v>0)while(x--)b[x]||y[x]||(y[x]=L.call(p));y=xt(y)}H.apply(p,y),T&&!u&&y.length>0&&v+t.length>1&&ut.uniqueSort(p)}return T&&(w=N,a=C),b};return o?st(u):u}s=ut.compile=function(e,t){var n,r=[],i=[],o=N[e+" "];if(!o){t||(t=gt(e)),n=t.length;while(n--)o=wt(t[n]),o[y]?r.push(o):i.push(o);o=N(e,Tt(i,r))}return o};function Ct(e,t,n){var r=0,i=t.length;for(;i>r;r++)ut(e,t[r],n);return n}function kt(e,t,n,i){var o,a,u,l,c,f=gt(e);if(!i&&1===f.length){if(a=f[0]=f[0].slice(0),a.length>2&&"ID"===(u=a[0]).type&&9===t.nodeType&&p&&r.relative[a[1].type]){if(t=(r.find.ID(u.matches[0].replace(tt,nt),t)||[])[0],!t)return n;e=e.slice(a.shift().value.length)}o=G.needsContext.test(e)?0:a.length;while(o--){if(u=a[o],r.relative[l=u.type])break;if((c=r.find[l])&&(i=c(u.matches[0].replace(tt,nt),X.test(a[0].type)&&t.parentNode||t))){if(a.splice(o,1),e=i.length&&mt(a),!e)return H.apply(n,i),n;break}}}return s(e,f)(i,t,!p,n,X.test(e)),n}r.pseudos.nth=r.pseudos.eq;function Nt(){}Nt.prototype=r.filters=r.pseudos,r.setFilters=new Nt,b.sortStable=y.split("").sort(S).join("")===y,l(),[0,0].sort(S),b.detectDuplicates=E,at(function(e){if(e.innerHTML="<a href='#'></a>","#"!==e.firstChild.getAttribute("href")){var t="type|href|height|width".split("|"),n=t.length;while(n--)r.attrHandle[t[n]]=ft}}),at(function(e){if(null!=e.getAttribute("disabled")){var t=P.split("|"),n=t.length;while(n--)r.attrHandle[t[n]]=ct}}),x.find=ut,x.expr=ut.selectors,x.expr[":"]=x.expr.pseudos,x.unique=ut.uniqueSort,x.text=ut.getText,x.isXMLDoc=ut.isXML,x.contains=ut.contains}(e);var D={};function A(e){var t=D[e]={};return x.each(e.match(w)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?D[e]||A(e):x.extend({},e);var t,n,r,i,o,s,a=[],u=!e.once&&[],l=function(f){for(t=e.memory&&f,n=!0,s=i||0,i=0,o=a.length,r=!0;a&&o>s;s++)if(a[s].apply(f[0],f[1])===!1&&e.stopOnFalse){t=!1;break}r=!1,a&&(u?u.length&&l(u.shift()):t?a=[]:c.disable())},c={add:function(){if(a){var n=a.length;(function s(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&c.has(n)||a.push(n):n&&n.length&&"string"!==r&&s(n)})})(arguments),r?o=a.length:t&&(i=n,l(t))}return this},remove:function(){return a&&x.each(arguments,function(e,t){var n;while((n=x.inArray(t,a,n))>-1)a.splice(n,1),r&&(o>=n&&o--,s>=n&&s--)}),this},has:function(e){return e?x.inArray(e,a)>-1:!(!a||!a.length)},empty:function(){return a=[],o=0,this},disable:function(){return a=u=t=undefined,this},disabled:function(){return!a},lock:function(){return u=undefined,t||c.disable(),this},locked:function(){return!u},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!a||n&&!u||(r?u.push(t):l(t)),this},fire:function(){return c.fireWith(this,arguments),this},fired:function(){return!!n}};return c},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var s=o[0],a=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=a&&a.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===r?n.promise():this,a?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var s=o[2],a=o[3];r[o[1]]=s.add,a&&s.add(function(){n=a},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=s.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=d.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),s=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?d.call(arguments):r,n===a?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},a,u,l;if(r>1)for(a=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(s(t,l,n)).fail(o.reject).progress(s(t,u,a)):--i;return i||o.resolveWith(l,n),o.promise()}}),x.support=function(t){var n=o.createElement("input"),r=o.createDocumentFragment(),i=o.createElement("div"),s=o.createElement("select"),a=s.appendChild(o.createElement("option"));return n.type?(n.type="checkbox",t.checkOn=""!==n.value,t.optSelected=a.selected,t.reliableMarginRight=!0,t.boxSizingReliable=!0,t.pixelPosition=!1,n.checked=!0,t.noCloneChecked=n.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!a.disabled,n=o.createElement("input"),n.value="t",n.type="radio",t.radioValue="t"===n.value,n.setAttribute("checked","t"),n.setAttribute("name","t"),r.appendChild(n),t.checkClone=r.cloneNode(!0).cloneNode(!0).lastChild.checked,t.focusinBubbles="onfocusin"in e,i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===i.style.backgroundClip,x(function(){var n,r,s="padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",a=o.getElementsByTagName("body")[0];a&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",a.appendChild(n).appendChild(i),i.innerHTML="",i.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%",x.swap(a,null!=a.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===i.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(i,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(i,null)||{width:"4px"}).width,r=i.appendChild(o.createElement("div")),r.style.cssText=i.style.cssText=s,r.style.marginRight=r.style.width="0",i.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),a.removeChild(n))}),t):t}({});var L,q,H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,O=/([A-Z])/g;function F(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=x.expando+Math.random()}F.uid=1,F.accepts=function(e){return e.nodeType?1===e.nodeType||9===e.nodeType:!0},F.prototype={key:function(e){if(!F.accepts(e))return 0;var t={},n=e[this.expando];if(!n){n=F.uid++;try{t[this.expando]={value:n},Object.defineProperties(e,t)}catch(r){t[this.expando]=n,x.extend(e,t)}}return this.cache[n]||(this.cache[n]={}),n},set:function(e,t,n){var r,i=this.key(e),o=this.cache[i];if("string"==typeof t)o[t]=n;else if(x.isEmptyObject(o))this.cache[i]=t;else for(r in t)o[r]=t[r]},get:function(e,t){var n=this.cache[this.key(e)];return t===undefined?n:n[t]},access:function(e,t,n){return t===undefined||t&&"string"==typeof t&&n===undefined?this.get(e,t):(this.set(e,t,n),n!==undefined?n:t)},remove:function(e,t){var n,r,i=this.key(e),o=this.cache[i];if(t===undefined)this.cache[i]={};else{x.isArray(t)?r=t.concat(t.map(x.camelCase)):t in o?r=[t]:(r=x.camelCase(t),r=r in o?[r]:r.match(w)||[]),n=r.length;while(n--)delete o[r[n]]}},hasData:function(e){return!x.isEmptyObject(this.cache[e[this.expando]]||{})},discard:function(e){delete this.cache[this.key(e)]}},L=new F,q=new F,x.extend({acceptData:F.accepts,hasData:function(e){return L.hasData(e)||q.hasData(e)},data:function(e,t,n){return L.access(e,t,n)},removeData:function(e,t){L.remove(e,t)},_data:function(e,t,n){return q.access(e,t,n)},_removeData:function(e,t){q.remove(e,t)}}),x.fn.extend({data:function(e,t){var n,r,i=this[0],o=0,s=null;if(e===undefined){if(this.length&&(s=L.get(i),1===i.nodeType&&!q.get(i,"hasDataAttrs"))){for(n=i.attributes;n.length>o;o++)r=n[o].name,0===r.indexOf("data-")&&(r=x.camelCase(r.substring(5)),P(i,r,s[r]));q.set(i,"hasDataAttrs",!0)}return s}return"object"==typeof e?this.each(function(){L.set(this,e)}):x.access(this,function(t){var n,r=x.camelCase(e);if(i&&t===undefined){if(n=L.get(i,e),n!==undefined)return n;if(n=L.get(i,r),n!==undefined)return n;if(n=P(i,r,undefined),n!==undefined)return n}else this.each(function(){var n=L.get(this,r);L.set(this,r,t),-1!==e.indexOf("-")&&n!==undefined&&L.set(this,e,t)})},null,t,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){L.remove(this,e)})}});function P(e,t,n){var r;if(n===undefined&&1===e.nodeType)if(r="data-"+t.replace(O,"-$1").toLowerCase(),n=e.getAttribute(r),"string"==typeof n){try{n="true"===n?!0:"false"===n?!1:"null"===n?null:+n+""===n?+n:H.test(n)?JSON.parse(n):n}catch(i){}L.set(e,t,n)}else n=undefined;return n}x.extend({queue:function(e,t,n){var r;return e?(t=(t||"fx")+"queue",r=q.get(e,t),n&&(!r||x.isArray(n)?r=q.access(e,t,x.makeArray(n)):r.push(n)),r||[]):undefined},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),s=function(){x.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),o.cur=i,i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,s,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return q.get(e,n)||q.access(e,n,{empty:x.Callbacks("once memory").add(function(){q.remove(e,[t+"queue",n])})})}}),x.fn.extend({queue:function(e,t){var n=2;return"string"!=typeof e&&(t=e,e="fx",n--),n>arguments.length?x.queue(this[0],e):t===undefined?this:this.each(function(){var n=x.queue(this,e,t);
x._queueHooks(this,e),"fx"===e&&"inprogress"!==n[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=x.Deferred(),o=this,s=this.length,a=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=undefined),e=e||"fx";while(s--)n=q.get(o[s],e+"queueHooks"),n&&n.empty&&(r++,n.empty.add(a));return a(),i.promise(t)}});var R,M,W=/[\t\r\n]/g,$=/\r/g,B=/^(?:input|select|textarea|button)$/i;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return this.each(function(){delete this[x.propFix[e]||e]})},addClass:function(e){var t,n,r,i,o,s=0,a=this.length,u="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,s=0,a=this.length,u=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,i="boolean"==typeof t;return x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,s=0,a=x(this),u=t,l=e.match(w)||[];while(o=l[s++])u=i?u:!a.hasClass(o),a[u?"addClass":"removeClass"](o)}else(n===r||"boolean"===n)&&(this.className&&q.set(this,"__className__",this.className),this.className=this.className||e===!1?"":q.get(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(W," ").indexOf(t)>=0)return!0;return!1},val:function(e){var t,n,r,i=this[0];{if(arguments.length)return r=x.isFunction(e),this.each(function(n){var i,o=x(this);1===this.nodeType&&(i=r?e.call(this,n,o.val()):e,null==i?i="":"number"==typeof i?i+="":x.isArray(i)&&(i=x.map(i,function(e){return null==e?"":e+""})),t=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],t&&"set"in t&&t.set(this,i,"value")!==undefined||(this.value=i))});if(i)return t=x.valHooks[i.type]||x.valHooks[i.nodeName.toLowerCase()],t&&"get"in t&&(n=t.get(i,"value"))!==undefined?n:(n=i.value,"string"==typeof n?n.replace($,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,s=o?null:[],a=o?i+1:r.length,u=0>i?a:o?i:0;for(;a>u;u++)if(n=r[u],!(!n.selected&&u!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),s=i.length;while(s--)r=i[s],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,t,n){var i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===r?x.prop(e,t,n):(1===s&&x.isXMLDoc(e)||(t=t.toLowerCase(),i=x.attrHooks[t]||(x.expr.match.boolean.test(t)?M:R)),n===undefined?i&&"get"in i&&null!==(o=i.get(e,t))?o:(o=x.find.attr(e,t),null==o?undefined:o):null!==n?i&&"set"in i&&(o=i.set(e,n,t))!==undefined?o:(e.setAttribute(t,n+""),n):(x.removeAttr(e,t),undefined))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.boolean.test(n)&&(e[r]=!1),e.removeAttribute(n)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,t,n){var r,i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return o=1!==s||!x.isXMLDoc(e),o&&(t=x.propFix[t]||t,i=x.propHooks[t]),n!==undefined?i&&"set"in i&&(r=i.set(e,n,t))!==undefined?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){return e.hasAttribute("tabindex")||B.test(e.nodeName)||e.href?e.tabIndex:-1}}}}),M={set:function(e,t,n){return t===!1?x.removeAttr(e,n):e.setAttribute(n,n),n}},x.each(x.expr.match.boolean.source.match(/\w+/g),function(e,t){var n=x.expr.attrHandle[t]||x.find.attr;x.expr.attrHandle[t]=function(e,t,r){var i=x.expr.attrHandle[t],o=r?undefined:(x.expr.attrHandle[t]=undefined)!=n(e,t,r)?t.toLowerCase():null;return x.expr.attrHandle[t]=i,o}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,t){return x.isArray(t)?e.checked=x.inArray(x(e).val(),t)>=0:undefined}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var I=/^key/,z=/^(?:mouse|contextmenu)|click/,_=/^(?:focusinfocus|focusoutblur)$/,X=/^([^.]*)(?:\.(.+)|)$/;function U(){return!0}function Y(){return!1}function V(){try{return o.activeElement}catch(e){}}x.event={global:{},add:function(e,t,n,i,o){var s,a,u,l,c,f,p,h,d,g,m,y=q.get(e);if(y){n.handler&&(s=n,n=s.handler,o=s.selector),n.guid||(n.guid=x.guid++),(l=y.events)||(l=y.events={}),(a=y.handle)||(a=y.handle=function(e){return typeof x===r||e&&x.event.triggered===e.type?undefined:x.event.dispatch.apply(a.elem,arguments)},a.elem=e),t=(t||"").match(w)||[""],c=t.length;while(c--)u=X.exec(t[c])||[],d=m=u[1],g=(u[2]||"").split(".").sort(),d&&(p=x.event.special[d]||{},d=(o?p.delegateType:p.bindType)||d,p=x.event.special[d]||{},f=x.extend({type:d,origType:m,data:i,handler:n,guid:n.guid,selector:o,needsContext:o&&x.expr.match.needsContext.test(o),namespace:g.join(".")},s),(h=l[d])||(h=l[d]=[],h.delegateCount=0,p.setup&&p.setup.call(e,i,g,a)!==!1||e.addEventListener&&e.addEventListener(d,a,!1)),p.add&&(p.add.call(e,f),f.handler.guid||(f.handler.guid=n.guid)),o?h.splice(h.delegateCount++,0,f):h.push(f),x.event.global[d]=!0);e=null}},remove:function(e,t,n,r,i){var o,s,a,u,l,c,f,p,h,d,g,m=q.hasData(e)&&q.get(e);if(m&&(u=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(a=X.exec(t[l])||[],h=g=a[1],d=(a[2]||"").split(".").sort(),h){f=x.event.special[h]||{},h=(r?f.delegateType:f.bindType)||h,p=u[h]||[],a=a[2]&&RegExp("(^|\\.)"+d.join("\\.(?:.*\\.|)")+"(\\.|$)"),s=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||a&&!a.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));s&&!p.length&&(f.teardown&&f.teardown.call(e,d,m.handle)!==!1||x.removeEvent(e,h,m.handle),delete u[h])}else for(h in u)x.event.remove(e,h+t[l],n,r,!0);x.isEmptyObject(u)&&(delete m.handle,q.remove(e,"events"))}},trigger:function(t,n,r,i){var s,a,u,l,c,f,p,h=[r||o],d=y.call(t,"type")?t.type:t,g=y.call(t,"namespace")?t.namespace.split("."):[];if(a=u=r=r||o,3!==r.nodeType&&8!==r.nodeType&&!_.test(d+x.event.triggered)&&(d.indexOf(".")>=0&&(g=d.split("."),d=g.shift(),g.sort()),c=0>d.indexOf(":")&&"on"+d,t=t[x.expando]?t:new x.Event(d,"object"==typeof t&&t),t.isTrigger=i?2:3,t.namespace=g.join("."),t.namespace_re=t.namespace?RegExp("(^|\\.)"+g.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,t.result=undefined,t.target||(t.target=r),n=null==n?[t]:x.makeArray(n,[t]),p=x.event.special[d]||{},i||!p.trigger||p.trigger.apply(r,n)!==!1)){if(!i&&!p.noBubble&&!x.isWindow(r)){for(l=p.delegateType||d,_.test(l+d)||(a=a.parentNode);a;a=a.parentNode)h.push(a),u=a;u===(r.ownerDocument||o)&&h.push(u.defaultView||u.parentWindow||e)}s=0;while((a=h[s++])&&!t.isPropagationStopped())t.type=s>1?l:p.bindType||d,f=(q.get(a,"events")||{})[t.type]&&q.get(a,"handle"),f&&f.apply(a,n),f=c&&a[c],f&&x.acceptData(a)&&f.apply&&f.apply(a,n)===!1&&t.preventDefault();return t.type=d,i||t.isDefaultPrevented()||p._default&&p._default.apply(h.pop(),n)!==!1||!x.acceptData(r)||c&&x.isFunction(r[d])&&!x.isWindow(r)&&(u=r[c],u&&(r[c]=null),x.event.triggered=d,r[d](),x.event.triggered=undefined,u&&(r[c]=u)),t.result}},dispatch:function(e){e=x.event.fix(e);var t,n,r,i,o,s=[],a=d.call(arguments),u=(q.get(this,"events")||{})[e.type]||[],l=x.event.special[e.type]||{};if(a[0]=e,e.delegateTarget=this,!l.preDispatch||l.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),t=0;while((i=s[t++])&&!e.isPropagationStopped()){e.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(o.namespace))&&(e.handleObj=o,e.data=o.data,r=((x.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,a),r!==undefined&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return l.postDispatch&&l.postDispatch.call(this,e),e.result}},handlers:function(e,t){var n,r,i,o,s=[],a=t.delegateCount,u=e.target;if(a&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!==this;u=u.parentNode||this)if(u.disabled!==!0||"click"!==e.type){for(r=[],n=0;a>n;n++)o=t[n],i=o.selector+" ",r[i]===undefined&&(r[i]=o.needsContext?x(i,this).index(u)>=0:x.find(i,this,null,[u]).length),r[i]&&r.push(o);r.length&&s.push({elem:u,handlers:r})}return t.length>a&&s.push({elem:this,handlers:t.slice(a)}),s},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,t){var n,r,i,s=t.button;return null==e.pageX&&null!=t.clientX&&(n=e.target.ownerDocument||o,r=n.documentElement,i=n.body,e.pageX=t.clientX+(r&&r.scrollLeft||i&&i.scrollLeft||0)-(r&&r.clientLeft||i&&i.clientLeft||0),e.pageY=t.clientY+(r&&r.scrollTop||i&&i.scrollTop||0)-(r&&r.clientTop||i&&i.clientTop||0)),e.which||s===undefined||(e.which=1&s?1:2&s?3:4&s?2:0),e}},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,o=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=z.test(i)?this.mouseHooks:I.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new x.Event(o),t=r.length;while(t--)n=r[t],e[n]=o[n];return 3===e.target.nodeType&&(e.target=e.target.parentNode),s.filter?s.filter(e,o):e},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==V()&&this.focus?(this.focus(),!1):undefined},delegateType:"focusin"},blur:{trigger:function(){return this===V()&&this.blur?(this.blur(),!1):undefined},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&x.nodeName(this,"input")?(this.click(),!1):undefined},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==undefined&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)},x.Event=function(e,t){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.getPreventDefault&&e.getPreventDefault()?U:Y):this.type=e,t&&x.extend(this,t),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,undefined):new x.Event(e,t)},x.Event.prototype={isDefaultPrevented:Y,isPropagationStopped:Y,isImmediatePropagationStopped:Y,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=U,e&&e.preventDefault&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=U,e&&e.stopPropagation&&e.stopPropagation()},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=U,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,t,n,r,i){var o,s;if("object"==typeof e){"string"!=typeof t&&(n=n||t,t=undefined);for(s in e)this.on(s,t,n,e[s],i);return this}if(null==n&&null==r?(r=t,n=t=undefined):null==r&&("string"==typeof t?(r=n,n=undefined):(r=n,n=t,t=undefined)),r===!1)r=Y;else if(!r)return this;return 1===i&&(o=r,r=function(e){return x().off(e),o.apply(this,arguments)},r.guid=o.guid||(o.guid=x.guid++)),this.each(function(){x.event.add(this,e,r,n,t)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,x(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return(t===!1||"function"==typeof t)&&(n=t,t=undefined),n===!1&&(n=Y),this.each(function(){x.event.remove(this,e,n,t)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];return n?x.event.trigger(e,t,n,!0):undefined}});var G=/^.[^:#\[\.,]*$/,J=x.expr.match.needsContext,Q={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n,r,i=this.length;if("string"!=typeof e)return t=this,this.pushStack(x(e).filter(function(){for(r=0;i>r;r++)if(x.contains(t[r],this))return!0}));for(n=[],r=0;i>r;r++)x.find(e,this[r],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=(this.selector?this.selector+" ":"")+e,n},has:function(e){var t=x(e,this),n=t.length;return this.filter(function(){var e=0;for(;n>e;e++)if(x.contains(this,t[e]))return!0})},not:function(e){return this.pushStack(Z(this,e||[],!0))},filter:function(e){return this.pushStack(Z(this,e||[],!1))},is:function(e){return!!e&&("string"==typeof e?J.test(e)?x(e,this.context).index(this[0])>=0:x.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,o=[],s=J.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(s?s.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?g.call(x(e),this[0]):g.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function K(e,t){while((e=e[t])&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return K(e,"nextSibling")},prev:function(e){return K(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return x.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(Q[e]||x.unique(i),"p"===e[0]&&i.reverse()),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,t,n){var r=[],i=n!==undefined;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&x(e).is(n))break;r.push(e)}return r},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function Z(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(G.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return g.call(t,e)>=0!==n})}var et=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,tt=/<([\w:]+)/,nt=/<|&#?\w+;/,rt=/<(?:script|style|link)/i,it=/^(?:checkbox|radio)$/i,ot=/checked\s*(?:[^=]|=\s*.checked.)/i,st=/^$|\/(?:java|ecma)script/i,at=/^true\/(.*)/,ut=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,lt={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};lt.optgroup=lt.option,lt.tbody=lt.tfoot=lt.colgroup=lt.caption=lt.col=lt.thead,lt.th=lt.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===undefined?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=ct(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=ct(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(gt(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&ht(gt(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++)1===e.nodeType&&(x.cleanData(gt(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var t=this[0]||{},n=0,r=this.length;if(e===undefined&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!rt.test(e)&&!lt[(tt.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(et,"<$1></$2>");try{for(;r>n;n++)t=this[n]||{},1===t.nodeType&&(x.cleanData(gt(t,!1)),t.innerHTML=e);t=0}catch(i){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=p.apply([],e);var r,i,o,s,a,u,l=0,c=this.length,f=this,h=c-1,d=e[0],g=x.isFunction(d);if(g||!(1>=c||"string"!=typeof d||x.support.checkClone)&&ot.test(d))return this.each(function(r){var i=f.eq(r);g&&(e[0]=d.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(r=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),i=r.firstChild,1===r.childNodes.length&&(r=i),i)){for(o=x.map(gt(r,"script"),ft),s=o.length;c>l;l++)a=r,l!==h&&(a=x.clone(a,!0,!0),s&&x.merge(o,gt(a,"script"))),t.call(this[l],a,l);if(s)for(u=o[o.length-1].ownerDocument,x.map(o,pt),l=0;s>l;l++)a=o[l],st.test(a.type||"")&&!q.access(a,"globalEval")&&x.contains(u,a)&&(a.src?x._evalUrl(a.src):x.globalEval(a.textContent.replace(ut,"")))}return this}}),x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=[],i=x(e),o=i.length-1,s=0;for(;o>=s;s++)n=s===o?this:this.clone(!0),x(i[s])[t](n),h.apply(r,n.get());return this.pushStack(r)}}),x.extend({clone:function(e,t,n){var r,i,o,s,a=e.cloneNode(!0),u=x.contains(e.ownerDocument,e);if(!(x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(s=gt(a),o=gt(e),r=0,i=o.length;i>r;r++)mt(o[r],s[r]);if(t)if(n)for(o=o||gt(e),s=s||gt(a),r=0,i=o.length;i>r;r++)dt(o[r],s[r]);else dt(e,a);return s=gt(a,"script"),s.length>0&&ht(s,!u&&gt(e,"script")),a},buildFragment:function(e,t,n,r){var i,o,s,a,u,l,c=0,f=e.length,p=t.createDocumentFragment(),h=[];for(;f>c;c++)if(i=e[c],i||0===i)if("object"===x.type(i))x.merge(h,i.nodeType?[i]:i);else if(nt.test(i)){o=o||p.appendChild(t.createElement("div")),s=(tt.exec(i)||["",""])[1].toLowerCase(),a=lt[s]||lt._default,o.innerHTML=a[1]+i.replace(et,"<$1></$2>")+a[2],l=a[0];while(l--)o=o.firstChild;x.merge(h,o.childNodes),o=p.firstChild,o.textContent=""}else h.push(t.createTextNode(i));p.textContent="",c=0;while(i=h[c++])if((!r||-1===x.inArray(i,r))&&(u=x.contains(i.ownerDocument,i),o=gt(p.appendChild(i),"script"),u&&ht(o),n)){l=0;while(i=o[l++])st.test(i.type||"")&&n.push(i)}return p},cleanData:function(e){var t,n,r,i=e.length,o=0,s=x.event.special;for(;i>o;o++){if(n=e[o],x.acceptData(n)&&(t=q.access(n)))for(r in t.events)s[r]?x.event.remove(n,r):x.removeEvent(n,r,t.handle);L.discard(n),q.discard(n)}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"text",async:!1,global:!1,success:x.globalEval})}});function ct(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function ft(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function pt(e){var t=at.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function ht(e,t){var n=e.length,r=0;for(;n>r;r++)q.set(e[r],"globalEval",!t||q.get(t[r],"globalEval"))}function dt(e,t){var n,r,i,o,s,a,u,l;if(1===t.nodeType){if(q.hasData(e)&&(o=q.access(e),s=x.extend({},o),l=o.events,q.set(t,s),l)){delete s.handle,s.events={};for(i in l)for(n=0,r=l[i].length;r>n;n++)x.event.add(t,i,l[i][n])}L.hasData(e)&&(a=L.access(e),u=x.extend({},a),L.set(t,u))}}function gt(e,t){var n=e.getElementsByTagName?e.getElementsByTagName(t||"*"):e.querySelectorAll?e.querySelectorAll(t||"*"):[];return t===undefined||t&&x.nodeName(e,t)?x.merge([e],n):n}function mt(e,t){var n=t.nodeName.toLowerCase();"input"===n&&it.test(e.type)?t.checked=e.checked:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}x.fn.extend({wrapAll:function(e){var t;return x.isFunction(e)?this.each(function(t){x(this).wrapAll(e.call(this,t))}):(this[0]&&(t=x(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this)},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var yt,vt,xt=/^(none|table(?!-c[ea]).+)/,bt=/^margin/,wt=RegExp("^("+b+")(.*)$","i"),Tt=RegExp("^("+b+")(?!px)[a-z%]+$","i"),Ct=RegExp("^([+-])=("+b+")","i"),kt={BODY:"block"},Nt={position:"absolute",visibility:"hidden",display:"block"},Et={letterSpacing:0,fontWeight:400},St=["Top","Right","Bottom","Left"],jt=["Webkit","O","Moz","ms"];function Dt(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=jt.length;while(i--)if(t=jt[i]+n,t in e)return t;return r}function At(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function Lt(t){return e.getComputedStyle(t,null)}function qt(e,t){var n,r,i,o=[],s=0,a=e.length;for(;a>s;s++)r=e[s],r.style&&(o[s]=q.get(r,"olddisplay"),n=r.style.display,t?(o[s]||"none"!==n||(r.style.display=""),""===r.style.display&&At(r)&&(o[s]=q.access(r,"olddisplay",Pt(r.nodeName)))):o[s]||(i=At(r),(n&&"none"!==n||!i)&&q.set(r,"olddisplay",i?n:x.css(r,"display"))));for(s=0;a>s;s++)r=e[s],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[s]||"":"none"));return e}x.fn.extend({css:function(e,t){return x.access(this,function(e,t,n){var r,i,o={},s=0;if(x.isArray(t)){for(r=Lt(e),i=t.length;i>s;s++)o[t[s]]=x.css(e,t[s],!1,r);return o}return n!==undefined?x.style(e,t,n):x.css(e,t)},e,t,arguments.length>1)},show:function(){return qt(this,!0)},hide:function(){return qt(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:At(this))?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=yt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,s,a=x.camelCase(t),u=e.style;return t=x.cssProps[a]||(x.cssProps[a]=Dt(u,a)),s=x.cssHooks[t]||x.cssHooks[a],n===undefined?s&&"get"in s&&(i=s.get(e,!1,r))!==undefined?i:u[t]:(o=typeof n,"string"===o&&(i=Ct.exec(n))&&(n=(i[1]+1)*i[2]+parseFloat(x.css(e,t)),o="number"),null==n||"number"===o&&isNaN(n)||("number"!==o||x.cssNumber[a]||(n+="px"),x.support.clearCloneStyle||""!==n||0!==t.indexOf("background")||(u[t]="inherit"),s&&"set"in s&&(n=s.set(e,n,r))===undefined||(u[t]=n)),undefined)}},css:function(e,t,n,r){var i,o,s,a=x.camelCase(t);return t=x.cssProps[a]||(x.cssProps[a]=Dt(e.style,a)),s=x.cssHooks[t]||x.cssHooks[a],s&&"get"in s&&(i=s.get(e,!0,n)),i===undefined&&(i=yt(e,t,r)),"normal"===i&&t in Et&&(i=Et[t]),""===n||n?(o=parseFloat(i),n===!0||x.isNumeric(o)?o||0:i):i}}),yt=function(e,t,n){var r,i,o,s=n||Lt(e),a=s?s.getPropertyValue(t)||s[t]:undefined,u=e.style;return s&&(""!==a||x.contains(e.ownerDocument,e)||(a=x.style(e,t)),Tt.test(a)&&bt.test(t)&&(r=u.width,i=u.minWidth,o=u.maxWidth,u.minWidth=u.maxWidth=u.width=a,a=s.width,u.width=r,u.minWidth=i,u.maxWidth=o)),a};function Ht(e,t,n){var r=wt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function Ot(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,s=0;for(;4>o;o+=2)"margin"===n&&(s+=x.css(e,n+St[o],!0,i)),r?("content"===n&&(s-=x.css(e,"padding"+St[o],!0,i)),"margin"!==n&&(s-=x.css(e,"border"+St[o]+"Width",!0,i))):(s+=x.css(e,"padding"+St[o],!0,i),"padding"!==n&&(s+=x.css(e,"border"+St[o]+"Width",!0,i)));return s}function Ft(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Lt(e),s=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=yt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Tt.test(i))return i;r=s&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+Ot(e,t,n||(s?"border":"content"),r,o)+"px"}function Pt(e){var t=o,n=kt[e];return n||(n=Rt(e,t),"none"!==n&&n||(vt=(vt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(vt[0].contentWindow||vt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=Rt(e,t),vt.detach()),kt[e]=n),n}function Rt(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,t){x.cssHooks[t]={get:function(e,n,r){return n?0===e.offsetWidth&&xt.test(x.css(e,"display"))?x.swap(e,Nt,function(){return Ft(e,t,r)}):Ft(e,t,r):undefined},set:function(e,n,r){var i=r&&Lt(e);return Ht(e,n,r?Ot(e,t,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,t){return t?x.swap(e,{display:"inline-block"},yt,[e,"marginRight"]):undefined}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,t){x.cssHooks[t]={get:function(e,n){return n?(n=yt(e,t),Tt.test(n)?x(e).position()[t]+"px":n):undefined}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+St[r]+t]=o[r]||o[r-2]||o[0];return i}},bt.test(e)||(x.cssHooks[e+t].set=Ht)});var Mt=/%20/g,Wt=/\[\]$/,$t=/\r?\n/g,Bt=/^(?:submit|button|image|reset|file)$/i,It=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&It.test(this.nodeName)&&!Bt.test(e)&&(this.checked||!it.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace($t,"\r\n")}}):{name:t.name,value:n.replace($t,"\r\n")}}).get()}}),x.param=function(e,t){var n,r=[],i=function(e,t){t=x.isFunction(t)?t():null==t?"":t,r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(t===undefined&&(t=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){i(this.name,this.value)});else for(n in e)zt(n,e[n],t,i);return r.join("&").replace(Mt,"+")};function zt(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||Wt.test(e)?r(e,i):zt(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)zt(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var _t,Xt,Ut=x.now(),Yt=/\?/,Vt=/#.*$/,Gt=/([?&])_=[^&]*/,Jt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Qt=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Kt=/^(?:GET|HEAD)$/,Zt=/^\/\//,en=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,tn=x.fn.load,nn={},rn={},on="*/".concat("*");try{Xt=i.href}catch(sn){Xt=o.createElement("a"),Xt.href="",Xt=Xt.href}_t=en.exec(Xt.toLowerCase())||[];function an(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];
if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function un(e,t,n,r){var i={},o=e===rn;function s(a){var u;return i[a]=!0,x.each(e[a]||[],function(e,a){var l=a(t,n,r);return"string"!=typeof l||o||i[l]?o?!(u=l):undefined:(t.dataTypes.unshift(l),s(l),!1)}),u}return s(t.dataTypes[0])||!i["*"]&&s("*")}function ln(e,t){var n,r,i=x.ajaxSettings.flatOptions||{};for(n in t)t[n]!==undefined&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,t,n){if("string"!=typeof e&&tn)return tn.apply(this,arguments);var r,i,o,s=this,a=e.indexOf(" ");return a>=0&&(r=e.slice(a),e=e.slice(0,a)),x.isFunction(t)?(n=t,t=undefined):t&&"object"==typeof t&&(i="POST"),s.length>0&&x.ajax({url:e,type:i,dataType:"html",data:t}).done(function(e){o=arguments,s.html(r?x("<div>").append(x.parseHTML(e)).find(r):e)}).complete(n&&function(e,t){s.each(n,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Xt,type:"GET",isLocal:Qt.test(_t[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":on,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?ln(ln(e,x.ajaxSettings),t):ln(x.ajaxSettings,e)},ajaxPrefilter:an(nn),ajaxTransport:an(rn),ajax:function(e,t){"object"==typeof e&&(t=e,e=undefined),t=t||{};var n,r,i,o,s,a,u,l,c=x.ajaxSetup({},t),f=c.context||c,p=c.context&&(f.nodeType||f.jquery)?x(f):x.event,h=x.Deferred(),d=x.Callbacks("once memory"),g=c.statusCode||{},m={},y={},v=0,b="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(2===v){if(!o){o={};while(t=Jt.exec(i))o[t[1].toLowerCase()]=t[2]}t=o[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===v?i:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return v||(e=y[n]=y[n]||e,m[e]=t),this},overrideMimeType:function(e){return v||(c.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>v)for(t in e)g[t]=[g[t],e[t]];else T.always(e[T.status]);return this},abort:function(e){var t=e||b;return n&&n.abort(t),k(0,t),this}};if(h.promise(T).complete=d.add,T.success=T.done,T.error=T.fail,c.url=((e||c.url||Xt)+"").replace(Vt,"").replace(Zt,_t[1]+"//"),c.type=t.method||t.type||c.method||c.type,c.dataTypes=x.trim(c.dataType||"*").toLowerCase().match(w)||[""],null==c.crossDomain&&(a=en.exec(c.url.toLowerCase()),c.crossDomain=!(!a||a[1]===_t[1]&&a[2]===_t[2]&&(a[3]||("http:"===a[1]?"80":"443"))===(_t[3]||("http:"===_t[1]?"80":"443")))),c.data&&c.processData&&"string"!=typeof c.data&&(c.data=x.param(c.data,c.traditional)),un(nn,c,t,T),2===v)return T;u=c.global,u&&0===x.active++&&x.event.trigger("ajaxStart"),c.type=c.type.toUpperCase(),c.hasContent=!Kt.test(c.type),r=c.url,c.hasContent||(c.data&&(r=c.url+=(Yt.test(r)?"&":"?")+c.data,delete c.data),c.cache===!1&&(c.url=Gt.test(r)?r.replace(Gt,"$1_="+Ut++):r+(Yt.test(r)?"&":"?")+"_="+Ut++)),c.ifModified&&(x.lastModified[r]&&T.setRequestHeader("If-Modified-Since",x.lastModified[r]),x.etag[r]&&T.setRequestHeader("If-None-Match",x.etag[r])),(c.data&&c.hasContent&&c.contentType!==!1||t.contentType)&&T.setRequestHeader("Content-Type",c.contentType),T.setRequestHeader("Accept",c.dataTypes[0]&&c.accepts[c.dataTypes[0]]?c.accepts[c.dataTypes[0]]+("*"!==c.dataTypes[0]?", "+on+"; q=0.01":""):c.accepts["*"]);for(l in c.headers)T.setRequestHeader(l,c.headers[l]);if(c.beforeSend&&(c.beforeSend.call(f,T,c)===!1||2===v))return T.abort();b="abort";for(l in{success:1,error:1,complete:1})T[l](c[l]);if(n=un(rn,c,t,T)){T.readyState=1,u&&p.trigger("ajaxSend",[T,c]),c.async&&c.timeout>0&&(s=setTimeout(function(){T.abort("timeout")},c.timeout));try{v=1,n.send(m,k)}catch(C){if(!(2>v))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,t,o,a){var l,m,y,b,w,C=t;2!==v&&(v=2,s&&clearTimeout(s),n=undefined,i=a||"",T.readyState=e>0?4:0,l=e>=200&&300>e||304===e,o&&(b=cn(c,T,o)),b=fn(c,b,T,l),l?(c.ifModified&&(w=T.getResponseHeader("Last-Modified"),w&&(x.lastModified[r]=w),w=T.getResponseHeader("etag"),w&&(x.etag[r]=w)),204===e?C="nocontent":304===e?C="notmodified":(C=b.state,m=b.data,y=b.error,l=!y)):(y=C,(e||!C)&&(C="error",0>e&&(e=0))),T.status=e,T.statusText=(t||C)+"",l?h.resolveWith(f,[m,C,T]):h.rejectWith(f,[T,C,y]),T.statusCode(g),g=undefined,u&&p.trigger(l?"ajaxSuccess":"ajaxError",[T,c,l?m:y]),d.fireWith(f,[T,C]),u&&(p.trigger("ajaxComplete",[T,c]),--x.active||x.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,t){return x.get(e,undefined,t,"script")}}),x.each(["get","post"],function(e,t){x[t]=function(e,n,r,i){return x.isFunction(n)&&(i=i||r,r=n,n=undefined),x.ajax({url:e,type:t,dataType:i,data:n,success:r})}});function cn(e,t,n){var r,i,o,s,a=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),r===undefined&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in a)if(a[i]&&a[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}s||(s=i)}o=o||s}return o?(o!==u[0]&&u.unshift(o),n[o]):undefined}function fn(e,t,n,r){var i,o,s,a,u,l={},c=e.dataTypes.slice();if(c[1])for(s in e.converters)l[s.toLowerCase()]=e.converters[s];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(s=l[u+" "+o]||l["* "+o],!s)for(i in l)if(a=i.split(" "),a[1]===o&&(s=l[u+" "+a[0]]||l["* "+a[0]])){s===!0?s=l[i]:l[i]!==!0&&(o=a[0],c.unshift(a[1]));break}if(s!==!0)if(s&&e["throws"])t=s(t);else try{t=s(t)}catch(f){return{state:"parsererror",error:s?f:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===undefined&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),x.ajaxTransport("script",function(e){if(e.crossDomain){var t,n;return{send:function(r,i){t=x("<script>").prop({async:!0,charset:e.scriptCharset,src:e.url}).on("load error",n=function(e){t.remove(),n=null,e&&i("error"===e.type?404:200,e.type)}),o.head.appendChild(t[0])},abort:function(){n&&n()}}}});var pn=[],hn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=pn.pop()||x.expando+"_"+Ut++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(t,n,r){var i,o,s,a=t.jsonp!==!1&&(hn.test(t.url)?"url":"string"==typeof t.data&&!(t.contentType||"").indexOf("application/x-www-form-urlencoded")&&hn.test(t.data)&&"data");return a||"jsonp"===t.dataTypes[0]?(i=t.jsonpCallback=x.isFunction(t.jsonpCallback)?t.jsonpCallback():t.jsonpCallback,a?t[a]=t[a].replace(hn,"$1"+i):t.jsonp!==!1&&(t.url+=(Yt.test(t.url)?"&":"?")+t.jsonp+"="+i),t.converters["script json"]=function(){return s||x.error(i+" was not called"),s[0]},t.dataTypes[0]="json",o=e[i],e[i]=function(){s=arguments},r.always(function(){e[i]=o,t[i]&&(t.jsonpCallback=n.jsonpCallback,pn.push(i)),s&&x.isFunction(o)&&o(s[0]),s=o=undefined}),"script"):undefined}),x.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(e){}};var dn=x.ajaxSettings.xhr(),gn={0:200,1223:204},mn=0,yn={};e.ActiveXObject&&x(e).on("unload",function(){for(var e in yn)yn[e]();yn=undefined}),x.support.cors=!!dn&&"withCredentials"in dn,x.support.ajax=dn=!!dn,x.ajaxTransport(function(e){var t;return x.support.cors||dn&&!e.crossDomain?{send:function(n,r){var i,o,s=e.xhr();if(s.open(e.type,e.url,e.async,e.username,e.password),e.xhrFields)for(i in e.xhrFields)s[i]=e.xhrFields[i];e.mimeType&&s.overrideMimeType&&s.overrideMimeType(e.mimeType),e.crossDomain||n["X-Requested-With"]||(n["X-Requested-With"]="XMLHttpRequest");for(i in n)s.setRequestHeader(i,n[i]);t=function(e){return function(){t&&(delete yn[o],t=s.onload=s.onerror=null,"abort"===e?s.abort():"error"===e?r(s.status||404,s.statusText):r(gn[s.status]||s.status,s.statusText,"string"==typeof s.responseText?{text:s.responseText}:undefined,s.getAllResponseHeaders()))}},s.onload=t(),s.onerror=t("error"),t=yn[o=mn++]=t("abort"),s.send(e.hasContent&&e.data||null)},abort:function(){t&&t()}}:undefined});var vn,xn,bn=/^(?:toggle|show|hide)$/,wn=RegExp("^(?:([+-])=|)("+b+")([a-z%]*)$","i"),Tn=/queueHooks$/,Cn=[Dn],kn={"*":[function(e,t){var n,r,i=this.createTween(e,t),o=wn.exec(t),s=i.cur(),a=+s||0,u=1,l=20;if(o){if(n=+o[2],r=o[3]||(x.cssNumber[e]?"":"px"),"px"!==r&&a){a=x.css(i.elem,e,!0)||n||1;do u=u||".5",a/=u,x.style(i.elem,e,a+r);while(u!==(u=i.cur()/s)&&1!==u&&--l)}i.unit=r,i.start=a,i.end=o[1]?a+(o[1]+1)*n:n}return i}]};function Nn(){return setTimeout(function(){vn=undefined}),vn=x.now()}function En(e,t){x.each(t,function(t,n){var r=(kn[t]||[]).concat(kn["*"]),i=0,o=r.length;for(;o>i;i++)if(r[i].call(e,t,n))return})}function Sn(e,t,n){var r,i,o=0,s=Cn.length,a=x.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=vn||Nn(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,s=0,u=l.tweens.length;for(;u>s;s++)l.tweens[s].run(o);return a.notifyWith(e,[l,o,n]),1>o&&u?n:(a.resolveWith(e,[l]),!1)},l=a.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:vn||Nn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?a.resolveWith(e,[l,t]):a.rejectWith(e,[l,t]),this}}),c=l.props;for(jn(c,l.opts.specialEasing);s>o;o++)if(r=Cn[o].call(l,e,c,l.opts))return r;return En(l,c),x.isFunction(l.opts.start)&&l.opts.start.call(e,l),x.fx.timer(x.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function jn(e,t){var n,r,i,o,s;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),s=x.cssHooks[r],s&&"expand"in s){o=s.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(Sn,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],kn[n]=kn[n]||[],kn[n].unshift(t)},prefilter:function(e,t){t?Cn.unshift(e):Cn.push(e)}});function Dn(e,t,n){var r,i,o,s,a,u,l,c,f,p=this,h=e.style,d={},g=[],m=e.nodeType&&At(e);n.queue||(c=x._queueHooks(e,"fx"),null==c.unqueued&&(c.unqueued=0,f=c.empty.fire,c.empty.fire=function(){c.unqueued||f()}),c.unqueued++,p.always(function(){p.always(function(){c.unqueued--,x.queue(e,"fx").length||c.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),a=q.get(e,"fxshow");for(r in t)if(o=t[r],bn.exec(o)){if(delete t[r],u=u||"toggle"===o,o===(m?"hide":"show")){if("show"!==o||a===undefined||a[r]===undefined)continue;m=!0}g.push(r)}if(s=g.length){a=q.get(e,"fxshow")||q.access(e,"fxshow",{}),"hidden"in a&&(m=a.hidden),u&&(a.hidden=!m),m?x(e).show():p.done(function(){x(e).hide()}),p.done(function(){var t;q.remove(e,"fxshow");for(t in d)x.style(e,t,d[t])});for(r=0;s>r;r++)i=g[r],l=p.createTween(i,m?a[i]:0),d[i]=a[i]||x.style(e,i),i in a||(a[i]=l.start,m&&(l.end=l.start,l.start="width"===i||"height"===i?1:0))}}function An(e,t,n,r,i){return new An.prototype.init(e,t,n,r,i)}x.Tween=An,An.prototype={constructor:An,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=An.propHooks[this.prop];return e&&e.get?e.get(this):An.propHooks._default.get(this)},run:function(e){var t,n=An.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):An.propHooks._default.set(this),this}},An.prototype.init.prototype=An.prototype,An.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},An.propHooks.scrollTop=An.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(Ln(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(At).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),s=function(){var t=Sn(this,x.extend({},e),o);s.finish=function(){t.stop(!0)},(i||q.get(this,"finish"))&&t.stop(!0)};return s.finish=s,i||o.queue===!1?this.each(s):this.queue(o.queue,s)},stop:function(e,t,n){var r=function(e){var t=e.stop;delete e.stop,t(n)};return"string"!=typeof e&&(n=t,t=e,e=undefined),t&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,i=null!=e&&e+"queueHooks",o=x.timers,s=q.get(this);if(i)s[i]&&s[i].stop&&r(s[i]);else for(i in s)s[i]&&s[i].stop&&Tn.test(i)&&r(s[i]);for(i=o.length;i--;)o[i].elem!==this||null!=e&&o[i].queue!==e||(o[i].anim.stop(n),t=!1,o.splice(i,1));(t||!n)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=q.get(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,s=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.cur&&i.cur.finish&&i.cur.finish.call(this),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;s>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function Ln(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=St[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:Ln("show"),slideUp:Ln("hide"),slideToggle:Ln("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=An.prototype.init,x.fx.tick=function(){var e,t=x.timers,n=0;for(vn=x.now();t.length>n;n++)e=t[n],e()||t[n]!==e||t.splice(n--,1);t.length||x.fx.stop(),vn=undefined},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){xn||(xn=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(xn),xn=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===undefined?this:this.each(function(t){x.offset.setOffset(this,e,t)});var t,n,i=this[0],o={top:0,left:0},s=i&&i.ownerDocument;if(s)return t=s.documentElement,x.contains(t,i)?(typeof i.getBoundingClientRect!==r&&(o=i.getBoundingClientRect()),n=qn(s),{top:o.top+n.pageYOffset-t.clientTop,left:o.left+n.pageXOffset-t.clientLeft}):o},x.offset={setOffset:function(e,t,n){var r,i,o,s,a,u,l,c=x.css(e,"position"),f=x(e),p={};"static"===c&&(e.style.position="relative"),a=f.offset(),o=x.css(e,"top"),u=x.css(e,"left"),l=("absolute"===c||"fixed"===c)&&(o+u).indexOf("auto")>-1,l?(r=f.position(),s=r.top,i=r.left):(s=parseFloat(o)||0,i=parseFloat(u)||0),x.isFunction(t)&&(t=t.call(e,n,a)),null!=t.top&&(p.top=t.top-a.top+s),null!=t.left&&(p.left=t.left-a.left+i),"using"in t?t.using.call(e,p):f.css(p)}},x.fn.extend({position:function(){if(this[0]){var e,t,n=this[0],r={top:0,left:0};return"fixed"===x.css(n,"position")?t=n.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(r=e.offset()),r.top+=x.css(e[0],"borderTopWidth",!0),r.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-r.top-x.css(n,"marginTop",!0),left:t.left-r.left-x.css(n,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,n){var r="pageYOffset"===n;x.fn[t]=function(i){return x.access(this,function(t,i,o){var s=qn(t);return o===undefined?s?s[n]:t[i]:(s?s.scrollTo(r?e.pageXOffset:o,r?o:e.pageYOffset):t[i]=o,undefined)},t,i,arguments.length,null)}});function qn(e){return x.isWindow(e)?e:9===e.nodeType&&e.defaultView}x.each({Height:"height",Width:"width"},function(e,t){x.each({padding:"inner"+e,content:t,"":"outer"+e},function(n,r){x.fn[r]=function(r,i){var o=arguments.length&&(n||"boolean"!=typeof r),s=n||(r===!0||i===!0?"margin":"border");return x.access(this,function(t,n,r){var i;return x.isWindow(t)?t.document.documentElement["client"+e]:9===t.nodeType?(i=t.documentElement,Math.max(t.body["scroll"+e],i["scroll"+e],t.body["offset"+e],i["offset"+e],i["client"+e])):r===undefined?x.css(t,n,s):x.style(t,n,r,s)},t,o?r:undefined,o,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&"object"==typeof module.exports?module.exports=x:"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}),"object"==typeof e&&"object"==typeof e.document&&(e.jQuery=e.$=x)})(window);
/*! jQuery UI - v1.9.2 - 2012-12-29
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.mouse.js, jquery.ui.draggable.js, jquery.ui.resizable.js, jquery.ui.sortable.js
* Copyright (c) 2012 jQuery Foundation and other contributors Licensed MIT */

(function(e,t){function i(t,n){var r,i,o,u=t.nodeName.toLowerCase();return"area"===u?(r=t.parentNode,i=r.name,!t.href||!i||r.nodeName.toLowerCase()!=="map"?!1:(o=e("img[usemap=#"+i+"]")[0],!!o&&s(o))):(/input|select|textarea|button|object/.test(u)?!t.disabled:"a"===u?t.href||n:n)&&s(t)}function s(t){return e.expr.filters.visible(t)&&!e(t).parents().andSelf().filter(function(){return e.css(this,"visibility")==="hidden"}).length}var n=0,r=/^ui-id-\d+$/;e.ui=e.ui||{};if(e.ui.version)return;e.extend(e.ui,{version:"1.9.2",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),e.fn.extend({_focus:e.fn.focus,focus:function(t,n){return typeof t=="number"?this.each(function(){var r=this;setTimeout(function(){e(r).focus(),n&&n.call(r)},t)}):this._focus.apply(this,arguments)},scrollParent:function(){var t;return e.ui.ie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?t=this.parents().filter(function(){return/(relative|absolute|fixed)/.test(e.css(this,"position"))&&/(auto|scroll)/.test(e.css(this,"overflow")+e.css(this,"overflow-y")+e.css(this,"overflow-x"))}).eq(0):t=this.parents().filter(function(){return/(auto|scroll)/.test(e.css(this,"overflow")+e.css(this,"overflow-y")+e.css(this,"overflow-x"))}).eq(0),/fixed/.test(this.css("position"))||!t.length?e(document):t},zIndex:function(n){if(n!==t)return this.css("zIndex",n);if(this.length){var r=e(this[0]),i,s;while(r.length&&r[0]!==document){i=r.css("position");if(i==="absolute"||i==="relative"||i==="fixed"){s=parseInt(r.css("zIndex"),10);if(!isNaN(s)&&s!==0)return s}r=r.parent()}}return 0},uniqueId:function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++n)})},removeUniqueId:function(){return this.each(function(){r.test(this.id)&&e(this).removeAttr("id")})}}),e.extend(e.expr[":"],{data:e.expr.createPseudo?e.expr.createPseudo(function(t){return function(n){return!!e.data(n,t)}}):function(t,n,r){return!!e.data(t,r[3])},focusable:function(t){return i(t,!isNaN(e.attr(t,"tabindex")))},tabbable:function(t){var n=e.attr(t,"tabindex"),r=isNaN(n);return(r||n>=0)&&i(t,!r)}}),e(function(){var t=document.body,n=t.appendChild(n=document.createElement("div"));n.offsetHeight,e.extend(n.style,{minHeight:"100px",height:"auto",padding:0,borderWidth:0}),e.support.minHeight=n.offsetHeight===100,e.support.selectstart="onselectstart"in n,t.removeChild(n).style.display="none"}),e("<a>").outerWidth(1).jquery||e.each(["Width","Height"],function(n,r){function u(t,n,r,s){return e.each(i,function(){n-=parseFloat(e.css(t,"padding"+this))||0,r&&(n-=parseFloat(e.css(t,"border"+this+"Width"))||0),s&&(n-=parseFloat(e.css(t,"margin"+this))||0)}),n}var i=r==="Width"?["Left","Right"]:["Top","Bottom"],s=r.toLowerCase(),o={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:e.fn.outerHeight};e.fn["inner"+r]=function(n){return n===t?o["inner"+r].call(this):this.each(function(){e(this).css(s,u(this,n)+"px")})},e.fn["outer"+r]=function(t,n){return typeof t!="number"?o["outer"+r].call(this,t):this.each(function(){e(this).css(s,u(this,t,!0,n)+"px")})}}),e("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(e.fn.removeData=function(t){return function(n){return arguments.length?t.call(this,e.camelCase(n)):t.call(this)}}(e.fn.removeData)),function(){var t=/msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase())||[];e.ui.ie=t.length?!0:!1,e.ui.ie6=parseFloat(t[1],10)===6}(),e.fn.extend({disableSelection:function(){return this.bind((e.support.selectstart?"selectstart":"mousedown")+".ui-disableSelection",function(e){e.preventDefault()})},enableSelection:function(){return this.unbind(".ui-disableSelection")}}),e.extend(e.ui,{plugin:{add:function(t,n,r){var i,s=e.ui[t].prototype;for(i in r)s.plugins[i]=s.plugins[i]||[],s.plugins[i].push([n,r[i]])},call:function(e,t,n){var r,i=e.plugins[t];if(!i||!e.element[0].parentNode||e.element[0].parentNode.nodeType===11)return;for(r=0;r<i.length;r++)e.options[i[r][0]]&&i[r][1].apply(e.element,n)}},contains:e.contains,hasScroll:function(t,n){if(e(t).css("overflow")==="hidden")return!1;var r=n&&n==="left"?"scrollLeft":"scrollTop",i=!1;return t[r]>0?!0:(t[r]=1,i=t[r]>0,t[r]=0,i)},isOverAxis:function(e,t,n){return e>t&&e<t+n},isOver:function(t,n,r,i,s,o){return e.ui.isOverAxis(t,r,s)&&e.ui.isOverAxis(n,i,o)}})})(jQuery);(function(e,t){var n=0,r=Array.prototype.slice,i=e.cleanData;e.cleanData=function(t){for(var n=0,r;(r=t[n])!=null;n++)try{e(r).triggerHandler("remove")}catch(s){}i(t)},e.widget=function(t,n,r){var i,s,o,u,a=t.split(".")[0];t=t.split(".")[1],i=a+"-"+t,r||(r=n,n=e.Widget),e.expr[":"][i.toLowerCase()]=function(t){return!!e.data(t,i)},e[a]=e[a]||{},s=e[a][t],o=e[a][t]=function(e,t){if(!this._createWidget)return new o(e,t);arguments.length&&this._createWidget(e,t)},e.extend(o,s,{version:r.version,_proto:e.extend({},r),_childConstructors:[]}),u=new n,u.options=e.widget.extend({},u.options),e.each(r,function(t,i){e.isFunction(i)&&(r[t]=function(){var e=function(){return n.prototype[t].apply(this,arguments)},r=function(e){return n.prototype[t].apply(this,e)};return function(){var t=this._super,n=this._superApply,s;return this._super=e,this._superApply=r,s=i.apply(this,arguments),this._super=t,this._superApply=n,s}}())}),o.prototype=e.widget.extend(u,{widgetEventPrefix:s?u.widgetEventPrefix:t},r,{constructor:o,namespace:a,widgetName:t,widgetBaseClass:i,widgetFullName:i}),s?(e.each(s._childConstructors,function(t,n){var r=n.prototype;e.widget(r.namespace+"."+r.widgetName,o,n._proto)}),delete s._childConstructors):n._childConstructors.push(o),e.widget.bridge(t,o)},e.widget.extend=function(n){var i=r.call(arguments,1),s=0,o=i.length,u,a;for(;s<o;s++)for(u in i[s])a=i[s][u],i[s].hasOwnProperty(u)&&a!==t&&(e.isPlainObject(a)?n[u]=e.isPlainObject(n[u])?e.widget.extend({},n[u],a):e.widget.extend({},a):n[u]=a);return n},e.widget.bridge=function(n,i){var s=i.prototype.widgetFullName||n;e.fn[n]=function(o){var u=typeof o=="string",a=r.call(arguments,1),f=this;return o=!u&&a.length?e.widget.extend.apply(null,[o].concat(a)):o,u?this.each(function(){var r,i=e.data(this,s);if(!i)return e.error("cannot call methods on "+n+" prior to initialization; "+"attempted to call method '"+o+"'");if(!e.isFunction(i[o])||o.charAt(0)==="_")return e.error("no such method '"+o+"' for "+n+" widget instance");r=i[o].apply(i,a);if(r!==i&&r!==t)return f=r&&r.jquery?f.pushStack(r.get()):r,!1}):this.each(function(){var t=e.data(this,s);t?t.option(o||{})._init():e.data(this,s,new i(o,this))}),f}},e.Widget=function(){},e.Widget._childConstructors=[],e.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(t,r){r=e(r||this.defaultElement||this)[0],this.element=e(r),this.uuid=n++,this.eventNamespace="."+this.widgetName+this.uuid,this.options=e.widget.extend({},this.options,this._getCreateOptions(),t),this.bindings=e(),this.hoverable=e(),this.focusable=e(),r!==this&&(e.data(r,this.widgetName,this),e.data(r,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===r&&this.destroy()}}),this.document=e(r.style?r.ownerDocument:r.document||r),this.window=e(this.document[0].defaultView||this.document[0].parentWindow)),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:e.noop,_getCreateEventData:e.noop,_create:e.noop,_init:e.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetName).removeData(this.widgetFullName).removeData(e.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled "+"ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")},_destroy:e.noop,widget:function(){return this.element},option:function(n,r){var i=n,s,o,u;if(arguments.length===0)return e.widget.extend({},this.options);if(typeof n=="string"){i={},s=n.split("."),n=s.shift();if(s.length){o=i[n]=e.widget.extend({},this.options[n]);for(u=0;u<s.length-1;u++)o[s[u]]=o[s[u]]||{},o=o[s[u]];n=s.pop();if(r===t)return o[n]===t?null:o[n];o[n]=r}else{if(r===t)return this.options[n]===t?null:this.options[n];i[n]=r}}return this._setOptions(i),this},_setOptions:function(e){var t;for(t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return this.options[e]=t,e==="disabled"&&(this.widget().toggleClass(this.widgetFullName+"-disabled ui-state-disabled",!!t).attr("aria-disabled",t),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")),this},enable:function(){return this._setOption("disabled",!1)},disable:function(){return this._setOption("disabled",!0)},_on:function(t,n,r){var i,s=this;typeof t!="boolean"&&(r=n,n=t,t=!1),r?(n=i=e(n),this.bindings=this.bindings.add(n)):(r=n,n=this.element,i=this.widget()),e.each(r,function(r,o){function u(){if(!t&&(s.options.disabled===!0||e(this).hasClass("ui-state-disabled")))return;return(typeof o=="string"?s[o]:o).apply(s,arguments)}typeof o!="string"&&(u.guid=o.guid=o.guid||u.guid||e.guid++);var a=r.match(/^(\w+)\s*(.*)$/),f=a[1]+s.eventNamespace,l=a[2];l?i.delegate(l,f,u):n.bind(f,u)})},_off:function(e,t){t=(t||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,e.unbind(t).undelegate(t)},_delay:function(e,t){function n(){return(typeof e=="string"?r[e]:e).apply(r,arguments)}var r=this;return setTimeout(n,t||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){e(t.currentTarget).addClass("ui-state-hover")},mouseleave:function(t){e(t.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){e(t.currentTarget).addClass("ui-state-focus")},focusout:function(t){e(t.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(t,n,r){var i,s,o=this.options[t];r=r||{},n=e.Event(n),n.type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),n.target=this.element[0],s=n.originalEvent;if(s)for(i in s)i in n||(n[i]=s[i]);return this.element.trigger(n,r),!(e.isFunction(o)&&o.apply(this.element[0],[n].concat(r))===!1||n.isDefaultPrevented())}},e.each({show:"fadeIn",hide:"fadeOut"},function(t,n){e.Widget.prototype["_"+t]=function(r,i,s){typeof i=="string"&&(i={effect:i});var o,u=i?i===!0||typeof i=="number"?n:i.effect||n:t;i=i||{},typeof i=="number"&&(i={duration:i}),o=!e.isEmptyObject(i),i.complete=s,i.delay&&r.delay(i.delay),o&&e.effects&&(e.effects.effect[u]||e.uiBackCompat!==!1&&e.effects[u])?r[t](i):u!==t&&r[u]?r[u](i.duration,i.easing,s):r.queue(function(n){e(this)[t](),s&&s.call(r[0]),n()})}}),e.uiBackCompat!==!1&&(e.Widget.prototype._getCreateOptions=function(){return e.metadata&&e.metadata.get(this.element[0])[this.widgetName]})})(jQuery);(function(e,t){var n=!1;e(document).mouseup(function(e){n=!1}),e.widget("ui.mouse",{version:"1.9.2",options:{cancel:"input,textarea,button,select,option",distance:1,delay:0},_mouseInit:function(){var t=this;this.element.bind("mousedown."+this.widgetName,function(e){return t._mouseDown(e)}).bind("click."+this.widgetName,function(n){if(!0===e.data(n.target,t.widgetName+".preventClickEvent"))return e.removeData(n.target,t.widgetName+".preventClickEvent"),n.stopImmediatePropagation(),!1}),this.started=!1},_mouseDestroy:function(){this.element.unbind("."+this.widgetName),this._mouseMoveDelegate&&e(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate)},_mouseDown:function(t){if(n)return;this._mouseStarted&&this._mouseUp(t),this._mouseDownEvent=t;var r=this,i=t.which===1,s=typeof this.options.cancel=="string"&&t.target.nodeName?e(t.target).closest(this.options.cancel).length:!1;if(!i||s||!this._mouseCapture(t))return!0;this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){r.mouseDelayMet=!0},this.options.delay));if(this._mouseDistanceMet(t)&&this._mouseDelayMet(t)){this._mouseStarted=this._mouseStart(t)!==!1;if(!this._mouseStarted)return t.preventDefault(),!0}return!0===e.data(t.target,this.widgetName+".preventClickEvent")&&e.removeData(t.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(e){return r._mouseMove(e)},this._mouseUpDelegate=function(e){return r._mouseUp(e)},e(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate),t.preventDefault(),n=!0,!0},_mouseMove:function(t){return!e.ui.ie||document.documentMode>=9||!!t.button?this._mouseStarted?(this._mouseDrag(t),t.preventDefault()):(this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,t)!==!1,this._mouseStarted?this._mouseDrag(t):this._mouseUp(t)),!this._mouseStarted):this._mouseUp(t)},_mouseUp:function(t){return e(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,t.target===this._mouseDownEvent.target&&e.data(t.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(t)),!1},_mouseDistanceMet:function(e){return Math.max(Math.abs(this._mouseDownEvent.pageX-e.pageX),Math.abs(this._mouseDownEvent.pageY-e.pageY))>=this.options.distance},_mouseDelayMet:function(e){return this.mouseDelayMet},_mouseStart:function(e){},_mouseDrag:function(e){},_mouseStop:function(e){},_mouseCapture:function(e){return!0}})})(jQuery);(function(e,t){e.widget("ui.draggable",e.ui.mouse,{version:"1.9.2",widgetEventPrefix:"drag",options:{addClasses:!0,appendTo:"parent",axis:!1,connectToSortable:!1,containment:!1,cursor:"auto",cursorAt:!1,grid:!1,handle:!1,helper:"original",iframeFix:!1,opacity:!1,refreshPositions:!1,revert:!1,revertDuration:500,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:20,snap:!1,snapMode:"both",snapTolerance:20,stack:!1,zIndex:!1},_create:function(){this.options.helper=="original"&&!/^(?:r|a|f)/.test(this.element.css("position"))&&(this.element[0].style.position="relative"),this.options.addClasses&&this.element.addClass("ui-draggable"),this.options.disabled&&this.element.addClass("ui-draggable-disabled"),this._mouseInit()},_destroy:function(){this.element.removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled"),this._mouseDestroy()},_mouseCapture:function(t){var n=this.options;return this.helper||n.disabled||e(t.target).is(".ui-resizable-handle")?!1:(this.handle=this._getHandle(t),this.handle?(e(n.iframeFix===!0?"iframe":n.iframeFix).each(function(){e('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({width:this.offsetWidth+"px",height:this.offsetHeight+"px",position:"absolute",opacity:"0.001",zIndex:1e3}).css(e(this).offset()).appendTo("body")}),!0):!1)},_mouseStart:function(t){var n=this.options;return this.helper=this._createHelper(t),this.helper.addClass("ui-draggable-dragging"),this._cacheHelperProportions(),e.ui.ddmanager&&(e.ui.ddmanager.current=this),this._cacheMargins(),this.cssPosition=this.helper.css("position"),this.scrollParent=this.helper.scrollParent(),this.offset=this.positionAbs=this.element.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},e.extend(this.offset,{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.originalPosition=this.position=this._generatePosition(t),this.originalPageX=t.pageX,this.originalPageY=t.pageY,n.cursorAt&&this._adjustOffsetFromHelper(n.cursorAt),n.containment&&this._setContainment(),this._trigger("start",t)===!1?(this._clear(),!1):(this._cacheHelperProportions(),e.ui.ddmanager&&!n.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t),this._mouseDrag(t,!0),e.ui.ddmanager&&e.ui.ddmanager.dragStart(this,t),!0)},_mouseDrag:function(t,n){this.position=this._generatePosition(t),this.positionAbs=this._convertPositionTo("absolute");if(!n){var r=this._uiHash();if(this._trigger("drag",t,r)===!1)return this._mouseUp({}),!1;this.position=r.position}if(!this.options.axis||this.options.axis!="y")this.helper[0].style.left=this.position.left+"px";if(!this.options.axis||this.options.axis!="x")this.helper[0].style.top=this.position.top+"px";return e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),!1},_mouseStop:function(t){var n=!1;e.ui.ddmanager&&!this.options.dropBehaviour&&(n=e.ui.ddmanager.drop(this,t)),this.dropped&&(n=this.dropped,this.dropped=!1);var r=this.element[0],i=!1;while(r&&(r=r.parentNode))r==document&&(i=!0);if(!i&&this.options.helper==="original")return!1;if(this.options.revert=="invalid"&&!n||this.options.revert=="valid"&&n||this.options.revert===!0||e.isFunction(this.options.revert)&&this.options.revert.call(this.element,n)){var s=this;e(this.helper).animate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){s._trigger("stop",t)!==!1&&s._clear()})}else this._trigger("stop",t)!==!1&&this._clear();return!1},_mouseUp:function(t){return e("div.ui-draggable-iframeFix").each(function(){this.parentNode.removeChild(this)}),e.ui.ddmanager&&e.ui.ddmanager.dragStop(this,t),e.ui.mouse.prototype._mouseUp.call(this,t)},cancel:function(){return this.helper.is(".ui-draggable-dragging")?this._mouseUp({}):this._clear(),this},_getHandle:function(t){var n=!this.options.handle||!e(this.options.handle,this.element).length?!0:!1;return e(this.options.handle,this.element).find("*").andSelf().each(function(){this==t.target&&(n=!0)}),n},_createHelper:function(t){var n=this.options,r=e.isFunction(n.helper)?e(n.helper.apply(this.element[0],[t])):n.helper=="clone"?this.element.clone().removeAttr("id"):this.element;return r.parents("body").length||r.appendTo(n.appendTo=="parent"?this.element[0].parentNode:n.appendTo),r[0]!=this.element[0]&&!/(fixed|absolute)/.test(r.css("position"))&&r.css("position","absolute"),r},_adjustOffsetFromHelper:function(t){typeof t=="string"&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var t=this.offsetParent.offset();this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&e.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.scrollParent.scrollTop());if(this.offsetParent[0]==document.body||this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&e.ui.ie)t={top:0,left:0};return{top:t.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var e=this.element.position();return{top:e.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.element.css("marginLeft"),10)||0,top:parseInt(this.element.css("marginTop"),10)||0,right:parseInt(this.element.css("marginRight"),10)||0,bottom:parseInt(this.element.css("marginBottom"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t=this.options;t.containment=="parent"&&(t.containment=this.helper[0].parentNode);if(t.containment=="document"||t.containment=="window")this.containment=[t.containment=="document"?0:e(window).scrollLeft()-this.offset.relative.left-this.offset.parent.left,t.containment=="document"?0:e(window).scrollTop()-this.offset.relative.top-this.offset.parent.top,(t.containment=="document"?0:e(window).scrollLeft())+e(t.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(t.containment=="document"?0:e(window).scrollTop())+(e(t.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top];if(!/^(document|window|parent)$/.test(t.containment)&&t.containment.constructor!=Array){var n=e(t.containment),r=n[0];if(!r)return;var i=n.offset(),s=e(r).css("overflow")!="hidden";this.containment=[(parseInt(e(r).css("borderLeftWidth"),10)||0)+(parseInt(e(r).css("paddingLeft"),10)||0),(parseInt(e(r).css("borderTopWidth"),10)||0)+(parseInt(e(r).css("paddingTop"),10)||0),(s?Math.max(r.scrollWidth,r.offsetWidth):r.offsetWidth)-(parseInt(e(r).css("borderLeftWidth"),10)||0)-(parseInt(e(r).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left-this.margins.right,(s?Math.max(r.scrollHeight,r.offsetHeight):r.offsetHeight)-(parseInt(e(r).css("borderTopWidth"),10)||0)-(parseInt(e(r).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top-this.margins.bottom],this.relative_container=n}else t.containment.constructor==Array&&(this.containment=t.containment)},_convertPositionTo:function(t,n){n||(n=this.position);var r=t=="absolute"?1:-1,i=this.options,s=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,o=/(html|body)/i.test(s[0].tagName);return{top:n.top+this.offset.relative.top*r+this.offset.parent.top*r-(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():o?0:s.scrollTop())*r,left:n.left+this.offset.relative.left*r+this.offset.parent.left*r-(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():o?0:s.scrollLeft())*r}},_generatePosition:function(t){var n=this.options,r=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,i=/(html|body)/i.test(r[0].tagName),s=t.pageX,o=t.pageY;if(this.originalPosition){var u;if(this.containment){if(this.relative_container){var a=this.relative_container.offset();u=[this.containment[0]+a.left,this.containment[1]+a.top,this.containment[2]+a.left,this.containment[3]+a.top]}else u=this.containment;t.pageX-this.offset.click.left<u[0]&&(s=u[0]+this.offset.click.left),t.pageY-this.offset.click.top<u[1]&&(o=u[1]+this.offset.click.top),t.pageX-this.offset.click.left>u[2]&&(s=u[2]+this.offset.click.left),t.pageY-this.offset.click.top>u[3]&&(o=u[3]+this.offset.click.top)}if(n.grid){var f=n.grid[1]?this.originalPageY+Math.round((o-this.originalPageY)/n.grid[1])*n.grid[1]:this.originalPageY;o=u?f-this.offset.click.top<u[1]||f-this.offset.click.top>u[3]?f-this.offset.click.top<u[1]?f+n.grid[1]:f-n.grid[1]:f:f;var l=n.grid[0]?this.originalPageX+Math.round((s-this.originalPageX)/n.grid[0])*n.grid[0]:this.originalPageX;s=u?l-this.offset.click.left<u[0]||l-this.offset.click.left>u[2]?l-this.offset.click.left<u[0]?l+n.grid[0]:l-n.grid[0]:l:l}}return{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():i?0:r.scrollTop()),left:s-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:r.scrollLeft())}},_clear:function(){this.helper.removeClass("ui-draggable-dragging"),this.helper[0]!=this.element[0]&&!this.cancelHelperRemoval&&this.helper.remove(),this.helper=null,this.cancelHelperRemoval=!1},_trigger:function(t,n,r){return r=r||this._uiHash(),e.ui.plugin.call(this,t,[n,r]),t=="drag"&&(this.positionAbs=this._convertPositionTo("absolute")),e.Widget.prototype._trigger.call(this,t,n,r)},plugins:{},_uiHash:function(e){return{helper:this.helper,position:this.position,originalPosition:this.originalPosition,offset:this.positionAbs}}}),e.ui.plugin.add("draggable","connectToSortable",{start:function(t,n){var r=e(this).data("draggable"),i=r.options,s=e.extend({},n,{item:r.element});r.sortables=[],e(i.connectToSortable).each(function(){var n=e.data(this,"sortable");n&&!n.options.disabled&&(r.sortables.push({instance:n,shouldRevert:n.options.revert}),n.refreshPositions(),n._trigger("activate",t,s))})},stop:function(t,n){var r=e(this).data("draggable"),i=e.extend({},n,{item:r.element});e.each(r.sortables,function(){this.instance.isOver?(this.instance.isOver=0,r.cancelHelperRemoval=!0,this.instance.cancelHelperRemoval=!1,this.shouldRevert&&(this.instance.options.revert=!0),this.instance._mouseStop(t),this.instance.options.helper=this.instance.options._helper,r.options.helper=="original"&&this.instance.currentItem.css({top:"auto",left:"auto"})):(this.instance.cancelHelperRemoval=!1,this.instance._trigger("deactivate",t,i))})},drag:function(t,n){var r=e(this).data("draggable"),i=this,s=function(t){var n=this.offset.click.top,r=this.offset.click.left,i=this.positionAbs.top,s=this.positionAbs.left,o=t.height,u=t.width,a=t.top,f=t.left;return e.ui.isOver(i+n,s+r,a,f,o,u)};e.each(r.sortables,function(s){var o=!1,u=this;this.instance.positionAbs=r.positionAbs,this.instance.helperProportions=r.helperProportions,this.instance.offset.click=r.offset.click,this.instance._intersectsWith(this.instance.containerCache)&&(o=!0,e.each(r.sortables,function(){return this.instance.positionAbs=r.positionAbs,this.instance.helperProportions=r.helperProportions,this.instance.offset.click=r.offset.click,this!=u&&this.instance._intersectsWith(this.instance.containerCache)&&e.ui.contains(u.instance.element[0],this.instance.element[0])&&(o=!1),o})),o?(this.instance.isOver||(this.instance.isOver=1,this.instance.currentItem=e(i).clone().removeAttr("id").appendTo(this.instance.element).data("sortable-item",!0),this.instance.options._helper=this.instance.options.helper,this.instance.options.helper=function(){return n.helper[0]},t.target=this.instance.currentItem[0],this.instance._mouseCapture(t,!0),this.instance._mouseStart(t,!0,!0),this.instance.offset.click.top=r.offset.click.top,this.instance.offset.click.left=r.offset.click.left,this.instance.offset.parent.left-=r.offset.parent.left-this.instance.offset.parent.left,this.instance.offset.parent.top-=r.offset.parent.top-this.instance.offset.parent.top,r._trigger("toSortable",t),r.dropped=this.instance.element,r.currentItem=r.element,this.instance.fromOutside=r),this.instance.currentItem&&this.instance._mouseDrag(t)):this.instance.isOver&&(this.instance.isOver=0,this.instance.cancelHelperRemoval=!0,this.instance.options.revert=!1,this.instance._trigger("out",t,this.instance._uiHash(this.instance)),this.instance._mouseStop(t,!0),this.instance.options.helper=this.instance.options._helper,this.instance.currentItem.remove(),this.instance.placeholder&&this.instance.placeholder.remove(),r._trigger("fromSortable",t),r.dropped=!1)})}}),e.ui.plugin.add("draggable","cursor",{start:function(t,n){var r=e("body"),i=e(this).data("draggable").options;r.css("cursor")&&(i._cursor=r.css("cursor")),r.css("cursor",i.cursor)},stop:function(t,n){var r=e(this).data("draggable").options;r._cursor&&e("body").css("cursor",r._cursor)}}),e.ui.plugin.add("draggable","opacity",{start:function(t,n){var r=e(n.helper),i=e(this).data("draggable").options;r.css("opacity")&&(i._opacity=r.css("opacity")),r.css("opacity",i.opacity)},stop:function(t,n){var r=e(this).data("draggable").options;r._opacity&&e(n.helper).css("opacity",r._opacity)}}),e.ui.plugin.add("draggable","scroll",{start:function(t,n){var r=e(this).data("draggable");r.scrollParent[0]!=document&&r.scrollParent[0].tagName!="HTML"&&(r.overflowOffset=r.scrollParent.offset())},drag:function(t,n){var r=e(this).data("draggable"),i=r.options,s=!1;if(r.scrollParent[0]!=document&&r.scrollParent[0].tagName!="HTML"){if(!i.axis||i.axis!="x")r.overflowOffset.top+r.scrollParent[0].offsetHeight-t.pageY<i.scrollSensitivity?r.scrollParent[0].scrollTop=s=r.scrollParent[0].scrollTop+i.scrollSpeed:t.pageY-r.overflowOffset.top<i.scrollSensitivity&&(r.scrollParent[0].scrollTop=s=r.scrollParent[0].scrollTop-i.scrollSpeed);if(!i.axis||i.axis!="y")r.overflowOffset.left+r.scrollParent[0].offsetWidth-t.pageX<i.scrollSensitivity?r.scrollParent[0].scrollLeft=s=r.scrollParent[0].scrollLeft+i.scrollSpeed:t.pageX-r.overflowOffset.left<i.scrollSensitivity&&(r.scrollParent[0].scrollLeft=s=r.scrollParent[0].scrollLeft-i.scrollSpeed)}else{if(!i.axis||i.axis!="x")t.pageY-e(document).scrollTop()<i.scrollSensitivity?s=e(document).scrollTop(e(document).scrollTop()-i.scrollSpeed):e(window).height()-(t.pageY-e(document).scrollTop())<i.scrollSensitivity&&(s=e(document).scrollTop(e(document).scrollTop()+i.scrollSpeed));if(!i.axis||i.axis!="y")t.pageX-e(document).scrollLeft()<i.scrollSensitivity?s=e(document).scrollLeft(e(document).scrollLeft()-i.scrollSpeed):e(window).width()-(t.pageX-e(document).scrollLeft())<i.scrollSensitivity&&(s=e(document).scrollLeft(e(document).scrollLeft()+i.scrollSpeed))}s!==!1&&e.ui.ddmanager&&!i.dropBehaviour&&e.ui.ddmanager.prepareOffsets(r,t)}}),e.ui.plugin.add("draggable","snap",{start:function(t,n){var r=e(this).data("draggable"),i=r.options;r.snapElements=[],e(i.snap.constructor!=String?i.snap.items||":data(draggable)":i.snap).each(function(){var t=e(this),n=t.offset();this!=r.element[0]&&r.snapElements.push({item:this,width:t.outerWidth(),height:t.outerHeight(),top:n.top,left:n.left})})},drag:function(t,n){var r=e(this).data("draggable"),i=r.options,s=i.snapTolerance,o=n.offset.left,u=o+r.helperProportions.width,a=n.offset.top,f=a+r.helperProportions.height;for(var l=r.snapElements.length-1;l>=0;l--){var c=r.snapElements[l].left,h=c+r.snapElements[l].width,p=r.snapElements[l].top,d=p+r.snapElements[l].height;if(!(c-s<o&&o<h+s&&p-s<a&&a<d+s||c-s<o&&o<h+s&&p-s<f&&f<d+s||c-s<u&&u<h+s&&p-s<a&&a<d+s||c-s<u&&u<h+s&&p-s<f&&f<d+s)){r.snapElements[l].snapping&&r.options.snap.release&&r.options.snap.release.call(r.element,t,e.extend(r._uiHash(),{snapItem:r.snapElements[l].item})),r.snapElements[l].snapping=!1;continue}if(i.snapMode!="inner"){var v=Math.abs(p-f)<=s,m=Math.abs(d-a)<=s,g=Math.abs(c-u)<=s,y=Math.abs(h-o)<=s;v&&(n.position.top=r._convertPositionTo("relative",{top:p-r.helperProportions.height,left:0}).top-r.margins.top),m&&(n.position.top=r._convertPositionTo("relative",{top:d,left:0}).top-r.margins.top),g&&(n.position.left=r._convertPositionTo("relative",{top:0,left:c-r.helperProportions.width}).left-r.margins.left),y&&(n.position.left=r._convertPositionTo("relative",{top:0,left:h}).left-r.margins.left)}var b=v||m||g||y;if(i.snapMode!="outer"){var v=Math.abs(p-a)<=s,m=Math.abs(d-f)<=s,g=Math.abs(c-o)<=s,y=Math.abs(h-u)<=s;v&&(n.position.top=r._convertPositionTo("relative",{top:p,left:0}).top-r.margins.top),m&&(n.position.top=r._convertPositionTo("relative",{top:d-r.helperProportions.height,left:0}).top-r.margins.top),g&&(n.position.left=r._convertPositionTo("relative",{top:0,left:c}).left-r.margins.left),y&&(n.position.left=r._convertPositionTo("relative",{top:0,left:h-r.helperProportions.width}).left-r.margins.left)}!r.snapElements[l].snapping&&(v||m||g||y||b)&&r.options.snap.snap&&r.options.snap.snap.call(r.element,t,e.extend(r._uiHash(),{snapItem:r.snapElements[l].item})),r.snapElements[l].snapping=v||m||g||y||b}}}),e.ui.plugin.add("draggable","stack",{start:function(t,n){var r=e(this).data("draggable").options,i=e.makeArray(e(r.stack)).sort(function(t,n){return(parseInt(e(t).css("zIndex"),10)||0)-(parseInt(e(n).css("zIndex"),10)||0)});if(!i.length)return;var s=parseInt(i[0].style.zIndex)||0;e(i).each(function(e){this.style.zIndex=s+e}),this[0].style.zIndex=s+i.length}}),e.ui.plugin.add("draggable","zIndex",{start:function(t,n){var r=e(n.helper),i=e(this).data("draggable").options;r.css("zIndex")&&(i._zIndex=r.css("zIndex")),r.css("zIndex",i.zIndex)},stop:function(t,n){var r=e(this).data("draggable").options;r._zIndex&&e(n.helper).css("zIndex",r._zIndex)}})})(jQuery);(function(e,t){e.widget("ui.resizable",e.ui.mouse,{version:"1.9.2",widgetEventPrefix:"resize",options:{alsoResize:!1,animate:!1,animateDuration:"slow",animateEasing:"swing",aspectRatio:!1,autoHide:!1,containment:!1,ghost:!1,grid:!1,handles:"e,s,se",helper:!1,maxHeight:null,maxWidth:null,minHeight:10,minWidth:10,zIndex:1e3},_create:function(){var t=this,n=this.options;this.element.addClass("ui-resizable"),e.extend(this,{_aspectRatio:!!n.aspectRatio,aspectRatio:n.aspectRatio,originalElement:this.element,_proportionallyResizeElements:[],_helper:n.helper||n.ghost||n.animate?n.helper||"ui-resizable-helper":null}),this.element[0].nodeName.match(/canvas|textarea|input|select|button|img/i)&&(this.element.wrap(e('<div class="ui-wrapper" style="overflow: hidden;"></div>').css({position:this.element.css("position"),width:this.element.outerWidth(),height:this.element.outerHeight(),top:this.element.css("top"),left:this.element.css("left")})),this.element=this.element.parent().data("resizable",this.element.data("resizable")),this.elementIsWrapper=!0,this.element.css({marginLeft:this.originalElement.css("marginLeft"),marginTop:this.originalElement.css("marginTop"),marginRight:this.originalElement.css("marginRight"),marginBottom:this.originalElement.css("marginBottom")}),this.originalElement.css({marginLeft:0,marginTop:0,marginRight:0,marginBottom:0}),this.originalResizeStyle=this.originalElement.css("resize"),this.originalElement.css("resize","none"),this._proportionallyResizeElements.push(this.originalElement.css({position:"static",zoom:1,display:"block"})),this.originalElement.css({margin:this.originalElement.css("margin")}),this._proportionallyResize()),this.handles=n.handles||(e(".ui-resizable-handle",this.element).length?{n:".ui-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",se:".ui-resizable-se",sw:".ui-resizable-sw",ne:".ui-resizable-ne",nw:".ui-resizable-nw"}:"e,s,se");if(this.handles.constructor==String){this.handles=="all"&&(this.handles="n,e,s,w,se,sw,ne,nw");var r=this.handles.split(",");this.handles={};for(var i=0;i<r.length;i++){var s=e.trim(r[i]),o="ui-resizable-"+s,u=e('<div class="ui-resizable-handle '+o+'"></div>');u.css({zIndex:n.zIndex}),"se"==s&&u.addClass("ui-icon ui-icon-gripsmall-diagonal-se"),this.handles[s]=".ui-resizable-"+s,this.element.append(u)}}this._renderAxis=function(t){t=t||this.element;for(var n in this.handles){this.handles[n].constructor==String&&(this.handles[n]=e(this.handles[n],this.element).show());if(this.elementIsWrapper&&this.originalElement[0].nodeName.match(/textarea|input|select|button/i)){var r=e(this.handles[n],this.element),i=0;i=/sw|ne|nw|se|n|s/.test(n)?r.outerHeight():r.outerWidth();var s=["padding",/ne|nw|n/.test(n)?"Top":/se|sw|s/.test(n)?"Bottom":/^e$/.test(n)?"Right":"Left"].join("");t.css(s,i),this._proportionallyResize()}if(!e(this.handles[n]).length)continue}},this._renderAxis(this.element),this._handles=e(".ui-resizable-handle",this.element).disableSelection(),this._handles.mouseover(function(){if(!t.resizing){if(this.className)var e=this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i);t.axis=e&&e[1]?e[1]:"se"}}),n.autoHide&&(this._handles.hide(),e(this.element).addClass("ui-resizable-autohide").mouseenter(function(){if(n.disabled)return;e(this).removeClass("ui-resizable-autohide"),t._handles.show()}).mouseleave(function(){if(n.disabled)return;t.resizing||(e(this).addClass("ui-resizable-autohide"),t._handles.hide())})),this._mouseInit()},_destroy:function(){this._mouseDestroy();var t=function(t){e(t).removeClass("ui-resizable ui-resizable-disabled ui-resizable-resizing").removeData("resizable").removeData("ui-resizable").unbind(".resizable").find(".ui-resizable-handle").remove()};if(this.elementIsWrapper){t(this.element);var n=this.element;this.originalElement.css({position:n.css("position"),width:n.outerWidth(),height:n.outerHeight(),top:n.css("top"),left:n.css("left")}).insertAfter(n),n.remove()}return this.originalElement.css("resize",this.originalResizeStyle),t(this.originalElement),this},_mouseCapture:function(t){var n=!1;for(var r in this.handles)e(this.handles[r])[0]==t.target&&(n=!0);return!this.options.disabled&&n},_mouseStart:function(t){var r=this.options,i=this.element.position(),s=this.element;this.resizing=!0,this.documentScroll={top:e(document).scrollTop(),left:e(document).scrollLeft()},(s.is(".ui-draggable")||/absolute/.test(s.css("position")))&&s.css({position:"absolute",top:i.top,left:i.left}),this._renderProxy();var o=n(this.helper.css("left")),u=n(this.helper.css("top"));r.containment&&(o+=e(r.containment).scrollLeft()||0,u+=e(r.containment).scrollTop()||0),this.offset=this.helper.offset(),this.position={left:o,top:u},this.size=this._helper?{width:s.outerWidth(),height:s.outerHeight()}:{width:s.width(),height:s.height()},this.originalSize=this._helper?{width:s.outerWidth(),height:s.outerHeight()}:{width:s.width(),height:s.height()},this.originalPosition={left:o,top:u},this.sizeDiff={width:s.outerWidth()-s.width(),height:s.outerHeight()-s.height()},this.originalMousePosition={left:t.pageX,top:t.pageY},this.aspectRatio=typeof r.aspectRatio=="number"?r.aspectRatio:this.originalSize.width/this.originalSize.height||1;var a=e(".ui-resizable-"+this.axis).css("cursor");return e("body").css("cursor",a=="auto"?this.axis+"-resize":a),s.addClass("ui-resizable-resizing"),this._propagate("start",t),!0},_mouseDrag:function(e){var t=this.helper,n=this.options,r={},i=this,s=this.originalMousePosition,o=this.axis,u=e.pageX-s.left||0,a=e.pageY-s.top||0,f=this._change[o];if(!f)return!1;var l=f.apply(this,[e,u,a]);this._updateVirtualBoundaries(e.shiftKey);if(this._aspectRatio||e.shiftKey)l=this._updateRatio(l,e);return l=this._respectSize(l,e),this._propagate("resize",e),t.css({top:this.position.top+"px",left:this.position.left+"px",width:this.size.width+"px",height:this.size.height+"px"}),!this._helper&&this._proportionallyResizeElements.length&&this._proportionallyResize(),this._updateCache(l),this._trigger("resize",e,this.ui()),!1},_mouseStop:function(t){this.resizing=!1;var n=this.options,r=this;if(this._helper){var i=this._proportionallyResizeElements,s=i.length&&/textarea/i.test(i[0].nodeName),o=s&&e.ui.hasScroll(i[0],"left")?0:r.sizeDiff.height,u=s?0:r.sizeDiff.width,a={width:r.helper.width()-u,height:r.helper.height()-o},f=parseInt(r.element.css("left"),10)+(r.position.left-r.originalPosition.left)||null,l=parseInt(r.element.css("top"),10)+(r.position.top-r.originalPosition.top)||null;n.animate||this.element.css(e.extend(a,{top:l,left:f})),r.helper.height(r.size.height),r.helper.width(r.size.width),this._helper&&!n.animate&&this._proportionallyResize()}return e("body").css("cursor","auto"),this.element.removeClass("ui-resizable-resizing"),this._propagate("stop",t),this._helper&&this.helper.remove(),!1},_updateVirtualBoundaries:function(e){var t=this.options,n,i,s,o,u;u={minWidth:r(t.minWidth)?t.minWidth:0,maxWidth:r(t.maxWidth)?t.maxWidth:Infinity,minHeight:r(t.minHeight)?t.minHeight:0,maxHeight:r(t.maxHeight)?t.maxHeight:Infinity};if(this._aspectRatio||e)n=u.minHeight*this.aspectRatio,s=u.minWidth/this.aspectRatio,i=u.maxHeight*this.aspectRatio,o=u.maxWidth/this.aspectRatio,n>u.minWidth&&(u.minWidth=n),s>u.minHeight&&(u.minHeight=s),i<u.maxWidth&&(u.maxWidth=i),o<u.maxHeight&&(u.maxHeight=o);this._vBoundaries=u},_updateCache:function(e){var t=this.options;this.offset=this.helper.offset(),r(e.left)&&(this.position.left=e.left),r(e.top)&&(this.position.top=e.top),r(e.height)&&(this.size.height=e.height),r(e.width)&&(this.size.width=e.width)},_updateRatio:function(e,t){var n=this.options,i=this.position,s=this.size,o=this.axis;return r(e.height)?e.width=e.height*this.aspectRatio:r(e.width)&&(e.height=e.width/this.aspectRatio),o=="sw"&&(e.left=i.left+(s.width-e.width),e.top=null),o=="nw"&&(e.top=i.top+(s.height-e.height),e.left=i.left+(s.width-e.width)),e},_respectSize:function(e,t){var n=this.helper,i=this._vBoundaries,s=this._aspectRatio||t.shiftKey,o=this.axis,u=r(e.width)&&i.maxWidth&&i.maxWidth<e.width,a=r(e.height)&&i.maxHeight&&i.maxHeight<e.height,f=r(e.width)&&i.minWidth&&i.minWidth>e.width,l=r(e.height)&&i.minHeight&&i.minHeight>e.height;f&&(e.width=i.minWidth),l&&(e.height=i.minHeight),u&&(e.width=i.maxWidth),a&&(e.height=i.maxHeight);var c=this.originalPosition.left+this.originalSize.width,h=this.position.top+this.size.height,p=/sw|nw|w/.test(o),d=/nw|ne|n/.test(o);f&&p&&(e.left=c-i.minWidth),u&&p&&(e.left=c-i.maxWidth),l&&d&&(e.top=h-i.minHeight),a&&d&&(e.top=h-i.maxHeight);var v=!e.width&&!e.height;return v&&!e.left&&e.top?e.top=null:v&&!e.top&&e.left&&(e.left=null),e},_proportionallyResize:function(){var t=this.options;if(!this._proportionallyResizeElements.length)return;var n=this.helper||this.element;for(var r=0;r<this._proportionallyResizeElements.length;r++){var i=this._proportionallyResizeElements[r];if(!this.borderDif){var s=[i.css("borderTopWidth"),i.css("borderRightWidth"),i.css("borderBottomWidth"),i.css("borderLeftWidth")],o=[i.css("paddingTop"),i.css("paddingRight"),i.css("paddingBottom"),i.css("paddingLeft")];this.borderDif=e.map(s,function(e,t){var n=parseInt(e,10)||0,r=parseInt(o[t],10)||0;return n+r})}i.css({height:n.height()-this.borderDif[0]-this.borderDif[2]||0,width:n.width()-this.borderDif[1]-this.borderDif[3]||0})}},_renderProxy:function(){var t=this.element,n=this.options;this.elementOffset=t.offset();if(this._helper){this.helper=this.helper||e('<div style="overflow:hidden;"></div>');var r=e.ui.ie6?1:0,i=e.ui.ie6?2:-1;this.helper.addClass(this._helper).css({width:this.element.outerWidth()+i,height:this.element.outerHeight()+i,position:"absolute",left:this.elementOffset.left-r+"px",top:this.elementOffset.top-r+"px",zIndex:++n.zIndex}),this.helper.appendTo("body").disableSelection()}else this.helper=this.element},_change:{e:function(e,t,n){return{width:this.originalSize.width+t}},w:function(e,t,n){var r=this.options,i=this.originalSize,s=this.originalPosition;return{left:s.left+t,width:i.width-t}},n:function(e,t,n){var r=this.options,i=this.originalSize,s=this.originalPosition;return{top:s.top+n,height:i.height-n}},s:function(e,t,n){return{height:this.originalSize.height+n}},se:function(t,n,r){return e.extend(this._change.s.apply(this,arguments),this._change.e.apply(this,[t,n,r]))},sw:function(t,n,r){return e.extend(this._change.s.apply(this,arguments),this._change.w.apply(this,[t,n,r]))},ne:function(t,n,r){return e.extend(this._change.n.apply(this,arguments),this._change.e.apply(this,[t,n,r]))},nw:function(t,n,r){return e.extend(this._change.n.apply(this,arguments),this._change.w.apply(this,[t,n,r]))}},_propagate:function(t,n){e.ui.plugin.call(this,t,[n,this.ui()]),t!="resize"&&this._trigger(t,n,this.ui())},plugins:{},ui:function(){return{originalElement:this.originalElement,element:this.element,helper:this.helper,position:this.position,size:this.size,originalSize:this.originalSize,originalPosition:this.originalPosition}}}),e.ui.plugin.add("resizable","alsoResize",{start:function(t,n){var r=e(this).data("resizable"),i=r.options,s=function(t){e(t).each(function(){var t=e(this);t.data("resizable-alsoresize",{width:parseInt(t.width(),10),height:parseInt(t.height(),10),left:parseInt(t.css("left"),10),top:parseInt(t.css("top"),10)})})};typeof i.alsoResize=="object"&&!i.alsoResize.parentNode?i.alsoResize.length?(i.alsoResize=i.alsoResize[0],s(i.alsoResize)):e.each(i.alsoResize,function(e){s(e)}):s(i.alsoResize)},resize:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r.originalSize,o=r.originalPosition,u={height:r.size.height-s.height||0,width:r.size.width-s.width||0,top:r.position.top-o.top||0,left:r.position.left-o.left||0},a=function(t,r){e(t).each(function(){var t=e(this),i=e(this).data("resizable-alsoresize"),s={},o=r&&r.length?r:t.parents(n.originalElement[0]).length?["width","height"]:["width","height","top","left"];e.each(o,function(e,t){var n=(i[t]||0)+(u[t]||0);n&&n>=0&&(s[t]=n||null)}),t.css(s)})};typeof i.alsoResize=="object"&&!i.alsoResize.nodeType?e.each(i.alsoResize,function(e,t){a(e,t)}):a(i.alsoResize)},stop:function(t,n){e(this).removeData("resizable-alsoresize")}}),e.ui.plugin.add("resizable","animate",{stop:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r._proportionallyResizeElements,o=s.length&&/textarea/i.test(s[0].nodeName),u=o&&e.ui.hasScroll(s[0],"left")?0:r.sizeDiff.height,a=o?0:r.sizeDiff.width,f={width:r.size.width-a,height:r.size.height-u},l=parseInt(r.element.css("left"),10)+(r.position.left-r.originalPosition.left)||null,c=parseInt(r.element.css("top"),10)+(r.position.top-r.originalPosition.top)||null;r.element.animate(e.extend(f,c&&l?{top:c,left:l}:{}),{duration:i.animateDuration,easing:i.animateEasing,step:function(){var n={width:parseInt(r.element.css("width"),10),height:parseInt(r.element.css("height"),10),top:parseInt(r.element.css("top"),10),left:parseInt(r.element.css("left"),10)};s&&s.length&&e(s[0]).css({width:n.width,height:n.height}),r._updateCache(n),r._propagate("resize",t)}})}}),e.ui.plugin.add("resizable","containment",{start:function(t,r){var i=e(this).data("resizable"),s=i.options,o=i.element,u=s.containment,a=u instanceof e?u.get(0):/parent/.test(u)?o.parent().get(0):u;if(!a)return;i.containerElement=e(a);if(/document/.test(u)||u==document)i.containerOffset={left:0,top:0},i.containerPosition={left:0,top:0},i.parentData={element:e(document),left:0,top:0,width:e(document).width(),height:e(document).height()||document.body.parentNode.scrollHeight};else{var f=e(a),l=[];e(["Top","Right","Left","Bottom"]).each(function(e,t){l[e]=n(f.css("padding"+t))}),i.containerOffset=f.offset(),i.containerPosition=f.position(),i.containerSize={height:f.innerHeight()-l[3],width:f.innerWidth()-l[1]};var c=i.containerOffset,h=i.containerSize.height,p=i.containerSize.width,d=e.ui.hasScroll(a,"left")?a.scrollWidth:p,v=e.ui.hasScroll(a)?a.scrollHeight:h;i.parentData={element:a,left:c.left,top:c.top,width:d,height:v}}},resize:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r.containerSize,o=r.containerOffset,u=r.size,a=r.position,f=r._aspectRatio||t.shiftKey,l={top:0,left:0},c=r.containerElement;c[0]!=document&&/static/.test(c.css("position"))&&(l=o),a.left<(r._helper?o.left:0)&&(r.size.width=r.size.width+(r._helper?r.position.left-o.left:r.position.left-l.left),f&&(r.size.height=r.size.width/r.aspectRatio),r.position.left=i.helper?o.left:0),a.top<(r._helper?o.top:0)&&(r.size.height=r.size.height+(r._helper?r.position.top-o.top:r.position.top),f&&(r.size.width=r.size.height*r.aspectRatio),r.position.top=r._helper?o.top:0),r.offset.left=r.parentData.left+r.position.left,r.offset.top=r.parentData.top+r.position.top;var h=Math.abs((r._helper?r.offset.left-l.left:r.offset.left-l.left)+r.sizeDiff.width),p=Math.abs((r._helper?r.offset.top-l.top:r.offset.top-o.top)+r.sizeDiff.height),d=r.containerElement.get(0)==r.element.parent().get(0),v=/relative|absolute/.test(r.containerElement.css("position"));d&&v&&(h-=r.parentData.left),h+r.size.width>=r.parentData.width&&(r.size.width=r.parentData.width-h,f&&(r.size.height=r.size.width/r.aspectRatio)),p+r.size.height>=r.parentData.height&&(r.size.height=r.parentData.height-p,f&&(r.size.width=r.size.height*r.aspectRatio))},stop:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r.position,o=r.containerOffset,u=r.containerPosition,a=r.containerElement,f=e(r.helper),l=f.offset(),c=f.outerWidth()-r.sizeDiff.width,h=f.outerHeight()-r.sizeDiff.height;r._helper&&!i.animate&&/relative/.test(a.css("position"))&&e(this).css({left:l.left-u.left-o.left,width:c,height:h}),r._helper&&!i.animate&&/static/.test(a.css("position"))&&e(this).css({left:l.left-u.left-o.left,width:c,height:h})}}),e.ui.plugin.add("resizable","ghost",{start:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r.size;r.ghost=r.originalElement.clone(),r.ghost.css({opacity:.25,display:"block",position:"relative",height:s.height,width:s.width,margin:0,left:0,top:0}).addClass("ui-resizable-ghost").addClass(typeof i.ghost=="string"?i.ghost:""),r.ghost.appendTo(r.helper)},resize:function(t,n){var r=e(this).data("resizable"),i=r.options;r.ghost&&r.ghost.css({position:"relative",height:r.size.height,width:r.size.width})},stop:function(t,n){var r=e(this).data("resizable"),i=r.options;r.ghost&&r.helper&&r.helper.get(0).removeChild(r.ghost.get(0))}}),e.ui.plugin.add("resizable","grid",{resize:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r.size,o=r.originalSize,u=r.originalPosition,a=r.axis,f=i._aspectRatio||t.shiftKey;i.grid=typeof i.grid=="number"?[i.grid,i.grid]:i.grid;var l=Math.round((s.width-o.width)/(i.grid[0]||1))*(i.grid[0]||1),c=Math.round((s.height-o.height)/(i.grid[1]||1))*(i.grid[1]||1);/^(se|s|e)$/.test(a)?(r.size.width=o.width+l,r.size.height=o.height+c):/^(ne)$/.test(a)?(r.size.width=o.width+l,r.size.height=o.height+c,r.position.top=u.top-c):/^(sw)$/.test(a)?(r.size.width=o.width+l,r.size.height=o.height+c,r.position.left=u.left-l):(r.size.width=o.width+l,r.size.height=o.height+c,r.position.top=u.top-c,r.position.left=u.left-l)}});var n=function(e){return parseInt(e,10)||0},r=function(e){return!isNaN(parseInt(e,10))}})(jQuery);(function(e,t){e.widget("ui.sortable",e.ui.mouse,{version:"1.9.2",widgetEventPrefix:"sort",ready:!1,options:{appendTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,forceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1e3},_create:function(){var e=this.options;this.containerCache={},this.element.addClass("ui-sortable"),this.refresh(),this.floating=this.items.length?e.axis==="x"||/left|right/.test(this.items[0].item.css("float"))||/inline|table-cell/.test(this.items[0].item.css("display")):!1,this.offset=this.element.offset(),this._mouseInit(),this.ready=!0},_destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled"),this._mouseDestroy();for(var e=this.items.length-1;e>=0;e--)this.items[e].item.removeData(this.widgetName+"-item");return this},_setOption:function(t,n){t==="disabled"?(this.options[t]=n,this.widget().toggleClass("ui-sortable-disabled",!!n)):e.Widget.prototype._setOption.apply(this,arguments)},_mouseCapture:function(t,n){var r=this;if(this.reverting)return!1;if(this.options.disabled||this.options.type=="static")return!1;this._refreshItems(t);var i=null,s=e(t.target).parents().each(function(){if(e.data(this,r.widgetName+"-item")==r)return i=e(this),!1});e.data(t.target,r.widgetName+"-item")==r&&(i=e(t.target));if(!i)return!1;if(this.options.handle&&!n){var o=!1;e(this.options.handle,i).find("*").andSelf().each(function(){this==t.target&&(o=!0)});if(!o)return!1}return this.currentItem=i,this._removeCurrentsFromItems(),!0},_mouseStart:function(t,n,r){var i=this.options;this.currentContainer=this,this.refreshPositions(),this.helper=this._createHelper(t),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=this.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},e.extend(this.offset,{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),this.originalPosition=this._generatePosition(t),this.originalPageX=t.pageX,this.originalPageY=t.pageY,i.cursorAt&&this._adjustOffsetFromHelper(i.cursorAt),this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]},this.helper[0]!=this.currentItem[0]&&this.currentItem.hide(),this._createPlaceholder(),i.containment&&this._setContainment(),i.cursor&&(e("body").css("cursor")&&(this._storedCursor=e("body").css("cursor")),e("body").css("cursor",i.cursor)),i.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css("opacity")),this.helper.css("opacity",i.opacity)),i.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper.css("zIndex")),this.helper.css("zIndex",i.zIndex)),this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",t,this._uiHash()),this._preserveHelperProportions||this._cacheHelperProportions();if(!r)for(var s=this.containers.length-1;s>=0;s--)this.containers[s]._trigger("activate",t,this._uiHash(this));return e.ui.ddmanager&&(e.ui.ddmanager.current=this),e.ui.ddmanager&&!i.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t),this.dragging=!0,this.helper.addClass("ui-sortable-helper"),this._mouseDrag(t),!0},_mouseDrag:function(t){this.position=this._generatePosition(t),this.positionAbs=this._convertPositionTo("absolute"),this.lastPositionAbs||(this.lastPositionAbs=this.positionAbs);if(this.options.scroll){var n=this.options,r=!1;this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-t.pageY<n.scrollSensitivity?this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop+n.scrollSpeed:t.pageY-this.overflowOffset.top<n.scrollSensitivity&&(this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop-n.scrollSpeed),this.overflowOffset.left+this.scrollParent[0].offsetWidth-t.pageX<n.scrollSensitivity?this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft+n.scrollSpeed:t.pageX-this.overflowOffset.left<n.scrollSensitivity&&(this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft-n.scrollSpeed)):(t.pageY-e(document).scrollTop()<n.scrollSensitivity?r=e(document).scrollTop(e(document).scrollTop()-n.scrollSpeed):e(window).height()-(t.pageY-e(document).scrollTop())<n.scrollSensitivity&&(r=e(document).scrollTop(e(document).scrollTop()+n.scrollSpeed)),t.pageX-e(document).scrollLeft()<n.scrollSensitivity?r=e(document).scrollLeft(e(document).scrollLeft()-n.scrollSpeed):e(window).width()-(t.pageX-e(document).scrollLeft())<n.scrollSensitivity&&(r=e(document).scrollLeft(e(document).scrollLeft()+n.scrollSpeed))),r!==!1&&e.ui.ddmanager&&!n.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t)}this.positionAbs=this._convertPositionTo("absolute");if(!this.options.axis||this.options.axis!="y")this.helper[0].style.left=this.position.left+"px";if(!this.options.axis||this.options.axis!="x")this.helper[0].style.top=this.position.top+"px";for(var i=this.items.length-1;i>=0;i--){var s=this.items[i],o=s.item[0],u=this._intersectsWithPointer(s);if(!u)continue;if(s.instance!==this.currentContainer)continue;if(o!=this.currentItem[0]&&this.placeholder[u==1?"next":"prev"]()[0]!=o&&!e.contains(this.placeholder[0],o)&&(this.options.type=="semi-dynamic"?!e.contains(this.element[0],o):!0)){this.direction=u==1?"down":"up";if(this.options.tolerance!="pointer"&&!this._intersectsWithSides(s))break;this._rearrange(t,s),this._trigger("change",t,this._uiHash());break}}return this._contactContainers(t),e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),this._trigger("sort",t,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1},_mouseStop:function(t,n){if(!t)return;e.ui.ddmanager&&!this.options.dropBehaviour&&e.ui.ddmanager.drop(this,t);if(this.options.revert){var r=this,i=this.placeholder.offset();this.reverting=!0,e(this.helper).animate({left:i.left-this.offset.parent.left-this.margins.left+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollLeft),top:i.top-this.offset.parent.top-this.margins.top+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollTop)},parseInt(this.options.revert,10)||500,function(){r._clear(t)})}else this._clear(t,n);return!1},cancel:function(){if(this.dragging){this._mouseUp({target:null}),this.options.helper=="original"?this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper"):this.currentItem.show();for(var t=this.containers.length-1;t>=0;t--)this.containers[t]._trigger("deactivate",null,this._uiHash(this)),this.containers[t].containerCache.over&&(this.containers[t]._trigger("out",null,this._uiHash(this)),this.containers[t].containerCache.over=0)}return this.placeholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.options.helper!="original"&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),e.extend(this,{helper:null,dragging:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?e(this.domPosition.prev).after(this.currentItem):e(this.domPosition.parent).prepend(this.currentItem)),this},serialize:function(t){var n=this._getItemsAsjQuery(t&&t.connected),r=[];return t=t||{},e(n).each(function(){var n=(e(t.item||this).attr(t.attribute||"id")||"").match(t.expression||/(.+)[-=_](.+)/);n&&r.push((t.key||n[1]+"[]")+"="+(t.key&&t.expression?n[1]:n[2]))}),!r.length&&t.key&&r.push(t.key+"="),r.join("&")},toArray:function(t){var n=this._getItemsAsjQuery(t&&t.connected),r=[];return t=t||{},n.each(function(){r.push(e(t.item||this).attr(t.attribute||"id")||"")}),r},_intersectsWith:function(e){var t=this.positionAbs.left,n=t+this.helperProportions.width,r=this.positionAbs.top,i=r+this.helperProportions.height,s=e.left,o=s+e.width,u=e.top,a=u+e.height,f=this.offset.click.top,l=this.offset.click.left,c=r+f>u&&r+f<a&&t+l>s&&t+l<o;return this.options.tolerance=="pointer"||this.options.forcePointerForContainers||this.options.tolerance!="pointer"&&this.helperProportions[this.floating?"width":"height"]>e[this.floating?"width":"height"]?c:s<t+this.helperProportions.width/2&&n-this.helperProportions.width/2<o&&u<r+this.helperProportions.height/2&&i-this.helperProportions.height/2<a},_intersectsWithPointer:function(t){var n=this.options.axis==="x"||e.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,t.top,t.height),r=this.options.axis==="y"||e.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,t.left,t.width),i=n&&r,s=this._getDragVerticalDirection(),o=this._getDragHorizontalDirection();return i?this.floating?o&&o=="right"||s=="down"?2:1:s&&(s=="down"?2:1):!1},_intersectsWithSides:function(t){var n=e.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,t.top+t.height/2,t.height),r=e.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,t.left+t.width/2,t.width),i=this._getDragVerticalDirection(),s=this._getDragHorizontalDirection();return this.floating&&s?s=="right"&&r||s=="left"&&!r:i&&(i=="down"&&n||i=="up"&&!n)},_getDragVerticalDirection:function(){var e=this.positionAbs.top-this.lastPositionAbs.top;return e!=0&&(e>0?"down":"up")},_getDragHorizontalDirection:function(){var e=this.positionAbs.left-this.lastPositionAbs.left;return e!=0&&(e>0?"right":"left")},refresh:function(e){return this._refreshItems(e),this.refreshPositions(),this},_connectWith:function(){var e=this.options;return e.connectWith.constructor==String?[e.connectWith]:e.connectWith},_getItemsAsjQuery:function(t){var n=[],r=[],i=this._connectWith();if(i&&t)for(var s=i.length-1;s>=0;s--){var o=e(i[s]);for(var u=o.length-1;u>=0;u--){var a=e.data(o[u],this.widgetName);a&&a!=this&&!a.options.disabled&&r.push([e.isFunction(a.options.items)?a.options.items.call(a.element):e(a.options.items,a.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),a])}}r.push([e.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):e(this.options.items,this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]);for(var s=r.length-1;s>=0;s--)r[s][0].each(function(){n.push(this)});return e(n)},_removeCurrentsFromItems:function(){var t=this.currentItem.find(":data("+this.widgetName+"-item)");this.items=e.grep(this.items,function(e){for(var n=0;n<t.length;n++)if(t[n]==e.item[0])return!1;return!0})},_refreshItems:function(t){this.items=[],this.containers=[this];var n=this.items,r=[[e.isFunction(this.options.items)?this.options.items.call(this.element[0],t,{item:this.currentItem}):e(this.options.items,this.element),this]],i=this._connectWith();if(i&&this.ready)for(var s=i.length-1;s>=0;s--){var o=e(i[s]);for(var u=o.length-1;u>=0;u--){var a=e.data(o[u],this.widgetName);a&&a!=this&&!a.options.disabled&&(r.push([e.isFunction(a.options.items)?a.options.items.call(a.element[0],t,{item:this.currentItem}):e(a.options.items,a.element),a]),this.containers.push(a))}}for(var s=r.length-1;s>=0;s--){var f=r[s][1],l=r[s][0];for(var u=0,c=l.length;u<c;u++){var h=e(l[u]);h.data(this.widgetName+"-item",f),n.push({item:h,instance:f,width:0,height:0,left:0,top:0})}}},refreshPositions:function(t){this.offsetParent&&this.helper&&(this.offset.parent=this._getParentOffset());for(var n=this.items.length-1;n>=0;n--){var r=this.items[n];if(r.instance!=this.currentContainer&&this.currentContainer&&r.item[0]!=this.currentItem[0])continue;var i=this.options.toleranceElement?e(this.options.toleranceElement,r.item):r.item;t||(r.width=i.outerWidth(),r.height=i.outerHeight());var s=i.offset();r.left=s.left,r.top=s.top}if(this.options.custom&&this.options.custom.refreshContainers)this.options.custom.refreshContainers.call(this);else for(var n=this.containers.length-1;n>=0;n--){var s=this.containers[n].element.offset();this.containers[n].containerCache.left=s.left,this.containers[n].containerCache.top=s.top,this.containers[n].containerCache.width=this.containers[n].element.outerWidth(),this.containers[n].containerCache.height=this.containers[n].element.outerHeight()}return this},_createPlaceholder:function(t){t=t||this;var n=t.options;if(!n.placeholder||n.placeholder.constructor==String){var r=n.placeholder;n.placeholder={element:function(){var n=e(document.createElement(t.currentItem[0].nodeName)).addClass(r||t.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper")[0];return r||(n.style.visibility="hidden"),n},update:function(e,i){if(r&&!n.forcePlaceholderSize)return;i.height()||i.height(t.currentItem.innerHeight()-parseInt(t.currentItem.css("paddingTop")||0,10)-parseInt(t.currentItem.css("paddingBottom")||0,10)),i.width()||i.width(t.currentItem.innerWidth()-parseInt(t.currentItem.css("paddingLeft")||0,10)-parseInt(t.currentItem.css("paddingRight")||0,10))}}}t.placeholder=e(n.placeholder.element.call(t.element,t.currentItem)),t.currentItem.after(t.placeholder),n.placeholder.update(t,t.placeholder)},_contactContainers:function(t){var n=null,r=null;for(var i=this.containers.length-1;i>=0;i--){if(e.contains(this.currentItem[0],this.containers[i].element[0]))continue;if(this._intersectsWith(this.containers[i].containerCache)){if(n&&e.contains(this.containers[i].element[0],n.element[0]))continue;n=this.containers[i],r=i}else this.containers[i].containerCache.over&&(this.containers[i]._trigger("out",t,this._uiHash(this)),this.containers[i].containerCache.over=0)}if(!n)return;if(this.containers.length===1)this.containers[r]._trigger("over",t,this._uiHash(this)),this.containers[r].containerCache.over=1;else{var s=1e4,o=null,u=this.containers[r].floating?"left":"top",a=this.containers[r].floating?"width":"height",f=this.positionAbs[u]+this.offset.click[u];for(var l=this.items.length-1;l>=0;l--){if(!e.contains(this.containers[r].element[0],this.items[l].item[0]))continue;if(this.items[l].item[0]==this.currentItem[0])continue;var c=this.items[l].item.offset()[u],h=!1;Math.abs(c-f)>Math.abs(c+this.items[l][a]-f)&&(h=!0,c+=this.items[l][a]),Math.abs(c-f)<s&&(s=Math.abs(c-f),o=this.items[l],this.direction=h?"up":"down")}if(!o&&!this.options.dropOnEmpty)return;this.currentContainer=this.containers[r],o?this._rearrange(t,o,null,!0):this._rearrange(t,null,this.containers[r].element,!0),this._trigger("change",t,this._uiHash()),this.containers[r]._trigger("change",t,this._uiHash(this)),this.options.placeholder.update(this.currentContainer,this.placeholder),this.containers[r]._trigger("over",t,this._uiHash(this)),this.containers[r].containerCache.over=1}},_createHelper:function(t){var n=this.options,r=e.isFunction(n.helper)?e(n.helper.apply(this.element[0],[t,this.currentItem])):n.helper=="clone"?this.currentItem.clone():this.currentItem;return r.parents("body").length||e(n.appendTo!="parent"?n.appendTo:this.currentItem[0].parentNode)[0].appendChild(r[0]),r[0]==this.currentItem[0]&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(r[0].style.width==""||n.forceHelperSize)&&r.width(this.currentItem.width()),(r[0].style.height==""||n.forceHelperSize)&&r.height(this.currentItem.height()),r},_adjustOffsetFromHelper:function(t){typeof t=="string"&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var t=this.offsetParent.offset();this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&e.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.scrollParent.scrollTop());if(this.offsetParent[0]==document.body||this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&e.ui.ie)t={top:0,left:0};return{top:t.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var e=this.currentItem.position();return{top:e.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||0,top:parseInt(this.currentItem.css("marginTop"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t=this.options;t.containment=="parent"&&(t.containment=this.helper[0].parentNode);if(t.containment=="document"||t.containment=="window")this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,e(t.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(e(t.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top];if(!/^(document|window|parent)$/.test(t.containment)){var n=e(t.containment)[0],r=e(t.containment).offset(),i=e(n).css("overflow")!="hidden";this.containment=[r.left+(parseInt(e(n).css("borderLeftWidth"),10)||0)+(parseInt(e(n).css("paddingLeft"),10)||0)-this.margins.left,r.top+(parseInt(e(n).css("borderTopWidth"),10)||0)+(parseInt(e(n).css("paddingTop"),10)||0)-this.margins.top,r.left+(i?Math.max(n.scrollWidth,n.offsetWidth):n.offsetWidth)-(parseInt(e(n).css("borderLeftWidth"),10)||0)-(parseInt(e(n).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,r.top+(i?Math.max(n.scrollHeight,n.offsetHeight):n.offsetHeight)-(parseInt(e(n).css("borderTopWidth"),10)||0)-(parseInt(e(n).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top]}},_convertPositionTo:function(t,n){n||(n=this.position);var r=t=="absolute"?1:-1,i=this.options,s=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,o=/(html|body)/i.test(s[0].tagName);return{top:n.top+this.offset.relative.top*r+this.offset.parent.top*r-(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():o?0:s.scrollTop())*r,left:n.left+this.offset.relative.left*r+this.offset.parent.left*r-(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():o?0:s.scrollLeft())*r}},_generatePosition:function(t){var n=this.options,r=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,i=/(html|body)/i.test(r[0].tagName);this.cssPosition=="relative"&&(this.scrollParent[0]==document||this.scrollParent[0]==this.offsetParent[0])&&(this.offset.relative=this._getRelativeOffset());var s=t.pageX,o=t.pageY;if(this.originalPosition){this.containment&&(t.pageX-this.offset.click.left<this.containment[0]&&(s=this.containment[0]+this.offset.click.left),t.pageY-this.offset.click.top<this.containment[1]&&(o=this.containment[1]+this.offset.click.top),t.pageX-this.offset.click.left>this.containment[2]&&(s=this.containment[2]+this.offset.click.left),t.pageY-this.offset.click.top>this.containment[3]&&(o=this.containment[3]+this.offset.click.top));if(n.grid){var u=this.originalPageY+Math.round((o-this.originalPageY)/n.grid[1])*n.grid[1];o=this.containment?u-this.offset.click.top<this.containment[1]||u-this.offset.click.top>this.containment[3]?u-this.offset.click.top<this.containment[1]?u+n.grid[1]:u-n.grid[1]:u:u;var a=this.originalPageX+Math.round((s-this.originalPageX)/n.grid[0])*n.grid[0];s=this.containment?a-this.offset.click.left<this.containment[0]||a-this.offset.click.left>this.containment[2]?a-this.offset.click.left<this.containment[0]?a+n.grid[0]:a-n.grid[0]:a:a}}return{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():i?0:r.scrollTop()),left:s-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:r.scrollLeft())}},_rearrange:function(e,t,n,r){n?n[0].appendChild(this.placeholder[0]):t.item[0].parentNode.insertBefore(this.placeholder[0],this.direction=="down"?t.item[0]:t.item[0].nextSibling),this.counter=this.counter?++this.counter:1;var i=this.counter;this._delay(function(){i==this.counter&&this.refreshPositions(!r)})},_clear:function(t,n){this.reverting=!1;var r=[];!this._noFinalSort&&this.currentItem.parent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null;if(this.helper[0]==this.currentItem[0]){for(var i in this._storedCSS)if(this._storedCSS[i]=="auto"||this._storedCSS[i]=="static")this._storedCSS[i]="";this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else this.currentItem.show();this.fromOutside&&!n&&r.push(function(e){this._trigger("receive",e,this._uiHash(this.fromOutside))}),(this.fromOutside||this.domPosition.prev!=this.currentItem.prev().not(".ui-sortable-helper")[0]||this.domPosition.parent!=this.currentItem.parent()[0])&&!n&&r.push(function(e){this._trigger("update",e,this._uiHash())}),this!==this.currentContainer&&(n||(r.push(function(e){this._trigger("remove",e,this._uiHash())}),r.push(function(e){return function(t){e._trigger("receive",t,this._uiHash(this))}}.call(this,this.currentContainer)),r.push(function(e){return function(t){e._trigger("update",t,this._uiHash(this))}}.call(this,this.currentContainer))));for(var i=this.containers.length-1;i>=0;i--)n||r.push(function(e){return function(t){e._trigger("deactivate",t,this._uiHash(this))}}.call(this,this.containers[i])),this.containers[i].containerCache.over&&(r.push(function(e){return function(t){e._trigger("out",t,this._uiHash(this))}}.call(this,this.containers[i])),this.containers[i].containerCache.over=0);this._storedCursor&&e("body").css("cursor",this._storedCursor),this._storedOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex",this._storedZIndex=="auto"?"":this._storedZIndex),this.dragging=!1;if(this.cancelHelperRemoval){if(!n){this._trigger("beforeStop",t,this._uiHash());for(var i=0;i<r.length;i++)r[i].call(this,t);this._trigger("stop",t,this._uiHash())}return this.fromOutside=!1,!1}n||this._trigger("beforeStop",t,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.helper[0]!=this.currentItem[0]&&this.helper.remove(),this.helper=null;if(!n){for(var i=0;i<r.length;i++)r[i].call(this,t);this._trigger("stop",t,this._uiHash())}return this.fromOutside=!1,!0},_trigger:function(){e.Widget.prototype._trigger.apply(this,arguments)===!1&&this.cancel()},_uiHash:function(t){var n=t||this;return{helper:n.helper,placeholder:n.placeholder||e([]),position:n.position,originalPosition:n.originalPosition,offset:n.positionAbs,item:n.currentItem,sender:t?t.element:null}}})})(jQuery);
(function(window) {

	/* ------------------------- FUNCTION_PARSE.js ------------------------- */

	var fn_parse = {

		cache: {},

		hasPrivateScope: function(fn, cache) {
			var fn_str = fn.toString();
			var signature = fn.name + ':' + fn.length + ':' + fn_str.length;
			if(typeof this.cache[signature] !== 'undefined')
				return this.cache[signature];
			else
				return this.cache[signature] = fn_str.indexOf('this.private') > -1;
		},

		addPrivateScope: function(obj) {

			var privateScope = {};
			var self = this;

			Object.defineProperty(obj, 'private', {
			  enumerable: true,
			  configurable: true,
			  set: function(data) {},
			  get: function() { console.log('hi', this);
			       return self.hasPrivateScope(arguments.callee.caller) ? privateScope : undefined;
			  },
			});

		}

	};

	/* ------------------------- MAIN TRICKS ------------------------- */

	function trick(trickProps, isExtending) {
		// if this trick extends another trick(s) perform the extend now, the first extension by inheritence the rest mixin
		if(trickProps && trickProps['extends']) {
			var extending = trickProps['extends'];
			delete trickProps['extends'];
			if(extending instanceof Array && extending.length > 0)
				return extending.shift().extend(trickProps, extending);
			else
				return extending.extend(trickProps);
		}
		// prep singleton functinoality
		var singletonInstance = undefined;
		var forceSingleton = false;
		var newTrick;
		var args = undefined;
		newTrick = function(params) {
			// singleton logic
			if( (trickProps && trickProps.singleton) || forceSingleton ) {
				if(singletonInstance)
					return singletonInstance;
				else if( !(this instanceof tricks) ) {
					args = params;
					return (singletonInstance = new newTrick(params));
				}else if(args)
					arguments = args;
			}
			// call the setupTrick method
			tricks.call(this, params);
			// invoke constructor
			var args = helperMethods.parseArray(arguments);
			args.shift();
			if(typeof this.init === 'function')
				this.init.apply(this, args);
		}
		// give the trick that is returned immediate ability to be extended, instanciated or singleton'd
		newTrick['new'] = tricks.prototype['new'];
		// give the trick .extend() like functionality as well
		newTrick.extend = extendTrick;
		// optimization, if trick invoked by extendTrick, the below will be overwritten anyway so dont run it
		if(isExtending) return newTrick;
		// give prototype for this function access to the tricks API
		newTrick.prototype = Object.create(tricks.prototype);
		// apply trickProps to the trick
		_applyTrickProps(newTrick, trickProps);
		// return our new trick
		return newTrick;
	}

	if(typeof module !== 'undefined' && typeof module.exports !== 'undefined')
		module.exports = trick;
	else
		window.trick = trick;

	/* takes trickProps object and deflates it onto the trick prototype */
	function _applyTrickProps(newTrick, trickProps) {
		if(trickProps && trickProps.defaults) {
			var defaults = trickProps.defaults;
			delete trickProps.defaults;
		}
		// set defaults
		helperMethods.mixin(newTrick.prototype, trickProps);
		if(defaults)
			helperMethods.mixin(newTrick.prototype, defaults);
	}

	/* allows for extending another trick */

	function extendTrick(trickProps, mixins) {

		// the class we inherit from directly is the first item in the array
		var inheritFrom = this instanceof Array ? extending.shift() : this;
		var newClass = trick(trickProps, true);
		newClass.extendClass(inheritFrom);

		// mixin the other extendees
		if(typeof mixins !== 'undefined')
			for(var i = 0; i < mixins.length; i++)
				helperMethods.mixin(newClass.prototype, mixins[i]);

		// only after everything should we apply trick props to our new class
		_applyTrickProps(newClass, trickProps);

		return newClass;
	}

	/* tricks constructor */

	function tricks(params) {

		var self = this;

		/* EVENT MANAGEMENT */

		var propChangeCallbacks = {};
		var realData = {};

		this.trigger = function(name, value, callback) {
			var callbacks = propChangeCallbacks[name];
			if(callbacks)
				for(var i in callbacks)
					callbacks[i].call(this, value, callback);
		}

		this.on = function(key, callback) {
			// if event is for property, cause assignment to trigger change
			if(key.substr(0, 7) === 'change:') {
				var varname = key.substr(7);
				if(typeof realData[varname] === 'undefined')
					realData[varname] = this[varname];
				Object.defineProperty(this, varname, {
				  enumerable: true,
				  configurable: true,
				  get: function() { return realData[varname] },
				  set: function(data) {
				  	realData[varname] = data;
				  	self.trigger(key, data, function(d) { realData[varname] = d });
				  	return data;
				  }
				});
			}
			// add event
			if(!propChangeCallbacks[key])
				propChangeCallbacks[key] = [ callback ];
			else
				propChangeCallbacks[key].push(callback);
		}

		// create objects if none were given
		if(!params)
			params = {};

		// do actions only relavent if tricks was inherited with the dom property enabled
		if(this.domless != true) {

			/* create or locate the view for this trick */

			// if the user gave us a selector use that one
			if(params.el) {
				// user given selector is jQuery selector
				if(params.el instanceof jQuery) {
					params.$el = params.el;
					params.el = params.el[0];
				// user given selector is not jquery
				}else if(wiundow.jQuery) {
					params.$el = $(params.el);
				}
			// user gave us no selector so make one
			}else{
				if(typeof document !== 'undefined') {
					params.el = document.createElement(this.tagName ? this.tagName : 'div');
					if(typeof jQuery !== 'undefined')
						params.$el = jQuery(params.el);
				}
			}

			if(this.className)
				params.el.className = this.className;

			if(this.id)
				params.el.id = this.id;



		}

		/* handle events for the trick */

		if(this.events) {
			// determine method of adding the events
			var el = params.el;
			var $el = params.$el;
			// fix for webkitMatchesSelector
			if(!$el) {
				var matchesSelector = false;
				if(document.body.webkitMatchesSelector)
					var matchesSelector = 'webkitMatchesSelector';
				else if(document.body.mozMatchesSelector)
					var matchesSelector = 'mozMatchesSelector';
				else
					var matchesSelector = false;
			}
			// add eventts
			var events = this.events;
			for(var e in events) {
				// this preserves variables
				(function(){
					// grab a direct pointer to the callback we will invoke for this event
					var callback = events[e];
					if(typeof callback == 'string') {
						var callback_checking = self[callback];
						if(!callback_checking) {
							console.log('TRICKS: the event method "' + callback + '" was not found on the trick', self);
							return;
						}else{
							callback = callback_checking;
						}
					}
					// get the event name and selector from the prop we were given
					var space = e.indexOf(' ');
					var eventName = e.substr(0, space);
					var eventSelector = e.substr(space + 1);
					// bind the event with jQuery if its available
					if($el) {
						$el.on(eventName, eventSelector, function(e) {
							callback.call(self, e, this);
						});
					// no jquery access, will have to do this old school
					}else{
						el.addEventListener(eventName, function(e) {
							// abort if we have no way to check matches on something
							if(!matchesSelector)
								return;
							// only allow 50 iterations incase something wacky happens
							var node = e.target;
							for(var i = 0; i < 50; i++) {
								if(!node) {
									break;
								}else if(node[matchesSelector](eventSelector)) {
									e.currentTarget = node; 
									callback.call(self, e, node);
									break;
								}else{
									node = node.parentNode;
									if(node === el)
										break;
								}
							}
						});
					}
				})();
			}
		}

		// slap parameters into function as attributes
		helperMethods.mixin(this, params);

	}

	/* take another object or function and steal its functions/prototypes and dump them into our prototype */

	tricks.prototype.extend = function(/* arg1, arg2, ... */) {
		for(var i = 0; i < arguments.length; i++)
			helperMethods.mixin(Object.getPrototypeOf(this), arguments[i]);
	}

	/* allows for instanciating trick in single line */

	tricks.prototype['new'] = function() {
		return new this;
	}

	/* PROPERTY MUTATION */

	tricks.prototype.get = function(key) {
		return this[key];
	}

	tricks.prototype.set = function(key, value) {
		this[key] = value;
		//this.trigger('change:' + key, value);
	}

	tricks.prototype.delay = function(time) {
		var dummy = {};
		var self = this;
		var fn = function(name) {
			return function() {
				setTimeout(function(){
					self[name].apply(self, arguments);
				}, time);
				return self;
			}
		}
		for(var prop in this)
			if(typeof this[prop] === 'function')
			dummy[prop] = fn(prop);
		return dummy;
	}

	/* --- some general functions --- */

	var helperMethods = {

		mixin: function(self, obj) {
			// force prototype to be mixin'd if given instead of object
			if(typeof obj == 'function' && typeof obj.prototype == 'object')
				return helperMethods.mixin(self, obj.prototype);
			for(var prop in obj)
				self[prop] = obj[prop];
			// chain game
			return this;
		},

		// take an object with props or a length and spit out an array
		parseArray: function(object) {
			var returnArray = [];
			if(object.length) {
				for(var i = 0; i < object.length; i++)
					returnArray.push(object[i]);
			}else if(!object.length && typeof object == 'object') {
				for(var prop in object)
					returnArray.push(object[prop]);
			}
			return returnArray;
		}

	}

	/* --- extend functions to have a bind method --- */

	Function.prototype.bind = function(obj) {
	     var fn = this;
	     return function() {
	          return fn.apply(obj, arguments);
	     }
	}

	/* ------------------------- INHERITENCE.js: allow for multiple inheritence ------------------------- */

	// this helper method is added to class prototypes as ".super", when called it returns the super object. 

	var _super = function(/* method0, method1, ... */) {

		// this object will be populated with methods of the superclass bound to the child this scope
		var simulatedSuperInstance = {};

		// pointer to super
		var atInvokeSuper = this._super;

		// no method names were given to grab, so grab all methods of the parent
		if(arguments.length == 0) {
			for(var prop in atInvokeSuper)
				if(typeof atInvokeSuper[prop] == 'function' && prop != 'constructor')
					simulatedSuperInstance[prop] = atInvokeSuper[prop]._bind_for_super_propagation(this, atInvokeSuper._super);
			// manually pull the constructor from the superclass, it seems that for the top of inheritence doesnt get listed when looping props
			simulatedSuperInstance['constructor'] = atInvokeSuper['constructor']._bind_for_super_propagation(this, atInvokeSuper._super);
		}

		// otherwise a list of specific methods were given, so for performance gains ONLY make these methods available in the simulatedSuperInstance
		else
			for(var i = 0; i < arguments.length; i++)
				simulatedSuperInstance[arguments[i]] = atInvokeSuper[arguments[i]]._bind_for_super_propagation(this, atInvokeSuper._super);

		// return the simulated super
		return simulatedSuperInstance;

	}

	// allow inheritence

	Function.prototype.extendClass = function(parent) {

		 // inherit from prototype
	     this.prototype = Object.create(parent.prototype);

	     // the child's prototype must know where its superclass protoype is so that the super method knows where to look for methods
	     this.prototype._super = parent.prototype;

	     // the child prototype needs the super method to access methods of the super class
	     this.prototype['super'] = _super;

	     // when the subclass inherits a method from the superclass where the method uses the super method, super in this case must point to the superclass's superclass, we fix this by defining these methods directly on the subclass to essensially proxy call super so that the value of ._super propagates correctly
	     var needsProxy = /\.super\(/;
	     for(var prop in parent.prototype)
	     	if( typeof parent.prototype[prop] == 'function' && needsProxy.test(parent.prototype[prop].toString()) )
	     		this.prototype[prop] = parent.prototype[prop]._bind_for_super_propagation(undefined, parent.prototype._super);

	     // fix wrong constructor
	     this.prototype.constructor = this;
	     
	} 

	// works the same as regular js bind, except it propagates the _super attribute once

	Function.prototype._bind_for_super_propagation = function(scope, tempParentProto) {
		var fn = this;
		return function() {
			'.super('; // we need further children to proxy this method too
			scope = scope ? scope : this;
			var atInvokeSuper = scope._super;
			scope._super = tempParentProto;
			var ret = fn.apply(scope, arguments);
			scope._super = atInvokeSuper;
			return ret;
		}
	}

})(window);
/**
 @preserve snuownd.js - javascript port of reddit's "snudown" markdown parser
 https://github.com/gamefreak/snuownd
 */
/**
 * @license Copyright (c) 2009, Natacha Port�
 * Copyright (c) 2011, Vicent Marti
 * Copyright (c) 2012, Scott McClaugherty
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
// up to date with 7d3986e3d4f2a4ba856780d4f1b8baee29b227c6

/**
@module SnuOwnd
*/
var SnuOwnd = {};
(function(exports){
	function _isspace(c) {return c == ' ' || c == '\n';}
	function isspace(c) {return /\s/.test(c);}
	function isalnum(c) { return /[A-Za-z0-9]/.test(c); }
	function isalpha(c) { return /[A-Za-z]/.test(c); }
	function ispunct(c) {return /[\x20-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]/.test(c); }

	function urlHexCode(number) {
		var hex_str = '0123456789ABCDEF';
		return '%'+hex_str[(number&0xf0)>>4]+hex_str[(number&0x0f)>>0];
	}
	function escapeUTF8Char(char) {
		var code = char.charCodeAt(0);
		if (code < 0x80) {
			return urlHexCode(code);
		} else if((code > 0x7f) && (code < 0x0800)) {
			var seq = urlHexCode(code >> 6 & 0xff | 0xc0);
				seq += urlHexCode(code >> 0 & 0x3f | 0x80);
			return seq;
		} else {
			var seq  = urlHexCode(code >> 12 & 0xff | 0xe0);
				seq += urlHexCode(code >> 6 & 0x3f | 0x80);
				seq += urlHexCode(code >> 0 & 0x3f | 0x80);
			return seq;
		}
	}

	function find_block_tag (str) {
		var wordList = [
			'p', 'dl', 'div', 'math',
			'table', 'ul', 'del', 'form',
			'blockquote', 'figure', 'ol', 'fieldset',
			'h1', 'h6', 'pre', 'script',
			'h5', 'noscript', 'style', 'iframe',
			'h4', 'ins', 'h3', 'h2' ];
	  if (wordList.indexOf(str.toLowerCase()) != -1) {
		  return str.toLowerCase();
	  }
	  return '';
	}

	function sdhtml_is_tag(tag_data, tagname) {
		var i;
		var closed = 0;
		var tag_size = tag_data.length;

		if (tag_size < 3 || tag_data[0] != '<') return HTML_TAG_NONE;

		i = 1;

		if (tag_data[i] == '/') {
			closed = 1;
			i++;
		}

		var tagname_c = 0;
		for (; i < tag_size; ++i, ++tagname_c) {
			if (tagname_c >= tagname.length) break;

			if (tag_data[i] != tagname[tagname_c]) return HTML_TAG_NONE;
		}

		if (i == tag_size) return HTML_TAG_NONE;

		if (isspace(tag_data[i]) || tag_data[i] == '>')
			return closed ? HTML_TAG_CLOSE : HTML_TAG_OPEN;

		return HTML_TAG_NONE;
	}


	function unscape_text(out, src) {
		var i = 0, org;
		while (i < src.s.length) {
			org = i;
			while (i < src.s.length && src.s[i] != '\\') i++;

			if (i > org) out.s += src.s.slice(org, i);

			if (i + 1 >= src.s.length) break;

			out.s += src.s[i + 1];
			i += 2;
		}
	}

	/**
	 * According to the OWASP rules:
	 *
	 * & --> &amp;
	 * < --> &lt;
	 * > --> &gt;
	 * " --> &quot;
	 * ' --> &#x27;     &apos; is not recommended
	 * / --> &#x2F;     forward slash is included as it helps end an HTML entity
	 *
	 */
	var HTML_ESCAPE_TABLE = [
	7, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 7, 7, 0, 7, 7, 
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 
	0, 0, 1, 0, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 4, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 6, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
	];

	var HTML_ESCAPES = ["", "&quot;", "&amp;", "&#39;", "&#47;", "&lt;", "&gt;", "" /* throw out control characters */ ];

	function escape_html(out, src, secure) {
		var i = 0, org, esc = 0;
		while (i < src.length) {
			org = i;
			while (i < src.length && !(esc = HTML_ESCAPE_TABLE[src.charCodeAt(i)]))
				i++;

			if (i > org) out.s += src.slice(org, i);

			/* escaping */
			if (i >= src.length) break;

			/* The forward slash is only escaped in secure mode */
			if (src[i] == '/' && !secure) {
				out.s += '/';
			} else if (HTML_ESCAPE_TABLE[src.charCodeAt(i)] == 7) {
				/* skip control characters */
			} else {
				out.s += HTML_ESCAPES[esc];
			}

			i++;
		}
	}


	/*
	 * The following characters will not be escaped:
	 *
	 *		-_.+!*'(),%#@?=;:/,+&$ alphanum
	 *
	 * Note that this character set is the addition of:
	 *
	 *	- The characters which are safe to be in an URL
	 *	- The characters which are *not* safe to be in
	 *	an URL because they are RESERVED characters.
	 *
	 * We asume (lazily) that any RESERVED char that
	 * appears inside an URL is actually meant to
	 * have its native function (i.e. as an URL 
	 * component/separator) and hence needs no escaping.
	 *
	 * There are two exceptions: the chacters & (amp)
	 * and ' (single quote) do not appear in the table.
	 * They are meant to appear in the URL as components,
	 * yet they require special HTML-entity escaping
	 * to generate valid HTML markup.
	 *
	 * All other characters will be escaped to %XX.
	 *
	 */
	var HREF_SAFE = [
		2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 0, 2, 2, 
		2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 
		0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 
		0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
	];

	function escape_href(out, src) {
		var  i = 0, org;


		while (i < src.length) {
			org = i;
			while (i < src.length && HREF_SAFE[src.charCodeAt(i)] != 0) i++;

			if (i > org) out.s += src.slice(org, i);

			/* escaping */
			if (i >= src.length) break;

			/* throw out control characters */
			if (HREF_SAFE[src.charCodeAt(i)] == 2) {
				i++;
				continue;
			}

			switch (src[i]) {
				/* amp appears all the time in URLs, but needs
				 * HTML-entity escaping to be inside an href */
				case '&': 
					out.s += '&amp;';
					break;

					/* the single quote is a valid URL character
					 * according to the standard; it needs HTML
					 * entity escaping too */
				case '\'':
					out.s += '&#x27;';
					break;

					/* the space can be escaped to %20 or a plus
					 * sign. we're going with the generic escape
					 * for now. the plus thing is more commonly seen
					 * when building GET strings */
/*
				//This was disabled
				case ' ':
					out.s += '+'
					break;
//*/

					/* every other character goes with a %XX escaping */
				default:
					out.s += escapeUTF8Char(src[i]);
					/*
					var cc = src.charCodeAt(i);
					hex_str[1] = hex_chars[(cc >> 4) & 0xF];
					hex_str[2] = hex_chars[cc & 0xF];
					out.s += hex_str.join('');
					*/
			}

			i++;
		}
	}


//		function autolink_delim(uint8_t *data, size_t link_end, size_t offset, size_t size)
		function autolink_delim(data, link_end) {
			var cclose, copen = 0;
			var i;

			for (i = 0; i < link_end; ++i)
				if (data[i] == '<') {
					link_end = i;
					break;
				}

			while (link_end > 0) {
				if ('?!.,'.indexOf(data[link_end - 1]) != -1) link_end--;

				else if (data[link_end - 1] == ';') {
					var new_end = link_end - 2;

					while (new_end > 0 && isalpha(data[new_end])) new_end--;

					if (new_end < link_end - 2 && data[new_end] == '&')
						link_end = new_end;
					else link_end--;
				}
				else break;
			}

			if (link_end == 0) return 0;

			cclose = data[link_end - 1];

			switch (cclose) {
				case '"':	copen = '"'; break;
				case '\'':	copen = '\''; break;
				case ')':	copen = '('; break;
				case ']':	copen = '['; break;
				case '}':	copen = '{'; break;
			}

			if (copen != 0) {
				var closing = 0;
				var opening = 0;
				var j = 0;

				/* Try to close the final punctuation sign in this same line;
				 * if we managed to close it outside of the URL, that means that it's
				 * not part of the URL. If it closes inside the URL, that means it
				 * is part of the URL.
				 *
				 * Examples:
				 *
				 *	foo http://www.pokemon.com/Pikachu_(Electric) bar
				 *		=> http://www.pokemon.com/Pikachu_(Electric)
				 *
				 *	foo (http://www.pokemon.com/Pikachu_(Electric)) bar
				 *		=> http://www.pokemon.com/Pikachu_(Electric)
				 *
				 *	foo http://www.pokemon.com/Pikachu_(Electric)) bar
				 *		=> http://www.pokemon.com/Pikachu_(Electric))
				 *
				 *	(foo http://www.pokemon.com/Pikachu_(Electric)) bar
				 *		=> foo http://www.pokemon.com/Pikachu_(Electric)
				 */

				while (j < link_end) {
					if (data[j] == copen) opening++;
					else if (data[j] == cclose) closing++;

					j++;
				}

				if (closing != opening) link_end--;
			}

			return link_end;
		}

	function check_domain(data, allow_short) {
		var i, np = 0;

		if (!isalnum(data[0])) return 0;

		for (i = 1; i < data.length - 1; ++i) {
			if (data[i] == '.') np++;
			else if (!isalnum(data[i]) && data[i] != '-') break;
		}

		/* a valid domain needs to have at least a dot.
		 * that's as far as we get */
		if (allow_short) {
			/* We don't need a valid domain in the strict sence (with
			 * at least one dot; so just make sure it's composed of valid
			 * domain characters and return the length of the valid
			 * sequence. */
			return i;
		} else {
			return np ? i : 0;
		}
	}


	function sd_autolink_issafe(link) {
		var valid_uris = [
			"http://", "https://", "ftp://", "mailto://",
		"/", "git://", "steam://", "irc://", "news://", "mumble://",
		"ssh://", "ircs://", "#"];

		var i;

		for (i = 0; i < valid_uris.length; ++i) {
			var len = valid_uris[i].length;

			if (link.length > len &&
					link.toLowerCase().indexOf(valid_uris[i]) == 0 &&
					/[A-Za-z0-9#\/?]/.test(link[len]))
				return 1;
		}

		return 0;
	}


	function sd_autolink__url(rewind_p, link, data_, offset, size, flags) {
		var data = data_.slice(offset);
		var link_end, rewind = 0, domain_len;

		if (size < 4 || data_[offset+1] != '/' || data_[offset+2] != '/') return 0;

		while (rewind < offset && isalpha(data_[offset-rewind - 1])) rewind++;

		if (!sd_autolink_issafe(data_.substr(offset-rewind, size+rewind))) return 0;
		link_end = "://".length;

		domain_len = check_domain(data.slice(link_end), flags & SD_AUTOLINK_SHORT_DOMAINS);
		if (domain_len == 0) return 0;

		link_end += domain_len;
		while (link_end < size && !isspace(data_[offset+link_end])) link_end++;

		link_end = autolink_delim(data, link_end);

		if (link_end == 0) return 0;

		//TODO
		link.s += data_.substr(offset-rewind, link_end+rewind);
		rewind_p.p = rewind;

		return link_end;
	}


	function sd_autolink__subreddit(rewind_p, link, data_, offset, size) {
		var data = data_.slice(offset);
		var link_end;

		if (size < 3) return 0;

		/* make sure this / is part of /r/ */
		if (data.toLowerCase().indexOf('/r/') != 0) return 0;

		link_end = "/r/".length;

		do {
			var start = link_end;
			var max_length = 24;
			/* special case: /r/reddit.com (the only subreddit with a '.') */
			if ( size >= link_end+10 && data.substr(link_end, 10).toLowerCase() == 'reddit.com') {
				link_end += 10;
				max_length = 10;
			} else {
				/* If not the special case make sure it starts with (t:)?[A-Za-z0-9] */
				/* support autolinking to timereddits, /r/t:when (1 April 2012) */
				if ( size > link_end+2 && data.substr(link_end, 2) == 't:')
					link_end += 2;  /* Jump over the 't:' */

				/* the first character of a subreddit name must be a letter or digit */
				if (!isalnum(data[link_end]))
					return 0;
				link_end += 1;
			}

			/* consume valid characters ([A-Za-z0-9_]) until we run out */
			while (link_end < size && (isalnum(data[link_end]) ||
								data[link_end] == '_'))
				link_end++;

			/* valid subreddit names are between 3 and 21 characters, with
			 * some subreddits having 2-character names. Don't bother with
			 * autolinking for anything outside this length range.
			 * (chksrname function in reddit/.../validator.py) */
			if ( link_end-start < 2 || link_end-start > max_length )
				return 0;

			/* If we are linking to a multireddit, continue */
		} while ( link_end < size && data[link_end] == '+' && link_end++ );
		/* make the link */
		link.s += data.slice(0, link_end);
		rewind_p.p = 0;

		return link_end;
	}

	function sd_autolink__username(rewind_p, link, data_, offset, size) {
		var data = data_.slice(offset);
		var link_end;

		if (size < 6) return 0;

		/* make sure this / is part of /u/ */
		if (data.indexOf('/u/') != 0) return 0;

		/* the first letter of a username must... well, be valid, we don't care otherwise */
		link_end = "/u/".length;
		if (!isalnum(data[link_end]) && data[link_end] != '_' && data[link_end] != '-')
			return 0;
		link_end += 1;

		/* consume valid characters ([A-Za-z0-9_-]) until we run out */
		while (link_end < size && (isalnum(data[link_end]) ||
					data[link_end] == '_' ||
					data[link_end] == '-'))
			link_end++;

		/* make the link */
		link.s += data.slice(0, link_end);
		rewind_p.p = 0;

		return link_end;
	}


	function sd_autolink__email(rewind_p, link, data_, offset, size, flags) {
		var data = data_.slice(offset);
		var link_end, rewind;
		var nb = 0, np = 0;

		for (rewind = 0; rewind < offset; ++rewind) {
			var c = data_[offset-rewind - 1];
			if (isalnum(c)) continue;
			if (".+-_".indexOf(c) != -1) continue;
			break;
		}

		if (rewind == 0) return 0;

		for (link_end = 0; link_end < size; ++link_end) {
			var c = data_[offset+link_end];

			if (isalnum(c)) continue;

			if (c == '@') nb++;
			else if (c == '.' && link_end < size - 1) np++;
			else if (c != '-' && c != '_') break;
		}

		if (link_end < 2 || nb != 1 || np == 0) return 0;

		//TODO
		link_end = autolink_delim(data, link_end);

		if (link_end == 0) return 0;

//		link.s += data_.slice(offset - rewind, link_end + rewind
		link.s += data_.substr(offset - rewind, link_end + rewind);
		rewind_p.p = rewind;

		return link_end;
	}

	function sd_autolink__www(rewind_p, link, data_, offset, size, flags) {
		var data = data_.slice(offset);
		var link_end;

		if (offset > 0 && !ispunct(data_[offset-1]) && !isspace(data_[offset-1]))
			return 0;

//		if (size < 4 || memcmp(data, "www.", strlen("www.")) != 0)
		if (size < 4 || (data.slice(0,4) != 'www.')) return 0;

		link_end = check_domain(data, 0);

		if (link_end == 0)
			return 0;

		while (link_end < size && !isspace(data[link_end])) link_end++;

		link_end = autolink_delim(data, link_end);

		if (link_end == 0) return 0;

		link.s += data.slice(0, link_end);
		rewind_p.p = 0;

		return link_end;
	}

/**
Initialize a Callbacks object.

@constructor
@param {Object.<string, ?function>} callbacks A set of callbacks to use as the methods on this object.
*/
function Callbacks(callbacks) {
	if (callbacks) {
		for (var name in callbacks) {
			if (name in this) this[name] = callbacks[name];
		}
	}
}

Callbacks.prototype = {
/**
Renders a code block.

Syntax highlighting specific to lanugage may be performed here.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {Buffer} language The name of the code langage.
@param {?Object} context A renderer specific context object.
*/
	blockcode: null,
/**
Renders a blockquote.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {?Object} context A renderer specific context object.
*/
	blockquote: null,
/**
Renders a block of HTML code.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {?Object} context A renderer specific context object.
*/
	blockhtml: null,
/**
Renders a header.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {Number} level The header level.
@param {?Object} context A renderer specific context object.
*/
	header: null,
/**
Renders a horizontal rule.

@method
@param {Buffer} out The output string buffer to append to.
@param {?Object} context A renderer specific context object.
*/
	hrule: null,
/**
Renders a list.
<p>
This method handles the list wrapper, which in terms of HTML would be &lt;ol&gt; or &lt;ul&gt;.
This method is not responsible for handling list elements, all such processing should
already have occured on text pased to the method . All that it is intended
to do is to wrap the text parameter in anything needed.
</p>

@example
out.s += "&lt;ul&gt;" + text.s + "&lt;/ul&gt;"


@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input that goes inside the list.
@param {Number} flags A bitfield holding a portion of the render state. The only bit that this should be concerned with is MKD_LIST_ORDERED
@param {?Object} context A renderer specific context object.
*/
	list: null,
/**
Renders a list.
<p>
Wraps the text in a list element.
</p>

@example
out.s += "&lt;li&gt;" + text.s + "&lt;/li&gt;"


@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The contents of the list element.
@param {Number} flags A bitfield holding a portion of the render state. The only bit that this should be concerned with is MKD_LI_BLOCK.
@param {?Object} context A renderer specific context object.
*/
	listitem: null,
/**
Renders a paragraph.

@example

out.s += "&lt;p&gt;" + text.s + "&lt;/p&gt;";

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {?Object} context A renderer specific context object.
*/
	paragraph: null,
/**
Renders a table.

@example

out.s += "<table><thead>";
out.s += header.s;
out.s += "</thead><tbody>";
out.s += body.s;
out.s += "</tbody></table>";

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} head The table header.
@param {Buffer} body The table body.
@param {?Object} context A renderer specific context object.
*/
	table: null,
/**
Renders a table row.

@example

out.s += "&lt;tr&gt;" + text.s + "&lt;/tr&gt;";

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {?Object} context A renderer specific context object.
*/
	table_row: null,
/**
Renders a table cell.

@example

out.s += "&lt;td&gt;" + text.s + "&lt;/td&gt;";

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {Number} flags A bit filed indicating a portion of the output state. Relevant bits are: MKD_TABLE_HEADER, MKD_TABLE_ALIGN_CENTER. MKD_TABLE_ALIGN_L, and MKD_TABLE_ALIGN_R.
@param {?Object} context A renderer specific context object.
*/
	table_cell: null,
/**
Renders a link that was autodetected.

@example

out.s += "&lt;a href=\""+ text.s + "\"&gt;" + text.s + "&lt;/a&gt;";

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The address being linked to.
@param {Number} type Equal to MKDA_NORMAL or MKDA_EMAIL
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	autolink: null,
/**
Renders inline code.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	codespan: null,
/**
Renders text with double emphasis. Default is equivalent to the HTML &lt;strong&gt; tag.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	double_emphasis: null,
/**
Renders text with single emphasis. Default is equivalent to the HTML &lt;em&gt; tag.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	emphasis: null,
/**
Renders an image.

@example

out.s = "&lt;img src=\"" + link.s + "\" title=\"" + title.s + "\"  alt=\"" + alt.s + "\"/&gt;";"

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} link The address of the image.
@param {Buffer} title Title text for the image
@param {Buffer} alt Alt text for the image
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	image: null,
/**
Renders line break.

@example

out.s += "&lt;br/&gt;";

@method
@param {Buffer} out The output string buffer to append to.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	linebreak: null,
/**
Renders a link.

@example

out.s = "&lt;a href=\"" + link.s + "\" title=\"" + title.s + "\"&gt;" + content.s + "&lt;/a&gt;";

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} link The link address.
@param {Buffer} title Title text for the link.
@param {Buffer} content Link text.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	link: null,
/**
Copies and potentially escapes some HTML.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The input text.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	raw_html_tag: null,
/**
Renders text with triple emphasis. Default is equivalent to both the &lt;em&gt; and &lt;strong&gt; HTML tags.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	triple_emphasis: null,
/**
Renders text crossd out.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	strikethrough: null,
/**
Renders text as superscript.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
@returns {Boolean} Whether or not the tag was rendered.
*/
	superscript: null,
/**
Escapes an HTML entity.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being wrapped.
@param {?Object} context A renderer specific context object.
*/
	entity: null,
/**
Renders plain text.

@method
@param {Buffer} out The output string buffer to append to.
@param {Buffer} text The text being rendered.
@param {?Object} context A renderer specific context object.
*/
	normal_text: null,
/**
Creates opening boilerplate for a table of contents.

@method
@param {Buffer} out The output string buffer to append to.
@param {?Object} context A renderer specific context object.
*/
	doc_header: null,
/**
Creates closing boilerplate for a table of contents.

@method
@param {Buffer} out The output string buffer to append to.
@param {?Object} context A renderer specific context object.
*/
	doc_footer: null
};


/**
A renderer object

@constructor
@param {Callbacks} callbacks The callbacks object to use for the renderer.
@param {?Callbacks} context Renderer specific context information.
*/
function Renderer(callbacks, context) {
	this.callbacks = callbacks;
	this.context = context;
}

/**
Instantiates a custom Renderer object.

@param {Callbacks} callbacks The callbacks object to use for the renderer.
@param {?Callbacks} context Renderer specific context information.
@returns {Renderer}
*/
function createCustomRenderer(callbacks, context) {
	return new Renderer(callbacks, context)
}
exports.createCustomRenderer = createCustomRenderer;

/**
Produces a renderer object that will match Reddit's output.
@returns {Renderer} A renderer object that will match Reddit's output.
*/
function getRedditRenderer() {
	return new Renderer(getRedditCallbacks() ,{
		nofollow: 0,
		target: null,
		tocData: {
			headerCount: 0,
			currentLevel: 0,
			levelOffset: 0
		},
		flags: HTML_SKIP_HTML | HTML_SKIP_IMAGES | HTML_SAFELINK | HTML_ESCAPE | HTML_USE_XHTML,
		/* extra callbacks */
		//	void (*link_attributes)(struct buf *ob, const struct buf *url, void *self);
		link_attributes: function link_attributes(out, url, options) {

			if (options.nofollow) out.s += ' rel="nofollow"';

			if (options.target != null) {
				out.s += ' target="' + options.target + '"';
			}
		}
	});
}
exports.getRedditRenderer = getRedditRenderer;

/**
Create a Callbacks object with the given callback table.

@param {Object.<string, function>} callbacks A table of callbacks to place int a callbacks object.
@returns {Callbacks} A callbacks object holding the provided callbacks.
*/
function createCustomCallbacks(callbacks) {
	return new Callbacks(callbacks);
}
exports.createCustomCallbacks = createCustomCallbacks;

/**
Produce a callbacks object that matches Reddit's output.
@returns {Callbacks} A callbacks object that matches Reddit's output.
*/
function getRedditCallbacks(){
	return new Callbacks({
		blockcode: cb_blockcode,
		blockquote: cb_blockquote,
		blockhtml: cb_blockhtml,
		header: cb_header,
		hrule: cb_hrule,
		list: cb_list,
		listitem: cb_listitem,
		paragraph: cb_paragraph,
		table: cb_table,
		table_row: cb_table_row,
		table_cell: cb_table_cell,
		autolink: cb_autolink,
		codespan: cb_codespan,
		double_emphasis: cb_double_emphasis,
		emphasis: cb_emphasis,
		image: cb_image,
		linebreak: cb_linebreak,
		link: cb_link,
		raw_html_tag: cb_raw_html_tag,
		triple_emphasis: cb_triple_emphasis,
		strikethrough: cb_strikethrough,
		superscript: cb_superscript,
		entity: null,
		normal_text: cb_normal_text,
		doc_header: null,
		doc_footer: null
	});
}
exports.getRedditCallbacks = getRedditCallbacks;

/**
Produce a callbacks object for rendering a table of contents.
@returns {Callbacks} A callbacks object for rendering a table of contents.
*/
function getTocCallbacks() {
	return new Callbacks({
		blockcode: null,
		blockquote: null,
		blockhtml: null,
		header: cb_toc_header,
		hrule: null,
		list: null,
		listitem: null,
		paragraph: null,
		table: null,
		table_row: null,
		table_cell: null,
		autolink: null,
		codespan: cb_codespan,
		double_emphasis: cb_double_emphasis,
		emphasis: cb_emphasis,
		image: null,
		linebreak: null,
		link: cb_toc_link,
		raw_html_tag: null,
		triple_emphasis: cb_triple_emphasis,
		strikethrough: cb_strikethrough,
		superscript: cb_superscript,
		entity: null,
		normal_text: null,
		doc_header: null,
		doc_footer: cb_toc_finalize
	});
}
exports.getTocCallbacks = getTocCallbacks;

/* block level callbacks - NULL skips the block */
//	void (*blockcode)(struct buf *ob, const struct buf *text, const struct buf *lang, void *opaque);
	function cb_blockcode(out, text, lang, options) {
		if (out.s.length) out.s += '\n';

		if (lang && lang.s.length) {
			var i, cls;
			out.s += '<pre><code class="';

			for (i = 0, cls = 0; i < lang.s.length; ++i, ++cls) {
				while (i < lang.s.length && isspace(lang.s[i]))
					i++;

				if (i < lang.s.length) {
					var org = i;
					while (i < lang.s.length && !isspace(lang.s[i])) i++;

					if (lang.s[org] == '.') org++;

					if (cls) out.s += ' ';
					escape_html(out, lang.s.slice(org, i), false);
				}
			}

			out.s += '">';
		} else
			out.s += '<pre><code>';

		if (text) escape_html(out, text.s, false);

		out.s += '</code></pre>\n';
	}

//	void (*blockquote)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_blockquote(out, text, options) {
		if (out.s.length) out.s += '\n';
		out.s += '<blockquote>\n';
		if (text) out.s += text.s;
		out.s += '</blockquote>\n';
	}
//	void (*blockhtml)(struct buf *ob,const  struct buf *text, void *opaque);
	function cb_blockhtml(out, text, options) {
		var org, sz;
		if (!text) return;
		sz = text.s.length;
		while (sz > 0 && text.s[sz - 1] == '\n') sz--;
		org = 0;
		while (org < sz && text.s[org] == '\n') org++;
		if (org >= sz) return;
		if (out.s.length) out.s += '\n';
		out.s += text.s.slice(org, sz);
		out.s += '\n';
	}

//	header(Buffer out, Buffer text, int level, void *opaque);
	function cb_header(out, text, level, options) {
		if (out.s.length) out.s += '\n';
		if (options.flags & HTML_TOC)
			out.s += '<h' + (+level) + 'id="toc_' + (options.tocData.headerCount++) + '">';
		else
			out.s += '<h' + (+level) + '>';

		if (text) out.s += text.s;
		out.s += '</h' + (+level) + '>\n';
	}

//	void (*hrule)(struct buf *ob, void *opaque);
	function cb_hrule(out, options) {
		if (out.s.length) out.s += '\n';
		out.s += (options.flags & HTML_USE_XHTML) ? '<hr/>\n' : '<hr>\n';
	}

//	void (*list)(struct buf *ob, const struct buf *text, int flags, void *opaque);
	function cb_list(out, text, flags, options) {
		if (out.s.length) out.s += '\n';
		out.s += (flags&MKD_LIST_ORDERED?'<ol>\n':'<ul>\n');
		if (text) out.s += text.s;
		out.s += (flags&MKD_LIST_ORDERED?'</ol>\n':'</ul>\n');
	}

//	void (*listitem)(struct buf *ob, const struct buf *text, int flags, void *opaque);
	function cb_listitem(out, text, flags, options) {
		out.s += '<li>';
		if (text) {
			var size = text.s.length;
			while (size && text.s[size - 1] == '\n') size--;
			out.s += text.s.slice(0, size);
		}
		out.s += '</li>\n';
	}

//	void (*paragraph)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_paragraph(out, text, options) {
		var i = 0;

		if (out.s.length) out.s += '\n';

		if (!text || !text.s.length) return;

		while (i < text.s.length && isspace(text.s[i])) i++;

		if (i == text.s.length) return;

		out.s += '<p>';
		if (options.flags & HTML_HARD_WRAP) {
			var org;
			while (i < text.s.length) {
				org = i;
				while (i < text.s.length && text.data[i] != '\n')
					i++;

				if (i > org) out.s += text.s.slice(org, i);

				/*
				 * do not insert a line break if this newline
				 * is the last character on the paragraph
				 */
				if (i >= text.s.length - 1) break;

				cb_linebreak(out, options);
				i++;
			}
		} else {
			out.s += text.s.slice(i);
		}
		out.s += '</p>\n';
	}

//	void (*table)(struct buf *ob, const struct buf *header, const struct buf *body, void *opaque);
	function cb_table(out, header, body, options) {
		if (out.s.length) out.s += '\n';
		out.s += '<table><thead>\n';
		if (header) out.s += header.s;
		out.s += '</thead><tbody>\n';
		if (body) out.s += body.s;
		out.s += '</tbody></table>\n';
	}

//	void (*table_row)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_table_row(out, text, options) {
		out.s += '<tr>\n';
		if (text) out.s += text.s;
		out.s += '</tr>\n';
	}

//	void (*table_cell)(struct buf *ob, const struct buf *text, int flags, void *opaque);
	function cb_table_cell(out, text, flags, options) {
		if (flags & MKD_TABLE_HEADER) {
			out.s += '<th';
		} else {
			out.s += '<td';
		}

		switch (flags & MKD_TABLE_ALIGNMASK) {
			case MKD_TABLE_ALIGN_CENTER:
				out.s += ' align="center">';
				break;

			case MKD_TABLE_ALIGN_L:
				out.s += ' align="left">';
				break;

			case MKD_TABLE_ALIGN_R:
				out.s += ' align="right">';
				break;
			default:
				out.s += '>';
		}

		if (text) out.s += text.s;

		if (flags & MKD_TABLE_HEADER) {
			out.s += '</th>\n';
		} else {
			out.s += '</td>\n';
		}
	}

/* span level callbacks - NULL or return 0 prints the span verbatim */
//	int (*autolink)(struct buf *ob, const struct buf *link, enum mkd_autolink type, void *opaque);
	function cb_autolink(out, link, type, options) {
		var offset = 0;

		if (!link || !link.s.length) return 0;

		if ((options.flags & HTML_SAFELINK) != 0 &&
				!sd_autolink_issafe(link.s) && type != MKDA_EMAIL)
			return 0;

		out.s += '<a href="';
		if (type == MKDA_EMAIL) out.s += 'mailto:';
		escape_href(out, link.s.slice(offset));

		if (options.link_attributes) {
			out.s += '"';
			options.link_attributes(out, link, options);
			out.s += '>';
		} else {
			out.s += '">';
		}

		/*
		 * Pretty printing: if we get an email address as
		 * an actual URI, e.g. `mailto:foo@bar.com`, we don't
		 * want to print the `mailto:` prefix
		 */
		if (link.s.indexOf('mailto:')==0) {
			escape_html(out, link.s.slice(7), false);
		} else {
			escape_html(out, link.s, false);
		}

		out.s += '</a>';

		return 1;
	}

//	int (*codespan)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_codespan(out, text, options) {
		out.s += '<code>';
		if (text) escape_html(out, text.s, false);
		out.s += '</code>';
		return 1;
	}

//	int (*double_emphasis)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_double_emphasis(out, text, options) {
		if (!text || !text.s.length) return 0;
		out.s += '<strong>' + text.s + '</strong>';
		return 1;
	}

//	int (*emphasis)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_emphasis(out, text, options) {
		if (!text || !text.s.length) return 0;
		out.s += '<em>' + text.s + '</em>';
		return 1;
	}

//	int (*image)(struct buf *ob, const struct buf *link, const struct buf *title, const struct buf *alt, void *opaque);
	function cb_image(out, link, title, alt, options) {
		if (!link || !link.s.length) return 0;

		out.s += '<img src="';
		escape_href(out, link.s);
		out.s += '" alt="';

		if (alt && alt.s.length) escape_html(out, alt.s, false);

		if (title && title.s.length) {
			out.s += '" title="';
			escape_html(out, title.s, false);
		}

		out.s += (options.flags&HTML_USE_XHTML?'"/>':'">');
		return 1;
	}


//	int (*linebreak)(struct buf *ob, void *opaque);
	function cb_linebreak(out, options) {
		out.s += (options.flags&HTML_USE_XHTML?'<br/>\n':'<br>\n');
		return 1;
	}

//	int (*link)(struct buf *ob, const struct buf *link, const struct buf *title, const struct buf *content, void *opaque);
	function cb_link(out, link, title, content, options) {
		if (link != null && (options.flags & HTML_SAFELINK) != 0 && !sd_autolink_issafe(link.s)) return 0;

		out.s += '<a href="';

		if (link && link.s.length) escape_href(out, link.s);

		if (title && title.s.length) {
			out.s += '" title="';
			escape_html(out, title.s, false);
		}

		if (options.link_attributes) {
			out.s += '"';
			options.link_attributes(out, link, options);
			out.s += '>';
		} else {
			out.s += '">';
		}

		if (content && content.s.length) out.s += content.s;
		out.s += '</a>';
		return 1;
	}

//	int (*raw_html_tag)(struct buf *ob, const struct buf *tag, void *opaque);
	function cb_raw_html_tag(out, text, options) {
		/* HTML_ESCAPE overrides SKIP_HTML, SKIP_STYLE, SKIP_LINKS and SKIP_IMAGES
		 * It doens't see if there are any valid tags, just escape all of them. */
		if((options.flags & HTML_ESCAPE) != 0) {
			escape_html(out, text.s, false);
			return 1;
		}

		if ((options.flags & HTML_SKIP_HTML) != 0) return 1;

		if ((options.flags & HTML_SKIP_STYLE) != 0 &&
				sdhtml_is_tag(text.s, "style"))
			return 1;

		if ((options.flags & HTML_SKIP_LINKS) != 0 &&
				sdhtml_is_tag(text.s, "a"))
			return 1;

		if ((options.flags & HTML_SKIP_IMAGES) != 0 &&
				sdhtml_is_tag(text.s, "img"))
			return 1;

		out.s += text.s;
		return 1;
	}

//	int (*triple_emphasis)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_triple_emphasis(out, text, options) {
		if (!text || !text.s.length) return 0;
		out.s += '<strong><em>' + text.s + '</em></strong>';
		return 1;
	}

//	int (*strikethrough)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_strikethrough(out, text, options) {
		if (!text || !text.s.length) return 0;
		out.s += '<del>' + text.s + '</del>';
		return 1;
	}

//	int (*superscript)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_superscript(out, text, options) {
		if (!text || !text.s.length) return 0;
		out.s += '<sup>' + text.s + '</sup>';
		return 1;
	}

/* low level callbacks - NULL copies input directly into the output */
//	void (*entity)(struct buf *ob, const struct buf *entity, void *opaque);
//TODO: WRITE
//	entity: null,

//	void (*normal_text)(struct buf *ob, const struct buf *text, void *opaque);
	function cb_normal_text(out, text, options) {
		if (text) escape_html(out, text.s, false);
	}

//toc_header(struct buf *ob, const struct buf *text, int level, void *opaque)
	function cb_toc_header(out, text, level, options) {
		/* set the level offset if this is the first header
		 * we're parsing for the document */
		if (options.tocData.currentLevel== 0) {
			options.tocData.levelOffset = level - 1;
		}
		level -= options.tocData.levelOffset;

		if (level > options.tocData.currentLevel) {
			while (level > options.tocData.currentLevel) {
				out.s += '<ul>\n<li>\n';
				options.tocData.currentLevel++;
			}
		} else if (level < options.tocData.currentLevel) {
			out.s += '</li>\n';
			while (level < options.tocData.currentLevel) {
				out.s += '</ul\n</li>\n';
				options.tocData.currentLevel--;
			}
			out.s += '<li>\n';
		} else {
			out.s += '</li>\n<li>\n';
		}

		out.s += '<a href="#toc_' + options.tocData.headerCount++ + '">';
		if (text) escape_html(out, text.s, false);
		out.s += '</a>\n';
	}

//toc_link(struct buf *ob, const struct buf *link, const struct buf *title, const struct buf *content, void *opaque)
	function cb_toc_link(out, link, title, content, options) {
		if (content && content.s) 
			out.s += content.s;
		return 1;
	}

//toc_finalize(struct buf *ob, void *opaque)
	function cb_toc_finalize(out, options) {
		while (options.tocData.currentLevel > 0) {
			out.s += '</li>\n</ul>\n';
			options.tocData.currentLevel--;
		}
	}

/* header and footer */
// doc_header(Buffer out}, context);
//		doc_header: null,
//	doc_footer(Buffer out, context);
//		doc_footer: null


	/* char_emphasis � single and double emphasis parsing */
	//Buffer, md, str, int
	function char_emphasis(out, md, data_, offset) {
		var data = data_.slice(offset);
		var size = data.length;
		var c = data[0];
		var ret;

		if (size > 2 && data[1] != c) {
			/* whitespace cannot follow an opening emphasis;
			 * strikethrough only takes two characters '~~' */
			if (c == '~' || _isspace(data[1]) || (ret = parse_emph1(out, md, data, c)) == 0)
				return 0;

			return ret + 1;
		}

		if (data.length > 3 && data[1] == c && data[2] != c) {
			if (_isspace(data[2]) || (ret = parse_emph2(out, md, data, c)) == 0)
				return 0;

			return ret + 2;
		}

		if (data.length > 4 && data[1] == c && data[2] == c && data[3] != c) {
			if (c == '~' || _isspace(data[3]) || (ret = parse_emph3(out, md, data, c)) == 0)
				return 0;

			return ret + 3;
		}

		return 0;
	}

	/* char_codespan - '`' parsing a code span (assuming codespan != 0) */
	function char_codespan(out, md, data_, offset) {
		var data = data_.slice(offset);
		var end, nb = 0, i, f_begin, f_end;

		/* counting the number of backticks in the delimiter */
		while (nb < data.length && data[nb] == '`')
			nb++;

		/* finding the next delimiter */
		i = 0;
		for (end = nb; end < data.length && i < nb; end++) {
			if (data[end] == '`') i++;
			else i = 0;
		}

		if (i < nb && end >= data.length)
			return 0; /* no matching delimiter */

		/* trimming outside whitespaces */
		f_begin = nb;
		while (f_begin < end && data[f_begin] == ' ') f_begin++;

		f_end = end - nb;
		while (f_end > nb && data[f_end-1] == ' ') f_end--;

		/* real code span */
		if (f_begin < f_end) {
			var work = new Buffer(data.slice(f_begin, f_end));
			if (!md.callbacks.codespan(out, work, md.context))
				end = 0;
		} else {
			if (!md.callbacks.codespan(out, null, md.context))
				end = 0;
		}

		return end;
	}

	/* char_linebreak - '\n' preceded by two spaces (assuming linebreak != 0) */
	function char_linebreak(out, md, data_, offset) {
		var data = data_.slice(offset);
		if (offset < 2 || data_[offset-1] != ' ' || data_[offset-2] != ' ')
			return 0;

		/* removing the last space from ob and rendering */
		out.s = out.s.trimRight();

		return md.callbacks.linebreak(out, md.context) ? 1 : 0;
	}

	/* char_link - '[': parsing a link or an image */
	function char_link(out, md, data_, offset) {
		var data = data_.slice(offset);
		var is_img = (offset && data[offset - 1] == '!'), level;
		var i = 1, txt_e, link_b = 0, link_e = 0, title_b = 0, title_e = 0;
		//4 bufs
		var content = null;
		var link = null;
		var title = null;
		var u_link = null;
		var org_work_size = md.spanStack.length;
		var text_has_nl = 0, ret = 0;
		var in_title = 0, qtype = 0;

		function cleanup() {
			md.spanStack.length = org_work_size;
			return ret ? i : 0;
		}

		/* checking whether the correct renderer exists */
		if ((is_img && !md.callbacks.image) || (!is_img && !md.callbacks.link))
			return cleanup();

		/* looking for the matching closing bracket */
		for (level = 1; i < data.length; i++) {
			if (data[i] == '\n') text_has_nl = 1;
			else if (data[i - 1] == '\\') continue;
			else if (data[i] == '[') level++;
			else if (data[i] == ']') {
				level--;
				if (level <= 0) break;
			}
		}

		if (i >= data.length) return cleanup();

		txt_e = i;
		i++;

		/* skip any amount of whitespace or newline */
		/* (this is much more laxist than original markdown syntax) */
		while (i < data.length && _isspace(data[i])) i++;

		/* inline style link */
		if (i < data.length && data[i] == '(') {
			/* skipping initial whitespace */
			i++;

			while (i < data.length && _isspace(data[i])) i++;

			link_b = i;

			/* looking for link end: ' " ) */
			while (i < data.length) {
				if (data[i] == '\\') i += 2;
				else if (data[i] == ')') break;
				else if (i >= 1 && _isspace(data[i-1]) && (data[i] == '\'' || data[i] == '"')) break;
				else i++;
			}

			if (i >= data.length) return cleanup();
			link_e = i;

			/* looking for title end if present */
			if (data[i] == '\'' || data[i] == '"') {
				qtype = data[i];
				in_title = 1;
				i++;
				title_b = i;

				while (i < data.length) {
					if (data[i] == '\\') i += 2;
					else if (data[i] == qtype) {in_title = 0; i++;}
					else if ((data[i] == ')') && !in_title) break;
					else i++;
				}

				if (i >= data.length) return cleanup();

				/* skipping whitespaces after title */
				title_e = i - 1;
				while (title_e > title_b && _isspace(data[title_e])) title_e--;

				/* checking for closing quote presence */
				if (data[title_e] != '\'' &&  data[title_e] != '"') {
					title_b = title_e = 0;
					link_e = i;
				}
			}

			/* remove whitespace at the end of the link */
			while (link_e > link_b && _isspace(data[link_e - 1])) link_e--;

			/* remove optional angle brackets around the link */
			if (data[link_b] == '<') link_b++;
			if (data[link_e - 1] == '>') link_e--;

			/* building escaped link and title */
			if (link_e > link_b) {
				link = new Buffer();
				md.spanStack.push(link);
				link.s += data.slice(link_b, link_e);
			}

			if (title_e > title_b) {
				title = new Buffer();
				md.spanStack.push(title);
				title.s += data.slice(title_b, title_e);
			}

			i++;
		}

		/* reference style link */
		else if (i < data.length && data[i] == '[') {
			var id = new Buffer();
			var lr = null;

			/* looking for the id */
			i++;
			link_b = i;
			while (i < data.length && data[i] != ']') i++;
			if (i >= data.length) return cleanup();
			link_e = i;

			/* finding the link_ref */
			if (link_b == link_e) {
				if (text_has_nl) {
					var b = new Buffer();
					md.spanStack.push(b);
					var j;

					for (j = 1; j < txt_e; j++) {
						if (data[j] != '\n')
							b.s += data[j];
						else if (data[j - 1] != ' ')
							b.s += ' ';
					}

					id.s = b.s;
				} else {
					id.s = data.slice(1);
				}
			} else {
				id.s = data.slice(link_b, link_e);
			}

			//TODO
			lr = md.refs[id.s];
			if (!lr) return cleanup();

			/* keeping link and title from link_ref */
			link = lr.link;
			title = lr.title;
			i++;
		}

		/* shortcut reference style link */
		else {
			var id = new Buffer();
			var lr = null;

			/* crafting the id */
			if (text_has_nl) {
				var b = new Buffer();
				md.spanStack.push(b);

				var j;
				for (j = 1; j < txt_e; j++) {
					if (data[j] != '\n') b.s += data[j];
					else if (data[j - 1] != ' ') b.s += ' ';
				}

				id.s = b.s;
			} else {
				id.s = data.slice(1, txt_e);
			}

			/* finding the link_ref */
			lr = md.refs[id.s];
			if (!lr) return cleanup();

			/* keeping link and title from link_ref */
			link = lr.link;
			title = lr.title;

			/* rewinding the whitespace */
			i = txt_e + 1;
		}

		/* building content: img alt is escaped, link content is parsed */
		if (txt_e > 1) {
			content = new Buffer();
			md.spanStack.push(content);
			if (is_img) {
				content.s += data.slice(1, txt_e);
			} else {
				/* disable autolinking when parsing inline the
				 * content of a link */
				md.inLinkBody = 1;
				parse_inline(content, md, data.slice(1, txt_e));
				md.inLinkBody = 0;
			}
		}

		if (link) {
			u_link = new Buffer();
			md.spanStack.push(u_link);
			unscape_text(u_link, link);
		} else {
			return cleanup();
		}

		/* calling the relevant rendering function */
		if (is_img) {
			if (out.s.length && out.s[out.s.length - 1] == '!')
				out.s = out.s.slice(0, -1);

			ret = md.callbacks.image(out, u_link, title, content, md.context);
		} else {
			ret = md.callbacks.link(out, u_link, title, content, md.context);
		}

		/* cleanup */
//		cleanup:
//			rndr->work_bufs[BUFFER_SPAN].size = (int)org_work_size;
//		return ret ? i : 0;
		return cleanup();
	}


	/* char_langle_tag - '<' when tags or autolinks are allowed */
	function char_langle_tag(out, md, data_, offset) {
		var data = data_.slice(offset);
		var altype = {p:MKDA_NOT_AUTOLINK};
		var end = tag_length(data, altype);
		var work = new Buffer(data.slice(0, end));
		var ret = 0;

		if (end > 2) {
			if (md.callbacks.autolink && altype.p != MKDA_NOT_AUTOLINK) {
				var u_link = new Buffer();
				md.spanStack.push(u_link);
				work.s = data.slice(1 , end - 2);
				unscape_text(u_link, work);
				ret = md.callbacks.autolink(out, u_link, altype.p, md.context);
				md.spanStack.pop();
			}
			else if (md.callbacks.raw_html_tag)
				ret = md.callbacks.raw_html_tag(out, work, md.context);
		}

		if (!ret) return 0;
		else return end;
	}


	/* char_escape - '\\' backslash escape */
	function char_escape(out, md, data_, offset) {
		var data = data_.slice(offset);
		var escape_chars = "\\`*_{}[]()#+-.!:|&<>/^~";
		var work = new Buffer();

		if (data.length > 1) {
			if (escape_chars.indexOf(data[1]) == -1) return 0;

			if (md.callbacks.normal_text) {
				work.s = data[1];
				md.callbacks.normal_text(out, work, md.context);
			}
			else out.s += data[1];
		} else if (data.length == 1) {
			out.s += data[0];
		}

		return 2;
	}



	/* char_entity - '&' escaped when it doesn't belong to an entity */
	/* valid entities are assumed to be anything matching &#?[A-Za-z0-9]+; */
	function char_entity(out, md, data_, offset) {
		var data = data_.slice(offset);
		var end = 1;
		var work = new Buffer();

		if (end < data.length && data[end] == '#') end++;

		while (end < data.length && isalnum(data[end])) end++;

		if (end < data.length && data[end] == ';') end++; /* real entity */
		else return 0; /* lone '&' */

		if (md.callbacks.entity) {
			work.s = data.slice(0, end);
			md.callbacks.entity(out, work, md.context);
		}
		else out.s += data.slice(0, end);

		return end;
	}

	function char_autolink_url(out, md, data_, offset) {
		var data = data_.slice(offset);
		var link = null;
		var link_len, rewind = {p: null};

		if (!md.callbacks.autolink || md.inLinkBody) return 0;

		link = new Buffer();
		md.spanStack.push(link);

		if ((link_len = sd_autolink__url(rewind, link, data_, offset, data.length, 0)) > 0) {
			if (rewind.p > 0) out.s = out.s.slice(0, -rewind.p);
			md.callbacks.autolink(out, link, MKDA_NORMAL, md.context);
		}

		md.spanStack.pop();
		return link_len;
	}


	function char_autolink_email(out, md, data_, offset) {
		var data = data_.slice(offset);
		var link = null;
		var link_len, rewind = {p: null};

		if (!md.callbacks.autolink || md.inLinkBody) return 0;

		link = new Buffer();
		md.spanStack.push(link);

		if ((link_len = sd_autolink__email(rewind, link, data_, offset, data.length, 0)) > 0) {
			if (rewind.p > 0) out.s = out.s.slice(0, -rewind.p);
			md.callbacks.autolink(out, link, MKDA_EMAIL, md.context);
		}

		md.spanStack.pop();
		return link_len;
	}


	function char_autolink_www(out, md, data_, offset) {
		var data = data_.slice(offset);
		var link = null, link_url = null, link_text = null;
		var link_len, rewind = {p: null};

		if (!md.callbacks.link || md.inLinkBody) return 0;

		link = new Buffer();
		md.spanStack.push(link);

		if ((link_len = sd_autolink__www(rewind, link, data_, offset, data.length, 0)) > 0) {
			link_url = new Buffer();
			md.spanStack.push(link_url);
			link_url.s += 'http://';
			link_url.s += link.s;

			if (rewind.p > 0) out.s = out.s.slice(0, out.s.length-rewind.p);
			if (md.callbacks.normal_text) {
				link_text = new Buffer();
				md.spanStack.push(link_text);
				md.callbacks.normal_text(link_text, link, md.context);
				md.callbacks.link(out, link_url, null, link_text, md.context);
				md.spanStack.pop();
			} else {
				md.callbacks.link(out, link_url, null, link, md.context);
			}
			md.spanStack.pop();
		}

		md.spanStack.pop();
		return link_len;
	}

	function char_autolink_subreddit_or_username(out, md, data_, offset) {
		var data = data_.slice(offset);
		var link = null;
		var link_len, rewind = {p: null};

		if (!md.callbacks.autolink || md.inLinkBody) return 0;

		link = new Buffer();
		md.spanStack.push(link);
		if ((link_len = sd_autolink__subreddit(rewind, link, data_, offset, data.length)) > 0) {
			//don't slice because the rewind pointer will always be 0
			if (rewind.p > 0) out.s = out.s.slice(0, -rewind.p);
			md.callbacks.autolink(out, link, MKDA_NORMAL, md.context);
		} else if ((link_len = sd_autolink__username(rewind, link, data_, offset, data.length)) > 0) {
			//don't slice because the rewind pointer will always be 0
			if (rewind.p > 0) out.s = out.s.slice(0, -rewind.p);
			md.callbacks.autolink(out, link, MKDA_NORMAL, md.context);
		}
		md.spanStack.pop();

		return link_len;
	}


	function char_superscript(out, md, data_, offset) {
		var data = data_.slice(offset);
		var size = data.length;
		var sup_start, sup_len;
		var sup = null;

		if (!md.callbacks.superscript) return 0;

		if (size < 2) return 0;

		if (data[1] == '(') {
			sup_start = sup_len = 2;

			while (sup_len < size && data[sup_len] != ')' && data[sup_len - 1] != '\\') sup_len++;

			if (sup_len == size) return 0;
		} else {
			sup_start = sup_len = 1;

			while (sup_len < size && !_isspace(data[sup_len])) sup_len++;
		}

		if (sup_len - sup_start == 0) return (sup_start == 2) ? 3 : 0;

		sup = new Buffer();
		md.spanStack.push(sup);
		parse_inline(sup, md, data.slice(sup_start, sup_len));
		md.callbacks.superscript(out, sup, md.context);
		md.spanStack.pop();

		return (sup_start == 2) ? sup_len + 1 : sup_len;
	}


	var  markdown_char_ptrs = [
		null,
		char_emphasis,
		char_codespan,
		char_linebreak,
		char_link,
		char_langle_tag,
		char_escape,
		char_entity,
		char_autolink_url,
		char_autolink_email,
		char_autolink_www,
		char_autolink_subreddit_or_username,
		char_superscript
	];

	var MKD_LIST_ORDERED = 1;
	var MKD_LI_BLOCK = 2; /* <li> containing block data */
	var MKD_LI_END = 8; /* internal list flag */

	var enumCounter = 0;
	var MD_CHAR_NONE = enumCounter++;
	var MD_CHAR_EMPHASIS = enumCounter++;
	var MD_CHAR_CODESPAN = enumCounter++;
	var MD_CHAR_LINEBREAK = enumCounter++;
	var MD_CHAR_LINK = enumCounter++;
	var MD_CHAR_LANGLE = enumCounter++;
	var MD_CHAR_ESCAPE = enumCounter++;
	var MD_CHAR_ENTITITY = enumCounter++;
	var MD_CHAR_AUTOLINK_URL = enumCounter++;
	var MD_CHAR_AUTOLINK_EMAIL = enumCounter++;
	var MD_CHAR_AUTOLINK_WWW = enumCounter++;
	var MD_CHAR_AUTOLINK_SUBREDDIT_OR_USERNAME = enumCounter++;
	var MD_CHAR_SUPERSCRIPT = enumCounter++;

	var SD_AUTOLINK_SHORT_DOMAINS = (1 << 0);

	enumCounter = 0;
	var MKDA_NOT_AUTOLINK = enumCounter++;	/* used internally when it is not an autolink*/
	var MKDA_NORMAL = enumCounter++;		/* normal http/http/ftp/mailto/etc link */
	var MKDA_EMAIL = enumCounter++;			/* e-mail link without explit mailto: */

	var MKDEXT_NO_INTRA_EMPHASIS = (1 << 0);
	var MKDEXT_TABLES = (1 << 1);
	var MKDEXT_FENCED_CODE = (1 << 2);
	var MKDEXT_AUTOLINK = (1 << 3);
	var MKDEXT_STRIKETHROUGH = (1 << 4);
//	var MKDEXT_LAX_HTML_BLOCKS = (1 << 5);
	var MKDEXT_SPACE_HEADERS = (1 << 6);
	var MKDEXT_SUPERSCRIPT = (1 << 7);
	var MKDEXT_LAX_SPACING = (1 << 8)

	var HTML_SKIP_HTML = (1 << 0);
	var HTML_SKIP_STYLE = (1 << 1);
	var HTML_SKIP_IMAGES = (1 << 2);
	var HTML_SKIP_LINKS = (1 << 3);
	var HTML_EXPAND_TABS = (1 << 4);
	var HTML_SAFELINK = (1 << 5);
	var HTML_TOC = (1 << 6);
	var HTML_HARD_WRAP = (1 << 7);
	var HTML_USE_XHTML = (1 << 8);
	var HTML_ESCAPE = (1 << 9);

	var MKD_TABLE_ALIGN_L = 1;
	var MKD_TABLE_ALIGN_R = 2;
	var MKD_TABLE_ALIGN_CENTER = 3;
	var MKD_TABLE_ALIGNMASK = 3;
	var MKD_TABLE_HEADER = 4


	/**
	 * A string buffer wrapper because JavaScript doesn't have mutable strings.
	 * @constructor
	 * @param {string=} str Optional string to initialize the Buffer with.
	 */
	function Buffer(str) {
		this.s = str || "";
	};
//	Buffer.prototype.toString = function toString() {
//		return this.s;
//	};
//	Buffer.prototype.slice 


	/**
	 * A Markdown parser object.
	 * @constructor
	 */
	function Markdown() {

		//Becase javascript strings are immutable they must be wrapped with Buffer()
		this.spanStack = [];
		this.blockStack = [];
		this.extensions = MKDEXT_NO_INTRA_EMPHASIS | MKDEXT_SUPERSCRIPT | MKDEXT_AUTOLINK | MKDEXT_STRIKETHROUGH | MKDEXT_TABLES;
		var renderer = getRedditRenderer();
		this.context = renderer.context;
		this.inLinkBody = 0;
		this.activeChars = {};
		this.refs = {};
	};
	Markdown.prototype.callbacks =  getRedditCallbacks();
	Markdown.prototype.nestingLimit = 16;


	/* is_empty - returns the line length when it is empty, 0 otherwise */
	function is_empty(data) {
		var i;
		for (i = 0; i < data.length && data[i] != '\n'; i++)
			if (data[i] != ' ') return 0;

		return i + 1;
	}


	/* is_hrule - returns whether a line is a horizontal rule */
	function is_hrule(data) {
		var i = 0, n = 0;
		var c;

		/* skipping initial spaces */
		if (data.length < 3) return 0;
		if (data[0] == ' ') { i++;
		if (data[1] == ' ') { i++;
		if (data[2] == ' ') { i++; } } }

		/* looking at the hrule uint8_t */
		if (i + 2 >= data.length
				|| (data[i] != '*' && data[i] != '-' && data[i] != '_'))
			return 0;
		c = data[i];

		/* the whole line must be the char or whitespace */
		while (i < data.length && data[i] != '\n') {
			if (data[i] == c) n++;
			else if (data[i] != ' ')
				return 0;

			i++;
		}

		return n >= 3;
	}


	/* check if a line begins with a code fence; return the
	 * width if it is */
	function prefix_codefence(data) {
		var i = 0, n = 0;
		var c;

		/* skipping initial spaces */
		if (data.length < 3) return 0;
		if (data[0] == ' ') { i++;
		if (data[1] == ' ') { i++;
		if (data[2] == ' ') { i++; } } }

		/* looking at the hrule uint8_t */
		if (i + 2 >= data.length || !(data[i] == '~' || data[i] == '`'))
			return 0;

		c = data[i];

		/* the whole line must be the uint8_t or whitespace */
		while (i < data.length && data[i] == c) {
			n++; i++;
		}

		if (n < 3) return 0;

		return i;
	}

	/* check if a line is a code fence; return its size if it */
	function is_codefence(data, syntax) {
		var i = 0, syn_len = 0;
		i = prefix_codefence(data);
		if (i == 0) return 0;


		while (i < data.length && data[i] == ' ') i++;

		var syn_start;
		//syn_start = data + i;
		syn_start = i;

		if (i < data.length && data[i] == '{') {
			i++; syn_start++;

			while (i < data.length && data[i] != '}' && data[i] != '\n') {
				syn_len++; i++;
			}

			if (i == data.length || data[i] != '}')
				return 0;

			/* strip all whitespace at the beginning and the end
			 * of the {} block */
			/*remember not to remove the +0, it helps me keep syncronised with snudown*/
			while (syn > 0 && _isspace(data[syn_cursor+0])) {
				syn_start++; syn_len--;
			}

//			while (syn_len > 0 && _isspace(syn_start[syn_len - 1]))
			while (syn_len > 0 && _isspace(data[syn_start+syn_len - 1]))
				syn_len--;

			i++;
		} else {
			while (i < data.length && !_isspace(data[i])) {
				syn_len++; i++;
			}
		}

		if (syntax) syntax.s = data.substr(syn_start, syn_len);
//		syntax->size = syn;

		while (i < data.length && data[i] != '\n') {
			if (!_isspace(data[i])) return 0;

			i++;
		}

		return i + 1;
	}

	/* find_emph_char - looks for the next emph uint8_t, skipping other constructs */
	function find_emph_char(data, c) {
		var i = 1;
		while (i < data.length) {
			while (i < data.length && data[i] != c && data[i] != '`' && data[i] != '[')
				i++;

			if (i == data.length) return 0;
			if (data[i] == c) return i;

			/* not counting escaped chars */
			if (i && data[i - 1] == '\\') {
				i++; continue;
			}

			if (data[i] == '`') {
				var span_nb = 0, bt;
				var tmp_i = 0;

				/* counting the number of opening backticks */
				while (i < data.length && data[i] == '`') {
					i++; span_nb++;
				}

				if (i >= data.length) return 0;

				/* finding the matching closing sequence */
				bt = 0;
				while (i < data.length && bt < span_nb) {
					if (!tmp_i && data[i] == c) tmp_i = i;
					if (data[i] == '`') bt++;
					else bt = 0;
					i++;
				}

				if (i >= data.length) return tmp_i;
			}
			/* skipping a link */
			else if (data[i] == '[') {
				var tmp_i = 0;
				var cc;

				i++;
				while (i < data.length && data[i] != ']') {
					if (!tmp_i && data[i] == c) tmp_i = i;
					i++;
				}

				i++;
				while (i < data.length && (data[i] == ' ' || data[i] == '\n'))
					i++;

				if (i >= data.length) return tmp_i;

				switch (data[i]) {
				case '[':
					cc = ']'; break;

				case '(':
					cc = ')'; break;

				default:
					if (tmp_i)
						return tmp_i;
					else
						continue;
				}

				i++;
				while (i < data.length && data[i] != cc) {
					if (!tmp_i && data[i] == c) tmp_i = i;
					i++;
				}

				if (i >= data.length) return tmp_i;
				i++;
			}
		}

		return 0;
	}

	/* parse_emph1 - parsing single emphase */
	/* closed by a symbol not preceded by whitespace and not followed by symbol */
	function parse_emph1(out, md, data_, c) {
		var data = data_.slice(1);
		var i = 0, len;
		var r;

		if (!md.callbacks.emphasis) return 0;

		/* skipping one symbol if coming from emph3 */
		if (data.length > 1 && data[0] == c && data[1] == c) i = 1;

		while (i < data.length) {
			len = find_emph_char(data.slice(i), c);
			if (!len) return 0;
			i += len;
			if (i >= data.length) return 0;

			if (data[i] == c && !_isspace(data[i - 1])) {
				if ((md.extensions & MKDEXT_NO_INTRA_EMPHASIS) && (c == '_')) {
					if (!(i + 1 == data.length || _isspace(data[i + 1]) || ispunct(data[i + 1])))
						continue;
				}

				var work = new Buffer();
				md.spanStack.push(work);
				parse_inline(work, md, data.slice(0, i));
				r = md.callbacks.emphasis(out, work, md.context);
				md.spanStack.pop();
				return r ? i + 1 : 0;
			}
		}

		return 0;
	}

	/* parse_emph2 - parsing single emphase */
	function parse_emph2(out, md, data_, c) {
		var data = data_.slice(2);
		var i = 0, len;
		var r;

		var render_method = (c == '~') ? md.callbacks.strikethrough : md.callbacks.double_emphasis;

		if (!render_method) return 0;

		while (i < data.length) {
			len = find_emph_char(data.slice(i), c);
			if (!len) return 0;
			i += len;

			if (i + 1 < data.length && data[i] == c && data[i + 1] == c && i && !_isspace(data[i - 1])) {
				var work = new Buffer();
				md.spanStack.push(work);
				parse_inline(work, md, data.slice(0, i));
				r = render_method(out, work, md.context);
				md.spanStack.pop();
				return r ? i + 2 : 0;
			}
			i++;
		}
		return 0;
	}

	/* parse_emph3 � parsing single emphase */
	/* finds the first closing tag, and delegates to the other emph */
	function parse_emph3(out, md, data_, c) {
		var data = data_.slice(3);
		var i = 0, len;
		var r;

		while (i < data.length) {
			len = find_emph_char(data.slice(i), c);
			if (!len) return 0;
			i += len;

			/* skip whitespace preceded symbols */
			if (data[i] != c || _isspace(data[i - 1])) continue;

			if (i + 2 < data.length && data[i + 1] == c && data[i + 2] == c && md.callbacks.triple_emphasis) {
				/* triple symbol found */
				var work = new Buffer();
				md.spanStack.push(work);
				parse_inline(work, md, data.slice(0, i));
				r = md.callbacks.triple_emphasis(out, work, md.context);
				md.spanStack.pop();
				return r ? i + 3 : 0;

			} else if (i + 1 < data.length && data[i + 1] == c) {
				/* double symbol found, handing over to emph1 */
				len = parse_emph1(out, md, data_.slice(1), c);
				if (!len) return 0;
				else return len - 2;

			} else {
				/* single symbol found, handing over to emph2 */
				len = parse_emph2(out, md, data.slice(2), c);
				if (!len) return 0;
				else return len - 1;
			}
		}
		return 0;
	}

	function is_atxheader(md, data) {
		if (data[0] != '#') return false;

		if (md.extensions & MKDEXT_SPACE_HEADERS) {
			var level = 0;

			while (level < data.length && level < 6 && data[level] == '#')
				level++;

			if (level < data.length && data[level] != ' ')
				return false;
		}

		return true;
	}


	/* is_headerline . returns whether the line is a setext-style hdr underline */
	function is_headerline(data) {
		var i = 0;
		var size = data.length;

		/* test of level 1 header */
		if (data[i] == '=') {
			for (i = 1; i < size && data[i] == '='; i++) {}
			while (i < size && data[i] == ' ') i++;
			return (i >= size || data[i] == '\n') ? 1 : 0; }

		/* test of level 2 header */
		if (data[i] == '-') {
			for (i = 1; i < size && data[i] == '-'; i++) {}
			while (i < size && data[i] == ' ') i++;
			return (i >= size || data[i] == '\n') ? 2 : 0; }

		return 0;
	}

	function is_next_headerline(data) {
		var size = data.length;
		var i = 0;

		while (i < size && data[i] != '\n') i++;

		if (++i >= size) return 0;

		return is_headerline(data.slice(i));
	}

	/* prefix_quote - returns blockquote prefix length */
	function prefix_quote(data) {
		var i = 0;
		var size = data.length;
		if (i < size && data[i] == ' ') i++;
		if (i < size && data[i] == ' ') i++;
		if (i < size && data[i] == ' ') i++;

		if (i < size && data[i] == '>') {
			if (i + 1 < size && data[i + 1] == ' ')
				return i + 2;

			return i + 1;
		}

		return 0;
	}

	/* prefix_code � returns prefix length for block code*/
	function prefix_code(data) {
		if (data.length > 3 && data[0] == ' ' && data[1] == ' '
				&& data[2] == ' ' && data[3] == ' ') return 4;

		return 0;
	}


	/* prefix_oli - returns ordered list item prefix */
	function prefix_oli(data) {
		var size = data.length;
		var i = 0;

		if (i < size && data[i] == ' ') i++;
		if (i < size && data[i] == ' ') i++;
		if (i < size && data[i] == ' ') i++;

		if (i >= size || data[i] < '0' || data[i] > '9') return 0;

		while (i < size && data[i] >= '0' && data[i] <= '9') i++;

		if (i + 1 >= size || data[i] != '.' || data[i + 1] != ' ') return 0;

		if (is_next_headerline(data.slice(i))) return 0;

		return i + 2;
	}

	/* prefix_uli - returns ordered list item prefix */
	function prefix_uli(data) {
		var size = data.length;
		var i = 0;

		if (i < size && data[i] == ' ') i++;
		if (i < size && data[i] == ' ') i++;
		if (i < size && data[i] == ' ') i++;

		if (i + 1 >= size ||
				(data[i] != '*' && data[i] != '+' && data[i] != '-') ||
				data[i + 1] != ' ')
			return 0;

		if (is_next_headerline(data.slice(i))) return 0;

		return i + 2;
	}

	/* is_mail_autolink - looks for the address part of a mail autolink and '>' */
	/* this is less strict than the original markdown e-mail address matching */
	function is_mail_autolink(data) {
		var i = 0, nb = 0;

		/* address is assumed to be: [-@._a-zA-Z0-9]+ with exactly one '@' */
		for (i = 0; i < data.length; ++i) {
			if (isalnum(data[i]))
				continue;

			switch (data[i]) {
				case '@':
					nb++;

				case '-':
				case '.':
				case '_':
					break;

				case '>':
					return (nb == 1) ? i + 1 : 0;

				default:
					return 0;
			}
		}

		return 0;
	}

	/* tag_length - returns the length of the given tag, or 0 is it's not valid */
	function tag_length(data, autolink) {
		var i, j;

		/* a valid tag can't be shorter than 3 chars */
		if (data.length < 3) return 0;

		/* begins with a '<' optionally followed by '/', followed by letter or number */
		if (data[0] != '<') return 0;
		i = (data[1] == '/') ? 2 : 1;

		if (!isalnum(data[i])) return 0;

		/* scheme test */
		autolink.p = MKDA_NOT_AUTOLINK;

		/* try to find the beginning of an URI */
		while (i < data.length && (isalnum(data[i]) || data[i] == '.' || data[i] == '+' || data[i] == '-')) i++;

		if (i > 1 && data[i] == '@') {
			if ((j = is_mail_autolink(data.slice(i))) != 0) {
				autolink.p = MKDA_EMAIL;
				return i + j;
			}
		}

		if (i > 2 && data[i] == ':') {
			autolink.p = MKDA_NORMAL;
			i++;
		}

		/* completing autolink test: no whitespace or ' or " */
		if (i >= data.length) autolink.p = MKDA_NOT_AUTOLINK;
		else if (autolink.p) {
			j = i;

			while (i < data.length) {
				if (data[i] == '\\') i += 2;
				else if (data[i] == '>' || data[i] == '\'' ||
						data[i] == '"' || data[i] == ' ' || data[i] == '\n')
					break;
				else i++;
			}

			if (i >= data.length) return 0;
			if (i > j && data[i] == '>') return i + 1;
			/* one of the forbidden chars has been found */
			autolink.p = MKDA_NOT_AUTOLINK;
		}

		/* looking for sometinhg looking like a tag end */
		while (i < data.length && data[i] != '>') i++;
		if (i >= data.length) return 0;
		return i + 1;
	}

	// parse_inline - parses inline markdown elements 
	//Buffer, md, String
	function parse_inline(out, md, data) {
		var i = 0, end = 0;
		var action = 0;
		var work = new Buffer();

		if (md.spanStack.length + md.blockStack.length > md.nestingLimit)
			return;

		while (i < data.length) {
			/* copying inactive chars into the output */
			while (end < data.length && !(action = md.activeChars[data[end]])) {
				end++;
			}

			if (md.callbacks.normal_text) {
				work.s = data.slice(i, end);
				md.callbacks.normal_text(out, work, md.context);
			}
			else
				out.s += data.slice(i, end);

			if (end >= data.length) break;
			i = end;

			end = markdown_char_ptrs[action](out, md, data, i);
			if (!end) /* no action from the callback */
				end = i + 1;
			else {
				i += end;
				end = i;
			}
		}
	}

	/* parse_atxheader - parsing of atx-style headers */
	function parse_atxheader(out, md, data) {
		var level = 0;
		var i, end, skip;

		while (level < data.length && level < 6 && data[level] == '#') level++;

		for (i = level; i < data.length && data[i] == ' '; i++) {}

		for (end = i; end < data.length && data[end] != '\n'; end++) {}
		skip = end;

		while (end && data[end - 1] == '#') end--;

		while (end && data[end - 1] == ' ') end--;

		if (end > i) {
			var work = new Buffer();
			md.spanStack.push(work);

			parse_inline(work, md, data.slice(i, end));

			if (md.callbacks.header)
				md.callbacks.header(out, work, level, md.context);

			md.spanStack.pop();
		}

		return skip;
	}


	/* htmlblock_end - checking end of HTML block : </tag>[ \t]*\n[ \t*]\n */
	/*	returns the length on match, 0 otherwise */
//	htmlblock_end(const char *tag, size_t tag_len, struct sd_markdown *rndr, uint8_t *data, size_t size)
	function htmlblock_end(tag, md, data) {
		var i, w;

		/* checking if tag is a match */
		//tag should already be lowercase
		if (tag.length + 3 >= data.length ||
				data.slice(2).toLowerCase() != tag ||
				data[tag.length + 2] != '>')
			return 0;

		/* checking white lines */
		i = tag.length + 3;
		w = 0;
		if (i < data.length && (w = is_empty(data.slice(i))) == 0)
			return 0; /* non-blank after tag */
		i += w;
		w = 0;

		if (i < data.length) w = is_empty(data.slice(i));

		return i + w;
	}

	/* parse_htmlblock - parsing of inline HTML block */
	//TODO
	function parse_htmlblock(out, md, data, do_render) {
		var i, j = 0;
		var curtag = null;
		var found;
		var work = new Buffer(data);

		/* identification of the opening tag */
		if (data.length < 2 || data[0] != '<') return 0;

		i = 1;
		while (i < data.length && data[i] != '>' && data[i] != ' ') i++;

		if (i < data.length) curtag = find_block_tag(data.slice(1));

		/* handling of special cases */
		if (!curtag) {

			/* HTML comment, laxist form */
			if (data.length > 5 && data[1] == '!' && data[2] == '-' && data[3] == '-') {
				i = 5;

				while (i < data.length && !(data[i - 2] == '-' && data[i - 1] == '-' && data[i] == '>')) i++;

				i++;

				if (i < size)
					j = is_empty(data.slice(i));

				if (j) {
					//TODO: HANDLE WORK!!!
//					work.size = i + j;
					work.s = data.slice(0, i + j);
					if (do_render && md.callbacks.blockhtml)
						md.callbacks.blockhtml(out, work, md.context);
					return work.s.length;
				}
			}

			/* HR, which is the only self-closing block tag considered */
			if (data.length > 4 && (data[1] == 'h' || data[1] == 'H') && (data[2] == 'r' || data[2] == 'R')) {
				i = 3;
				while (i < data.length && data[i] != '>') i++;

				if (i + 1 < data.length) {
					i++;
					j = is_empty(data.slice(i));
					if (j) {
						work.s = data.slice(0, i + j);
						if (do_render && md.callbacks.blockhtml)
							md.callbacks.blockhtml(out, work, md.context);
						return work.s.length;
					}
				}
			}

			/* no special case recognised */
			return 0;
		}

		/* looking for an unindented matching closing tag */
		/*	followed by a blank line */
		i = 1;
		found = 0;

		/* if not found, trying a second pass looking for indented match */
		/* but not if tag is "ins" or "del" (following original Markdown.pl) */
		if (curtag != 'ins' && curtag != 'del') {
			var tag_size = curtag.length;
			i = 1;
			while (i < data.length) {
				i++;
				while (i < data.length && !(data[i - 1] == '<' && data[i] == '/'))
					i++;

				if (i + 2 + tag_size >= data.length)
					break;

//				j = htmlblock_end(tag, md, data + i - 1, size - i + 1);
				//TODO
				j = htmlblock_end(tag, md, data.slice(i - 1));

				if (j) {
					i += j - 1;
					found = 1;
					break;
				}
			}
		}

		if (!found) return 0;

		/* the end of the block has been found */
		//TODO:
		work.s = work.s.slice(0, i);
		if (do_render && md.callbacks.blockhtml)
			md.callbacks.blockhtml(out, work, md.context);

		return i;
	}


	/* parse_blockquote - handles parsing of a blockquote fragment */
	function parse_blockquote(out, md, data) {
		var size = data.length;
		var beg, end = 0, pre, work_size = 0;
//		uint8_t *work_data = 0;
		var work_data = "";
		var work_data_cursor = 0;

		var out_ = new Buffer();
		md.blockStack.push(out_);

		beg = 0;
		while (beg < size) {
			for (end = beg + 1; end < size && data[end - 1] != '\n'; end++) {}

			pre = prefix_quote(data.slice(beg, end));

			if (pre) beg += pre; /* skipping prefix */

			/* empty line followed by non-quote line */
			else if (is_empty(data.slice(beg, end)) &&
					(end >= size || (prefix_quote(data.slice(end)) == 0 &&
									 !is_empty(data.slice(end)))))
				break;

			if (beg < end) { /* copy into the in-place working buffer */
				/* bufput(work, data + beg, end - beg); */
				//TODO:!!! FIX THIS!!!
//				if (!work_data) work_data = data.slice(beg, end);
//					work_data = data + beg;
				work_data += data.slice(beg, end);
				/*
				if (!work_data) work_data_cursor = beg;
				else if (beg != work_data_cursor + work_size)
					work_data += data.slice(beg, end);
					*/
//					memmove(work_data + work_size, data + beg, end - beg);
				work_size += end - beg;
			}
			beg = end;
		}

		parse_block(out_, md, work_data);
		if (md.callbacks.blockquote)
			md.callbacks.blockquote(out, out_, md.context);
		md.blockStack.pop();
		return end;
	}

	/* parse_paragraph - handles parsing of a regular paragraph */
	function parse_paragraph(out, md, data) {
		var i = 0, end = 0;
		var level = 0;
		var size = data.length;
		var work = new Buffer(data);

		while (i < size) {
			for (end = i + 1; end < size && data[end - 1] != '\n'; end++) {/* empty */}

			if (prefix_quote(data.slice(i, end)) != 0) {
				end = i;
				break;
			}

			var tempdata = data.slice(i);
			if (is_empty(tempdata) || (level = is_headerline(tempdata)) != 0) break;
			if (is_empty(tempdata)) break;
			if ((level = is_headerline(tempdata)) != 0) break;

			if (is_atxheader(md, tempdata)
				|| is_hrule(tempdata)
				|| prefix_quote(tempdata)) {
					end = i;
					break;
				}

			/*
			 * Early termination of a paragraph with the same logic
			 * as markdown 1.0.0. If this logic is applied, the
			 * Markdown 1.0.3 test suite wont pass cleanly.
			 *
			 * :: If the first character in a new line is not a letter
			 * lets check to see if there's some kind of block starting here
			 */
			if ((md.extensions & MKDEXT_LAX_SPACING) && !isalnum(data[i])) {
				if (prefix_oli(tempdata)
				|| prefix_uli(tempdata)) {
					end = i;
					break;
				}
				/* see if an html block starts here */
				if (data[i] == '<' && md.callbacks.blockhtml
						&& parse_htmlblock(out, md, tempdata, 0)) {
					end = i;
					break
				}

				/* see if a code fence starts here */
				if ((md.extensions && MKDEXT_FENCED_CODE) != 0
						&& is_codefence(tempdata, null) != 0) {
					end = i;
					break;
				}
			}

			i = end;
		}

		var work_size = i;
		while (work_size && data[work_size - 1] == '\n') work_size--;
		work.s = work.s.slice(0, work_size);

		if (!level) {
			var tmp = new Buffer();
			md.blockStack.push(tmp);
			parse_inline(tmp, md, work.s);
			if (md.callbacks.paragraph)
				md.callbacks.paragraph(out, tmp, md.context);
			md.blockStack.pop();
		} else {
			var header_work = null;

			if (work.size) {
				var beg;
				i = work.s.length;
//				var work_size = work.s.length - 1;
//				work.size -= 1;

				while (work_size && data[work_size] != '\n')
					work_size -= 1;

				beg = work_size + 1;
				while (work_size && data[work_size - 1] == '\n')
					work_size -= 1;

				work.s = work.s.slice(0, work_size);
				if (work_size > 0) {
					var tmp = new Buffer();
					md.blockStack.push(tmp);
					parse_inline(tmp, md, work.s);

					if (md.callbacks.paragraph)
						md.callbacks.paragraph(out, tmp, md.context);

					md.blockStack.pop();
					work.s = work.s.slice(beg, i);
				}
				else work.s = work.s.slice(0, i);
			}

			header_work = new Buffer();
			md.spanStack.push(header_work);
			parse_inline(header_work, md, work.s);

			if (md.callbacks.header)
				md.callbacks.header(out, header_work, level, md.context);

			md.spanStack.pop();
		}

		return end;

	}

	/* parse_fencedcode - handles parsing of a block-level code fragment */
	function parse_fencedcode(out, md, data) {
		var beg, end;
		var work = null;
		var lang = new Buffer();

		beg = is_codefence(data, lang);
		if (beg == 0) return 0;

		work = new Buffer();
		md.blockStack.push(work);

		while (beg < data.length) {
			var fence_end;
			var fence_trail = new Buffer();

			fence_end = is_codefence(data.slice(beg), fence_trail);
			if (fence_end != 0 && fence_trail.s.length == 0) {
				beg += fence_end;
				break;
			}

			for (end = beg + 1; end < data.length && data[end - 1] != '\n'; end++) {}

			if (beg < end) {
				/* verbatim copy to the working buffer,
				   escaping entities */
				var tempData = data.slice(beg, end);
				if (is_empty(tempData)) work.s += '\n';
				else work.s += tempData;
			}
			beg = end;
		}

		if (work.s.length && work.s[work.s.length - 1] != '\n')
			work.s += '\n';

		if (md.callbacks.blockcode)
			md.callbacks.blockcode(out, work, lang.s.length ? lang : null, md.context);

		md.blockStack.pop();
		return beg;
	}

	function parse_blockcode(out, md, data) {
		var size = data.length;
		var beg, end, pre;

		var work = null;
		md.blockStack.push(work = new Buffer());

		beg = 0;
		while (beg < size) {
			for (end = beg + 1; end < size && data[end - 1] != '\n'; end++) {};
			pre = prefix_code(data.slice(beg, end));

			if (pre) beg += pre; /* skipping prefix */
			else if (!is_empty(data.slice(beg, end)))
				/* non-empty non-prefixed line breaks the pre */
				break;

			if (beg < end) {
				/* verbatim copy to the working buffer,
				   escaping entities */
				if (is_empty(data.slice(beg, end))) work.s += '\n';
				else work.s += data.slice(beg, end);
			}
			beg = end;
		}

		var work_size = work.s.length;
		while (work_size && work.s[work_size - 1] == '\n') work_size -= 1;
		work.s = work.s.slice(0, work_size);

		work.s += '\n';

		if (md.callbacks.blockcode)
			md.callbacks.blockcode(out, work, null, md.context);

		md.blockStack.pop();
		return beg;
	}

	/* parse_listitem - parsing of a single list item */
	/*	assuming initial prefix is already removed */
	//FLAGS is pointer
	function parse_listitem(out, md, data, flags) {
		var size = data.length;
		var work = null, inter = null;
		var beg = 0, end, pre, sublist = 0, orgpre = 0, i;
		var in_empty = 0, has_inside_empty = 0, in_fence = 0;

		/* keeping track of the first indentation prefix */
		while (orgpre < 3 && orgpre < size && data[orgpre] == ' ')
			orgpre++;

		//TODO
		beg = prefix_uli(data);
		if (!beg) beg = prefix_oli(data);

		if (!beg) return 0;

		/* skipping to the beginning of the following line */
		end = beg;
		while (end < size && data[end - 1] != '\n') end++;

		/* getting working buffers */
		md.spanStack.push(work = new Buffer());
		md.spanStack.push(inter = new Buffer());

		/* putting the first line into the working buffer */
		work.s += data.slice(beg, end);
		beg = end;

		/* process the following lines */
		while (beg < size) {
			var has_next_uli, has_next_oli;
			end++;

			while (end < size && data[end - 1] != '\n') end++;

			/* process an empty line */
			if (is_empty(data.slice(beg, end))) {
				in_empty = 1;
				beg = end;
				continue;
			}

			/* calculating the indentation */
			i = 0;
			while (i < 4 && beg + i < end && data[beg + i] == ' ') i++;

			pre = i;

			//TODO: Cache this slice?
			if (md.flags & MKDEXT_FENCED_CODE) {
				if (is_codefence(data.slice(beg+i, end), null) != 0) {
					in_fence = !in_fence;
				}
			}

			/* only check for new list items if we are **not** in a fenced code block */
			if (!in_fence) {
				has_next_uli = prefix_uli(data.slice(beg+i, end));
				has_next_oli = prefix_oli(data.slice(beg+i, end));
			}

			/* checking for ul/ol switch */
			if (in_empty && (
						((flags.p & MKD_LIST_ORDERED) && has_next_uli) ||
						(!(flags.p & MKD_LIST_ORDERED) && has_next_oli))){
							flags.p |= MKD_LI_END;
							break; /* the following item must have same list type */
						}

			/* checking for a new item */
			if ((has_next_uli && !is_hrule(data.slice(beg+i, end))) || has_next_oli) {
				if (in_empty) has_inside_empty = 1;

				if (pre == orgpre) /* the following item must have */
					break;             /* the same indentation */

				if (!sublist) sublist = work.s.length;
			}
			/* joining only indented stuff after empty lines;
			 * note that now we only require 1 space of indentation
			 * to continue list */
			else if (in_empty && pre == 0) {
				flags.p |= MKD_LI_END;
				break;
			}
			else if (in_empty) {
				work.s += '\n';
				has_inside_empty = 1;
			}

			in_empty = 0;

			/* adding the line without prefix into the working buffer */
			work.s += data.slice(beg + i, end);
			beg = end;
		}

		/* render of li contents */
		if (has_inside_empty) flags.p |= MKD_LI_BLOCK;

		if (flags.p & MKD_LI_BLOCK) {
			/* intermediate render of block li */
			if (sublist && sublist < work.s.length) {
				parse_block(inter, md, work.s.slice(0, sublist));
				parse_block(inter, md, work.s.slice(sublist));
			}
			else
				parse_block(inter, md, work.s);
		} else {
				//TODO:
			/* intermediate render of inline li */
			if (sublist && sublist < work.s.length) {
				parse_inline(inter, md, work.s.slice(0, sublist));
				parse_block(inter, md, work.s.slice(sublist));
			}
			else
				parse_inline(inter, md, work.s);
		}

		/* render of li itself */
		if (md.callbacks.listitem)
			md.callbacks.listitem(out, inter, flags.p, md.context);

		md.spanStack.pop();
		md.spanStack.pop();
		return beg;
	}


	/* parse_list - parsing ordered or unordered list block */
	function parse_list(out, md, data, flags) {
		var size = data.length;
		var i = 0, j;

		var work = null;
		md.blockStack.push(work = new Buffer());

		while (i < size) {
			var flag_p = {p: flags};
			j = parse_listitem(work, md, data.slice(i), flag_p);
			flags = flag_p.p;
			i += j;

			if (!j || (flags & MKD_LI_END)) break;
		}

		if (md.callbacks.list)
			md.callbacks.list(out, work, flags, md.context);
		md.blockStack.pop();
		return i;
	}

	function parse_table_row(out, md, data, columns, header_flag) {
		var i = 0, col;
		var row_work = null;

		if (!md.callbacks.table_cell || !md.callbacks.table_row) return;

		md.spanStack.push(row_work = new Buffer());

		if (i < data.length && data[i] == '|') i++;

		for (col = 0; col < columns.length && i < data.length; ++col) {
			var cell_start, cell_end;
			var cell_work;

			md.spanStack.push(cell_work = new Buffer());

			while (i < data.length && _isspace(data[i])) i++;

			cell_start = i;

			while (i < data.length && data[i] != '|') i++;

			cell_end = i - 1;

			while (cell_end > cell_start && _isspace(data[cell_end])) cell_end--;

//			parse_inline(cell_work, rndr, data + cell_start, 1 + cell_end - cell_start);
			parse_inline(cell_work, md, data.slice(cell_start, 1 + cell_end));
			md.callbacks.table_cell(row_work, cell_work, columns[col] | header_flag, md.context);

			md.spanStack.pop();
			i++;
		}

		for (; col < columns.length; ++col) {
			var empty_cell = null;
			md.callbacks.table_cell(row_work, empty_cell, columns[col] | header_flag, md.context);
		}

		md.callbacks.table_row(out, row_work, md.context);

		md.spanStack.pop();
	}

	function parse_table_header(out, md, data, columns) { 
		var i = 0, col, header_end, under_end;

		var pipes = 0;
		while (i < data.length && data[i] != '\n')
			if (data[i++] == '|') pipes++;

		if (i == data.length || pipes == 0)
			return 0;

		header_end = i;

		while (header_end > 0 && _isspace(data[header_end - 1])) header_end--;

		if (data[0] == '|') pipes--;

		if (header_end && data[header_end - 1] == '|') pipes--;

		//	columns.p = pipes + 1;
		//	column_data.p = new Array(columns.p);
		columns.p = new Array(pipes + 1);
		for (var k = 0; k <	columns.p.length; k++) columns.p[k] = 0;

		/* Parse the header underline */
		i++;
		if (i < data.length && data[i] == '|') i++;

		under_end = i;
		while (under_end < data.length && data[under_end] != '\n') under_end++;

		for (col = 0; col < columns.p.length && i < under_end; ++col) {
			var dashes = 0;

			while (i < under_end && data[i] == ' ') i++;

			if (data[i] == ':') {
				i++;
				columns.p[col] |= MKD_TABLE_ALIGN_L;
				dashes++;
			}

			while (i < under_end && data[i] == '-') {
				i++; dashes++;
			}

			if (i < under_end && data[i] == ':') {
				i++; columns.p[col] |= MKD_TABLE_ALIGN_R;
				dashes++;
			}

			while (i < under_end && data[i] == ' ') i++;

			if (i < under_end && data[i] != '|') break;

			if (dashes < 1) break;

			i++;
		}

		if (col < columns.p.length) return 0;

		parse_table_row(out, md, data.slice(0, header_end), columns.p, MKD_TABLE_HEADER);

		return under_end + 1;
	}

	function parse_table(out, md, data) {
		var i;
		var header_work, body_work;

		var columns = {p: null};

		md.spanStack.push(header_work = new Buffer());
		md.blockStack.push(body_work = new Buffer());

		i = parse_table_header(header_work, md, data, columns);
		if (i > 0) {

		while (i < data.length) {
			var row_start;
			var pipes = 0;

			row_start = i;

			while (i < data.length && data[i] != '\n')
				if (data[i++] == '|')
					pipes++;

			if (pipes == 0 || i == data.length) {
				i = row_start;
				break;
			}

			parse_table_row(body_work, md, data.slice(row_start, i), columns.p, 0);

			i++;
		}

		if (md.callbacks.table)
			md.callbacks.table(out, header_work, body_work, md.context);
		}

		md.spanStack.pop();
		md.blockStack.pop();
		return i;
	}


	function parse_block(out, md, data) {
		var beg = 0, end, i;
		var textData;

		if (md.spanStack.length +
				md.blockStack.length > md.nestingLimit)
			return;

		while (beg < data.length) {
			textData = data.slice(beg);
			end = data.length - beg;

			if (is_atxheader(md, textData))
				beg += parse_atxheader(out, md, textData);

			else if (data[beg] == '<' && md.callbacks.blockhtml &&
					(i = parse_htmlblock(out, md, textData, 1)) != 0)
				beg += i;
			else if ((i = is_empty(textData)) != 0)
				beg += i;
			else if (is_hrule(textData)) {
				if (md.callbacks.hrule)
					md.callbacks.hrule(out, md.context);

				while (beg < data.length && data[beg] != '\n') beg++;

				beg++;
			}

			else if ((md.extensions & MKDEXT_FENCED_CODE) != 0 &&
					(i = parse_fencedcode(out, md, textData)) != 0)
				beg += i;

			else if ((md.extensions & MKDEXT_TABLES) != 0 &&
					(i = parse_table(out, md, textData)) != 0)
				beg += i;

			else if (prefix_quote(textData))
				beg += parse_blockquote(out, md, textData);

			else if (prefix_code(textData))
				beg += parse_blockcode(out, md, textData);

			else if (prefix_uli(textData))
				beg += parse_list(out, md, textData, 0);

			else if (prefix_oli(textData))
				beg += parse_list(out, md, textData, MKD_LIST_ORDERED);

			else {
				beg += parse_paragraph(out, md, textData);
			}
		}
	}

	function is_ref(data, beg, end, md) {
		/*	int n; */
		var i = 0;
		var idOffset, idEnd;
		var linkOffset, linkEnd;
		var titleOffset, titleEnd;
		var lineEnd;

		/* up to 3 optional leading spaces */
		if (beg + 3 >= end) return 0;
		if (data[beg] == ' ') { i = 1;
		if (data[beg + 1] == ' ') { i = 2;
		if (data[beg + 2] == ' ') { i = 3;
		if (data[beg + 3] == ' ') return 0; } } }
		i += beg;

		/* id part: anything but a newline between brackets */
		if (data[i] != '[') return 0;
		i++;
		idOffset = i;
		while (i < end && data[i] != '\n' && data[i] != '\r' && data[i] != ']') i++;
		if (i >= end || data[i] != ']') return 0;
		idEnd = i;

		/* spacer: colon (space | tab)* newline? (space | tab)* */
		i++;
		if (i >= end || data[i] != ':') return 0;
		i++;
		while (i < end && data[i] == ' ') i++;
		if (i < end && (data[i] == '\n' || data[i] == '\r')) {
			i++;
			if (i < end && data[i] == '\r' && data[i - 1] == '\n') i++; }
		while (i < end && data[i] == ' ') i++;
		if (i >= end) return 0;

		/* link: whitespace-free sequence, optionally between angle brackets */
		if (data[i] == '<') i++;

		linkOffset = i;
		while (i < end && data[i] != ' ' && data[i] != '\n' && data[i] != '\r') i++;

		if (data[i - 1] == '>') linkEnd = i - 1; else linkEnd = i;

		/* optional spacer: (space | tab)* (newline | '\'' | '"' | '(' ) */
		while (i < end && data[i] == ' ') i++;
		if (i < end && data[i] != '\n' && data[i] != '\r'
				&& data[i] != '\'' && data[i] != '"' && data[i] != '(')
			return 0;
		lineEnd = 0;
		/* computing end-of-line */
		if (i >= end || data[i] == '\r' || data[i] == '\n') lineEnd = i;
		if (i + 1 < end && data[i] == '\n' && data[i + 1] == '\r')
			lineEnd = i + 1;

		/* optional (space|tab)* spacer after a newline */
		if (lineEnd) {
			i = lineEnd + 1;
			while (i < end && data[i] == ' ') i++;
		}

		/* optional title: any non-newline sequence enclosed in '"()
		   alone on its line */
		titleOffset = titleEnd = 0;
		if (i + 1 < end && (data[i] == '\'' || data[i] == '"' || data[i] == '(')) {
			i++;
			titleOffset = i;
			/* looking for EOL */
			while (i < end && data[i] != '\n' && data[i] != '\r') i++;
			if (i + 1 < end && data[i] == '\n' && data[i + 1] == '\r')
				titleEnd = i + 1;
			else titleEnd = i;
			/* stepping back */
			i -= 1;
			while (i > titleOffset && data[i] == ' ')
				i -= 1;
			if (i > titleOffset && (data[i] == '\'' || data[i] == '"' || data[i] == ')')) {
				lineEnd = titleEnd;
				titleEnd = i;
			}
		}

		if (!lineEnd || linkEnd == linkOffset)
			return 0; /* garbage after the link empty link */

		var id = data.slice(idOffset, idEnd);
		var link = data.slice(linkOffset, linkEnd);
		var title = null;
		if (titleEnd > titleOffset) title = data.slice(titleOffset, titleEnd);
		md.refs[id] = {
			id: id,
			link: new Buffer(link),
			title: new Buffer(title)
		};
		return lineEnd;
	}

	function expand_tabs(out, line) {
		var  i = 0, tab = 0;

		while (i < line.length) {
			var org = i;

			while (i < line.length && line[i] != '\t') {
				i++; tab++;
			}

			if (i > org) out.s += line.slice(org, i);

			if (i >= line.length) break;

			do {
				out.s += ' ';
				tab++;
			} while (tab % 4);

			i++;
		}
	}

	/**
	Render markdown code to HTML.

	@param {string} source Markdown code.
	@returns {string} HTML code.
	*/
	function render(source) {
		var text = new Buffer();
		var beg = 0, end;
		this.refs = {};

		while (beg < source.length) { /* iterating over lines */
			if (end = is_ref(source, beg, source.length, this))
				beg = end;
			else { /* skipping to the next line */
				end = beg;
				while (end < source.length && source[end] != '\n' && source[end] != '\r') end++;

				/* adding the line body if present */
				if (end > beg) expand_tabs(text, source.slice(beg, end));

				while (end < source.length && (source[end] == '\n' || source[end] == '\r')) {
					/* add one \n per newline */
					if (source[end] == '\n' || (end + 1 < source.length && source[end + 1] != '\n'))
						text.s += '\n';
					end++;
				}

				beg = end;
			}
		}
	
		var out = new Buffer();

		/* second pass: actual rendering */
		if (this.callbacks.doc_header)
			this.callbacks.doc_header(out, this.context);

		if (text.s.length) {
			/* adding a final newline if not already present */
			if (text.s[text.s.length - 1] != '\n' &&  text.s[text.s.length - 1] != '\r')
				text.s += '\n';
			parse_block(out, this, text.s);
		}

		if (this.callbacks.doc_footer)
			this.callbacks.doc_footer(out, this.context);

		return out.s;
	}
	Markdown.prototype['render'] = render;

	/**
	Create a parser object using the given configuration parameters.

	To get a Reddit equivelent configuration, pass no arguments.

	@param {?Renderer=} renderer A renderer object.
	@param {?Number=} extensions A series of OR'd extension flags. (Extension flags start with MKDEXT_)
	@param {?Number=} nestingLimit The maximum depth to which inline elements can be nested.
	@return {Markdown} A configured markdown object.
	*/
	exports.getParser = function getParser(renderer, extensions, nestingLimit) {
		var md = new Markdown();
		if (renderer) md.callbacks = renderer.callbacks;
		if (nestingLimit) md.nestingLimit = nestingLimit;
		if (renderer) md.context = context;
		if (extensions != undefined && extensions != null) md.extensions = extensions;

		var cb = md.callbacks;
		if (cb.emphasis || cb.double_emphasis || cb.triple_emphasis) {
			md.activeChars['*'] = MD_CHAR_EMPHASIS;
			md.activeChars['_'] = MD_CHAR_EMPHASIS;
			if (md.extensions & MKDEXT_STRIKETHROUGH) md.activeChars['~'] = MD_CHAR_EMPHASIS;
		}

		if (cb.codespan) md.activeChars['`'] = MD_CHAR_CODESPAN;
		if (cb.linebreak) md.activeChars['\n'] = MD_CHAR_LINEBREAK;
		if (cb.image || cb.link) md.activeChars['['] = MD_CHAR_LINK;

		md.activeChars['<'] = MD_CHAR_LANGLE;
		md.activeChars['\\'] = MD_CHAR_ESCAPE;
		md.activeChars['&'] = MD_CHAR_ENTITITY;

		if (md.extensions & MKDEXT_AUTOLINK) {
			md.activeChars[':'] = MD_CHAR_AUTOLINK_URL;
			md.activeChars['@'] = MD_CHAR_AUTOLINK_EMAIL;
			md.activeChars['w'] = MD_CHAR_AUTOLINK_WWW;
			md.activeChars['/'] = MD_CHAR_AUTOLINK_SUBREDDIT_OR_USERNAME;
		}
		if (md.extensions & MKDEXT_SUPERSCRIPT) md.activeChars['^'] = MD_CHAR_SUPERSCRIPT;

		return md;
	}


	exports.HTML_SKIP_HTML = HTML_SKIP_HTML;
	exports.HTML_SKIP_STYLE = HTML_SKIP_STYLE;
	exports.HTML_SKIP_IMAGES = HTML_SKIP_IMAGES;
	exports.HTML_SKIP_LINKS = HTML_SKIP_LINKS;
	exports.HTML_EXPAND_TABS = HTML_EXPAND_TABS;
	exports.HTML_SAFELINK = HTML_SAFELINK;
	exports.HTML_TOC = HTML_TOC;
	exports.HTML_HARD_WRAP = HTML_HARD_WRAP;
	exports.HTML_USE_XHTML = HTML_USE_XHTML;
	exports.HTML_ESCAPE = HTML_ESCAPE;
	exports.MKDEXT_NO_INTRA_EMPHASIS = MKDEXT_NO_INTRA_EMPHASIS;
	exports.MKDEXT_TABLES = MKDEXT_TABLES;
	exports.MKDEXT_FENCED_CODE = MKDEXT_FENCED_CODE;
	exports.MKDEXT_AUTOLINK = MKDEXT_AUTOLINK;
	exports.MKDEXT_STRIKETHROUGH = MKDEXT_STRIKETHROUGH;
	exports.MKDEXT_SPACE_HEADERS = MKDEXT_SPACE_HEADERS;
	exports.MKDEXT_SUPERSCRIPT = MKDEXT_SUPERSCRIPT;
	exports.MKDEXT_LAX_SPACING = MKDEXT_LAX_SPACING;

	exports['SD_AUTOLINK_SHORT_DOMAINS'] = SD_AUTOLINK_SHORT_DOMAINS;

	exports.MKDA_NOT_AUTOLINK = MKDA_NOT_AUTOLINK;
	exports.MKDA_NORMAL = MKDA_NORMAL;
	exports.MKDA_EMAIL = MKDA_EMAIL;
})(typeof(exports)!='undefined'?exports:SnuOwnd);
/*! Javascript plotting library for jQuery, v. 0.7.
 *
 * Released under the MIT license by IOLA, December 2007.
 *
 */

// first an inline dependency, jquery.colorhelpers.js, we inline it here
// for convenience

/* Plugin for jQuery for working with colors.
 * 
 * Version 1.1.
 * 
 * Inspiration from jQuery color animation plugin by John Resig.
 *
 * Released under the MIT license by Ole Laursen, October 2009.
 *
 * Examples:
 *
 *   $.color.parse("#fff").scale('rgb', 0.25).add('a', -0.5).toString()
 *   var c = $.color.extract($("#mydiv"), 'background-color');
 *   console.log(c.r, c.g, c.b, c.a);
 *   $.color.make(100, 50, 25, 0.4).toString() // returns "rgba(100,50,25,0.4)"
 *
 * Note that .scale() and .add() return the same modified object
 * instead of making a new one.
 *
 * V. 1.1: Fix error handling so e.g. parsing an empty string does
 * produce a color rather than just crashing.
 */ 
(function(B){B.color={};B.color.make=function(F,E,C,D){var G={};G.r=F||0;G.g=E||0;G.b=C||0;G.a=D!=null?D:1;G.add=function(J,I){for(var H=0;H<J.length;++H){G[J.charAt(H)]+=I}return G.normalize()};G.scale=function(J,I){for(var H=0;H<J.length;++H){G[J.charAt(H)]*=I}return G.normalize()};G.toString=function(){if(G.a>=1){return"rgb("+[G.r,G.g,G.b].join(",")+")"}else{return"rgba("+[G.r,G.g,G.b,G.a].join(",")+")"}};G.normalize=function(){function H(J,K,I){return K<J?J:(K>I?I:K)}G.r=H(0,parseInt(G.r),255);G.g=H(0,parseInt(G.g),255);G.b=H(0,parseInt(G.b),255);G.a=H(0,G.a,1);return G};G.clone=function(){return B.color.make(G.r,G.b,G.g,G.a)};return G.normalize()};B.color.extract=function(D,C){var E;do{E=D.css(C).toLowerCase();if(E!=""&&E!="transparent"){break}D=D.parent()}while(!B.nodeName(D.get(0),"body"));if(E=="rgba(0, 0, 0, 0)"){E="transparent"}return B.color.parse(E)};B.color.parse=function(F){var E,C=B.color.make;if(E=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(F)){return C(parseInt(E[1],10),parseInt(E[2],10),parseInt(E[3],10))}if(E=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(F)){return C(parseInt(E[1],10),parseInt(E[2],10),parseInt(E[3],10),parseFloat(E[4]))}if(E=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(F)){return C(parseFloat(E[1])*2.55,parseFloat(E[2])*2.55,parseFloat(E[3])*2.55)}if(E=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(F)){return C(parseFloat(E[1])*2.55,parseFloat(E[2])*2.55,parseFloat(E[3])*2.55,parseFloat(E[4]))}if(E=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(F)){return C(parseInt(E[1],16),parseInt(E[2],16),parseInt(E[3],16))}if(E=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(F)){return C(parseInt(E[1]+E[1],16),parseInt(E[2]+E[2],16),parseInt(E[3]+E[3],16))}var D=B.trim(F).toLowerCase();if(D=="transparent"){return C(255,255,255,0)}else{E=A[D]||[0,0,0];return C(E[0],E[1],E[2])}};var A={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);

// the actual Flot code
(function($) {
    function Plot(placeholder, data_, options_, plugins) {
        // data is on the form:
        //   [ series1, series2 ... ]
        // where series is either just the data as [ [x1, y1], [x2, y2], ... ]
        // or { data: [ [x1, y1], [x2, y2], ... ], label: "some label", ... }
        
        var series = [],
            options = {
                // the color theme used for graphs
                colors: ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"],
                legend: {
                    show: true,
                    noColumns: 1, // number of colums in legend table
                    labelFormatter: null, // fn: string -> string
                    labelBoxBorderColor: "#ccc", // border color for the little label boxes
                    container: null, // container (as jQuery object) to put legend in, null means default on top of graph
                    position: "ne", // position of default legend container within plot
                    margin: 5, // distance from grid edge to default legend container within plot
                    backgroundColor: null, // null means auto-detect
                    backgroundOpacity: 0.85 // set to 0 to avoid background
                },
                xaxis: {
                    show: null, // null = auto-detect, true = always, false = never
                    position: "bottom", // or "top"
                    mode: null, // null or "time"
                    color: null, // base color, labels, ticks
                    tickColor: null, // possibly different color of ticks, e.g. "rgba(0,0,0,0.15)"
                    transform: null, // null or f: number -> number to transform axis
                    inverseTransform: null, // if transform is set, this should be the inverse function
                    min: null, // min. value to show, null means set automatically
                    max: null, // max. value to show, null means set automatically
                    autoscaleMargin: null, // margin in % to add if auto-setting min/max
                    ticks: null, // either [1, 3] or [[1, "a"], 3] or (fn: axis info -> ticks) or app. number of ticks for auto-ticks
                    tickFormatter: null, // fn: number -> string
                    labelWidth: null, // size of tick labels in pixels
                    labelHeight: null,
                    reserveSpace: null, // whether to reserve space even if axis isn't shown
                    tickLength: null, // size in pixels of ticks, or "full" for whole line
                    alignTicksWithAxis: null, // axis number or null for no sync
                    
                    // mode specific options
                    tickDecimals: null, // no. of decimals, null means auto
                    tickSize: null, // number or [number, "unit"]
                    minTickSize: null, // number or [number, "unit"]
                    monthNames: null, // list of names of months
                    timeformat: null, // format string to use
                    twelveHourClock: false // 12 or 24 time in time mode
                },
                yaxis: {
                    autoscaleMargin: 0.02,
                    position: "left" // or "right"
                },
                xaxes: [],
                yaxes: [],
                series: {
                    points: {
                        show: false,
                        radius: 3,
                        lineWidth: 2, // in pixels
                        fill: true,
                        fillColor: "#ffffff",
                        symbol: "circle" // or callback
                    },
                    lines: {
                        // we don't put in show: false so we can see
                        // whether lines were actively disabled 
                        lineWidth: 2, // in pixels
                        fill: false,
                        fillColor: null,
                        steps: false
                    },
                    bars: {
                        show: false,
                        lineWidth: 2, // in pixels
                        barWidth: 1, // in units of the x axis
                        fill: true,
                        fillColor: null,
                        align: "left", // or "center" 
                        horizontal: false
                    },
                    shadowSize: 3
                },
                grid: {
                    show: true,
                    aboveData: false,
                    color: "#545454", // primary color used for outline and labels
                    backgroundColor: null, // null for transparent, else color
                    borderColor: null, // set if different from the grid color
                    tickColor: null, // color for the ticks, e.g. "rgba(0,0,0,0.15)"
                    labelMargin: 5, // in pixels
                    axisMargin: 8, // in pixels
                    borderWidth: 2, // in pixels
                    minBorderMargin: null, // in pixels, null means taken from points radius
                    markings: null, // array of ranges or fn: axes -> array of ranges
                    markingsColor: "#f4f4f4",
                    markingsLineWidth: 2,
                    // interactive stuff
                    clickable: false,
                    hoverable: false,
                    autoHighlight: true, // highlight in case mouse is near
                    mouseActiveRadius: 10 // how far the mouse can be away to activate an item
                },
                hooks: {}
            },
        canvas = null,      // the canvas for the plot itself
        overlay = null,     // canvas for interactive stuff on top of plot
        eventHolder = null, // jQuery object that events should be bound to
        ctx = null, octx = null,
        xaxes = [], yaxes = [],
        plotOffset = { left: 0, right: 0, top: 0, bottom: 0},
        canvasWidth = 0, canvasHeight = 0,
        plotWidth = 0, plotHeight = 0,
        hooks = {
            processOptions: [],
            processRawData: [],
            processDatapoints: [],
            drawSeries: [],
            draw: [],
            bindEvents: [],
            drawOverlay: [],
            shutdown: []
        },
        plot = this;

        // public functions
        plot.setData = setData;
        plot.setupGrid = setupGrid;
        plot.draw = draw;
        plot.getPlaceholder = function() { return placeholder; };
        plot.getCanvas = function() { return canvas; };
        plot.getPlotOffset = function() { return plotOffset; };
        plot.width = function () { return plotWidth; };
        plot.height = function () { return plotHeight; };
        plot.offset = function () {
            var o = eventHolder.offset();
            o.left += plotOffset.left;
            o.top += plotOffset.top;
            return o;
        };
        plot.getData = function () { return series; };
        plot.getAxes = function () {
            var res = {}, i;
            $.each(xaxes.concat(yaxes), function (_, axis) {
                if (axis)
                    res[axis.direction + (axis.n != 1 ? axis.n : "") + "axis"] = axis;
            });
            return res;
        };
        plot.getXAxes = function () { return xaxes; };
        plot.getYAxes = function () { return yaxes; };
        plot.c2p = canvasToAxisCoords;
        plot.p2c = axisToCanvasCoords;
        plot.getOptions = function () { return options; };
        plot.highlight = highlight;
        plot.unhighlight = unhighlight;
        plot.triggerRedrawOverlay = triggerRedrawOverlay;
        plot.pointOffset = function(point) {
            return {
                left: parseInt(xaxes[axisNumber(point, "x") - 1].p2c(+point.x) + plotOffset.left),
                top: parseInt(yaxes[axisNumber(point, "y") - 1].p2c(+point.y) + plotOffset.top)
            };
        };
        plot.shutdown = shutdown;
        plot.resize = function () {
            getCanvasDimensions();
            resizeCanvas(canvas);
            resizeCanvas(overlay);
        };

        // public attributes
        plot.hooks = hooks;
        
        // initialize
        initPlugins(plot);
        parseOptions(options_);
        setupCanvases();
        setData(data_);
        setupGrid();
        draw();
        bindEvents();


        function executeHooks(hook, args) {
            args = [plot].concat(args);
            for (var i = 0; i < hook.length; ++i)
                hook[i].apply(this, args);
        }

        function initPlugins() {
            for (var i = 0; i < plugins.length; ++i) {
                var p = plugins[i];
                p.init(plot);
                if (p.options)
                    $.extend(true, options, p.options);
            }
        }
        
        function parseOptions(opts) {
            var i;
            
            $.extend(true, options, opts);
            
            if (options.xaxis.color == null)
                options.xaxis.color = options.grid.color;
            if (options.yaxis.color == null)
                options.yaxis.color = options.grid.color;
            
            if (options.xaxis.tickColor == null) // backwards-compatibility
                options.xaxis.tickColor = options.grid.tickColor;
            if (options.yaxis.tickColor == null) // backwards-compatibility
                options.yaxis.tickColor = options.grid.tickColor;

            if (options.grid.borderColor == null)
                options.grid.borderColor = options.grid.color;
            if (options.grid.tickColor == null)
                options.grid.tickColor = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            
            // fill in defaults in axes, copy at least always the
            // first as the rest of the code assumes it'll be there
            for (i = 0; i < Math.max(1, options.xaxes.length); ++i)
                options.xaxes[i] = $.extend(true, {}, options.xaxis, options.xaxes[i]);
            for (i = 0; i < Math.max(1, options.yaxes.length); ++i)
                options.yaxes[i] = $.extend(true, {}, options.yaxis, options.yaxes[i]);

            // backwards compatibility, to be removed in future
            if (options.xaxis.noTicks && options.xaxis.ticks == null)
                options.xaxis.ticks = options.xaxis.noTicks;
            if (options.yaxis.noTicks && options.yaxis.ticks == null)
                options.yaxis.ticks = options.yaxis.noTicks;
            if (options.x2axis) {
                options.xaxes[1] = $.extend(true, {}, options.xaxis, options.x2axis);
                options.xaxes[1].position = "top";
            }
            if (options.y2axis) {
                options.yaxes[1] = $.extend(true, {}, options.yaxis, options.y2axis);
                options.yaxes[1].position = "right";
            }
            if (options.grid.coloredAreas)
                options.grid.markings = options.grid.coloredAreas;
            if (options.grid.coloredAreasColor)
                options.grid.markingsColor = options.grid.coloredAreasColor;
            if (options.lines)
                $.extend(true, options.series.lines, options.lines);
            if (options.points)
                $.extend(true, options.series.points, options.points);
            if (options.bars)
                $.extend(true, options.series.bars, options.bars);
            if (options.shadowSize != null)
                options.series.shadowSize = options.shadowSize;

            // save options on axes for future reference
            for (i = 0; i < options.xaxes.length; ++i)
                getOrCreateAxis(xaxes, i + 1).options = options.xaxes[i];
            for (i = 0; i < options.yaxes.length; ++i)
                getOrCreateAxis(yaxes, i + 1).options = options.yaxes[i];

            // add hooks from options
            for (var n in hooks)
                if (options.hooks[n] && options.hooks[n].length)
                    hooks[n] = hooks[n].concat(options.hooks[n]);

            executeHooks(hooks.processOptions, [options]);
        }

        function setData(d) {
            series = parseData(d);
            fillInSeriesOptions();
            processData();
        }
        
        function parseData(d) {
            var res = [];
            for (var i = 0; i < d.length; ++i) {
                var s = $.extend(true, {}, options.series);

                if (d[i].data != null) {
                    s.data = d[i].data; // move the data instead of deep-copy
                    delete d[i].data;

                    $.extend(true, s, d[i]);

                    d[i].data = s.data;
                }
                else
                    s.data = d[i];
                res.push(s);
            }

            return res;
        }
        
        function axisNumber(obj, coord) {
            var a = obj[coord + "axis"];
            if (typeof a == "object") // if we got a real axis, extract number
                a = a.n;
            if (typeof a != "number")
                a = 1; // default to first axis
            return a;
        }

        function allAxes() {
            // return flat array without annoying null entries
            return $.grep(xaxes.concat(yaxes), function (a) { return a; });
        }
        
        function canvasToAxisCoords(pos) {
            // return an object with x/y corresponding to all used axes 
            var res = {}, i, axis;
            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used)
                    res["x" + axis.n] = axis.c2p(pos.left);
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used)
                    res["y" + axis.n] = axis.c2p(pos.top);
            }
            
            if (res.x1 !== undefined)
                res.x = res.x1;
            if (res.y1 !== undefined)
                res.y = res.y1;

            return res;
        }
        
        function axisToCanvasCoords(pos) {
            // get canvas coords from the first pair of x/y found in pos
            var res = {}, i, axis, key;

            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used) {
                    key = "x" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "x";

                    if (pos[key] != null) {
                        res.left = axis.p2c(pos[key]);
                        break;
                    }
                }
            }
            
            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used) {
                    key = "y" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "y";

                    if (pos[key] != null) {
                        res.top = axis.p2c(pos[key]);
                        break;
                    }
                }
            }
            
            return res;
        }
        
        function getOrCreateAxis(axes, number) {
            if (!axes[number - 1])
                axes[number - 1] = {
                    n: number, // save the number for future reference
                    direction: axes == xaxes ? "x" : "y",
                    options: $.extend(true, {}, axes == xaxes ? options.xaxis : options.yaxis)
                };
                
            return axes[number - 1];
        }

        function fillInSeriesOptions() {
            var i;
            
            // collect what we already got of colors
            var neededColors = series.length,
                usedColors = [],
                assignedColors = [];
            for (i = 0; i < series.length; ++i) {
                var sc = series[i].color;
                if (sc != null) {
                    --neededColors;
                    if (typeof sc == "number")
                        assignedColors.push(sc);
                    else
                        usedColors.push($.color.parse(series[i].color));
                }
            }
            
            // we might need to generate more colors if higher indices
            // are assigned
            for (i = 0; i < assignedColors.length; ++i) {
                neededColors = Math.max(neededColors, assignedColors[i] + 1);
            }

            // produce colors as needed
            var colors = [], variation = 0;
            i = 0;
            while (colors.length < neededColors) {
                var c;
                if (options.colors.length == i) // check degenerate case
                    c = $.color.make(100, 100, 100);
                else
                    c = $.color.parse(options.colors[i]);

                // vary color if needed
                var sign = variation % 2 == 1 ? -1 : 1;
                c.scale('rgb', 1 + sign * Math.ceil(variation / 2) * 0.2)

                // FIXME: if we're getting to close to something else,
                // we should probably skip this one
                colors.push(c);
                
                ++i;
                if (i >= options.colors.length) {
                    i = 0;
                    ++variation;
                }
            }

            // fill in the options
            var colori = 0, s;
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                
                // assign colors
                if (s.color == null) {
                    s.color = colors[colori].toString();
                    ++colori;
                }
                else if (typeof s.color == "number")
                    s.color = colors[s.color].toString();

                // turn on lines automatically in case nothing is set
                if (s.lines.show == null) {
                    var v, show = true;
                    for (v in s)
                        if (s[v] && s[v].show) {
                            show = false;
                            break;
                        }
                    if (show)
                        s.lines.show = true;
                }

                // setup axes
                s.xaxis = getOrCreateAxis(xaxes, axisNumber(s, "x"));
                s.yaxis = getOrCreateAxis(yaxes, axisNumber(s, "y"));
            }
        }
        
        function processData() {
            var topSentry = Number.POSITIVE_INFINITY,
                bottomSentry = Number.NEGATIVE_INFINITY,
                fakeInfinity = Number.MAX_VALUE,
                i, j, k, m, length,
                s, points, ps, x, y, axis, val, f, p;

            function updateAxis(axis, min, max) {
                if (min < axis.datamin && min != -fakeInfinity)
                    axis.datamin = min;
                if (max > axis.datamax && max != fakeInfinity)
                    axis.datamax = max;
            }

            $.each(allAxes(), function (_, axis) {
                // init axis
                axis.datamin = topSentry;
                axis.datamax = bottomSentry;
                axis.used = false;
            });
            
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                s.datapoints = { points: [] };
                
                executeHooks(hooks.processRawData, [ s, s.data, s.datapoints ]);
            }
            
            // first pass: clean and copy data
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                var data = s.data, format = s.datapoints.format;

                if (!format) {
                    format = [];
                    // find out how to copy
                    format.push({ x: true, number: true, required: true });
                    format.push({ y: true, number: true, required: true });

                    if (s.bars.show || (s.lines.show && s.lines.fill)) {
                        format.push({ y: true, number: true, required: false, defaultValue: 0 });
                        if (s.bars.horizontal) {
                            delete format[format.length - 1].y;
                            format[format.length - 1].x = true;
                        }
                    }
                    
                    s.datapoints.format = format;
                }

                if (s.datapoints.pointsize != null)
                    continue; // already filled in

                s.datapoints.pointsize = format.length;
                
                ps = s.datapoints.pointsize;
                points = s.datapoints.points;

                insertSteps = s.lines.show && s.lines.steps;
                s.xaxis.used = s.yaxis.used = true;
                
                for (j = k = 0; j < data.length; ++j, k += ps) {
                    p = data[j];

                    var nullify = p == null;
                    if (!nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = p[m];
                            f = format[m];

                            if (f) {
                                if (f.number && val != null) {
                                    val = +val; // convert to number
                                    if (isNaN(val))
                                        val = null;
                                    else if (val == Infinity)
                                        val = fakeInfinity;
                                    else if (val == -Infinity)
                                        val = -fakeInfinity;
                                }

                                if (val == null) {
                                    if (f.required)
                                        nullify = true;
                                    
                                    if (f.defaultValue != null)
                                        val = f.defaultValue;
                                }
                            }
                            
                            points[k + m] = val;
                        }
                    }
                    
                    if (nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = points[k + m];
                            if (val != null) {
                                f = format[m];
                                // extract min/max info
                                if (f.x)
                                    updateAxis(s.xaxis, val, val);
                                if (f.y)
                                    updateAxis(s.yaxis, val, val);
                            }
                            points[k + m] = null;
                        }
                    }
                    else {
                        // a little bit of line specific stuff that
                        // perhaps shouldn't be here, but lacking
                        // better means...
                        if (insertSteps && k > 0
                            && points[k - ps] != null
                            && points[k - ps] != points[k]
                            && points[k - ps + 1] != points[k + 1]) {
                            // copy the point to make room for a middle point
                            for (m = 0; m < ps; ++m)
                                points[k + ps + m] = points[k + m];

                            // middle point has same y
                            points[k + 1] = points[k - ps + 1];

                            // we've added a point, better reflect that
                            k += ps;
                        }
                    }
                }
            }

            // give the hooks a chance to run
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                
                executeHooks(hooks.processDatapoints, [ s, s.datapoints]);
            }

            // second pass: find datamax/datamin for auto-scaling
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                points = s.datapoints.points,
                ps = s.datapoints.pointsize;

                var xmin = topSentry, ymin = topSentry,
                    xmax = bottomSentry, ymax = bottomSentry;
                
                for (j = 0; j < points.length; j += ps) {
                    if (points[j] == null)
                        continue;

                    for (m = 0; m < ps; ++m) {
                        val = points[j + m];
                        f = format[m];
                        if (!f || val == fakeInfinity || val == -fakeInfinity)
                            continue;
                        
                        if (f.x) {
                            if (val < xmin)
                                xmin = val;
                            if (val > xmax)
                                xmax = val;
                        }
                        if (f.y) {
                            if (val < ymin)
                                ymin = val;
                            if (val > ymax)
                                ymax = val;
                        }
                    }
                }
                
                if (s.bars.show) {
                    // make sure we got room for the bar on the dancing floor
                    var delta = s.bars.align == "left" ? 0 : -s.bars.barWidth/2;
                    if (s.bars.horizontal) {
                        ymin += delta;
                        ymax += delta + s.bars.barWidth;
                    }
                    else {
                        xmin += delta;
                        xmax += delta + s.bars.barWidth;
                    }
                }
                
                updateAxis(s.xaxis, xmin, xmax);
                updateAxis(s.yaxis, ymin, ymax);
            }

            $.each(allAxes(), function (_, axis) {
                if (axis.datamin == topSentry)
                    axis.datamin = null;
                if (axis.datamax == bottomSentry)
                    axis.datamax = null;
            });
        }

        function makeCanvas(skipPositioning, cls) {
            var c = document.createElement('canvas');
            c.className = cls;
            c.width = canvasWidth;
            c.height = canvasHeight;
                    
            if (!skipPositioning)
                $(c).css({ position: 'absolute', left: 0, top: 0 });
                
            $(c).appendTo(placeholder);
                
            if (!c.getContext) // excanvas hack
                c = window.G_vmlCanvasManager.initElement(c);

            // used for resetting in case we get replotted
            c.getContext("2d").save();
            
            return c;
        }

        function getCanvasDimensions() {
            canvasWidth = placeholder.width();
            canvasHeight = placeholder.height();
            
            if (canvasWidth <= 0 || canvasHeight <= 0)
                throw "Invalid dimensions for plot, width = " + canvasWidth + ", height = " + canvasHeight;
        }

        function resizeCanvas(c) {
            // resizing should reset the state (excanvas seems to be
            // buggy though)
            if (c.width != canvasWidth)
                c.width = canvasWidth;

            if (c.height != canvasHeight)
                c.height = canvasHeight;

            // so try to get back to the initial state (even if it's
            // gone now, this should be safe according to the spec)
            var cctx = c.getContext("2d");
            cctx.restore();

            // and save again
            cctx.save();
        }
        
        function setupCanvases() {
            var reused,
                existingCanvas = placeholder.children("canvas.base"),
                existingOverlay = placeholder.children("canvas.overlay");

            if (existingCanvas.length == 0 || existingOverlay == 0) {
                // init everything
                
                placeholder.html(""); // make sure placeholder is clear
            
                placeholder.css({ padding: 0 }); // padding messes up the positioning
                
                if (placeholder.css("position") == 'static')
                    placeholder.css("position", "relative"); // for positioning labels and overlay

                getCanvasDimensions();
                
                canvas = makeCanvas(true, "base");
                overlay = makeCanvas(false, "overlay"); // overlay canvas for interactive features

                reused = false;
            }
            else {
                // reuse existing elements

                canvas = existingCanvas.get(0);
                overlay = existingOverlay.get(0);

                reused = true;
            }

            ctx = canvas.getContext("2d");
            octx = overlay.getContext("2d");

            // we include the canvas in the event holder too, because IE 7
            // sometimes has trouble with the stacking order
            eventHolder = $([overlay, canvas]);

            if (reused) {
                // run shutdown in the old plot object
                placeholder.data("plot").shutdown();

                // reset reused canvases
                plot.resize();
                
                // make sure overlay pixels are cleared (canvas is cleared when we redraw)
                octx.clearRect(0, 0, canvasWidth, canvasHeight);
                
                // then whack any remaining obvious garbage left
                eventHolder.unbind();
                placeholder.children().not([canvas, overlay]).remove();
            }

            // save in case we get replotted
            placeholder.data("plot", plot);
        }

        function bindEvents() {
            // bind events
            if (options.grid.hoverable) {
                eventHolder.mousemove(onMouseMove);
                eventHolder.mouseleave(onMouseLeave);
            }

            if (options.grid.clickable)
                eventHolder.click(onClick);

            executeHooks(hooks.bindEvents, [eventHolder]);
        }

        function shutdown() {
            if (redrawTimeout)
                clearTimeout(redrawTimeout);
            
            eventHolder.unbind("mousemove", onMouseMove);
            eventHolder.unbind("mouseleave", onMouseLeave);
            eventHolder.unbind("click", onClick);
            
            executeHooks(hooks.shutdown, [eventHolder]);
        }

        function setTransformationHelpers(axis) {
            // set helper functions on the axis, assumes plot area
            // has been computed already
            
            function identity(x) { return x; }
            
            var s, m, t = axis.options.transform || identity,
                it = axis.options.inverseTransform;
            
            // precompute how much the axis is scaling a point
            // in canvas space
            if (axis.direction == "x") {
                s = axis.scale = plotWidth / Math.abs(t(axis.max) - t(axis.min));
                m = Math.min(t(axis.max), t(axis.min));
            }
            else {
                s = axis.scale = plotHeight / Math.abs(t(axis.max) - t(axis.min));
                s = -s;
                m = Math.max(t(axis.max), t(axis.min));
            }

            // data point to canvas coordinate
            if (t == identity) // slight optimization
                axis.p2c = function (p) { return (p - m) * s; };
            else
                axis.p2c = function (p) { return (t(p) - m) * s; };
            // canvas coordinate to data point
            if (!it)
                axis.c2p = function (c) { return m + c / s; };
            else
                axis.c2p = function (c) { return it(m + c / s); };
        }

        function measureTickLabels(axis) {
            var opts = axis.options, i, ticks = axis.ticks || [], labels = [],
                l, w = opts.labelWidth, h = opts.labelHeight, dummyDiv;

            function makeDummyDiv(labels, width) {
                return $('<div style="position:absolute;top:-10000px;' + width + 'font-size:smaller">' +
                         '<div class="' + axis.direction + 'Axis ' + axis.direction + axis.n + 'Axis">'
                         + labels.join("") + '</div></div>')
                    .appendTo(placeholder);
            }
            
            if (axis.direction == "x") {
                // to avoid measuring the widths of the labels (it's slow), we
                // construct fixed-size boxes and put the labels inside
                // them, we don't need the exact figures and the
                // fixed-size box content is easy to center
                if (w == null)
                    w = Math.floor(canvasWidth / (ticks.length > 0 ? ticks.length : 1));

                // measure x label heights
                if (h == null) {
                    labels = [];
                    for (i = 0; i < ticks.length; ++i) {
                        l = ticks[i].label;
                        if (l)
                            labels.push('<div class="tickLabel" style="float:left;width:' + w + 'px">' + l + '</div>');
                    }

                    if (labels.length > 0) {
                        // stick them all in the same div and measure
                        // collective height
                        labels.push('<div style="clear:left"></div>');
                        dummyDiv = makeDummyDiv(labels, "width:10000px;");
                        h = dummyDiv.height();
                        dummyDiv.remove();
                    }
                }
            }
            else if (w == null || h == null) {
                // calculate y label dimensions
                for (i = 0; i < ticks.length; ++i) {
                    l = ticks[i].label;
                    if (l)
                        labels.push('<div class="tickLabel">' + l + '</div>');
                }
                
                if (labels.length > 0) {
                    dummyDiv = makeDummyDiv(labels, "");
                    if (w == null)
                        w = dummyDiv.children().width();
                    if (h == null)
                        h = dummyDiv.find("div.tickLabel").height();
                    dummyDiv.remove();
                }
            }

            if (w == null)
                w = 0;
            if (h == null)
                h = 0;

            axis.labelWidth = w;
            axis.labelHeight = h;
        }

        function allocateAxisBoxFirstPhase(axis) {
            // find the bounding box of the axis by looking at label
            // widths/heights and ticks, make room by diminishing the
            // plotOffset

            var lw = axis.labelWidth,
                lh = axis.labelHeight,
                pos = axis.options.position,
                tickLength = axis.options.tickLength,
                axismargin = options.grid.axisMargin,
                padding = options.grid.labelMargin,
                all = axis.direction == "x" ? xaxes : yaxes,
                index;

            // determine axis margin
            var samePosition = $.grep(all, function (a) {
                return a && a.options.position == pos && a.reserveSpace;
            });
            if ($.inArray(axis, samePosition) == samePosition.length - 1)
                axismargin = 0; // outermost

            // determine tick length - if we're innermost, we can use "full"
            if (tickLength == null)
                tickLength = "full";

            var sameDirection = $.grep(all, function (a) {
                return a && a.reserveSpace;
            });

            var innermost = $.inArray(axis, sameDirection) == 0;
            if (!innermost && tickLength == "full")
                tickLength = 5;
                
            if (!isNaN(+tickLength))
                padding += +tickLength;

            // compute box
            if (axis.direction == "x") {
                lh += padding;
                
                if (pos == "bottom") {
                    plotOffset.bottom += lh + axismargin;
                    axis.box = { top: canvasHeight - plotOffset.bottom, height: lh };
                }
                else {
                    axis.box = { top: plotOffset.top + axismargin, height: lh };
                    plotOffset.top += lh + axismargin;
                }
            }
            else {
                lw += padding;
                
                if (pos == "left") {
                    axis.box = { left: plotOffset.left + axismargin, width: lw };
                    plotOffset.left += lw + axismargin;
                }
                else {
                    plotOffset.right += lw + axismargin;
                    axis.box = { left: canvasWidth - plotOffset.right, width: lw };
                }
            }

             // save for future reference
            axis.position = pos;
            axis.tickLength = tickLength;
            axis.box.padding = padding;
            axis.innermost = innermost;
        }

        function allocateAxisBoxSecondPhase(axis) {
            // set remaining bounding box coordinates
            if (axis.direction == "x") {
                axis.box.left = plotOffset.left;
                axis.box.width = plotWidth;
            }
            else {
                axis.box.top = plotOffset.top;
                axis.box.height = plotHeight;
            }
        }
        
        function setupGrid() {
            var i, axes = allAxes();

            // first calculate the plot and axis box dimensions

            $.each(axes, function (_, axis) {
                axis.show = axis.options.show;
                if (axis.show == null)
                    axis.show = axis.used; // by default an axis is visible if it's got data
                
                axis.reserveSpace = axis.show || axis.options.reserveSpace;

                setRange(axis);
            });

            allocatedAxes = $.grep(axes, function (axis) { return axis.reserveSpace; });

            plotOffset.left = plotOffset.right = plotOffset.top = plotOffset.bottom = 0;
            if (options.grid.show) {
                $.each(allocatedAxes, function (_, axis) {
                    // make the ticks
                    setupTickGeneration(axis);
                    setTicks(axis);
                    snapRangeToTicks(axis, axis.ticks);

                    // find labelWidth/Height for axis
                    measureTickLabels(axis);
                });

                // with all dimensions in house, we can compute the
                // axis boxes, start from the outside (reverse order)
                for (i = allocatedAxes.length - 1; i >= 0; --i)
                    allocateAxisBoxFirstPhase(allocatedAxes[i]);

                // make sure we've got enough space for things that
                // might stick out
                var minMargin = options.grid.minBorderMargin;
                if (minMargin == null) {
                    minMargin = 0;
                    for (i = 0; i < series.length; ++i)
                        minMargin = Math.max(minMargin, series[i].points.radius + series[i].points.lineWidth/2);
                }
                    
                for (var a in plotOffset) {
                    plotOffset[a] += options.grid.borderWidth;
                    plotOffset[a] = Math.max(minMargin, plotOffset[a]);
                }
            }
            
            plotWidth = canvasWidth - plotOffset.left - plotOffset.right;
            plotHeight = canvasHeight - plotOffset.bottom - plotOffset.top;

            // now we got the proper plotWidth/Height, we can compute the scaling
            $.each(axes, function (_, axis) {
                setTransformationHelpers(axis);
            });

            if (options.grid.show) {
                $.each(allocatedAxes, function (_, axis) {
                    allocateAxisBoxSecondPhase(axis);
                });

                insertAxisLabels();
            }
            
            insertLegend();
        }
        
        function setRange(axis) {
            var opts = axis.options,
                min = +(opts.min != null ? opts.min : axis.datamin),
                max = +(opts.max != null ? opts.max : axis.datamax),
                delta = max - min;

            if (delta == 0.0) {
                // degenerate case
                var widen = max == 0 ? 1 : 0.01;

                if (opts.min == null)
                    min -= widen;
                // always widen max if we couldn't widen min to ensure we
                // don't fall into min == max which doesn't work
                if (opts.max == null || opts.min != null)
                    max += widen;
            }
            else {
                // consider autoscaling
                var margin = opts.autoscaleMargin;
                if (margin != null) {
                    if (opts.min == null) {
                        min -= delta * margin;
                        // make sure we don't go below zero if all values
                        // are positive
                        if (min < 0 && axis.datamin != null && axis.datamin >= 0)
                            min = 0;
                    }
                    if (opts.max == null) {
                        max += delta * margin;
                        if (max > 0 && axis.datamax != null && axis.datamax <= 0)
                            max = 0;
                    }
                }
            }
            axis.min = min;
            axis.max = max;
        }

        function setupTickGeneration(axis) {
            var opts = axis.options;
                
            // estimate number of ticks
            var noTicks;
            if (typeof opts.ticks == "number" && opts.ticks > 0)
                noTicks = opts.ticks;
            else
                // heuristic based on the model a*sqrt(x) fitted to
                // some data points that seemed reasonable
                noTicks = 0.3 * Math.sqrt(axis.direction == "x" ? canvasWidth : canvasHeight);

            var delta = (axis.max - axis.min) / noTicks,
                size, generator, unit, formatter, i, magn, norm;

            if (opts.mode == "time") {
                // pretty handling of time
                
                // map of app. size of time units in milliseconds
                var timeUnitSize = {
                    "second": 1000,
                    "minute": 60 * 1000,
                    "hour": 60 * 60 * 1000,
                    "day": 24 * 60 * 60 * 1000,
                    "month": 30 * 24 * 60 * 60 * 1000,
                    "year": 365.2425 * 24 * 60 * 60 * 1000
                };


                // the allowed tick sizes, after 1 year we use
                // an integer algorithm
                var spec = [
                    [1, "second"], [2, "second"], [5, "second"], [10, "second"],
                    [30, "second"], 
                    [1, "minute"], [2, "minute"], [5, "minute"], [10, "minute"],
                    [30, "minute"], 
                    [1, "hour"], [2, "hour"], [4, "hour"],
                    [8, "hour"], [12, "hour"],
                    [1, "day"], [2, "day"], [3, "day"],
                    [0.25, "month"], [0.5, "month"], [1, "month"],
                    [2, "month"], [3, "month"], [6, "month"],
                    [1, "year"]
                ];

                var minSize = 0;
                if (opts.minTickSize != null) {
                    if (typeof opts.tickSize == "number")
                        minSize = opts.tickSize;
                    else
                        minSize = opts.minTickSize[0] * timeUnitSize[opts.minTickSize[1]];
                }

                for (var i = 0; i < spec.length - 1; ++i)
                    if (delta < (spec[i][0] * timeUnitSize[spec[i][1]]
                                 + spec[i + 1][0] * timeUnitSize[spec[i + 1][1]]) / 2
                       && spec[i][0] * timeUnitSize[spec[i][1]] >= minSize)
                        break;
                size = spec[i][0];
                unit = spec[i][1];
                
                // special-case the possibility of several years
                if (unit == "year") {
                    magn = Math.pow(10, Math.floor(Math.log(delta / timeUnitSize.year) / Math.LN10));
                    norm = (delta / timeUnitSize.year) / magn;
                    if (norm < 1.5)
                        size = 1;
                    else if (norm < 3)
                        size = 2;
                    else if (norm < 7.5)
                        size = 5;
                    else
                        size = 10;

                    size *= magn;
                }

                axis.tickSize = opts.tickSize || [size, unit];
                
                generator = function(axis) {
                    var ticks = [],
                        tickSize = axis.tickSize[0], unit = axis.tickSize[1],
                        d = new Date(axis.min);
                    
                    var step = tickSize * timeUnitSize[unit];

                    if (unit == "second")
                        d.setUTCSeconds(floorInBase(d.getUTCSeconds(), tickSize));
                    if (unit == "minute")
                        d.setUTCMinutes(floorInBase(d.getUTCMinutes(), tickSize));
                    if (unit == "hour")
                        d.setUTCHours(floorInBase(d.getUTCHours(), tickSize));
                    if (unit == "month")
                        d.setUTCMonth(floorInBase(d.getUTCMonth(), tickSize));
                    if (unit == "year")
                        d.setUTCFullYear(floorInBase(d.getUTCFullYear(), tickSize));
                    
                    // reset smaller components
                    d.setUTCMilliseconds(0);
                    if (step >= timeUnitSize.minute)
                        d.setUTCSeconds(0);
                    if (step >= timeUnitSize.hour)
                        d.setUTCMinutes(0);
                    if (step >= timeUnitSize.day)
                        d.setUTCHours(0);
                    if (step >= timeUnitSize.day * 4)
                        d.setUTCDate(1);
                    if (step >= timeUnitSize.year)
                        d.setUTCMonth(0);


                    var carry = 0, v = Number.NaN, prev;
                    do {
                        prev = v;
                        v = d.getTime();
                        ticks.push(v);
                        if (unit == "month") {
                            if (tickSize < 1) {
                                // a bit complicated - we'll divide the month
                                // up but we need to take care of fractions
                                // so we don't end up in the middle of a day
                                d.setUTCDate(1);
                                var start = d.getTime();
                                d.setUTCMonth(d.getUTCMonth() + 1);
                                var end = d.getTime();
                                d.setTime(v + carry * timeUnitSize.hour + (end - start) * tickSize);
                                carry = d.getUTCHours();
                                d.setUTCHours(0);
                            }
                            else
                                d.setUTCMonth(d.getUTCMonth() + tickSize);
                        }
                        else if (unit == "year") {
                            d.setUTCFullYear(d.getUTCFullYear() + tickSize);
                        }
                        else
                            d.setTime(v + step);
                    } while (v < axis.max && v != prev);

                    return ticks;
                };

                formatter = function (v, axis) {
                    var d = new Date(v);

                    // first check global format
                    if (opts.timeformat != null)
                        return $.plot.formatDate(d, opts.timeformat, opts.monthNames);
                    
                    var t = axis.tickSize[0] * timeUnitSize[axis.tickSize[1]];
                    var span = axis.max - axis.min;
                    var suffix = (opts.twelveHourClock) ? " %p" : "";
                    
                    if (t < timeUnitSize.minute)
                        fmt = "%h:%M:%S" + suffix;
                    else if (t < timeUnitSize.day) {
                        if (span < 2 * timeUnitSize.day)
                            fmt = "%h:%M" + suffix;
                        else
                            fmt = "%b %d %h:%M" + suffix;
                    }
                    else if (t < timeUnitSize.month)
                        fmt = "%b %d";
                    else if (t < timeUnitSize.year) {
                        if (span < timeUnitSize.year)
                            fmt = "%b";
                        else
                            fmt = "%b %y";
                    }
                    else
                        fmt = "%y";
                    
                    return $.plot.formatDate(d, fmt, opts.monthNames);
                };
            }
            else {
                // pretty rounding of base-10 numbers
                var maxDec = opts.tickDecimals;
                var dec = -Math.floor(Math.log(delta) / Math.LN10);
                if (maxDec != null && dec > maxDec)
                    dec = maxDec;

                magn = Math.pow(10, -dec);
                norm = delta / magn; // norm is between 1.0 and 10.0
                
                if (norm < 1.5)
                    size = 1;
                else if (norm < 3) {
                    size = 2;
                    // special case for 2.5, requires an extra decimal
                    if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                        size = 2.5;
                        ++dec;
                    }
                }
                else if (norm < 7.5)
                    size = 5;
                else
                    size = 10;

                size *= magn;
                
                if (opts.minTickSize != null && size < opts.minTickSize)
                    size = opts.minTickSize;

                axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
                axis.tickSize = opts.tickSize || size;

                generator = function (axis) {
                    var ticks = [];

                    // spew out all possible ticks
                    var start = floorInBase(axis.min, axis.tickSize),
                        i = 0, v = Number.NaN, prev;
                    do {
                        prev = v;
                        v = start + i * axis.tickSize;
                        ticks.push(v);
                        ++i;
                    } while (v < axis.max && v != prev);
                    return ticks;
                };

                formatter = function (v, axis) {
                    return v.toFixed(axis.tickDecimals);
                };
            }

            if (opts.alignTicksWithAxis != null) {
                var otherAxis = (axis.direction == "x" ? xaxes : yaxes)[opts.alignTicksWithAxis - 1];
                if (otherAxis && otherAxis.used && otherAxis != axis) {
                    // consider snapping min/max to outermost nice ticks
                    var niceTicks = generator(axis);
                    if (niceTicks.length > 0) {
                        if (opts.min == null)
                            axis.min = Math.min(axis.min, niceTicks[0]);
                        if (opts.max == null && niceTicks.length > 1)
                            axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
                    }
                    
                    generator = function (axis) {
                        // copy ticks, scaled to this axis
                        var ticks = [], v, i;
                        for (i = 0; i < otherAxis.ticks.length; ++i) {
                            v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
                            v = axis.min + v * (axis.max - axis.min);
                            ticks.push(v);
                        }
                        return ticks;
                    };
                    
                    // we might need an extra decimal since forced
                    // ticks don't necessarily fit naturally
                    if (axis.mode != "time" && opts.tickDecimals == null) {
                        var extraDec = Math.max(0, -Math.floor(Math.log(delta) / Math.LN10) + 1),
                            ts = generator(axis);

                        // only proceed if the tick interval rounded
                        // with an extra decimal doesn't give us a
                        // zero at end
                        if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec))))
                            axis.tickDecimals = extraDec;
                    }
                }
            }

            axis.tickGenerator = generator;
            if ($.isFunction(opts.tickFormatter))
                axis.tickFormatter = function (v, axis) { return "" + opts.tickFormatter(v, axis); };
            else
                axis.tickFormatter = formatter;
        }
        
        function setTicks(axis) {
            var oticks = axis.options.ticks, ticks = [];
            if (oticks == null || (typeof oticks == "number" && oticks > 0))
                ticks = axis.tickGenerator(axis);
            else if (oticks) {
                if ($.isFunction(oticks))
                    // generate the ticks
                    ticks = oticks({ min: axis.min, max: axis.max });
                else
                    ticks = oticks;
            }

            // clean up/labelify the supplied ticks, copy them over
            var i, v;
            axis.ticks = [];
            for (i = 0; i < ticks.length; ++i) {
                var label = null;
                var t = ticks[i];
                if (typeof t == "object") {
                    v = +t[0];
                    if (t.length > 1)
                        label = t[1];
                }
                else
                    v = +t;
                if (label == null)
                    label = axis.tickFormatter(v, axis);
                if (!isNaN(v))
                    axis.ticks.push({ v: v, label: label });
            }
        }

        function snapRangeToTicks(axis, ticks) {
            if (axis.options.autoscaleMargin && ticks.length > 0) {
                // snap to ticks
                if (axis.options.min == null)
                    axis.min = Math.min(axis.min, ticks[0].v);
                if (axis.options.max == null && ticks.length > 1)
                    axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
            }
        }
      
        function draw() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            var grid = options.grid;

            // draw background, if any
            if (grid.show && grid.backgroundColor)
                drawBackground();
            
            if (grid.show && !grid.aboveData)
                drawGrid();

            for (var i = 0; i < series.length; ++i) {
                executeHooks(hooks.drawSeries, [ctx, series[i]]);
                drawSeries(series[i]);
            }

            executeHooks(hooks.draw, [ctx]);
            
            if (grid.show && grid.aboveData)
                drawGrid();
        }

        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = allAxes();

            for (i = 0; i < axes.length; ++i) {
                axis = axes[i];
                if (axis.direction == coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n == 1)
                        key = coord + "axis"; // support x1axis as xaxis
                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord == "x" ? xaxes[0] : yaxes[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }
            
            return { from: from, to: to, axis: axis };
        }
        
        function drawBackground() {
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            ctx.fillStyle = getColorOrGradient(options.grid.backgroundColor, plotHeight, 0, "rgba(255, 255, 255, 0)");
            ctx.fillRect(0, 0, plotWidth, plotHeight);
            ctx.restore();
        }

        function drawGrid() {
            var i;
            
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // draw markings
            var markings = options.grid.markings;
            if (markings) {
                if ($.isFunction(markings)) {
                    var axes = plot.getAxes();
                    // xmin etc. is backwards compatibility, to be
                    // removed in the future
                    axes.xmin = axes.xaxis.min;
                    axes.xmax = axes.xaxis.max;
                    axes.ymin = axes.yaxis.min;
                    axes.ymax = axes.yaxis.max;
                    
                    markings = markings(axes);
                }

                for (i = 0; i < markings.length; ++i) {
                    var m = markings[i],
                        xrange = extractRange(m, "x"),
                        yrange = extractRange(m, "y");

                    // fill in missing
                    if (xrange.from == null)
                        xrange.from = xrange.axis.min;
                    if (xrange.to == null)
                        xrange.to = xrange.axis.max;
                    if (yrange.from == null)
                        yrange.from = yrange.axis.min;
                    if (yrange.to == null)
                        yrange.to = yrange.axis.max;

                    // clip
                    if (xrange.to < xrange.axis.min || xrange.from > xrange.axis.max ||
                        yrange.to < yrange.axis.min || yrange.from > yrange.axis.max)
                        continue;

                    xrange.from = Math.max(xrange.from, xrange.axis.min);
                    xrange.to = Math.min(xrange.to, xrange.axis.max);
                    yrange.from = Math.max(yrange.from, yrange.axis.min);
                    yrange.to = Math.min(yrange.to, yrange.axis.max);

                    if (xrange.from == xrange.to && yrange.from == yrange.to)
                        continue;

                    // then draw
                    xrange.from = xrange.axis.p2c(xrange.from);
                    xrange.to = xrange.axis.p2c(xrange.to);
                    yrange.from = yrange.axis.p2c(yrange.from);
                    yrange.to = yrange.axis.p2c(yrange.to);
                    
                    if (xrange.from == xrange.to || yrange.from == yrange.to) {
                        // draw line
                        ctx.beginPath();
                        ctx.strokeStyle = m.color || options.grid.markingsColor;
                        ctx.lineWidth = m.lineWidth || options.grid.markingsLineWidth;
                        ctx.moveTo(xrange.from, yrange.from);
                        ctx.lineTo(xrange.to, yrange.to);
                        ctx.stroke();
                    }
                    else {
                        // fill area
                        ctx.fillStyle = m.color || options.grid.markingsColor;
                        ctx.fillRect(xrange.from, yrange.to,
                                     xrange.to - xrange.from,
                                     yrange.from - yrange.to);
                    }
                }
            }
            
            // draw the ticks
            var axes = allAxes(), bw = options.grid.borderWidth;

            for (var j = 0; j < axes.length; ++j) {
                var axis = axes[j], box = axis.box,
                    t = axis.tickLength, x, y, xoff, yoff;
                if (!axis.show || axis.ticks.length == 0)
                    continue
                
                ctx.strokeStyle = axis.options.tickColor || $.color.parse(axis.options.color).scale('a', 0.22).toString();
                ctx.lineWidth = 1;

                // find the edges
                if (axis.direction == "x") {
                    x = 0;
                    if (t == "full")
                        y = (axis.position == "top" ? 0 : plotHeight);
                    else
                        y = box.top - plotOffset.top + (axis.position == "top" ? box.height : 0);
                }
                else {
                    y = 0;
                    if (t == "full")
                        x = (axis.position == "left" ? 0 : plotWidth);
                    else
                        x = box.left - plotOffset.left + (axis.position == "left" ? box.width : 0);
                }
                
                // draw tick bar
                if (!axis.innermost) {
                    ctx.beginPath();
                    xoff = yoff = 0;
                    if (axis.direction == "x")
                        xoff = plotWidth;
                    else
                        yoff = plotHeight;
                    
                    if (ctx.lineWidth == 1) {
                        x = Math.floor(x) + 0.5;
                        y = Math.floor(y) + 0.5;
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                    ctx.stroke();
                }

                // draw ticks
                ctx.beginPath();
                for (i = 0; i < axis.ticks.length; ++i) {
                    var v = axis.ticks[i].v;
                    
                    xoff = yoff = 0;

                    if (v < axis.min || v > axis.max
                        // skip those lying on the axes if we got a border
                        || (t == "full" && bw > 0
                            && (v == axis.min || v == axis.max)))
                        continue;

                    if (axis.direction == "x") {
                        x = axis.p2c(v);
                        yoff = t == "full" ? -plotHeight : t;
                        
                        if (axis.position == "top")
                            yoff = -yoff;
                    }
                    else {
                        y = axis.p2c(v);
                        xoff = t == "full" ? -plotWidth : t;
                        
                        if (axis.position == "left")
                            xoff = -xoff;
                    }

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x")
                            x = Math.floor(x) + 0.5;
                        else
                            y = Math.floor(y) + 0.5;
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                }
                
                ctx.stroke();
            }
            
            
            // draw border
            if (bw) {
                ctx.lineWidth = bw;
                ctx.strokeStyle = options.grid.borderColor;
                ctx.strokeRect(-bw/2, -bw/2, plotWidth + bw, plotHeight + bw);
            }

            ctx.restore();
        }

        function insertAxisLabels() {
            placeholder.find(".tickLabels").remove();
            
            var html = ['<div class="tickLabels" style="font-size:smaller">'];

            var axes = allAxes();
            for (var j = 0; j < axes.length; ++j) {
                var axis = axes[j], box = axis.box;
                if (!axis.show)
                    continue;
                //debug: html.push('<div style="position:absolute;opacity:0.10;background-color:red;left:' + box.left + 'px;top:' + box.top + 'px;width:' + box.width +  'px;height:' + box.height + 'px"></div>')
                html.push('<div class="' + axis.direction + 'Axis ' + axis.direction + axis.n + 'Axis" style="color:' + axis.options.color + '">');
                for (var i = 0; i < axis.ticks.length; ++i) {
                    var tick = axis.ticks[i];
                    if (!tick.label || tick.v < axis.min || tick.v > axis.max)
                        continue;

                    var pos = {}, align;
                    
                    if (axis.direction == "x") {
                        align = "center";
                        pos.left = Math.round(plotOffset.left + axis.p2c(tick.v) - axis.labelWidth/2);
                        if (axis.position == "bottom")
                            pos.top = box.top + box.padding;
                        else
                            pos.bottom = canvasHeight - (box.top + box.height - box.padding);
                    }
                    else {
                        pos.top = Math.round(plotOffset.top + axis.p2c(tick.v) - axis.labelHeight/2);
                        if (axis.position == "left") {
                            pos.right = canvasWidth - (box.left + box.width - box.padding)
                            align = "right";
                        }
                        else {
                            pos.left = box.left + box.padding;
                            align = "left";
                        }
                    }

                    pos.width = axis.labelWidth;

                    var style = ["position:absolute", "text-align:" + align ];
                    for (var a in pos)
                        style.push(a + ":" + pos[a] + "px")
                    
                    html.push('<div class="tickLabel" style="' + style.join(';') + '">' + tick.label + '</div>');
                }
                html.push('</div>');
            }

            html.push('</div>');

            placeholder.append(html.join(""));
        }

        function drawSeries(series) {
            if (series.lines.show)
                drawSeriesLines(series);
            if (series.bars.show)
                drawSeriesBars(series);
            if (series.points.show)
                drawSeriesPoints(series);
        }
        
        function drawSeriesLines(series) {
            function plotLine(datapoints, xoffset, yoffset, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    prevx = null, prevy = null;
                
                ctx.beginPath();
                for (var i = ps; i < points.length; i += ps) {
                    var x1 = points[i - ps], y1 = points[i - ps + 1],
                        x2 = points[i], y2 = points[i + 1];
                    
                    if (x1 == null || x2 == null)
                        continue;

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min) {
                        if (y2 < axisy.min)
                            continue;   // line segment is outside
                        // compute new intersection point
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min) {
                        if (y1 < axisy.min)
                            continue;
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max) {
                        if (y2 > axisy.max)
                            continue;
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max) {
                        if (y1 > axisy.max)
                            continue;
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (x1 != prevx || y1 != prevy)
                        ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);
                    
                    prevx = x2;
                    prevy = y2;
                    ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
                }
                ctx.stroke();
            }

            function plotLineArea(datapoints, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    bottom = Math.min(Math.max(0, axisy.min), axisy.max),
                    i = 0, top, areaOpen = false,
                    ypos = 1, segmentStart = 0, segmentEnd = 0;

                // we process each segment in two turns, first forward
                // direction to sketch out top, then once we hit the
                // end we go backwards to sketch the bottom
                while (true) {
                    if (ps > 0 && i > points.length + ps)
                        break;

                    i += ps; // ps is negative if going backwards

                    var x1 = points[i - ps],
                        y1 = points[i - ps + ypos],
                        x2 = points[i], y2 = points[i + ypos];

                    if (areaOpen) {
                        if (ps > 0 && x1 != null && x2 == null) {
                            // at turning point
                            segmentEnd = i;
                            ps = -ps;
                            ypos = 2;
                            continue;
                        }

                        if (ps < 0 && i == segmentStart + ps) {
                            // done with the reverse sweep
                            ctx.fill();
                            areaOpen = false;
                            ps = -ps;
                            ypos = 1;
                            i = segmentStart = segmentEnd + ps;
                            continue;
                        }
                    }

                    if (x1 == null || x2 == null)
                        continue;

                    // clip x values
                    
                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (!areaOpen) {
                        // open area
                        ctx.beginPath();
                        ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
                        areaOpen = true;
                    }
                    
                    // now first check the case where both is outside
                    if (y1 >= axisy.max && y2 >= axisy.max) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
                        continue;
                    }
                    else if (y1 <= axisy.min && y2 <= axisy.min) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
                        continue;
                    }
                    
                    // else it's a bit more complicated, there might
                    // be a flat maxed out rectangle first, then a
                    // triangular cutout or reverse; to find these
                    // keep track of the current x values
                    var x1old = x1, x2old = x2;

                    // clip the y values, without shortcutting, we
                    // go through all cases in turn
                    
                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // if the x value was changed we got a rectangle
                    // to fill
                    if (x1 != x1old) {
                        ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
                        // it goes to (x1, y1), but we fill that below
                    }
                    
                    // fill triangular section, this sometimes result
                    // in redundant points if (x1, y1) hasn't changed
                    // from previous line to, but we just ignore that
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

                    // fill the other rectangle if it's there
                    if (x2 != x2old) {
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
                        ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
                    }
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);
            ctx.lineJoin = "round";

            var lw = series.lines.lineWidth,
                sw = series.shadowSize;
            // FIXME: consider another form of shadow when filling is turned on
            if (lw > 0 && sw > 0) {
                // draw shadow as a thick and thin line with transparency
                ctx.lineWidth = sw;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                // position shadow at angle from the mid of line
                var angle = Math.PI/18;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/2), Math.cos(angle) * (lw/2 + sw/2), series.xaxis, series.yaxis);
                ctx.lineWidth = sw/2;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/4), Math.cos(angle) * (lw/2 + sw/4), series.xaxis, series.yaxis);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            var fillStyle = getFillStyle(series.lines, series.color, 0, plotHeight);
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
                plotLineArea(series.datapoints, series.xaxis, series.yaxis);
            }

            if (lw > 0)
                plotLine(series.datapoints, 0, 0, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function drawSeriesPoints(series) {
            function plotPoints(datapoints, radius, fillStyle, offset, shadow, axisx, axisy, symbol) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    var x = points[i], y = points[i + 1];
                    if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                        continue;
                    
                    ctx.beginPath();
                    x = axisx.p2c(x);
                    y = axisy.p2c(y) + offset;
                    if (symbol == "circle")
                        ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
                    else
                        symbol(ctx, x, y, radius, shadow);
                    ctx.closePath();
                    
                    if (fillStyle) {
                        ctx.fillStyle = fillStyle;
                        ctx.fill();
                    }
                    ctx.stroke();
                }
            }
            
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var lw = series.points.lineWidth,
                sw = series.shadowSize,
                radius = series.points.radius,
                symbol = series.points.symbol;
            if (lw > 0 && sw > 0) {
                // draw shadow in two steps
                var w = sw / 2;
                ctx.lineWidth = w;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                plotPoints(series.datapoints, radius, null, w + w/2, true,
                           series.xaxis, series.yaxis, symbol);

                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                plotPoints(series.datapoints, radius, null, w/2, true,
                           series.xaxis, series.yaxis, symbol);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            plotPoints(series.datapoints, radius,
                       getFillStyle(series.points, series.color), 0, false,
                       series.xaxis, series.yaxis, symbol);
            ctx.restore();
        }

        function drawBar(x, y, b, barLeft, barRight, offset, fillStyleCallback, axisx, axisy, c, horizontal, lineWidth) {
            var left, right, bottom, top,
                drawLeft, drawRight, drawTop, drawBottom,
                tmp;

            // in horizontal mode, we start the bar from the left
            // instead of from the bottom so it appears to be
            // horizontal rather than vertical
            if (horizontal) {
                drawBottom = drawRight = drawTop = true;
                drawLeft = false;
                left = b;
                right = x;
                top = y + barLeft;
                bottom = y + barRight;

                // account for negative bars
                if (right < left) {
                    tmp = right;
                    right = left;
                    left = tmp;
                    drawLeft = true;
                    drawRight = false;
                }
            }
            else {
                drawLeft = drawRight = drawTop = true;
                drawBottom = false;
                left = x + barLeft;
                right = x + barRight;
                bottom = b;
                top = y;

                // account for negative bars
                if (top < bottom) {
                    tmp = top;
                    top = bottom;
                    bottom = tmp;
                    drawBottom = true;
                    drawTop = false;
                }
            }
           
            // clip
            if (right < axisx.min || left > axisx.max ||
                top < axisy.min || bottom > axisy.max)
                return;
            
            if (left < axisx.min) {
                left = axisx.min;
                drawLeft = false;
            }

            if (right > axisx.max) {
                right = axisx.max;
                drawRight = false;
            }

            if (bottom < axisy.min) {
                bottom = axisy.min;
                drawBottom = false;
            }
            
            if (top > axisy.max) {
                top = axisy.max;
                drawTop = false;
            }

            left = axisx.p2c(left);
            bottom = axisy.p2c(bottom);
            right = axisx.p2c(right);
            top = axisy.p2c(top);
            
            // fill the bar
            if (fillStyleCallback) {
                c.beginPath();
                c.moveTo(left, bottom);
                c.lineTo(left, top);
                c.lineTo(right, top);
                c.lineTo(right, bottom);
                c.fillStyle = fillStyleCallback(bottom, top);
                c.fill();
            }

            // draw outline
            if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
                c.beginPath();

                // FIXME: inline moveTo is buggy with excanvas
                c.moveTo(left, bottom + offset);
                if (drawLeft)
                    c.lineTo(left, top + offset);
                else
                    c.moveTo(left, top + offset);
                if (drawTop)
                    c.lineTo(right, top + offset);
                else
                    c.moveTo(right, top + offset);
                if (drawRight)
                    c.lineTo(right, bottom + offset);
                else
                    c.moveTo(right, bottom + offset);
                if (drawBottom)
                    c.lineTo(left, bottom + offset);
                else
                    c.moveTo(left, bottom + offset);
                c.stroke();
            }
        }
        
        function drawSeriesBars(series) {
            function plotBars(datapoints, barLeft, barRight, offset, fillStyleCallback, axisx, axisy) {
                var points = datapoints.points, ps = datapoints.pointsize;
                
                for (var i = 0; i < points.length; i += ps) {
                    if (points[i] == null)
                        continue;
                    drawBar(points[i], points[i + 1], points[i + 2], barLeft, barRight, offset, fillStyleCallback, axisx, axisy, ctx, series.bars.horizontal, series.bars.lineWidth);
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // FIXME: figure out a way to add shadows (for instance along the right edge)
            ctx.lineWidth = series.bars.lineWidth;
            ctx.strokeStyle = series.color;
            var barLeft = series.bars.align == "left" ? 0 : -series.bars.barWidth/2;
            var fillStyleCallback = series.bars.fill ? function (bottom, top) { return getFillStyle(series.bars, series.color, bottom, top); } : null;
            plotBars(series.datapoints, barLeft, barLeft + series.bars.barWidth, 0, fillStyleCallback, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function getFillStyle(filloptions, seriesColor, bottom, top) {
            var fill = filloptions.fill;
            if (!fill)
                return null;

            if (filloptions.fillColor)
                return getColorOrGradient(filloptions.fillColor, bottom, top, seriesColor);
            
            var c = $.color.parse(seriesColor);
            c.a = typeof fill == "number" ? fill : 0.4;
            c.normalize();
            return c.toString();
        }
        
        function insertLegend() {
            placeholder.find(".legend").remove();

            if (!options.legend.show)
                return;
            
            var fragments = [], rowStarted = false,
                lf = options.legend.labelFormatter, s, label;
            for (var i = 0; i < series.length; ++i) {
                s = series[i];
                label = s.label;
                if (!label)
                    continue;
                
                if (i % options.legend.noColumns == 0) {
                    if (rowStarted)
                        fragments.push('</tr>');
                    fragments.push('<tr>');
                    rowStarted = true;
                }

                if (lf)
                    label = lf(label, s);
                
                fragments.push(
                    '<td class="legendColorBox"><div style="border:1px solid ' + options.legend.labelBoxBorderColor + ';padding:1px"><div style="width:4px;height:0;border:5px solid ' + s.color + ';overflow:hidden"></div></div></td>' +
                    '<td class="legendLabel">' + label + '</td>');
            }
            if (rowStarted)
                fragments.push('</tr>');
            
            if (fragments.length == 0)
                return;

            var table = '<table style="font-size:smaller;color:' + options.grid.color + '">' + fragments.join("") + '</table>';
            if (options.legend.container != null)
                $(options.legend.container).html(table);
            else {
                var pos = "",
                    p = options.legend.position,
                    m = options.legend.margin;
                if (m[0] == null)
                    m = [m, m];
                if (p.charAt(0) == "n")
                    pos += 'top:' + (m[1] + plotOffset.top) + 'px;';
                else if (p.charAt(0) == "s")
                    pos += 'bottom:' + (m[1] + plotOffset.bottom) + 'px;';
                if (p.charAt(1) == "e")
                    pos += 'right:' + (m[0] + plotOffset.right) + 'px;';
                else if (p.charAt(1) == "w")
                    pos += 'left:' + (m[0] + plotOffset.left) + 'px;';
                var legend = $('<div class="legend">' + table.replace('style="', 'style="position:absolute;' + pos +';') + '</div>').appendTo(placeholder);
                if (options.legend.backgroundOpacity != 0.0) {
                    // put in the transparent background
                    // separately to avoid blended labels and
                    // label boxes
                    var c = options.legend.backgroundColor;
                    if (c == null) {
                        c = options.grid.backgroundColor;
                        if (c && typeof c == "string")
                            c = $.color.parse(c);
                        else
                            c = $.color.extract(legend, 'background-color');
                        c.a = 1;
                        c = c.toString();
                    }
                    var div = legend.children();
                    $('<div style="position:absolute;width:' + div.width() + 'px;height:' + div.height() + 'px;' + pos +'background-color:' + c + ';"> </div>').prependTo(legend).css('opacity', options.legend.backgroundOpacity);
                }
            }
        }


        // interactive features
        
        var highlights = [],
            redrawTimeout = null;
        
        // returns the data item the mouse is over, or null if none is found
        function findNearbyItem(mouseX, mouseY, seriesFilter) {
            var maxDistance = options.grid.mouseActiveRadius,
                smallestDistance = maxDistance * maxDistance + 1,
                item = null, foundPoint = false, i, j;

            for (i = series.length - 1; i >= 0; --i) {
                if (!seriesFilter(series[i]))
                    continue;
                
                var s = series[i],
                    axisx = s.xaxis,
                    axisy = s.yaxis,
                    points = s.datapoints.points,
                    ps = s.datapoints.pointsize,
                    mx = axisx.c2p(mouseX), // precompute some stuff to make the loop faster
                    my = axisy.c2p(mouseY),
                    maxx = maxDistance / axisx.scale,
                    maxy = maxDistance / axisy.scale;

                // with inverse transforms, we can't use the maxx/maxy
                // optimization, sadly
                if (axisx.options.inverseTransform)
                    maxx = Number.MAX_VALUE;
                if (axisy.options.inverseTransform)
                    maxy = Number.MAX_VALUE;
                
                if (s.lines.show || s.points.show) {
                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1];
                        if (x == null)
                            continue;
                        
                        // For points and lines, the cursor must be within a
                        // certain distance to the data point
                        if (x - mx > maxx || x - mx < -maxx ||
                            y - my > maxy || y - my < -maxy)
                            continue;

                        // We have to calculate distances in pixels, not in
                        // data units, because the scales of the axes may be different
                        var dx = Math.abs(axisx.p2c(x) - mouseX),
                            dy = Math.abs(axisy.p2c(y) - mouseY),
                            dist = dx * dx + dy * dy; // we save the sqrt

                        // use <= to ensure last point takes precedence
                        // (last generally means on top of)
                        if (dist < smallestDistance) {
                            smallestDistance = dist;
                            item = [i, j / ps];
                        }
                    }
                }
                    
                if (s.bars.show && !item) { // no other point can be nearby
                    var barLeft = s.bars.align == "left" ? 0 : -s.bars.barWidth/2,
                        barRight = barLeft + s.bars.barWidth;
                    
                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1], b = points[j + 2];
                        if (x == null)
                            continue;
  
                        // for a bar graph, the cursor must be inside the bar
                        if (series[i].bars.horizontal ? 
                            (mx <= Math.max(b, x) && mx >= Math.min(b, x) && 
                             my >= y + barLeft && my <= y + barRight) :
                            (mx >= x + barLeft && mx <= x + barRight &&
                             my >= Math.min(b, y) && my <= Math.max(b, y)))
                                item = [i, j / ps];
                    }
                }
            }

            if (item) {
                i = item[0];
                j = item[1];
                ps = series[i].datapoints.pointsize;
                
                return { datapoint: series[i].datapoints.points.slice(j * ps, (j + 1) * ps),
                         dataIndex: j,
                         series: series[i],
                         seriesIndex: i };
            }
            
            return null;
        }

        function onMouseMove(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return s["hoverable"] != false; });
        }

        function onMouseLeave(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return false; });
        }

        function onClick(e) {
            triggerClickHoverEvent("plotclick", e,
                                   function (s) { return s["clickable"] != false; });
        }

        // trigger click or hover event (they send the same parameters
        // so we share their code)
        function triggerClickHoverEvent(eventname, event, seriesFilter) {
            var offset = eventHolder.offset(),
                canvasX = event.pageX - offset.left - plotOffset.left,
                canvasY = event.pageY - offset.top - plotOffset.top,
            pos = canvasToAxisCoords({ left: canvasX, top: canvasY });

            pos.pageX = event.pageX;
            pos.pageY = event.pageY;

            var item = findNearbyItem(canvasX, canvasY, seriesFilter);

            if (item) {
                // fill in mouse pos for any listeners out there
                item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + offset.left + plotOffset.left);
                item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + offset.top + plotOffset.top);
            }

            if (options.grid.autoHighlight) {
                // clear auto-highlights
                for (var i = 0; i < highlights.length; ++i) {
                    var h = highlights[i];
                    if (h.auto == eventname &&
                        !(item && h.series == item.series &&
                          h.point[0] == item.datapoint[0] &&
                          h.point[1] == item.datapoint[1]))
                        unhighlight(h.series, h.point);
                }
                
                if (item)
                    highlight(item.series, item.datapoint, eventname);
            }
            
            placeholder.trigger(eventname, [ pos, item ]);
        }

        function triggerRedrawOverlay() {
            if (!redrawTimeout)
                redrawTimeout = setTimeout(drawOverlay, 30);
        }

        function drawOverlay() {
            redrawTimeout = null;

            // draw highlights
            octx.save();
            octx.clearRect(0, 0, canvasWidth, canvasHeight);
            octx.translate(plotOffset.left, plotOffset.top);
            
            var i, hi;
            for (i = 0; i < highlights.length; ++i) {
                hi = highlights[i];

                if (hi.series.bars.show)
                    drawBarHighlight(hi.series, hi.point);
                else
                    drawPointHighlight(hi.series, hi.point);
            }
            octx.restore();
            
            executeHooks(hooks.drawOverlay, [octx]);
        }
        
        function highlight(s, point, auto) {
            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i == -1) {
                highlights.push({ series: s, point: point, auto: auto });

                triggerRedrawOverlay();
            }
            else if (!auto)
                highlights[i].auto = false;
        }
            
        function unhighlight(s, point) {
            if (s == null && point == null) {
                highlights = [];
                triggerRedrawOverlay();
            }
            
            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number")
                point = s.data[point];

            var i = indexOfHighlight(s, point);
            if (i != -1) {
                highlights.splice(i, 1);

                triggerRedrawOverlay();
            }
        }
        
        function indexOfHighlight(s, p) {
            for (var i = 0; i < highlights.length; ++i) {
                var h = highlights[i];
                if (h.series == s && h.point[0] == p[0]
                    && h.point[1] == p[1])
                    return i;
            }
            return -1;
        }
        
        function drawPointHighlight(series, point) {
            var x = point[0], y = point[1],
                axisx = series.xaxis, axisy = series.yaxis;
            
            if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                return;
            
            var pointRadius = series.points.radius + series.points.lineWidth / 2;
            octx.lineWidth = pointRadius;
            octx.strokeStyle = $.color.parse(series.color).scale('a', 0.5).toString();
            var radius = 1.5 * pointRadius,
                x = axisx.p2c(x),
                y = axisy.p2c(y);
            
            octx.beginPath();
            if (series.points.symbol == "circle")
                octx.arc(x, y, radius, 0, 2 * Math.PI, false);
            else
                series.points.symbol(octx, x, y, radius, false);
            octx.closePath();
            octx.stroke();
        }

        function drawBarHighlight(series, point) {
            octx.lineWidth = series.bars.lineWidth;
            octx.strokeStyle = $.color.parse(series.color).scale('a', 0.5).toString();
            var fillStyle = $.color.parse(series.color).scale('a', 0.5).toString();
            var barLeft = series.bars.align == "left" ? 0 : -series.bars.barWidth/2;
            drawBar(point[0], point[1], point[2] || 0, barLeft, barLeft + series.bars.barWidth,
                    0, function () { return fillStyle; }, series.xaxis, series.yaxis, octx, series.bars.horizontal, series.bars.lineWidth);
        }

        function getColorOrGradient(spec, bottom, top, defaultColor) {
            if (typeof spec == "string")
                return spec;
            else {
                // assume this is a gradient spec; IE currently only
                // supports a simple vertical gradient properly, so that's
                // what we support too
                var gradient = ctx.createLinearGradient(0, top, 0, bottom);
                
                for (var i = 0, l = spec.colors.length; i < l; ++i) {
                    var c = spec.colors[i];
                    if (typeof c != "string") {
                        var co = $.color.parse(defaultColor);
                        if (c.brightness != null)
                            co = co.scale('rgb', c.brightness)
                        if (c.opacity != null)
                            co.a *= c.opacity;
                        c = co.toString();
                    }
                    gradient.addColorStop(i / (l - 1), c);
                }
                
                return gradient;
            }
        }
    }

    $.plot = function(placeholder, data, options) {
        //var t0 = new Date();
        var plot = new Plot($(placeholder), data, options, $.plot.plugins);
        //(window.console ? console.log : alert)("time used (msecs): " + ((new Date()).getTime() - t0.getTime()));
        return plot;
    };

    $.plot.version = "0.7";
    
    $.plot.plugins = [];

    // returns a string with the date d formatted according to fmt
    $.plot.formatDate = function(d, fmt, monthNames) {
        var leftPad = function(n) {
            n = "" + n;
            return n.length == 1 ? "0" + n : n;
        };
        
        var r = [];
        var escape = false, padNext = false;
        var hours = d.getUTCHours();
        var isAM = hours < 12;
        if (monthNames == null)
            monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (fmt.search(/%p|%P/) != -1) {
            if (hours > 12) {
                hours = hours - 12;
            } else if (hours == 0) {
                hours = 12;
            }
        }
        for (var i = 0; i < fmt.length; ++i) {
            var c = fmt.charAt(i);
            
            if (escape) {
                switch (c) {
                case 'h': c = "" + hours; break;
                case 'H': c = leftPad(hours); break;
                case 'M': c = leftPad(d.getUTCMinutes()); break;
                case 'S': c = leftPad(d.getUTCSeconds()); break;
                case 'd': c = "" + d.getUTCDate(); break;
                case 'm': c = "" + (d.getUTCMonth() + 1); break;
                case 'y': c = "" + d.getUTCFullYear(); break;
                case 'b': c = "" + monthNames[d.getUTCMonth()]; break;
                case 'p': c = (isAM) ? ("" + "am") : ("" + "pm"); break;
                case 'P': c = (isAM) ? ("" + "AM") : ("" + "PM"); break;
                case '0': c = ""; padNext = true; break;
                }
                if (c && padNext) {
                    c = leftPad(c);
                    padNext = false;
                }
                r.push(c);
                if (!padNext)
                    escape = false;
            }
            else {
                if (c == "%")
                    escape = true;
                else
                    r.push(c);
            }
        }
        return r.join("");
    };
    
    // round to nearby lower multiple of base
    function floorInBase(n, base) {
        return base * Math.floor(n / base);
    }
    
})(jQuery);

!function(c){function a(f){f&&(this.promise=f)}if(!c.Promise){a.prototype.resolved=!1,a.prototype.rejected=!1,a.prototype.resolvedValue=void 0,a.prototype.rejectedValue=void 0,a.prototype.resolve=function(f){this.resolved||this.rejected||(this.resolved=!0,this.resolvedValue=f),this.promise&&this.promise.tick()},a.prototype.reject=function(f){this.resolved||this.rejected||(this.rejected=!0,this.rejectedValue=f),this.promise&&this.promise.tick()};var b=c.Promise=function(g){if(g){var f=this.deferred=new a(this);try{g(f.resolve.bind(f),f.reject.bind(f))}catch(h){f.reject(h)}}};b.prototype.thenMethod=void 0,b.prototype.thenMethodEvaluated=!1,b.prototype.catchMethodEvaluated=!1,b.prototype.thenMethodResult=void 0,b.prototype.nextPromise=void 0,b.prototype.transferred=!1,b.defer=function(){var f=new b;return f.deferred=new a(f),f.deferred},b.toPromise=function(f){return f instanceof b?f:f instanceof Error?b.reject(f):b.resolve(f)},b.resolve=function(f){var g=new b,h=g.deferred=new a(g);return h.resolved=!0,h.resolvedValue=f,g},b.reject=function(f){var g=new b,h=g.deferred=new a(g);return h.rejected=!0,h.rejectedValue=f,g},b.all=function(g){var f=[],h=0,i=b.defer();return g.forEach(function(e,j){b.toPromise(e).then(function(k){f[j]=k,h++,h==g.length&&i.resolve(f)})["catch"](function(k){i.reject(k)})}),i.promise},b.race=function(g){var f=!1,h=b.defer();return g.forEach(function(i,j){b.toPromise(i).then(function(k){f||(f=!0,h.resolve(k))})["catch"](function(k){f||(f=!0,h.reject(k))})}),h.promise},b.prototype.tick=function(){if(this.deferred){if(this.deferred.resolved){if(!this.thenMethodEvaluated&&this.thenMethod){try{var f=this.thenMethod(this.deferred.resolvedValue);this.thenMethodResult=b.toPromise(f),this.thenMethodEvaluated=!0}catch(g){var h=this.deferred=new a(this);h.rejected=!0,h.rejectedValue=g}}this.thenMethodEvaluated&&this.nextPromise&&(this.nextPromise.deferred=this.thenMethodResult.deferred,this.nextPromise.deferred.promise=this.nextPromise,this.nextPromise.tick())}this.deferred.rejected&&(this.catchMethod?this.catchMethodEvaluated||(this.catchMethod(this.deferred.rejectedValue),this.catchMethodEvaluated=!0):this.nextPromise&&this.nextPromise.reject(this.deferred.rejectedValue))}},b.prototype.resolve=function(f){if(!this.deferred){throw new Error("missing deferred")}this.deferred.resolve(f)},b.prototype.reject=function(f){this.deferred||(this.deferred=new a(this)),this.deferred.reject(f)},b.prototype["catch"]=function(f){if(this.catchMethod){throw new Error("already have a catch method")}return this.catchMethod=f,setTimeout(this.tick.bind(this),0),this},b.prototype.then=function(g,f){if(this.thenMethod){throw new Error("already have a then method")}return this.thenMethod=g,this.nextPromise||(this.nextPromise=new b),f?this["catch"](f):(setTimeout(this.tick.bind(this),0),this.nextPromise)}}c.Promise.npost=function(e,f,g){return new c.Promise(function(h,i){g.push(function(j){if(j){i(j)}else{var k=arguments[1];if(arguments.length>2){k=[];for(var l=1;l<arguments.length;l++){k.push(arguments[l])}}h(k)}}),("string"==typeof f?e[f]:f).apply(e,g)})},c.Promise.ninvoke=function(e,f){var g=[].slice.call(arguments,2);return c.Promise.npost(e,f,g)},c.Promise.nbind=function(e,f){return function(){var g=[].slice.call(arguments);return c.Promise.npost(e,f,g)}},c.Promise.denodify=function(e){return function(){var f=[].slice.call(arguments);return c.Promise.npost(null,e,f)}},c.Promise.nfapply=function(e,f){return c.Promise.npost(null,e,f)},c.Promise.nfcall=function(e){var f=[].slice.call(arguments,1);return c.Promise.npost(null,e,f)},c.Promise.prototype.spread=function(f){return this.then(function(e){return e.constructor===Array?f.apply(this,e):f(e)})},c.Promise.delay=function(e){return new c.Promise(function(g,f){setTimeout(g,e||0)})},c.Promise.fcall=function(e){var f;try{f=e()}catch(g){f=g}return f instanceof c.Promise?f:f instanceof Error?c.Promise.reject(f):c.Promise.resolve(f)},c.Promise.prototype.all=function(){return this.then(function(e){return !e.constructor===Array&&(e=[e]),c.Promise.all(e)})},c.Promise.defer||(c.Promise.defer=function(){var e={};return e.promise=new c.Promise(function(g,f){e.resolve=function(h){g(h)},e.reject=function(h){f(h)}}),e});var d=c.Promise.defer;c.Promise.defer=function(){var e=d.call(c.Promise);return e.makeNodeResolver=function(){var f=this;return function(g){if(g){f.reject(g)}else{var h=arguments[1];if(arguments.length>2){h=[];for(var i=1;i<arguments.length;i++){h.push(arguments[i])}}f.resolve(h)}}},e},Object.prototype.$promise||Object.defineProperty(Object.prototype,"$promise",{enumerable:!1,get:function(){var e=this;return function(f){var g=[].slice.call(arguments,1);return c.Promise.npost(e,f,g)}}}),"undefined"!=typeof module&&(module.exports=c.Promise)}("undefined"==typeof global?window:global);var english_language=[{Home:"Home",Back:"Back",Forward:"Forward",Paste_your_RES_data_here:"Paste your RES data here",Type_in_a_subreddit_and_hit_enter:"Type in a subreddit and hit enter",Slide_to_Comments_When_I_Click_Them:"Slide to Comments When I Click Them",Add:"Add",link_karma:"link karma",comment_karma:"comment karma",registered:"registered",Please_choose_which_subreddit_you_want:"Please choose which subreddit you want",Subject:"Subject",Title:"Title",Link:"Link",Text:"Text",Usernames:"Usernames",Write_your_message_here:"Write your message here",Refresh:"Refresh",Messages:"Messages",History:"History",Favourites:"Favourites",Main:"Main",Add_Column:"Add Column",New_Post:"New Post",New_Message:"New Message",View:"View",Open_a_Subreddit:"Open a Subreddit",Gallery:"Gallery",User:"User",Post:"Post",Friends:"Friends",Settings:"Settings",Code:"Code",General:"General",Theme:"Theme",Sync:"Sync",Keys:"Keys",Signature:"Signature",Profile:"Profile",Subscribed:"Subscribed",Flair:"Flair",Top_Bar:"Top Bar",RES_Import:"RES Import",About:"About",Quick_View:"Quick View",Add_Column_to_Reditr:"Add Column to Reditr",hot:"hot",Hot:"Hot",Top:"Top",Controversial:"Controversial",New:"New",top:"top",controversial:"controversial",Loading:"Loading","new":"new",rising:"rising",Rising:"Rising",comments:"comments",View_in_Gallery:"View in Gallery",Items_in_History:"Items in History",Clear_History:"Clear History",Compose:"Compose",All:"All",Unread:"Unread",PMs:"PMs",Sent:"Sent",Comments:"Comments",Posts:"Posts",My_Posts:"My Posts",Mod:"Mod",Select_All:"Select All",Unselect_All:"Unselect All",Mark_Read:"Mark Read",Mark_Unread:"Mark Unread",Save_Comment:"Save Comment",Permalink:"Permalink",Copy_URL:"Copy URL",Source:"Source",Edit_This:"Edit This",Delete:"Delete",Report:"Report",Reply:"Reply",Random:"Random",Close:"Close",Subreddit:"Subreddit",Front_Page:"Front Page",Search:"Search",Domain:"Domain",Moderated:"Moderated",All_Comments:"All Comments",Cancel:"Cancel",Save:"Save",Open_Reddit:"Open Reddit",Open_Link:"Open Link",Copy_Reddit:"Copy Reddit",Copy_Link:"Copy Link",Reload:"Relaod",Relevance:"Releveance",Load_All:"Load All",Dont_Highlight:"Don't Highlight",Highlight_New:"Highlight_New",Scroll_to_Top:"Scroll to Top",Navigate_by:"Navigate by",down:"down",up:"up",Accounts:"Account",Editor:"Editor",List:"List",Remove:"Remove",Remove_and_Unsubscribe:"Remove &amp; Unsubscribe",Change_Column_Title:"Change Column Title",Manage_Subreddits:"Manage Subreddits",Refresh_Content:"Refresh Content",Sidebar:"Sidebar",Gallery_Mode:"Gallery Mode",Width:"Width",Remove_Column_from_Reditr:"Remove Column from Reditr",Sort_Options:"Sort Options",Sort_by:"Sort by",Subscribe_to:"Subscribe to",Unsubscribe_from:"Unsubscribe from",Done:"Done",Add_Friend:"Add Friend",On:"On",Off:"Off",Gen:"Gen.",RES:"RES",Sig:"Sig",Show:"Show",Dont_Show:"Don't Show",Only_Show:"Only Show",Amount_of_History_Items_to_Keep:"Amount of History Items to Keep",Flag_New_Comments:"Flag New Comments",Typing_Previews:"Typing Previews",Show_NSFW:"Show NSFW",Live_Private_Messages:"Live Private Messages",Live_Notification_Updates:"Live Notification Updates",Desktop_Notifications:"Desktop Notifications",Notifications:"Notifications",Redirect_Reddit:"Redirect Reddit",Hover_Over_Previews:"Hover Over Previews",Youtube_Video_Setting:"Youtube Video Setting",HTML5:"HTML5",Flash:"Flash",Dark:"Dark",Light:"Light",Font_Size:"Font Size",Default_Column_Width:"Default Column Width",Visual_Animations:"Visual Animations",Stretch_Background:"Stretch Background",Background:"Background",Enable_Syncing:"Enable Syncing",Reditr_Account_Information:"Reditr Account Information",Login_Register:"Login / Register",Recover_Password:"Recover Password",Enable_Macros:"Enable Macros",New_Macro:"New Macro",Create:"Create",Existing_Macros:"Existing Macros",Trophy_Case:"Trophy Case",Manage_Tags:"Manage Tags",Send_Message:"Send Message",Display_Flair_Styles:"Display Flair Styles",Manage_My_Flairs:"Manage My Flairs",Enable_Subreddit_Bar:"Enable Subreddit Bar",My_Subreddit_Bar:"My Subreddit Bar",Import_RES_Tags:"Import RES Tags",Instructions:"Instructions",Import_Tags:"Import Tags",Submit:"Submit",Donate:"Donate",Visit_Subreddit:"Visit Subreddit",Report_Bugs:"Report Bugs",Default:"Default",New_Messages:"New Messages",Direct_Replies:"Direct Replies",Gallery_Home:"Gallery Home",Remove_Friend:"Remove Friend",Close_Comments:"Close Comments",Downloading_comments:"Downloading comments",Loading_comments:"Loading comments",Create_Column:"Create Column",View_Comments:"View Comments",Send:"Send",Community_Settings:"Community Settings",Edit_Moderators:"Edit Moderators",Edit_Approved_Submitters:"Edit Approved Submitters",Traffic_Stats:"Traffic Stats",Unsave_Comment:"Unsave Comment",Traffic:"Traffic",Moderation_Queue:"Moderation Queue",Reported_Links:"Reported Links",Deleted:"Deleted",Spam:"Spam",Ban_Users:"Ban Users",Un_Save:"Un-Save",Removed:"Removed",Unmoderated_Links:"Unmoderated Links",Go_Forward:"Go Forward",Reported:"Reported",Advanced_Search:"Advanced Search",Searching_for:"Searching for",Mod_Mail:"Mod Mail",Modqueue:"Modqueue",Mine:"Mine",Not_Mine:"Not Mine",Both:"Both",Go_Back:"Go Back",Hide:"Hide",Enter_name_of_subreddit:"Enter name of subreddit",Approve:"Approve",relevance:"relevance",Moderation_Tools:"Moderation Tools",Click_to_confirm:"Click to confirm",Promote_Reditr:"Promote Reditr",Superscript:"Superscript",Wait:"Wait",Drag_images_here_to_upload_them_to_Imgur:"Drag images here to upload them to Imgur",Password_Recovery:"Password Recovery",requires_restart:"requires restart",Remove_Column:"Remove Column",Use_Quickview:"Use Quickview",Add_Account:"Add Account",Redirect_Reddit_links_to_Reditr:"Redirect Reddit links to Reditr",Visit_Website:"Visit Website",Save_image:"Save image",Open_link_in_new_window:"Open link in new window",Copy_link_url:"Copy link url",Copy_Reddit_comments_url:"Copy Reddit comments url",Share_with_Facebook:"Share with Facebook",Share_with_Twitter:"Share with Twitter","Share_with_Google+":"Share with Google+",Save_link:"Save link",Language:"Language",Automatically_Load_All_Comments:"Automatically Load All Comments",Yes:"Yes",No:"No","Are_you_sure_you_want_to_delete_this_comment?":"Are you sure you want to delete this comment?",Confirm_Delete_Comment:"Confirm Delete Comment",You_are_viewing_the_source_of:"You are viewing the source of",comment:"comment","Are_you_sure_you_want_to_report_this_comment?":"Are you sure you want to report this comment?",Clear_Messages:"Clear Messages",Subscribed_Subreddits_as_Columns:"Use Subscribed Subreddits as Columns",More_Options:"More Options",Mark_Read_on_Hover_Over_Delay:"Mark Read on Hover Over Delay in milliseconds",Default_Scrollbar_Width:"Default Scrollbar Width",Account:"Account",Status:"Status",Subscription_Cycle:"Subscription Cycle",Subscription_Cost_per_Cycle:"Subscription Cost per Cycle",Next_Payment:"Next Payment",Monthly:"Monthly",Yearly:"Yearly",Subscription:"Subscription",Show_Quick_Buttons_on_Posts:"Show Quick Buttons on Posts",My_Subscribed_Subreddits:"My Subscribed Subreddits","Infinite_Column_Scroll_(EXPERIMENTAL)":"Infinite Column Scroll (EXPERIMENTAL)",Subsriptions:"Subsriptions",Subscriptions:"Subscriptions",My_Profile:"My Profile","You_currently_have_Reddit_set_to_fetch_100_posts_at_a_time._This_setting_is_not_compatible_with_Reditr,_and_you_must_change_it_back_to_25_in_order_to_receive_optimal_performance_from_Reditr.":"You currently have Reddit set to fetch 100 posts at a time. This setting is not compatible with Reditr, and you must change it back to 25 in order to receive optimal performance from Reditr.","Don't_show_this_warning_again":"Don't show this warning again",Confirm:"Confirm",TOS:"TOS",NSFW_Ribbon:"NSFW Ribbon",Login:"Login",Filters:"Filters",Stream_View:"Stream View",Column_View:"Column View",Show_Top_Comments_in_Stream_View:"Show Top Comments in Stream View",Downloading_List_of_your_Subreddits:"Downloading List of your Subreddits"}];function desktopNotification(c,b){function a(){try{var g=window.webkitNotifications;var f=g.createNotification("http://i.imgur.com/mDZWP.png",c,b);f.show();setTimeout(function(){f.cancel()},5000)}catch(e){alert(e.message)}}if(window.webkitNotifications){var d=window.webkitNotifications;if(d.checkPermission()){d.requestPermission(a)}else{a()}}if(window.isChromePackaged){chrome.notifications.create("reditr_notif",{type:"basic",title:c,message:b,iconUrl:"images/48x48.png"},function(){})}}(function(){function G(h,g,k){h.addEventListener?h.addEventListener(g,k,!1):h.attachEvent("on"+g,k)}function b(h){if("keypress"==h.type){var g=String.fromCharCode(h.which);h.shiftKey||(g=g.toLowerCase());return g}return Q[h.which]?Q[h.which]:a[h.which]?a[h.which]:String.fromCharCode(h.which).toLowerCase()}function n(h,g){h=h||{};var l=!1,k;for(k in N){h[k]&&N[k]>g?l=!0:N[k]=0}l||(L=!1)}function M(u,t,s,r,m){var p,q,l=[],k=s.type;if(!O[u]){return[]}"keyup"==k&&i(u)&&(t=[u]);for(p=0;p<O[u].length;++p){if(q=O[u][p],!(q.seq&&N[q.seq]!=q.level)&&k==q.action&&("keypress"==k&&!s.metaKey&&!s.ctrlKey||t.sort().join(",")===q.modifiers.sort().join(","))){r&&q.combo==m&&O[u].splice(p,1),l.push(q)}}return l}function e(h,g,k){if(!P.stopCallback(g,g.target||g.srcElement,k)&&!1===h(g,k)){g.preventDefault&&g.preventDefault(),g.stopPropagation&&g.stopPropagation(),g.returnValue=!1,g.cancelBubble=!0}}function d(k){"number"!==typeof k.which&&(k.which=k.keyCode);var h=b(k);if(h){if("keyup"==k.type&&c==h){c=!1}else{var r=[];k.shiftKey&&r.push("shift");k.altKey&&r.push("alt");k.ctrlKey&&r.push("ctrl");k.metaKey&&r.push("meta");var r=M(h,r,k),q,l={},m=0,p=!1;for(q=0;q<r.length;++q){r[q].seq?(p=!0,m=Math.max(m,r[q].level),l[r[q].seq]=1,e(r[q].callback,k,r[q].combo)):!p&&!L&&e(r[q].callback,k,r[q].combo)}k.type==L&&!i(h)&&n(l,m)}}}function i(g){return"shift"==g||"ctrl"==g||"alt"==g||"meta"==g}function J(h,g,l){if(!l){if(!K){K={};for(var k in Q){95<k&&112>k||Q.hasOwnProperty(k)&&(K[Q[k]]=k)}}l=K[h]?"keydown":"keypress"}"keypress"==l&&g.length&&(l="keydown");return l}function H(x,w,v,u,r){I[x+":"+v]=w;x=x.replace(/\s+/g," ");var s=x.split(" "),t,q,p=[];if(1<s.length){var m=x,l=v;N[m]=0;l||(l=J(s[0],[]));x=function(){L=l;++N[m];clearTimeout(o);o=setTimeout(n,1000)};v=function(g){e(w,g,m);"keyup"!==l&&(c=b(g));setTimeout(n,10)};for(u=0;u<s.length;++u){H(s[u],u<s.length-1?x:v,l,m,u)}}else{q="+"===x?["+"]:x.split("+");for(s=0;s<q.length;++s){t=q[s],j[t]&&(t=j[t]),v&&("keypress"!=v&&f[t])&&(t=f[t],p.push("shift")),i(t)&&p.push(t)}v=J(t,p,v);O[t]||(O[t]=[]);M(t,p,{type:v},!u,x);O[t][u?"unshift":"push"]({callback:w,modifiers:p,action:v,seq:u,level:r,combo:x})}}for(var Q={8:"backspace",9:"tab",13:"enter",16:"shift",17:"ctrl",18:"alt",20:"capslock",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"ins",46:"del",91:"meta",93:"meta",224:"meta"},a={106:"*",107:"+",109:"-",110:".",111:"/",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"},f={"~":"`","!":"1","@":"2","#":"3",$:"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",_:"-","+":"=",":":";",'"':"'","<":",",">":".","?":"/","|":"\\"},j={option:"alt",command:"meta","return":"enter",escape:"esc"},K,O={},I={},N={},o,c=!1,L=!1,R=1;20>R;++R){Q[111+R]="f"+R}for(R=0;9>=R;++R){Q[R+96]=R}G(document,"keypress",d);G(document,"keydown",d);G(document,"keyup",d);var P={bind:function(h,g,l){h=h instanceof Array?h:[h];for(var k=0;k<h.length;++k){H(h[k],g,l)}return this},unbind:function(h,g){return P.bind(h,function(){},g)},trigger:function(h,g){if(I[h+":"+g]){I[h+":"+g]({},h)}return this},reset:function(){O={};I={};return this},stopCallback:function(h,g){return(1==1)?!1:"INPUT"==g.tagName||"SELECT"==g.tagName||"TEXTAREA"==g.tagName||g.contentEditable&&"true"==g.contentEditable}};window.Mousetrap=P;"function"===typeof define&&define.amd&&define(P)})();var nameToCode={backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,pause:19,capsclock:20,escape:27,pageup:33,pagedown:34,end:35,home:36,left:37,up:38,right:39,down:40,ins:45,del:46,"0":48,"1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,a:65,b:66,c:67,d:68,e:69,f:70,g:71,h:72,i:73,j:74,k:75,l:76,m:77,n:78,o:79,p:80,q:81,r:82,s:83,t:84,u:85,v:86,w:87,x:88,y:89,z:90,"pad-0":96,"pad-1":97,"pad-2":98,"pad-3":99,"pad-4":100,"pad-5":101,"pad-6":102,"pad-7":103,"pad-8":104,"pad-9":105,"*":106,"+":107,"-":109,".":190,"/":111,f1:112,f2:113,f3:114,f4:115,f5:116,f6:117,f7:118,f8:119,f9:120,f10:121,f11:122,f12:123,"=":187,",":188,"/":191,"\\":220,command:91,cmdOrControl:(navigator.appVersion.indexOf("Mac")==-1)?17:91};window.keyModifierAsString=navigator.appVersion.indexOf("Mac")==-1?"ctrl":"command";var codeToName={8:"backspace",9:"tab",13:"enter",16:"shift",17:"ctrl",18:"alt",19:"pause",20:"capslock",27:"escape",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"ins",46:"del",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",96:"0",97:"pad-1",98:"pad-2",99:"pad-3",100:"pad-4",101:"pad-5",102:"pad-6",103:"pad-7",104:"pad-8",105:"pad-9",106:"*",107:"+",109:"-",190:".",111:"/",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",121:"f10",122:"f11",123:"f12",187:"=",188:",",191:"/",220:"\\",91:"command"};var shortcuts={openSearch:{action:function(){searchPopup(window.connection,window.tabManagerObj,window.quickSearchMostRecent);setTimeout(function(){$("#addSearch_search").focus()},1000);return false},desc:"Open Search"},reply:{action:function(){$("#replyGlobal").click();return false},desc:"Open Reply Popup"},newThread:{action:function(){$("#createPostNavButton").click();return false},desc:"Open New Thread Popup"},messages:{action:function(){$("#notificationCounter").click();return false},desc:"Open Notifications"},columnDropdown:{action:function(){$("#pageSelector .alien").filter(":visible").click();return false},desc:"Display Column Dropdown"},accounts:{action:function(){$("#accounts").click();return false},desc:"Accounts"},goHome:{action:function(){$("#homeNav").click();return false},desc:"Go Home"},goBack:{action:function(){history.back();return false},desc:"Go Back"},goForward:{action:function(){history.forward();return false},desc:"Go Forward"},openQuickview:{action:function(){$("#quickView").click();return false},desc:"Open Quickview"},submit:{action:function(){var a=$("#SubmitReply");if(a.length>0){a.click();return}$(".submitButton, .green").first().click();return false},desc:"Submit"},closePopup:{action:function(){var b=$(".contextMenu");if(b.length){b.remove()}else{var a=$('[data-message="close"]');if(a.length){a.click()}else{var c=$(".menubarDropdown");if(c.length){c.remove()}}}return false},desc:"Close Active Item"},openSettings:{action:function(a){a.preventDefault();a.stopPropagation();new settingsPopup(window.connection,window.tabManagerObj);return false},desc:"Open Settings"},nextGalleryItem:{action:function(){if(document.activeElement.tagName.search(/INPUT|TEXTAREA/)>-1){return true}if($("#galleryPlayground").length){$("#galleryPlayground .forwardButton").filter(":visible").click();return false}else{if(!tabManager.prototype.mailViewActive){$(".currentPage").next().filter(":visible").click();return false}}},desc:"Next Gallery Item / Column's Page"},prevGalleryItem:{action:function(){if(document.activeElement.tagName.search(/INPUT|TEXTAREA/)>-1){return true}if($("#galleryPlayground").length){$("#galleryPlayground .backButton").filter(":visible").click();return false}else{if(!tabManager.prototype.mailViewActive){$(".currentPage").prev().filter(":visible").click();return false}}},desc:"Previous Gallery Item / Column's Page"},toggleScopeLeft:{action:function(d,c){if(document.activeElement.tagName.search(/INPUT|TEXTAREA/)>-1||$(".complexAlertBackdrop").length!=0){return true}if(c!="next"){c="prev"}if(tabManager.prototype.mailViewActive){$("#ColumnContainer .container.glow").removeClass("glow");column.prototype.activeColumn=$("#ColumnContainer .container.stickleft").addClass("glow");return false}if(typeof column.prototype.activeColumn=="undefined"){var b=column.prototype.activeColumn=$('#ColumnContainer .container[data-page="'+window.tabManagerObj.currentPage+'"]:first');b.addClass("glow");shortcuts.toggleItemUp.action();return false}var a=column.prototype.activeColumn[c]();if(!a.is(".container")){return false}a.addClass("glow");column.prototype.activeColumn.removeClass("glow");if(window.tabManagerObj.currentPage!=a.attr("data-page")){window.tabManagerObj.changePage(a.attr("data-page"))}column.prototype.activeColumn=a;shortcuts.toggleItemUp.action();setTimeout(function(){$("input").blur()},250);return false},desc:"Previous Column"},toggleScopeRight:{action:function(a){return shortcuts.toggleScopeLeft.action(a,"next")},desc:"Next Column"},toggleItemUp:{action:function(f,h){if(document.activeElement.tagName.search(/INPUT|TEXTAREA/)>-1||$(".complexAlertBackdrop").length!=0){return true}if(h!="next"){h="prev"}if(typeof column.prototype.activeColumn=="undefined"){shortcuts.toggleScopeLeft.action();return false}if(column.prototype.activeColumn.find(".current").length==0){$(".current").removeClass("current");window.armForEnter=column.prototype.activeColumn.find(".Post:visible:first").addClass("current");return false}var g=column.prototype.activeColumn.find(".current");var a=g[h](":visible");if(a.length!=0){a}else{a=g[h+"Until"](":visible").last()[h]()}if(a.is("#searchElements")){return false}else{if(!a.is(".LoadingPost")){g.removeClass("current");a.addClass("current");window.armForEnter=a}var b=a.parent().parent();var j=b.height();var d=b.scrollTop();var i=a.position().top;var c=a.height();if((j+d)<(i+c+d)){b.scrollTop(i+d-j+c+10)}else{if(d>(d+i)){b.scrollTop(i+d)}}}return false},desc:"Previous post/comment"},toggleItemDown:{action:function(a){return shortcuts.toggleItemUp.action(a,"next")},desc:"Next post/comment"},upvote:{action:function(d,a){if(document.activeElement.tagName.search(/INPUT|TEXTAREA/)>-1||$(".complexAlertBackdrop").length!=0){return}if(a!="downVote"){a="upVote"}if($("#galleryPlayground").length){$("#galleryPlayground ."+a).click()}else{var b=tabManagerObj.columns[window.armForEnter.parent().parent().parent().parent().attr("id")];if(typeof b!="undefined"){var c=window.armForEnter.find("."+a);b.sourceObject[a](c,c.parent().parent().attr("id"))}return false}},desc:"Upvote Item"},downvote:{action:function(a){return shortcuts.upvote.action(a,"downVote")},desc:"Downvote Item"}};function setShortcut(a,c,b){a.setting("macroShortcuts",function(d){d[c]=b;a.setting("macroShortcuts",d)})}function applyShortcuts(a){a.setting("macros_enabled",function(b){Mousetrap.reset();if(!b){return}a.setting("macroShortcuts",function(d){for(var c in d){Mousetrap.bind(d[c],shortcuts[c].action)}body.off(".armForEnter").on("keypress.armForEnter",function(g){if(g.keyCode==13&&document.activeElement.tagName.search(/INPUT|TEXTAREA/)==-1&&typeof window.armForEnter!="undefined"&&$(window.armForEnter).length!=0){if(window.armForEnter.is(".Post")){var f=tabManagerObj.columns[window.armForEnter.parent().parent().parent().parent().attr("id")];if(typeof f!="undefined"){f.sourceObject.openPost(window.armForEnter)}}}})})})}(function(a){a.retryAjax=function(c){if(c.url.indexOf("callback=")>-1||c.url.indexOf("jsonp=")>-1){c.dataType="jsonp"}var b;c.tryCount=(!c.tryCount)?0:c.tryCount;c.retryLimit=(!c.retryLimit)?2:c.retryLimit;c.suppressErrors=true;if(c.error){b=c.error;delete c.error}else{b=function(){}}c.complete=function(d,e){if(a.inArray(e,["timeout","abort","error"])>-1){this.tryCount++;if(this.tryCount<=this.retryLimit){if(this.tryCount===this.retryLimit){this.error=b;delete this.suppressErrors}a.ajax(this);return true}return true}};a.ajax(c)}}(jQuery));jQuery.expr[":"].icontains=jQuery.expr.createPseudo(function(a){return function(b){return jQuery(b).text().toUpperCase().indexOf(a.toUpperCase())>=0}});window.reloadApp=function(){window.location.reload()};function analytics(a){if(window.location.href.indexOf("background.html")==-1){window._gaq=typeof _gaq=="undefined"?[]:_gaq;_gaq.push(["_setAccount","UA-32339730-2"]);_gaq.push(["_trackPageview",location.pathname+location.search+location.hash]);if(!a){(function(){var c=document.createElement("script");c.type="text/javascript";c.async=true;c.src="https://ssl.google-analytics.com/ga.js";var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(c,b)})()}}}function numberWithCommas(a){return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")}function translateNumberWithComma(a,b){return numberWithCommas(parseInt(a.replace(/,/g,""))+b)}function browserName(){var f=navigator.appVersion;var e=navigator.userAgent;var g=navigator.appName;var h=""+parseFloat(navigator.appVersion);var b=parseInt(navigator.appVersion,10);var a,d,c;if((d=e.indexOf("Opera"))!=-1){g="Opera";h=e.substring(d+6);if((d=e.indexOf("Version"))!=-1){h=e.substring(d+8)}}else{if((d=e.indexOf("MSIE"))!=-1){g="Microsoft Internet Explorer";h=e.substring(d+5)}else{if((d=e.indexOf("Chrome"))!=-1){g="Chrome";h=e.substring(d+7)}else{if((d=e.indexOf("Safari"))!=-1){g="Safari";h=e.substring(d+7);if((d=e.indexOf("Version"))!=-1){h=e.substring(d+8)}}else{if((d=e.indexOf("Firefox"))!=-1){g="Firefox";h=e.substring(d+8)}else{if((a=e.lastIndexOf(" ")+1)<(d=e.lastIndexOf("/"))){g=e.substring(a,d);h=e.substring(d+1);if(g.toLowerCase()==g.toUpperCase()){g=navigator.appName}}}}}}}if((c=h.indexOf(";"))!=-1){h=h.substring(0,c)}if((c=h.indexOf(" "))!=-1){h=h.substring(0,c)}b=parseInt(""+h,10);if(isNaN(b)){h=""+parseFloat(navigator.appVersion);b=parseInt(navigator.appVersion,10)}return g}function load_css(c,f,b){var e=new Date().getTime();var d=document.getElementsByTagName("head")[0];var a=document.createElement("link");a.type="text/css";a.rel="stylesheet";a.href=c;a.media="screen";a.id=e;if(b&&b.id){a.id=b.id}a.onreadystatechange=function(){if(typeof f=="function"){f()}};a.onload=function(){if(typeof f=="function"){f()}};d.appendChild(a);return e}function countProperties(b){var a=0;for(var c in b){if(b.hasOwnProperty(c)){++a}}return a}function popupBrowser(b,d,c){d=d||"_blank";c=c||"window";var a="";if(c=="popup"){a="width=550,height=420,scrollbars=no"}return window.open(b,d,a)}function downloadImage(a){if(DESKTOP||window.isChromePackaged){var b=window.open("http://api.reditr.com/scripts/download.php?img="+a,"_blank","width=20,height=20");b.blur();window.focus();setInterval(function(){if(b.location=="null"){b.close()}},100)}else{window.location="http://api.reditr.com/scripts/download.php?img="+a}}var months=new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec");function formatDate(g){g=(Date.now()/1000)-g;if(g<1){return["just now","updateTime"]}var b,f,e,d;b=g/60;if(b>30240){var g=new Date(new Date().getTime()-(b*60000));var a="th";var c=g.getDate();if(c==1||c==21||c==31){a="st"}else{if(c==2||c==22){a="nd"}else{if(c==3||c==23){a="rd"}}}e=(months[g.getMonth()]+" "+c+a+" "+g.getFullYear())}else{if(b>=10080){f=Math.floor(b/10080);e=f+"w ago";d="updateWeeks"}else{if(b>=1440){f=Math.floor(b/1440);e=f+"d ago";d="updateDays"}else{if(b>=60){f=Math.floor(b/60);e=f+"h ago";d="updateHours"}else{if(b>=1){f=Math.floor(b);e=f+"m ago";d="updateTime updateMinutes"}else{f=Math.floor(b*60);e=f+"s ago";d="updateTime updateSeconds"}}}}}return[e,d]}function updateDate(a,c,b){var d=$(a[c]);var e=d.attr("data-timestamp");d.html(formatDate(e)[0]);c++;if(c>=b){a=$(".updateTime");b=a.length;c=0}setTimeout(function(){updateDate(a,c,b)},1000)}(function(a){a.fn.toggleSwitch=function(){this.hide();this.each(function(){var j=a(this);var b='<span class="buttongroup toggleSwitch">';var g=j.val();var f=false;var h="";var c="";var e=j.find("option").size();var d=0;j.find("option").each(function(){var i=a(this);if(f==false&&g==i.val()){f=true;h=" btn_selected"}else{h=""}d++;if(e==d){c="last"}else{if(d==1){c="first"}else{c="middle"}}b=b+'<button class="toggleButton '+c+h+'" value="'+i.val()+'" data-message="'+i.attr("data-message")+'">'+i.html()+"</button>"});b=b+"</span>";j.wrap("<span>").after(b)});this.parent().find(".toggleSwitch .toggleButton").click(function(c){var b=a(this);c.preventDefault();b.parent().find(".toggleButton").removeClass("btn_selected");b.addClass("btn_selected");b.parent().parent().find("select").val(b.attr("value")).change()});return this}})(jQuery);(function(c){var b=0;var a=new Array();c.fn.doneTyping=function(f,d){if(typeof(d)=="undefined"){d=800}b++;this.keydown(function(){clearTimeout(a[b])});var e=this;this.keydown(function(){a[b]=setTimeout(function(){f.call(e)},d)});return this}})(jQuery);function nl2br(c,b){var a=(b||typeof b==="undefined")?"<br />":"<br>";return(c+"").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,"$1"+a+"$2")}function capitalize(b){if(typeof b=="object"){var a=b.length;var d=[];for(var c=0;c<a;c++){d.push(capitalize(b[c]))}return d}return b.charAt(0).toUpperCase()+b.slice(1)}function clipboard_set(b){var a=document.createElement("input");a.setAttribute("style","position: absolute; top: -1000px; left: -1000px; width: 1px; height: 1px;");a.contentEditable=true;document.body.appendChild(a);a.value=b;a.unselectable="off";a.focus();a.select();document.execCommand("copy");document.body.removeChild(a)}function strip_tags(b){var a=document.createElement("DIV");a.innerHTML=b.replace(/<br(.*?)>/gi,"LINEBREAK");return(a.textContent||a.innerText).replace(/LINEBREAK/gi,"<br>").replace(/<br(.*?)>[\s\S]<br(.*?)>[\s\S]<br(.*?)>/gi,"<br><br>")}(function(c){var b=new Array();var a=0;c.fn.autoHeight=function(){return this.each(function(){var e=c(this);e.attr("defaultheight",e.height()).attr("defaultwidth",e.width()).css("overflow-y","hidden");var d=c('<div style="word-wrap: break-word; position: absolute; left: -9999px;"></div>').css({"font-size":e.css("font-size"),"font-family":e.css("font-family"),width:e.width()}).appendTo("body");var f=function(){d.html(e.val().replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n$/,"<br/>&nbsp;").replace(/\n/g,"<br />"));var h=d.height();if(h>e.attr("defaultheight")){e.css("height",h)}else{e.css("height",e.attr("defaultheight"))}if(h>e.css("max-height").slice(0,-2)){e.css("overflow-y","scroll")}else{e.css("overflow-y","hidden")}};e.keyup(f).keydown(f).change(f);f();var g=++a;b[g]=setInterval(function(){if(e.width()!=e.attr("defaultwidth")){e.attr("defaultwidth",e.width());d.css("width",e.width());f();if(e.width()==0){d.remove();clearInterval(b[g])}}},300)});return this}})(jQuery);jQuery.fn.outerHTML=function(a){return(a)?this.before(a).remove():jQuery("<p>").append(this.eq(0).clone()).html()};window.decode_html_entities_node=document.createElement("DIV");function decode_html_entities(a){window.decode_html_entities_node.innerHTML=a;return window.decode_html_entities_node.textContent}function setBadge(a){window.document.title=((a!=""&&a!=0)?"("+a+") ":"")+window.document.title.replace(/\((.*?)\) /,"")}function imgurUpload(b,a){uploadHandler.createUploadBuffer(b,a)}function waitForSelector(a,d,c){var c=(typeof c=="undefined")?60:c;var b=$(a);if(b.length){d(b)}else{if(--c>0){setTimeout(function(){waitForSelector(a,d,c)},250)}}}jQuery.event.special.tripleclick={delegateType:"click",bindType:"click",handle:function(c){var b=c.handleObj;var d=jQuery.data(c.target);var a=null;d.clicks=(d.clicks||0)+1;if(d.clicks%3===0){c.type=b.origType;a=b.handler.apply(this,arguments);c.type=b.type;return a}}};function getImageBlob(a,c){var b=new XMLHttpRequest();b.open("GET",a,true);b.responseType="blob";b.onload=function(d){if(typeof c=="function"){c(window.webkitURL.createObjectURL(this.response))}};b.send()}function getFusionAd(b,a){$.ajax({url:a?"http://adn.fusionads.net/api/1.0/invokeZone.json.php":"http://api.reditr.com/sync/?stats",dataType:"json",type:"GET",data:{zoneid:258,rand:(Date.now()*Math.random())+"_"+Date.now()},error:function(e,d,c){if(!a){getFusionAd(b,true);$.get("http://api.reditr.com/ads/index.php",{result:"proxied",error:e.status})}else{$.get("http://api.reditr.com/ads/index.php",{result:"error",error:e.status})}},success:function(c){if(typeof c=="string"){c=JSON.parse(c.replace(/\\'/g,""))}$.get("http://api.reditr.com/ads/index.php",{result:"success"});b(c[0].ad)}})}function analytics(){if(this instanceof analytics){}else{if(analytics.prototype.sharedInstance){return analytics.prototype.sharedInstance}else{analytics.prototype.sharedInstance=new analytics();return analytics.prototype.sharedInstance}}}analytics.prototype={initialized:false,preventFileInjection:false,init:function(){if(window.location.href.indexOf("background.html")==-1){window._gaq=typeof _gaq=="undefined"?[]:_gaq;_gaq.push(["_setAccount","UA-32339730-2"]);_gaq.push(["_trackPageview",location.pathname+location.search+location.hash]);if(!this.preventFileInjection){(function(){var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://ssl.google-analytics.com/ga.js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(b,a)})()}initialized=true}},track:function(a,b){_gaq.push(["_trackEvent",a,b])}};var navigationPopup=trick({defaults:{placeholder:"",bindTo:"body",value:""}});navigationPopup.prototype.init=function(){var e=$(this.bindTo);if(typeof this.value=="undefined"||this.value=="undefined"){this.value=""}var d=$('<div style="position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; background-color: rgba(0, 0, 0, 0.1)">').appendTo("body");var g=this.searchBox=$('<div class="navigationInputBox"><input placeholder="'+this.placeholder+'" value="'+this.value+'"></div>').appendTo("body");var c=g.find("input");c.focus().select();var f=e.offset();f.left+=e.outerWidth();f.top+=(e.outerHeight()+g.outerHeight())/2;g.css(f);d.click(function(){d.remove();g.remove()});var a;var b=this;c.on("keyup",function(h){clearTimeout(a);a=setTimeout(function(){if(typeof b.onDoneTyping=="function"){b.onDoneTyping(c.val())}},500);if(h.keyCode==27){d.remove();g.remove()}else{if(h.keyCode==13){this.onEnter(c.val());d.remove();g.remove()}}}.bind(this));g.on("click",".resultItem",function(){b.onClickItem($(this).attr("data-name"),$(this).attr("data-value"))})};navigationPopup.prototype.populate=function(c){this.searchBox.find(".resultItem").remove();var a=[];for(var b=0;b<c.length;b++){a.push('<div class="resultItem" data-value="'+c[b].value+'">'+c[b].name+"</div>")}this.searchBox.append(a.join(""))};var updateNavCurrentUsertype="guest";var updateNavCurrentPage="None";function updateNav(b,a){if(b=="person"){updateNavCurrentUsertype=a}else{if(b=="page"){updateNavCurrentPage=a}}var c=$("#Header #Nav div, #leftNav");c.find(".link, .node").not(".node.title").hide();c.find("."+updateNavCurrentUsertype).show();c.find("."+updateNavCurrentPage).show();c.find("."+updateNavCurrentUsertype+"_and_"+updateNavCurrentPage).show();c.find(".not_"+updateNavCurrentPage).hide()}function bindNavigation(b){var f=$("#Header #Nav");var c=$("#leftNav");c.on("click.nav",".node.title",function(){var h=$(this);var g=h.parent();if(g.hasClass("open")){g.removeClass("open");h.find(".icon-chevron-up").removeClass("icon-chevron-up").addClass("icon-chevron-down");b.userVariable("sidebarClosed",function(i){if(typeof i!="object"){i={isClosed:false,sections:{}}}i.sections[g.attr("id")]=false;b.userVariable("sidebarClosed",i)})}else{g.addClass("open");h.find(".icon-chevron-down").removeClass("icon-chevron-down").addClass("icon-chevron-up");b.userVariable("sidebarClosed",function(i){if(typeof i!="object"){i={isClosed:false,sections:{}}}i.sections[g.attr("id")]=true;b.userVariable("sidebarClosed",i)})}});c.on("click.nav","#newMessage",function(){notifications(self.connection,window.tabManagerObj,{action:"compose",username:""})});f.on("click.nav","#previousHistory",function(){historyAPI().back()});f.on("click.nav","#forwardHistory",function(){historyAPI().forward()});f.on("click.nav","#refreshColumns",function(){if(window.streamInstance){window.streamInstance.render()}else{window.tabManagerObj.refreshAll()}});f.on("click.nav","#logoutNav",function(){logoutPopup(b)});f.on("click.nav","#homeNav",function(){if(window.streamInstance){window.location="#/Stream"}else{if(window.location.hash.indexOf("/post/")!=-1){window.location="#/Home/page/"+tabManagerObj.currentPage}else{tabManagerObj.changePage(1)}}});c.on("click.nav","#newPost",function(){createPost(this,b,window.tabManagerObj)});f.on("click.nav","#createPostNavButton",function(){createPost(this,b,window.tabManagerObj)});f.on("click.nav","#invokeHistory",function(){historyDropdown(b)});c.on("click.nav","#addColumn",function(){addColumn(b,window.tabManagerObj)});c.on("click.nav","#quickView",function(){storageWrapper.prototype.fetch("last_checked_quickview",function(h){var g=new navigationPopup({placeholder:locale.Enter_name_of_subreddit,bindTo:"#quickView",value:h});g.onDoneTyping=function(i){if(i==""||i==false||i==null){return}i=i.replace("/r/","");if(i.substr(0,2)=="r/"){i=i.substr(2)}storageWrapper.prototype.save("last_checked_quickview",i);reddit().searchForSubreddit(i,function(l){var k=[];for(var j=0;j<l.length;j++){k.push({name:l[j].name,value:l[j].name})}g.populate(k)})};g.onClickItem=function(i,j){if(window.streamInstance){streamInstance.set("url","/r/"+j+"/.json")}else{new quickView(b,j,"/r/"+j.toLowerCase()+"/")}};g.onEnter=function(i){if(i==""||i==false||i==null){return}i=i.replace("/r/","");if(i.substr(0,2)=="r/"){i=i.substr(2)}storageWrapper.prototype.save("last_checked_quickview",i);if(window.streamInstance){streamInstance.set("url","/r/"+i+"/.json")}else{new quickView(b,i,"/r/"+i.toLowerCase()+"/")}}})});f.on("click.nav",".accountsButton",function(g){accountsPopup(this,b,window.tabManagerObj)});var d=false;function a(){$("#searchNav").removeClass("active");$("body").off(".searchInputActive")}function e(){$("body").off(".searchInputActive")}f.on("keyup.nav","#searchNav input",function(g){clearTimeout(window.quickSearchTimeout);if(g.keyCode==13){quickSearch($("#searchNav input").val(),true,b,window.tabManagerObj,a,e,d);return}window.quickSearchTimeout=setTimeout(function(){quickSearch($("#searchNav input").val(),false,b,window.tabManagerObj,a,e,d)},500)});f.on("click.nav","#searchNav input",function(h){setTimeout(function(){var i=true;$("body").off(".searchInputActive").on("click.searchInputActive",function(){if(i){a()}});$("#searchNav input").off(".searchInputActive").on("click.searchInputActive",function(j){i=false;setTimeout(function(){i=true},500)})},500);$("#searchNav").addClass("active");var g=$(this).val();quickSearch(g,false,b,window.tabManagerObj,a,e,d)});f.on("click.nav","#searchType .active",function(i){i.stopPropagation();var g=$(this);if(g.html()=="Posts"){var h="Subreddits"}else{var h="Posts"}g.html(h);d=h;quickSearch($("#searchNav input").val(),true,b,window.tabManagerObj,a,e,h);$("#searchNav input").focus().select()});f.on("click.nav",".banner",function(){var g=$("body");if(g.hasClass("leftPaneOpen")){hideSidebar()}else{showSidebar()}});f.on("click.nav","#notificationCounter",function(){notifications(b,window.tabManagerObj)});f.on("click.nav","#settingsNav",function(){var g=new settingsPopup(b,window.tabManagerObj)});f.on("click.nav","#openSettings",function(){new settingsPopup(reddit(),window.tabManagerObj)});c.on("click.nav","#viewFriends",function(){var g=new friendsList(b,window.tabManagerObj)});f.on("click.nav","#favouritesButton",function(){var g="/user/"+b.user.username+"/saved.json";new quickView(b,"Favourites",g,{SPECIAL:true,TEMP:true,SORT:false},{SORT:false,SPECIAL:true})});c.on("click.nav","#toggleStreamView",function(){var g=window.location.href.indexOf("#/Home")>-1?"Stream":"Home";window.location.href="#/"+g;storageWrapper.prototype.save("mainPage",g)});c.on("click.nav","#viewGallery",function(){var g=(window.location.hash.match(/~r~(.*?)~/)!=null?window.location.hash.match(/~r~(.*?)~/).pop():"/r/pics");storageWrapper.prototype.fetch("last_checked_quickview",function(i){var h=new navigationPopup({placeholder:locale.Enter_name_of_subreddit,bindTo:"#viewGallery",value:g?g:i});h.onEnter=function(k){if(k==""||k==false||k==null){return}k=k.replace("/r/","");if(k.substr(0,2)=="r/"){k=k.substr(2)}storageWrapper.prototype.save("last_checked_quickview",k);var j=new column("/r/"+k+"/",undefined,activePlayground,b,tabManagerObj,{SORT:"hot",SPECIAL:true},k).startup();setTimeout(function(){new gallery(j,"default",function(){j.shutdown();delete j})},150)}})});c.on("click.nav","#viewUser",function(){storageWrapper.prototype.fetch("last_profile_checked",function(h){var g=new navigationPopup({placeholder:"Enter a Username",bindTo:"#viewUser",value:h});g.onEnter=function(j){if(j==""||j==false||j==null){return}storageWrapper.prototype.save("last_profile_checked",j);var i=new userInfo(j,reddit(),window.tabManagerObj,"")}})});c.on("click.nav","#settingsNav .node:not(.title,#settingsProfile)",function(){var g=new settingsPopup(b,window.tabManagerObj,$(this).attr("data-section"))});c.on("click.nav","#settingsProfile.node",function(){var g=new userInfo(self.connection.user.username,self.connection,window.tabManagerObj)})}function createLeftNav(){var a='<div id="mainNav" class="group open"> 			<div class="node title">Common<div class="icon-chevron-up"></div></div>				<div class="node member guest" id="toggleStreamView"><div class="nodeIcon icon-th"></div><span class="msg">'+locale.Stream_View+'</span></div> 				<div class="node guest member" id="addColumn"><div class="nodeIcon icon-plus-sign"></div>'+locale.Add_Column+'</div> 				<div class="node guest member" id="quickView"><div class="nodeIcon icon-eye-open"></div>'+locale.Open_a_Subreddit+'</div> 				<div class="node member" id="newPost"><div class="nodeIcon icon-pencil"></div>'+locale.New_Post+'</div> 			</div> 			<div id="viewNav" class="group">			<div class="node title">Activities<div class="icon-chevron-down"></div></div> 				<div class="node member guest" id="viewGallery"><div class="nodeIcon icon-camera"></div>'+locale.Gallery+'</div> 				<div class="node member" id="newMessage"><div class="nodeIcon icon-envelope-alt"></div>'+locale.New_Message+'</div> 				<div class="node guest member" id="viewUser"><div class="nodeIcon icon-user"></div>'+locale.User+'</div> 				<div class="node member" id="viewFriends"><div class="nodeIcon icon-book"></div>'+locale.Friends+'</div> 				<div class="node guest member" data-section="myprofile" id="settingsProfile"><div class="nodeIcon icon-user-md"></div>'+locale.My_Profile+'</div> 			</div> 			<div id="settingsNav" class="group open"> 				<div class="node title">Settings<div class="icon-chevron-up"></div></div> 				<div class="node guest member" data-section="general" id="settingsGeneral"><div class="nodeIcon icon-wrench"></div>'+locale.General+'</div> 				<div class="node guest member" data-section="appearance" id="settingsTheme"><div class="nodeIcon icon-desktop"></div>'+locale.Theme+'</div> 				<div class="node guest member" data-section="filter" id="settingsTheme"><div class="nodeIcon icon-filter"></div>'+locale.Filters+'</div> 				<div class="node guest member" data-section="sync" id="settingsSync"><div class="nodeIcon icon-refresh"></div>'+locale.Account+'</div> 				<div class="node guest member" data-section="macros" id="settingsKeys"><div class="nodeIcon icon-key"></div>'+locale.Keys+'</div> 				<div class="node guest member" data-section="subscribed" id="settingsSubscribed"><div class="nodeIcon icon-bookmark"></div>'+locale.Subscriptions+'</div> 				<div class="node guest member" data-section="flair" id="settingsFlair"><div class="nodeIcon icon-magic"></div>'+locale.Flair+'</div> 				<div class="node guest member" data-section="subs" id="settingsTopbar"><div class="nodeIcon icon-pushpin"></div>'+locale.Top_Bar+'</div> 				<div class="node guest member" data-section="res" id="settingsRES"><div class="nodeIcon icon-download-alt"></div>'+locale.RES_Import+'</div> 				<div class="node guest member" data-section="about" id="settingsAbout"><div class="nodeIcon icon-info-sign"></div>'+locale.About+"</div> 			</div>";$("#leftNav .navWrapper").html(a)}function createTopNav(a){storageWrapper.prototype.fetch("isFullscreen",function(i){var l=(!window.features.topNavigationControls)?"":'<div class="link guest member" id="previousHistory"><i class="icon-arrow-left" /><div class="info">'+locale.Back+'</div></div> 														  <div class="link guest member" id="forwardHistory"><i class="icon-arrow-right" /><div class="ignoreAnimate info">'+locale.Forward+"</div></div>";var k="";var o="";if(window.features.windowControlsTopRight||window.features.windowControlsTopLeft){var j='<div id="windowControls" class="'+window.features.windowControlsTheme+'" '+(i?'style="position:absolute;top:-100px"':"")+'> 							 <div id="pressedClose"></div> 							 <div id="pressedMinimize"></div> 							 <div id="pressedFullscreen"></div> 						   </div>';if(window.features.windowControlsTopLeft){k=j}else{o=j}}if(window.features.windowControlsTopLeft&&window.isMacgap&&macgap.window.toggleFullscreen){o='<div id="fullscreen"></div>'}var h='<div class="left"> 						'+k+' 						<div class="banner guest member"><div class="leftNavArrow"></div></div> 						<div class="link guest member" id="homeNav"><i class="icon-home" /><div class="info">'+locale.Home+"</div></div> 						"+l+' 						<div class="link guest member" id="refreshColumns"><i class="icon-refresh" /><div class="info">'+locale.Refresh+'</div></div> 						<div class="link member" id="notificationCounter"><i class="icon-envelope" /><div class="info">'+locale.Messages+'</div></div> 						<div class="link Home Post Stream" id="invokeHistory"><i class="icon-time" /><div class="info">'+locale.History+'</div></div> 						<div class="link member" id="favouritesButton"><i class="icon-heart" /><div class="info">'+locale.Favourites+'</div></div> 						<div class="link guest member" id="openSettings"><i class="icon-cog" /><div class="info">'+locale.Settings+'</div></div> 						<div class="link member" id="createPostNavButton"><i class="icon-pencil" /><div class="info">'+locale.New_Post+'</div></div> 		    		</div> 		    		<div class="center windowDraggable"></div> 	    	    	<div class="right"> 	    	    	    '+o+' 						<div class="link guest member accountsButton" id="accounts" style="display: block;"> 							<button class="redButton">'+locale.Login+'</button> 							<i class="icon-caret-down"></i> 						</div> 						<div class="link member karmaCounter" id="karmaCounter"></div> 						<div class="link guest member Post" id="searchNav" style="display: block;"><div id="searchType"><div class="active">Posts</div></div><input placeholder="'+locale.Search+'..." type="text"></div> 	    	    	</div>';$("#Header #Nav").html(h);if(window.features.windowControlsTopLeft||window.features.windowControlsTopRight){if(window.isMacgap&&macgap.window.toggleFullscreen){document.getElementById("fullscreen").addEventListener("click",function(){storageWrapper.prototype.fetch("isFullscreen",function(p){setTimeout(function(){if(!p&&window.isMaximized()){$("#windowControls").css({position:"absolute",top:"-100px"});storageWrapper.prototype.save("isFullscreen",true)}else{$("#windowControls").css({position:"relative",top:"auto"});storageWrapper.prototype.save("isFullscreen",false)}},2000);macgap.window.toggleFullscreen()})})}var n=false;var f=0;var e=0;document.getElementById("Header").addEventListener("mousedown",function(){n=true});document.getElementById("Header").addEventListener("dblclick",function(){if(!window.isMaximized()){window.maximize()}else{window.restore()}});document.addEventListener("mouseup",function(){n=false});document.addEventListener("mousedown",function(p){f=p.x;e=p.y});document.addEventListener("mousemove",function(p){if(n){p.preventDefault();p.stopPropagation();window.increaseWindowPos(p.x-f,p.y-e);return false}});var d=document.querySelector("#Header .left");var c=document.querySelector("#Header .center");var m=document.querySelector("#Header .right");var b=document.querySelector("#Header #Nav");setInterval(function(){c.style.width=b.clientWidth-d.clientWidth-m.clientWidth+"px";c.style.left=d.clientWidth+"px"},1000);var g=document.getElementById("windowControls");window.addEventListener("blur",function(){g.className=g.className.replace("blur","")+" blur"});window.addEventListener("focus",function(){g.className=g.className.replace("blur","")});g.onmousedown=function(p){if(p.target.id.substr(0,7)!="pressed"){return}g.className=g.className.replace(/(pressedFullscreen|pressedMinimize|pressedClose)/g,"")+" "+p.target.id};g.onmouseup=g.onmouseout=function(p){g.className=g.className.replace(/(pressedFullscreen|pressedMinimize|pressedClose)/g,"")};g.onclick=function(p){if(p.target.id.substr(0,7)!="pressed"){return}if(p.target.id=="pressedFullscreen"){if(!window.isMaximized()){window.maximize()}else{window.restore()}}else{if(p.target.id=="pressedMinimize"){window.minimize()}else{window.close()}}}}if(typeof a=="function"){a()}})}function showSidebar(){$("#createPostNavButton").hide();var b=$("#Header #Nav");var a=$("body");reddit().userVariable("sidebarClosed",function(c){if(typeof c!="object"){c={sections:{}}}c.isClosed=false;reddit().userVariable("sidebarClosed",c)});if(window.tabManagerObj){setTimeout(function(){window.tabManagerObj.resize()},250)}b.find(".leftNavArrow").removeClass("icon-chevron-right").addClass("icon-chevron-left");a.addClass("leftPaneOpen")}function hideSidebar(){$("#createPostNavButton").show();var b=$("#Header #Nav");var a=$("body");reddit().userVariable("sidebarClosed",function(c){if(typeof c!="object"){c={sections:{}}}c.isClosed=true;reddit().userVariable("sidebarClosed",c)});if(window.tabManagerObj){setTimeout(function(){window.tabManagerObj.resize()},250)}a.removeClass("leftPaneOpen");b.find(".leftNavArrow").removeClass("icon-chevron-left").addClass("icon-chevron-right")}function createPost(f,a,k,p,n){var i="<div class='left'><select id='PostType'><option value='link'>Link</option><option value='self'>Text</option><option value='image'>Image</option></select></div><div class='text'>"+locale.Drag_images_here_to_upload_them_to_Imgur+"</div> 				   <button data-message='post' class='green right space'><i class=\"icon-ok\"></i><span>&nbsp;&nbsp;"+locale.Post+"</span></button> 				   <button data-message='close' class='right space'><i class=\"icon-remove\"></i><span>&nbsp;&nbsp;"+locale.Cancel+"</span></button>";n=n?n:(window.location.hash.match(/~r~(.*?)~/)!=null?window.location.hash.match(/~r~(.*?)~/).pop():"");var h="<div class='incontainer'><input class='first' placeholder='Title' type='text' id='Title' /></div> 				   <div id='LinkContainer'><div class='incontainer'><input placeholder='Link' type='text' id='Link' /></div></div>   				   <input id='createPostSecretInput' type='file' name='pic' accept='image/*'> 				   <div style='display: none;' id='TextContainer'><div class='incontainer'><textarea placeholder='Write your message here' id='Text' /></div></div> 				   <div class='incontainer'><input class='nomargins' placeholder='Subreddit' type='text' value='"+n+"' id='Subreddit' /></div> 				   <div id='addSubreddit_results'></div>";var j="link";var e=false;var o=false;var g,l,c;g=$.popup({id:"newPostPopup",message:h,buttons:i},function(C,t){if(C=="subreddit_item"){l.val(t.html()).focus().select()}else{if(C=="post"){var A=g.find("#Title");var z=g.find("#Link");var B=g.find("#Text");var r=g.find("#Subreddit");var w=g.find("#captchaEnter");if(e){return}e=true;t.addClass("loading");var u=A.val();var v=(j=="link")?z.val():B.val();var x=r.val();function q(){t.removeClass("loading");e=false}if(u==""){alert("Please specify a title!");q();A.focus().select();return}else{if(v==""){alert("Please specify a link or text!");q();if(j=="link"){z.focus().select()}else{B.focus().select()}return}else{if(x==""){alert("Please specify a subreddit!");q();r.focus().select();return}}}var s=(o?w.attr("iden"):null);var y=(o?w.val():null);a.submit(u,v,x,j,s,y,function(F,L){if(F=="BAD_CAPTCHA"){t.removeClass("loading");e=false;if(!o){o=true;var G='<img id="captchaCode" src="http://reddit.com/captcha/'+L+'.png" />';var I='<div class="incontainer">								<input placeholder="Enter the captcha code above" type="text" iden="'+L+'" id="captchaEnter"> 							</div>';g.find("#addSubreddit_results").before(G+I)}else{alert("You entered the captcha incorrectly, try again.");g.find("#captchaCode").attr("src","http://reddit.com/captcha/"+L+".png")}}else{if(F=="noerror"){g.closePopup();var J=L.split(".com").pop();var D=L.match(/comments\/(.*?)\//).pop();var K=L.match(/\.com(.*?)comments\//).pop().replace(/\//g,"-");var E=L.match(/\.com(.*?)comments\//).pop().replace(/\//g,"~");var H=capitalize(L.match(/r\/(.*?)\//).pop());if(window.location.hash.indexOf("Stream")>-1){window.location.href="#/Stream/post/"+J.replace(/\//g,"~")+"/url/"+(E.indexOf(".json")>-1?E:E+".json")}else{window.location.href="#/Home/post/"+D+"/permalink/"+J.replace(/\//g,"~")+"/column/"+K+"/title/"+H+"/url/"+E}}else{alert(L);t.removeClass("loading");e=false}}analytics().track("Interaction","Submitted a Post")})}}return C});var b=g.closePopup;g.closePopup=function(){if(c){c.close()}b.call(g)};var m=g.find("textarea")[0];m.addEventListener("keyup",function(){if(c&&m.value==""){c.hide();g.setOffsetX(0);return}else{if(c){g.setOffsetX(-200);c.show()}}if(!c){c=new quickText({bindTo:$(".alert"),background:false,autoExpandHeight:true,letterCount:false,formattingOptions:false,initialContent:"<strong>Preview</strong><br>"});g.setOffsetX(-200)}c.contentHTML="<strong>Preview</strong><br>"+SnuOwnd.getParser().render(m.value)});g.onPopupShow(function(){if(c&&m.value!=""){c.positionPopup();c.show()}});g.onPopupHide(function(){if(c){c.hide()}});g.on("click",".ButtonGroup a",function(){if(c){c.contentHTML="<strong>Preview</strong><br>"+SnuOwnd.getParser().render(m.value)}});g.find("#PostType").toggleSwitch();$("#PostType").change(function(){j=$(this).val();if(j=="link"){g.find("#LinkContainer").removeAttr("disabled").show();g.find("#TextContainer").hide();g.find("input[name=pic]").hide();if(c){c.hide();g.setOffsetX(0)}}else{if(j=="self"){g.find("#LinkContainer").hide();g.find("#TextContainer").show();g.find("input[name=pic]").hide();if(c&&m.value!=""){c.show();g.setOffsetX(-200)}m.focus()}else{if(j=="image"){g.find("#LinkContainer").show();g.find("#TextContainer").hide();g.find("input[name=pic]").show().off().on("change",function(q){uploadHandler.enqueueFile(q.originalEvent.srcElement.files[0])});g.find("#createPostSecretInput").click()}}}});var d=g.find("#addSubreddit_results");l=g.find("#Subreddit");l.doneTyping(function(){var q=l.val().toLowerCase();l.addClass("loading");a.searchRedditNames(q,function(u){d.find("div:not(.selected)").remove();if(u.length!=0){d.append('<div data-message="subreddit_item">'+u.join('</div><div data-message="subreddit_item">')+"</div>")}var s=false;var r=u.length;for(var t=0;t<r;t++){if(q==u[t].toLowerCase()){s=true}}l.removeClass("loading");if(!s){a.subredditExists(q,function(v){if(v){d.append('<div data-message="subreddit_item">'+capitalize(q)+"</div>")}})}})});g.find("textarea").autoHeight().css("max-height",parseInt($("body").height()-300)+"px").reditor();if(typeof p=="function"){p(g)}return g}function addColumn(a,i){var e=a.loggedin;var b='<div id="stageOne" class="stage columnTypes"> 		 				   <div data-message="subreddit" id="subreddit" class="item">'+locale.Subreddit+'</div> 						   <div data-message="subscribed" id="subscribed" class="item">'+locale.Front_Page+'</div> 						   <div data-message="everything" id="everything" class="item">'+locale.All+'</div> 						   <div data-message="search" id="search" class="item">'+locale.Search+'</div> 						   <div data-message="user" id="user" class="item">'+locale.User+'</div> 						   <div data-message="random" id="random" class="item">'+locale.Random+'</div> 						   <div data-message="domain" id="domain" class="item">'+locale.Domain+"</div>"+((e)?'<div data-message="saved" id="saved" class="item">'+locale.Favourites+'</div> 						   <div data-message="moderated" id="moderated" class="item">'+locale.Moderated+'</div> 						   <div data-message="friends" id="friends" class="item">'+locale.Friends+'</div> 						   <div data-message="allcomments" id="friends" class="item">'+locale.All_Comments+"</div>":"")+'<div style="clear: both"></div> 					 </div>';var c='<div id="addSubreddit" class="stage" style="display: none"></div>';var g='<div id="addDomain" class="stage" style="display: none"> 						 <div class="incontainer"> 							<input data-message="addDomain_button" class="nomargins" id="addDomain_domain" type="text" placeholder="Enter a domain here"> 						 </div> 					</div>';var d='<div id="addUser" class="stage" style="display: none"> 						<div class="incontainer"> 							<input type="text" data-message="addUser_button" class="nomargins" id="addUser_username"placeholder="Specify a Username Here"> <br> 						</div> 				  </div>';var h='<button data-message="back" class="left backButton space" style="display: none"><i class="icon-arrow-left"></i><span>&nbsp;&nbsp;'+locale.Back+'</span></button> 				   <button data-message="subreddit_createColumn" class="green subreddit_createColumn stage right space" style="display: none"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Create_Column+'</span></button> 				   <button data-message="addUser_button" class="green addUser_button stage right space" style="display: none"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Create_Column+'</span></button> 				   <button data-message="addDomain_button" class="green addDomain_button stage right space" style="display: none"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Create_Column+'</span></button> 				   <button data-message="close" class="right space"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Cancel+'</span></button> 				   <div style="clear: both"></div>';var j=0;var f=null;addColumnDiag=null;f=$.popup({id:"columnPopup",message:b+c+d+g,buttons:h},function(s,o){var r=$(this);if(s=="back"){$(o).hide();r.find(".stage").hide();r.find("#stageOne").show()}else{if(s=="domain"){r.find("#stageOne").hide();r.find("#addDomain, .backButton, .addDomain_button").show();var q=r.find("#addDomain_domain").focus()}else{if(s=="addDomain_button"){var l=r.find("#addDomain_domain").val().replace(/www\./g,"").replace(/http:\/\//g,"");if(l.slice(-1)=="/"){l=l.slice(0,-1)}var p=l.slice(0,1).toUpperCase()+l.slice(1).toLowerCase();var n=i.insert(function(t){return new column("/domain/"+l+"/.json",t,activePlayground,a,this,{SPECIAL:true,DOM:true},p)},"SYNC");i.lastPage();f.closePopup()}else{if(s=="friends"){var n=i.insert(function(t){return new column("/r/friends/",t,activePlayground,a,this,{SORT:"hot",FRI:true,SPECIAL:true},"Friends")},"SYNC");i.lastPage();f.closePopup()}else{if(s=="allcomments"){var n=i.insert(function(t){return new column("/comments/.json",t,activePlayground,a,this,{SORT:"new",CMT:true},"All Comments",1000)},"SYNC");i.lastPage();f.closePopup()}else{if(s=="moderated"){var n=i.insert(function(t){return new column("/r/mod/",t,activePlayground,a,this,{SORT:"hot",SPECIAL:true,MOD:true},"Moderator")},"SYNC");i.lastPage();f.closePopup()}else{if(s=="subscribed"){var n=i.insert(function(t){return new column("/",t,activePlayground,a,this,{SORT:"new",SPECIAL:true,SUB:true},"Front Page")},"SYNC");i.lastPage();f.closePopup()}else{if(s=="everything"){var n=i.insert(function(t){return new column("/r/all/",t,activePlayground,a,this,{SORT:"hot",SPECIAL:true,EVE:true},"All")},"SYNC");i.lastPage();f.closePopup()}else{if(s=="random"){o.removeAttr("data-message").html("Loading");a.randomSubreddit(function(t){o.attr("data-message","random").html("Random");var u=t.slice(0,1).toUpperCase()+t.slice(1).toLowerCase();new quickView(a,u,"/r/"+t+"/")})}else{if(s=="saved"){var n=i.insert(function(t){return new column("/user/"+a.user.name+"/saved.json",t,activePlayground,a,this,{SORT:false,SPECIAL:true},"Favourites")},"SYNC");i.lastPage();f.closePopup()}else{if(s=="addUser_button"){var m=r.find("#addUser_username").val();var p=m.slice(0,1).toUpperCase()+m.slice(1).toLowerCase()+"'s Posts";var n=i.insert(function(t){return new column("/user/"+m+"/.json",t,activePlayground,a,this,{SPECIAL:true,SORT:"new",USER:true},p)},"SYNC");i.lastPage();f.closePopup()}else{if(s=="user"){r.find("#stageOne").hide();r.find("#addUser, .backButton, .addUser_button").show();var q=r.find("#addUser_username").focus()}else{if(s=="search"){searchPopup(a,i)}else{if(s=="subreddit"){var k=r.find("#addSubreddit");r.find("#stageOne").hide();k.show();r.find(".backButton").show();addColumnDiag=new subredditSelector(a,k,function(t){if(t.length>0){r.find(".subreddit_createColumn").show()}else{r.find(".subreddit_createColumn").hide()}})}else{if(s=="subreddit_createColumn"){addColumnDiag.subreddits(function(u){var t="/r/"+u.join("+")+"/";var v=capitalize(u).join(", ");var w=i.insert(function(x){return new column(t,x,activePlayground,a,this,{SORT:"hot"},v)},"SYNC");i.lastPage();f.closePopup()})}}}}}}}}}}}}}}}return s})}function imageZoom(g,G,F,d,f,h,w,b){if(b){b=w?w:b;w=undefined}if(!w){var z=$(".complexAlertBackdrop");if(!z.length){var z=$('<div class="animate complexAlertBackdrop" style="z-index: '+(window.shameful_popup_zindex++)+' !important"></div>').appendTo("body")}var c=$(".complexAlertContainer");if(c.length){c.hide()}}imageTitle=false;if(f&&f[F]){imageTitle=f[F]?f[F]:"Photo #"+(F+1)}var l;if(w){l=$('<div class="imageZoom">'+(imageTitle?'<div class="imageTitle" style="padding-bottom: 0px !important">'+imageTitle+"</div>":"")+'<div class="imageZoom" style="z-index: '+(window.shameful_popup_zindex++)+' !important; width: 100%; height: 500px; position: relative; overflow: hidden"></div></div>');w.html(l);l=l.find(".imageZoom")}else{l=$('<div class="complexAlertContainer" style="z-index: '+(window.shameful_popup_zindex++)+' !important; width: 100%; height: 100%; margin: 0px; padding: 0px; border: none; z-index: 1001; position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; overflow: auto">'+(imageTitle?'<div class="imageTitle">'+imageTitle+"</div>":"")+"</div>").appendTo("body")}function v(){l.remove();if(!$(".complexAlertContainer").length){if(!w){z.remove()}}if(!$(".complexAlertContainer:visible").length){$(".complexAlertContainer").last().show()}}if(!w){l.add(z).click(v)}if(typeof F=="undefined"||isNaN(F)){F=-1}var q=(typeof d=="undefined")?0:d.length;var t=(F==-1||q-F==1)?"":'<div style="position: '+(w?"absolute; bottom: 121px":"fixed")+"; z-index: "+(window.shameful_popup_zindex)+' !important" class="imageZoomCaptionForwardButton"></div>';var r=(F==-1||F==0)?"":'<div style="position: '+(w?"absolute; bottom: 121px":"fixed")+"; z-index: "+(window.shameful_popup_zindex)+' !important" class="imageZoomCaptionBackwardButton"></div>';$('<table style="width: 100%; margin: 0px; margin-top: 5px; padding: 0px; border: none; z-index: 1001; position: '+(w?"absolute":"fixed; height: 100%")+"; "+(f&&f[F]?"top: 13px; bottom: 122px;":"")+'left: 0px; right: 0px"><tr valign="middle"><td style="text-align: center" valign="middle"><div id="imageContainer"><div class="loadingcss"></div></div></td></tr></table>'+t+r).appendTo(l);var H=l.find("table");if(!w){var j=true;H.draggable({start:function(){j=false},stop:function(){setTimeout(function(){j=true},250)}})}var s=H.find("td");var J=document.createElement("img");var C=false,a=false,x;var p=0;var I=0;J.addEventListener("load",function(){C=true},true);if(window.isChromePackaged){getImageBlob(g,function(i){J.setAttribute("src",i);x=setInterval(e,100)})}else{J.setAttribute("src",g);x=setInterval(e,100)}function e(){if(!a&&J.width!=0&&J.height!=0&&C){a=true;clearInterval(x);if(F>1){$("<img/>")[0].src=d[F-1]}if(F+1<q){$("<img/>")[0].src=d[F+1]}s.find("#imageContainer").html(J);var O=$(window);var L=O.width()-150;var i=l.height()-125;var N=$(J);p=J.width;Q=J.height;if(p>L){var Q=(L/p)*Q;p=L;N.attr("width",p).attr("height",Q)}if(Q>i||Q==0){p=(i/Q)*p;Q=i;N.attr("height",Q).attr("width",p)}var R=$('<div id="controls" class="buttongroup" style="'+(w?"display: none; ":"")+"position: fixed; top: 5px; left: 5px; z-index: "+(window.shameful_popup_zindex)+' !important"> 								  <button id="copyLink"><i class="icon-link"></i></button><button id="zoomOut"><i class="icon-zoom-out"></i></button><button id="zoomIn"><i class="icon-zoom-in"></i></button> 							  </div>').appendTo(l);if(!w){var K=$('<div style="z-index: '+(window.shameful_popup_zindex)+' !important" data-message="close" id="closeGallery"></div>').appendTo(l)}if(!w){function M(S){S.stopPropagation();S.preventDefault();if(!j){return false}p*=1.2;Q*=1.2;N.attr("width",p).attr("height",Q);return false}R.on("click","#zoomIn",M);s.on("click","img",M);function P(S){S.stopPropagation();S.preventDefault();if(!j){return false}p*=0.8;Q*=0.8;N.attr("width",p).attr("height",Q);return false}R.on("click","#zoomOut",P);s.on("contextmenu","img",P);R.on("click","#copyLink",function(S){S.stopPropagation();clipboard_set(d?d[F]:g)});H.on("mousewheel",function(V){V.preventDefault();V.stopPropagation();var S=V.originalEvent.wheelDeltaY;var T=p+(S/600)*p;var U=Q+(S/600)*Q;if(S<0&&(U<100||T<100)){return false}N.attr("width",p=T).attr("height",Q=U);return false})}else{s.on("click","img",function(S){S.preventDefault();S.stopPropagation();imageZoom(g,G,F,d,f,h,w,true)})}l.on("click",".imageZoomCaptionForwardButton",function(T){T.stopPropagation();var S=F+1;imageZoom(d[S],f[S],S,d,f,h,w,b);if(b){imageZoom(d[S],f[S],S,d,f,h,b)}v()});l.on("click",".imageZoomCaptionBackwardButton",function(T){T.stopPropagation();var S=F-1;imageZoom(d[S],f[S],S,d,f,h,w,b);if(b){imageZoom(d[S],f[S],S,d,f,h,b)}v()})}}if(typeof h!="undefined"){if(typeof h=="object"){var A=['<div id="bareSourceImages" class="imageZoomPreviewContainer"><div>'];for(var D=0;D<q;D++){var E=(window.isChromePackaged?"data-thumb='"+h[D]+"'":"src='"+h[D]+"'");A.push('<div class="img"> 								<img data-key="'+D+'" '+E+'> 								<div class="imgtitle"><span>'+(f[D]?f[D]:"Photo #"+(D+1))+"</span></div> 							 </div>")}A.push("</div></div>");h=A.join("")}var m=$(h).css("z-index",window.shameful_popup_zindex++);l.append(m);m.on("click","img",function(K){K.stopPropagation();var i=parseInt($(this).attr("data-key"));imageZoom(d[i],f[i],i,d,f,h,w,b);if(b){imageZoom(d[i],f[i],i,d,f,h,b)}v()});var o=m.find('[data-key="'+F+'"]').parent();o.addClass("active");var k=l.width();var y=o.position().left;var B=(k-o.width())/2;var n=-y+B;var u=m.width();if(y<B){n=0}if(-n>u-k){n=-u+k}m.css("margin-left",n);if(window.isChromePackaged){l.find(".img img:not(.l)").each(function(){var i=$(this);getImageBlob(i.attr("data-thumb"),function(K){i.attr("src",K);i.addClass("l")})})}}}var replyBar=trick({className:"bottomInterface"});replyBar.prototype.init=function(b,f,g,e,h,c,d){this.connection=b;this.content=f;this.placeholder=g;this.id=e;this.callback=h;this.isReplying=false;this.textPreview=d;this.converter=SnuOwnd.getParser();var a=this;if(c){$(".bottomInterface").remove();this.draw()}else{if($(".bottomInterface").length!=0&&$(".bottomInterface").find("textarea").val()!=""){confirmFancy("Are you sure you want to cancel "+$(".bottomInterface").find("textarea").attr("placeholder")+"?",function(i){if(i){$(".bottomInterface").remove();a.draw()}else{return false}})}else{this.draw()}}return this};replyBar.prototype.clearDraft=function(){this.connection.updateLocalStorageCache(this.id,"",1);return this};replyBar.prototype.draw=function(d){if(this.id&&!d){var b=this;this.connection.getLocalStorageCache(this.id,function(e){b.content=(!b.content&&typeof e=="string"&&e!="")?e:((!b.content||b.content=="")?"":b.content);b.draw(true)});return this}var a=($(window).width()-140)/2;var c='<table class="container">		<tr><td class="messageParent">				<div class="redditEditContainer"> 					<div class="redditEdit">						<textarea placeholder="'+this.placeholder+'" class="Message" id="Message">'+this.content+"</textarea>					</div>				</div>		</td>";if(this.textPreview){c+='<td class="previewParent">				<div class="redditEditContainer"> 					<div class="redditEdit preview">						<div class="Preview" id="Preview">Preview will appear here</div>					</div>				</div>		</td>'}c+='<td width="200px" style="text-align:center;"><div class="ButtonGroup rightButtons">			<a data-ignore=true data-message="close" id="CancelReply" class="Button">'+locale.Cancel+'</a><a data-ignore=true id="SubmitReply" class="Button submitButton">'+locale.Submit+"</a>		</div></td></tr>		</table>";this.el.innerHTML=c;$("body").append(this.$el.animate({bottom:0},450));this.bindings();return this};replyBar.prototype.clear=function(a){a=a?a:"";this.messageArea.val(a).trigger("change").focus();return this};replyBar.prototype.loading=function(a){this.doneButton.html(a?locale.Wait+"...":locale.Submit);this.isReplying=a;return this};replyBar.prototype.bindings=function(){var k=this;var f=this.$el;var j=this.messageArea=f.find("#Message.Message");var c=f.find(".redditEdit.preview");this.doneButton=f.find("#SubmitReply");var d=this.connection;j.reditor().autoHeight();var a=f.find("table.container");if(this.textPreview){var h=f.find(".previewParent");var b=f.find(".messageParent");var e=b.width();var g=h.width();h.css("width",g+"px");b.css("width",e+"px");c.css("width",g+"px");j.css("width",e-30+"px");b.resizable({start:function(l,m){b.css({position:"relative !important",left:"0 !important"})},resize:function(m,n){b.css({position:"",left:""});var l=-1*(n.size.width-e);e=n.size.width;h.css("width",h.width()+l+"px");c.css("width",h.width()+"px")},stop:function(l,m){b.css({position:"",top:"0",left:"0"})},minWidth:505,handles:"e"});h.resizable({start:function(l,m){h.css({position:"relative !important",left:"0 !important"})},resize:function(m,n){h.css({position:"",left:""});b.css({position:"",left:""});var l=-1*(n.size.width-g);g=n.size.width;c.css("width",g);b.css("width",l+b.width()+"px");j.css("width",b.width()-30+"px")},stop:function(l,m){h.css({position:"",top:"0",left:"0"})},maxWidth:0.4*$(window).width(),handles:"w"})}a.resizable({handles:"n",start:function(l,m){a.css({top:"0 !important",left:"0 !important"})},resize:function(l,m){a.css({position:"",top:"0",left:""})},stop:function(l,m){a.css({position:"",top:"0",left:""})},maxHeight:$(window).height()/2,alsoResize:".messageParent, .previewParent, #Message.Message, .redditEdit.preview"});f.off();f.on("click.replyBar"+k.id,".ButtonGroup",function(){f.find("textarea").focus()});f.on("click.replyBar"+k.id,"#CancelReply",function(){if(k.messageArea.val().trim()!=""){var l=k.$el.css("z-index");k.$el.css("z-index","10");confirmFancy("Are you sure you want to cancel "+k.placeholder+"?",function(m){if(m){k.close()}else{k.$el.css("z-index",l)}})}else{k.close()}});f.on("click.replyBar"+k.id,"#SubmitReply",function(){button=$(this);if(k.isReplying){return}k.callback.call(k,j.val())});var i;j.on("change.replyBar, keyup.replyBar",function(){clearTimeout(i);var l=this;i=setTimeout(function(){var n=$(l).val();var m=k.converter.render(n);c.html((n=="")?"Preview will appear here":m);if(k.id&&n!=""){d.updateLocalStorageCache(k.id,n,1)}},500)});j.focus().trigger("change");return this};replyBar.prototype.close=function(){var a=this;a.isReplying=false;a.$el.animate({bottom:-1.5*a.$el.outerHeight()+"px"},450,function(){$(this).remove();delete a});return this};function closeQuickSearchPopup(){$("body").off(".quickSearch");var a=$("#searchDropdown");a.add("#searchNav input").off(".quickSearch");window.quickSearchColumn.shutdown();delete window.quickSearchColumn;a.remove();window.quickSearchQuery="";if(typeof onClose=="function"){onClose()}}function quickSearch(e,d,c,a,b,f,g){storageWrapper.prototype.fetch("searchPopup_userSortType",function(m){var r=$("#searchDropdown");if((window.quickSearchQuery==e&&d!=true)||(e==""&&!r.length)){return}else{window.quickSearchQuery=e}window.quickSearchMostRecent=e;if(typeof f=="function"&&r.length>0){f(r)}if(e==""&&r.length){closeQuickSearchPopup();return}var l,n=false;if(e.substring(0,2)=="u:"){l=e.substring(2).trim();n=reddit().user.username==l;if(m=="comments"||!m){var k="/user/"+l+".json?t="+Date.now()}else{var k="/search.json?q="+escape("author:"+l)+"&t="+Date.now()}var q=true}else{if(g=="Subreddits"){var k="/api/subreddits_by_topic.json?query="+escape(e)}else{var k="/search.json?q="+escape(e)}}if(r.length==0||typeof window.quickSearchColumn!="undefined"){if(window.quickSearchColumn){window.quickSearchColumn.shutdown();delete window.quickSearchColumn}if(r.length>0){r.remove()}var o='<div class="newMessage advancedSearch">'+locale.Advanced_Search+"</div>";if(q){o='<div class="newMessage"> 									<select class="userPostCommentsToggle"> 										<option value="comments">Comments</option> 										<option value="posts" '+(m=="posts"?"selected":"")+">Posts</option> 									</select> 								 </div>"}r=$('<div id="searchDropdown" class="menubarDropdown"> 						  	 <div class="header node"> 						  	 	 <div class="title">'+locale.Searching_for+' "'+e+'"</div> 						  	 	 '+o+'						  	 	 <div style="clear: both"></div> 						  	 </div> 						  	 <div class="itemContainer"></div> 						  </div>').appendTo("body");if(typeof f=="function"){f(r)}r.on("click",".advancedSearch",function(){searchPopup(c,a,window.quickSearchMostRecent);closeQuickSearchPopup()});setTimeout(function(){window.quickSearchPreventClose=false;$("body").off(".quickSearch").on("click.quickSearch",function(){if(!window.quickSearchPreventClose){closeQuickSearchPopup()}});var s;r.add("#searchNav input").off(".quickSearch").on("click.quickSearch",function(t){window.quickSearchPreventClose=true;clearTimeout(s);s=setTimeout(function(){window.quickSearchPreventClose=false},500)})},500);var h=r.find(".itemContainer");var j=window.quickSearchColumn=new column(k,h,window.activePlayground,c,false,{SPECIAL:true,SORT:"new",top_filter:"all"},locale.Searching_for+' "'+e+'"',5000);if(n){var i=j.fetchDataAfter.bind(j);j.fetchDataAfter=function(t,u,s){if(t){return i(t,u,s)}if(!m){m="comments"}if(!window.userRecentPosts_type){window.userRecentPosts_type="comments"}if(window.userRecentPosts&&m==window.userRecentPosts_type&&window.userRecentPosts_username==reddit().user.username){return u(window.userRecentPosts)}i(t,function(v){u(window.userRecentPosts=v)},s)};if(!window.userRecentPostsInterval){window.userRecentPostsInterval=setInterval(function(){if(!reddit().loggedin){return}storageWrapper.prototype.fetch("searchPopup_userSortType",function(s){var t=s=="comments"||!s?k="/user/"+reddit().user.username+".json?t="+Date.now():"/search.json?q="+escape("author:"+reddit().user.username)+"&t="+Date.now();column.prototype.fetchDataAfter.bind({connection:reddit(),url:t,count:25,flags:{SPECIAL:true,SORT:"new",top_filter:"all"}})(null,function(u){window.userRecentPosts=u;window.userRecentPosts_type=s;window.userRecentPosts_username=reddit().user.username},true)})},120000)}}j.startup();var p=j.openPost;j.openPost=function(s){closeQuickSearchPopup();p.call(j,s)}}else{var j=window.quickSearchColumn;j.url=k;j.refresh();r.find(".header .title").html(locale.Searching_for+' "'+e+'"')}r.find(".itemContainer").css("height",($(document).height()-100)+"px");if(q){r.find(".Sorter").hide();r.find(".userPostCommentsToggle").on("change",function(){window.userRecentPosts=undefined;delete window.userRecentPosts;if(this.value=="comments"){window.quickSearchColumn.url="/user/"+l+".json";j.refresh();storageWrapper.prototype.save("searchPopup_userSortType","comments")}else{window.quickSearchColumn.url="/search.json?q="+escape("author:"+l);j.refresh();storageWrapper.prototype.save("searchPopup_userSortType","posts")}})}})}function searchPopup(d,i,c){c=c||"";if(c.substring(0,2)=="u:"){var b=c.substring(2).trim();c=undefined}var e='<div id="leftSide"> 							<div class="incontainer"> 								<input data-message="addSearch_search" type="text" id="addSearch_search"placeholder="Specify a Search Here" '+(typeof c=="undefined"?"":'value="'+c+'"')+'> <br> 							</div> 							<div class="addSearch_advancedParams incontainer"> 								<input type="text" data-message="addSearch_search" id="addSearch_subreddit"placeholder="Subreddit"> <br> 								<input type="text" data-message="addSearch_search" id="addSearch_selftext"placeholder="Self Text"> <br> 								<input type="text" data-message="addSearch_search" id="addSearch_author"placeholder="Author" '+(typeof b=="undefined"?"":'value="'+b+'"')+'> <br> 								<input type="text" data-message="addSearch_search" id="addSearch_site"placeholder="Domain"> <br> 								<input type="text" data-message="addSearch_search" id="addSearch_url"placeholder="Website URL"> <br> 								<div class="toggleSwitchContainer"> 									<select id="addSearch_self"><option value="both">Both</option><option value="yes">'+locale.Mine+'</option><option value="no">'+locale.Not_Mine+'</option></select> 								</div> 								<div class="toggleSwitchContainer"> 									<select id="addSearch_nsfw"><option value="both" selected>'+locale.Both+'</option><option value="yes">NSFW</option><option value="no">SFW</option></select> 								</div> 								<div class="toggleSwitchContainer"> 									<select id="addSearch_contentType"><option value="posts" selected>'+locale.Posts+'</option><option value="subreddits">Subreddits</option></select> 								</div> 							 </div> 						 </div> 						 <div id="rightSide" class="Viewport"></div> 						 <div style="clear: both"></div>';var h='<button data-message="addSearch_search" class="addSearch_search stage right space green"><i class="icon-search"></i><span>&nbsp;&nbsp;'+locale.Search+'</span></button> 				   <button data-message="addSearch_create" class="addSearch_addColumn stage right space" style="display: none"><i class="icon-plus"></i><span>&nbsp;&nbsp;'+locale.Add_Column+'</span></button> 				   <button data-message="close" class="left">[suggestedCloseText]</button> 				   <div style="clear: both"></div>';var j=0;var g=null;var f;var a=undefined;g=$.popup({id:"searchPopup",message:e,buttons:h},function(A,t){var z=$(this);if(A=="addSearch_search"){z.find("#leftSide").addClass("slideLeft");z.find("#rightSide").addClass("slideLeft");z.find(".addSearch_addColumn").show();var l=[];var y=z.find("#addSearch_search").val();var n=z.find("#addSearch_subreddit").val();var o=z.find("#addSearch_selftext").val();var r=z.find("#addSearch_author").val();var k=z.find("#addSearch_site").val();var q=z.find("#addSearch_url").val();var m=z.find("#addSearch_self").val();var v=z.find("#addSearch_nsfw").val();var x=z.find("#addSearch_contentType").val();l.push(y);if(n!=""){l.push("reddit:"+n)}if(o!=""){l.push("selftext:"+o)}if(r!=""){l.push("author:"+r)}if(k!=""){l.push("site:"+k)}if(q!=""){l.push("url:"+q)}if(m!="both"){l.push("self:"+m)}if(v!="both"){l.push("nsfw:"+v)}if(x=="subreddits"){var p="/api/subreddits_by_topic.json?query="+escape(l.join(" "))}else{var p="/search.json?q="+escape(l.join(" "))}f=p;var w=locale.Search+": "+y;if(typeof a!="undefined"){a.url=p;a.refresh()}else{a=new column(f,z.find("#rightSide"),activePlayground,d,false,{SPECIAL:true,SEARCH:true},w).startup();var u=a.openPost;a.openPost=function(B){g.closeQuickSearchPopup();u.call(a,B)}}}else{if(A=="addSearch_create"){var s=i.insert(function(B){return new column(a.url,B,activePlayground,d,this,{SPECIAL:true,SEARCH:true,SORT:"relevance"},a.title)},"SYNC");i.lastPage();g.closeQuickSearchPopup(true);A="close"}}return A});g.find("#addSearch_self, #addSearch_nsfw, #addSearch_contentType").toggleSwitch()}function settingsPopup(a,l,e){this.connection=a;this.tabManagerObj=l;var n=this;var e=e?e:"general";var j='<div id="content"></div>';var b=[{message:"general",html:"Gen."},{message:"appearance",html:"Theme"},{message:"filter",html:"Filter"},{message:"sync",html:"Account"},{message:"macros",html:"Keys"},{message:"subscribed",html:"Subscriptions",login:true},{message:"flair",html:"Flair",login:true},{message:"subs",html:"Top Bar"},{message:"res",html:"RES"},{message:"about",html:"About"}];var f=a.loggedin;var h=b.length;var c=[];for(var d=0;d<h;d++){var m=b[d];if(!m.login||f){c.push("<option "+(e==m.message?"selected ":"")+'data-message="'+m.message+'">'+m.html+"</option>")}}var k='<div class="left"> 					  <select id="page"> 					   	  '+c.join("")+' 				      </select> 				   </div> 				   <div class="right"> 				   		  <button data-message="close" class="close"><span class="icon-remove"></span></button> 				   </div>';var g=this.thisPopup=$.popup({id:"settingsPopup",message:j,buttons:k},function(o,i,p){return n.eventHandler.call(n,o,i,p)});var j=this.content=g.find("#content");g.find("#page").toggleSwitch();this.oldMessage=e;this.eventHandler(e,g.find('[data-message="'+e+'"]'))}settingsPopup.prototype.eventHandler=function(message,button,e){var self=this;var connection=this.connection;var thisPopup=this.thisPopup;var content=this.content;var tabManagerObj=this.tabManagerObj;if(message=="subs"){self.subs(function(buffer){self.subsRender(content,buffer)})}else{if(message=="general"){self.general(function(buffer){self.generalRender(content,buffer)})}else{if(message=="subscribed"){self.subscribed(function(buffer){self.subscribedRender(content,buffer)})}else{if(message=="filter"){self.filter(function(buffer){self.filterRender(content,buffer)})}else{if(message=="appearance"){self.appearance(function(buffer){self.appearanceRender(content,buffer)})}else{if(message=="flair"){self.flair(function(buffer){content.html(buffer);content.find("select:not(.noToggle)").toggleSwitch()})}else{if(message=="about"){self.about(function(buffer){content.html(buffer)})}else{if(message=="sync"){self.sync(function(buffer){content.html(buffer);content.find("select:not(.noToggle)").toggleSwitch()})}else{if(message=="macros"){self.macros(function(buffer){self.macrosRender(content,buffer)});return message}else{if(message=="res"){self.res(function(buffer){content.html(buffer);content.find("#resCode").on("click",function(){$(this).html('<div class="incontainer"><input type="text" readonly="readonly" value="RESStorage update RESmodules.userTagger.tags" /></div>');$(this).find("input").select()})})}else{if(message.indexOf("deleteBkg")!=-1){e.stopPropagation();e.preventDefault();connection.setting("backgrounds",function(backgrounds){var key=message.split(":").pop();backgrounds.splice(key,1);connection.setting("backgrounds",backgrounds);$('.bkg[key="'+key+'"]').remove();$("#backgroundsContainer .bkg").each(function(){var item=$(this);var itemKey=item.attr("key");if(itemKey>key){item.attr("key",--itemKey);item.attr("data-message","general:background:"+itemKey);item.find(".del").attr("data-message","deleteBkg:"+itemKey)}})})}else{if(message=="subredditbar_on"){connection.setting("subredditBar",true);subReddits(connection)}else{if(message=="subredditbar_off"){connection.setting("subredditBar",false);subReddits(connection)}else{if(message=="useQuickview_on"){connection.setting("useQuickview",true)}else{if(message=="useQuickview_off"){connection.setting("useQuickview",false)}else{if(message=="setFlair"){var value=button.find("span").html();var id=button.attr("id");if(value!=""){value=prompt("Enter a value for your new flair (some subs do not allow this)",value);if(!value){return}button.find("span").html(value)}content.find(".selected").removeClass("selected");button.addClass("selected");connection.setNewFlair(content.find("#subredditName").val().toLowerCase(),id,value)}else{if(message=="disableFlair"){content.find(".selected").removeClass("selected");connection.toggleFlairEnabled(button.attr("id"),false)}else{if(message=="fetchSubredditFlairs"){var subredditInput=content.find("#subredditName");if(subredditInput.hasClass("loading")){return}subredditInput.addClass("loading");var subreddit=subredditInput.val().toLowerCase();subreddit=subreddit.replace("/r/","");if(subreddit.substr(0,2)=="r/"){subreddit=subreddit.substr(2)}connection.subredditExists(subreddit,function(exists){if(!exists){alert("That subreddit does not exist!");subredditInput.removeClass("loading").focus().select();return}connection.fetchFlairHTML(subreddit,function(cud){subredditInput.removeClass("loading");var playground=content.find("#flairPlayground");playground.html(cud);playground.find("*").addClass(subreddit);playground.find(".author").remove();playground.find("li").attr("data-message","setFlair");playground.find("ul").prepend('<li> <span style="text-indent: 0px !important; background: none !important; width: 100px !important; line-height: 100px !important; height: 100px !important; padding: 0 !important; margin: 0 !important" id="'+subreddit+'" class="flair '+subreddit+'" data-message="disableFlair">No Flair</li>')})})}else{if(message=="eastereggStream"){window.location.href="#/Stream";return"close"}else{if(message=="reditrDonate"){popupBrowser("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=JNDER44DYCLWC")}else{if(message=="reditrWebsite"){popupBrowser("http://reditr.com")}else{if(message=="wallaMagic"){var winHeight=$(window).height();var mainDiv='<div class="spaceship" style="position:absolute;z-index:99999;height: '+winHeight+'px; width: 2560px;"></div>';var secondDiv='<div class="spaceship" style="top:-64px;left:64px;position:absolute;z-index:99999;height: '+winHeight+'px; width:2432px;"></div>';var mover=$('<div style="position:absolute;width:2560px;height:100%;left: -2560px;" id="eggMover">'+mainDiv+secondDiv+"</div>").prependTo("body");mover.animate({left:"2560px"},1500,function(){$(this).remove()})}else{if(message=="reditrSubreddit"){new quickView(self.connection,"Reditr","/r/reditr/")}else{if(message=="reditrBugsSubreddit"){new quickView(self.connection,"ReditrBugs","/r/reditrbugs/")}else{if(message=="reditrTos"){popupBrowser("http://reditr.com/tos")}else{if(message=="openSubscribe"){popupBrowser("http://reditr.com/subscription")}else{if(message=="sync_recovery"){var email=$("#reditr_recoverPassword_input").val();var button=$("#reditr_recoverPassword_button");if(button.hasClass("loading")){return}button.addClass("loading");sync_recovery(email,connection,function(data){button.removeClass("loading");if(data=="notRegistered"){alert("That email account isn't registered.")}else{alert("Please check your email for further instructions.")}})}else{if(message=="disableSync"){connection.database.save("sync_enabled",false)}else{if(message=="enableSync"){connection.database.save("sync_enabled",true)}else{if(message=="syncLogout"){sync_logout();content.find(".loginControls").show();content.find(".syncLogoutButton").hide()}else{if(message=="registerTab"){content.find(".loginText").html("Register");content.find(".confirmPassword").show()}else{if(message=="loginTab"){content.find(".loginText").html("Login");content.find(".confirmPassword").hide()}else{if(message=="login_register"){var button=$("#login_register");if(button.hasClass("loading")){return}button.addClass("loading");var confirmValue=$("#reditr_password_confirm").val();if(content.find("#loginTabOrRegisterTab").val()=="register"&&(confirmValue==""||confirmValue!=$("#reditr_password").val())){alert("The passwords you entered do not match.");button.removeClass("loading");return}sync_setup($("#reditr_email").val(),$("#reditr_password").val(),connection,function(data){button.removeClass("loading");if(data=="empty"){alert("Please do not leave any fields empty!")}else{if(data=="taken"){alert("Either you entered your credentials wrong, or that e-mail address is already registered!")}else{if(data=="invalid_email"){alert("Please enter a valid e-mail!")}else{if(data=="success"){reloadApp()}}}}})}else{if(message=="new_macro"){var nameId=thisPopup.find("#newMacroType").val();var desc=shortcuts[nameId].desc;var item=$('<div class="shortcut" keycodes="" nameid="'+nameId+'"> <div class="desc">'+desc+'</div> <div class="shortcut"></div> </div>');$("#currentMacros").prepend(item);item.find(".shortcut").click().focus()}else{if(message=="enable_macros"){connection.setting("macros_enabled",true);applyShortcuts(connection);return message}else{if(message=="disable_macros"){connection.setting("macros_enabled",false);applyShortcuts(connection);return message}else{if(message=="import_tags"){var button=$("#import_tags_button");var inputValue=$("#jsonTags").val();if(inputValue.substr(0,4)=="run:"){eval(inputValue.substr(4));return}var data=JSON.parse(inputValue);if(button.hasClass("loading")){return}button.addClass("loading");connection.tags(function(tags){for(var i in data){var user=data[i];var userLower=i;var object={c:"#FFF",b:user.color,t:user.tag};if(typeof tags[userLower]=="undefined"){tags[userLower]=[]}if(typeof tags[userLower]=="undefined"){tags[userLower].push(object)}}button.removeClass("loading").text("Import Successful!");connection.tags(tags)})}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}var data=message.split(":");if(data[0]=="general"&&message.indexOf(":")>-1){var settingName=data[1];var settingValue=data[2];if(settingValue=="true"){settingValue=true}else{if(settingValue=="false"){settingValue=false}}var reloadStylesheets=(settingName=="visual_animations"||settingName=="theme")?true:false;connection.setting(settingName,settingValue,function(){changeAccountSettings(connection,reloadStylesheets,false);if(data[3]=="reload"){window.location.hash="#/"+window.location.hash.match(/#\/([^\/]*?)(\/|$)/)[1]+"/page/1/reload/"+Date.now()}else{if(data[3]=="restart"){reloadApp()}}if(window.isChrome){getBackgroundPage(function(bgScope){bgScope.boot()})}})}this.oldMessage=message;return message};settingsPopup.prototype.res=function(b){var a='<div class="setting"> 						<h3>'+locale.Import_RES_Tags+'</h3> 							<div class="incontainer"> 								<input type="text" id="jsonTags" data-message="import_tags" placeholder="'+locale.Paste_your_RES_data_here+'" /> 							</div> 							<button id="import_tags_button" data-message="import_tags" style="float: right" class="green">'+locale.Import_Tags+'</button> 							 </div> 					  <div class="setting"> 						<h3>Instructions</h3> 						<div>1. Hit the "." (period) key on Reddit. <br /> 						2. In the console type: <br /> 							&nbsp;&nbsp;&nbsp;&nbsp;<span id="resCode" style="font-style: italic; cursor:pointer;" data-message="highlight">RESStorage update RESmodules.userTagger.tags</span><br /> 						3. Select all and copy. Paste it into the input above and hit Import Tags. 					   </div></div>';b(a)};settingsPopup.prototype.sync=function(a){this.connection.database.fetch("sync_enabled",function(b){this.connection.database.fetch("sync_username",function(h){var g="";if(b){var i=new Date(window.noAdsUntil*1000);var j="<strong>"+i.getFullYear()+"-"+(i.getMonth()+1)+"-"+i.getDate()+"</strong>";var f=(Date.now()/1000>window.noAdsUntil)?'<button style="float: right" class="button yellow" data-message="openSubscribe"><i class="icon-leaf"></i><span>&nbsp;&nbsp;Get a Subscription</span></button> 							    <p>Subscriptions remove ads and bring you early access to builds of Reditr.</p>':"Your subscription is <span style='color:green;font-weight:bold;'>ACTIVE</span> and expires "+j;g='<div class="subs setting"> 						    <h3>'+locale.Subscription+" - Remove Ads</h3>"+f+" 						  	</div>"}var e=h?'style="display:none"':"";var c='<div class="setting"> 							  <h3>'+locale.Enable_Syncing+"</h3> 							  <select> 							  	   "+(b?'<option data-message="enableSync">'+locale.On+'</option><option data-message="disableSync">'+locale.Off+"</option>":'<option data-message="enableSync">'+locale.On+'</option><option selected data-message="disableSync">'+locale.Off+"</option>")+' 							  </select> 						  </div> 						  <div class="setting"> 							  <h3>'+locale.Reditr_Account_Information+' (@)</h3> 							  <div class="loginControls" '+e+'> 								  <div class="incontainer"> 									  <select id="loginTabOrRegisterTab"> 									    <option value="login" data-message="loginTab">Login</option> 									  	<option value="register" data-message="registerTab" '+(h?"":" selected")+'>Register</option> 									  </select> 									  <br> 								  </div> 								  <div class="incontainer"> 								  	<input type="text" data-message="login_register" id="reditr_email" placeholder="Enter your E-mail" class="noShortcuts" value="'+((h)?h:"")+'"> 								  </div> 								  <div class="incontainer"> 								  	<input data-message="login_register" id="reditr_password" class="noShortcuts" placeholder="Password" type="password"> 								  </div> 								  <div class="incontainer confirmPassword" style="'+(h?"display:none":"")+'"> 								  	<input data-message="login_register" id="reditr_password_confirm" class="noShortcuts" placeholder="Confirm Password" type="password"> 								  </div> 								  <button id="login_register" data-message="login_register" style="float: right" data-message="login_register" class="green"><i class="icon-lock"></i><span>&nbsp;&nbsp;<span class="loginText">'+(h?"Login":"Register")+"</span></span></button> 							  </div> 							  "+(h?'<button class="red syncLogoutButton" data-message="syncLogout">Logout of <b>'+h+"</b></button>":"")+" 						</div>"+g+'						  <div class="setting"> 							  <h3>'+locale.Password_Recovery+'</h3> 							  <div class="incontainer"> 							  	<input type="text" data-message="sync_recovery" class="noShortcuts" id="reditr_recoverPassword_input" placeholder="Enter your Email"> 							  </div> 							  <button id="reditr_recoverPassword_button" data-message="sync_recovery" style="float: right" data-message="login_register"><i class="icon-question-sign"></i><span>&nbsp;&nbsp;'+locale.Recover_Password+"</span></button> 						  </div>";a(c)})})};settingsPopup.prototype.macrosRender=function(b,a){b.html(a);b.find("select:not(.noToggle)").toggleSwitch();b.on("click",".shortcut .shortcut",function(){var d=$(window);var c=$(this);b.find(".waitingForKeyInput").each(function(){var e=$(this);e.removeClass("waitingForKeyInput").removeClass("firstItemAdded").html(e.parent().attr("keycodestext"));d.unbind(".waitingForKeyInput")});c.html("hold & release shortcut keys").addClass("waitingForKeyInput");d.bind("keydown.waitingForKeyInput",function(g){g.preventDefault();g.stopPropagation();var f=codeToName[g.keyCode];if(!c.hasClass("firstItemAdded")){c.html(f);c.parent().attr("keycodes",codeToName[g.keyCode])}else{c.append(" + "+f);c.parent().attr("keycodes",c.parent().attr("keycodes")+"+"+codeToName[g.keyCode])}c.addClass("firstItemAdded");return false}).bind("keyup.waitingForKeyInput",function(i){i.preventDefault();i.stopPropagation();d.unbind(".waitingForKeyInput");c.removeClass("waitingForKeyInput").removeClass("firstItemAdded");var g=c.parent();var f=g.attr("keycodes");var h=g.attr("nameid");setShortcut(connection,h,f);changeAccountSettings(connection,false,false);return false})})};settingsPopup.prototype.macros=function(b){var a=this.connection;a.setting("macros_enabled",function(c){a.setting("macroShortcuts",function(h){var e=['<div class="setting"> 							  <h3>'+locale.Enable_Macros+"</h3> 							  <select> 							  	   "+(c?'<option data-message="enable_macros">'+locale.On+'</option><option data-message="disable_macros">'+locale.Off+"</option>":'<option data-message="enable_macros">'+locale.On+'</option><option data-message="disable_macros" selected>'+locale.Off+"</option>")+" 							  </select> 						   </div>"];var d=[];for(var g in shortcuts){d.push('<option value="'+g+'">'+shortcuts[g].desc+"</option>")}e.push('<div class="setting"> 							 <h3>'+locale.New_Macro+'</h3> 							 <select id="newMacroType" class="noToggle">'+d.join("")+'</select> 							 <button data-message="new_macro" class="addNewMacro">'+locale.Create+"</button> 						 </div>");e.push('<div class="setting"> 						 	<h3>'+locale.Existing_Macros+'</h3> 						 		<div id="currentMacros">');for(var j in h){if(typeof shortcuts[j]=="undefined"){continue}var f=h[j];var k=shortcuts[j].desc;e.push('<div class="shortcut" keycodes="'+f+'" nameid="'+j+'" keycodestext="'+f+'"> <div class="desc">'+k+'</div> <div class="shortcut">'+f+"</div> </div>")}e.push("</div> </div>");b(e.join(""))})})};settingsPopup.prototype.generalRender=function(c,a){var b=this;c.html(a);c.find("select:not(.noToggle)").toggleSwitch();c.find("#historyToKeep").doneTyping(function(){var d=$(this).val().trim();if(isNaN(d)){d=200}else{if(d<0){d=0}else{if(d>2000){d=2000}}}if(d==0){b.connection.clearHistory()}b.connection.setting("historyToKeep",d)});c.find("#markReadDelay").doneTyping(function(){var d=$(this).val().trim();if(isNaN(d)){d=2000}else{if(d<0){d=0}}b.connection.setting("markReadOnHoverDelay",d)});c.find("select#selectLang").on("change",function(){b.connection.setting("locale",c.find("select#selectLang").val())})};settingsPopup.prototype.general=function(c){var a=this.connection;var b=["infiniteScroll","load_all_comments_automatically","NSFW","clicking_comments_slides_to_them","live_private_messages","historyToKeep","live_notification_updates","show_desktop_notifications","highlightNew","postHoverOvers","textPreviewsEnabled","ytVideoType","redirectReddit","locale","markReadOnHoverDelay","quickButtons","nsfwRibbon","showTopComments","showMyUsername"];a.setting(b,function(j,y,o,w,q,s,d,u,l,r,n,g,m,A,f,e,p,z,x){if(o==1){var k='<option data-message="general:NSFW:1:reload">'+locale.Show+'</option><option data-message="general:NSFW:2:reload">'+locale.Hide+'</option><option data-message="general:NSFW:3:reload">'+locale.Only_Show+"</option>"}else{if(o==2){var k='<option data-message="general:NSFW:1:reload">'+locale.Show+'</option><option selected data-message="general:NSFW:2:reload">'+locale.Hide+'</option><option data-message="general:NSFW:3:reload">'+locale.Only_Show+"</option>"}else{var k='<option data-message="general:NSFW:1:reload">'+locale.Show+'</option><option data-message="general:NSFW:2:reload">'+locale.Hide+'</option><option selected data-message="general:NSFW:3:reload">'+locale.Only_Show+"</option>"}}var h=[];for(var v in langNames){h.push("<option "+((v==A)?"selected":"")+' value="'+v+'">'+langNames[v]+" ["+v+"]</option>")}var t='<div class="setting half"> <h3>'+locale["Infinite_Column_Scroll_(EXPERIMENTAL)"]+"</h3> <select> "+(j?'<option data-message="general:infiniteScroll:true:restart">'+locale.On+'</option><option data-message="general:infiniteScroll:false:restart">'+locale.Off+"</option>":'<option data-message="general:infiniteScroll:true:restart">'+locale.On+'</option><option selected data-message="general:infiniteScroll:false:restart">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Automatically_Load_All_Comments+"</h3> <select> "+(y?'<option data-message="general:load_all_comments_automatically:true">'+locale.On+'</option><option data-message="general:load_all_comments_automatically:false">'+locale.Off+"</option>":'<option data-message="general:load_all_comments_automatically:true">'+locale.On+'</option><option selected data-message="general:load_all_comments_automatically:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Flag_New_Comments+"</h3> <select> "+(l?'<option data-message="general:highlightNew:true">'+locale.On+'</option><option data-message="general:highlightNew:false">'+locale.Off+"</option>":'<option data-message="general:highlightNew:true">'+locale.On+'</option><option selected data-message="general:highlightNew:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Show_Top_Comments_in_Stream_View+' <span style="font-size: 75%">('+locale.requires_restart+")</span></h3> <select> "+(z?'<option data-message="general:showTopComments:true">'+locale.On+'</option><option data-message="general:showTopComments:false">'+locale.Off+"</option>":'<option data-message="general:showTopComments:true">'+locale.On+'</option><option selected data-message="general:showTopComments:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Slide_to_Comments_When_I_Click_Them+"</h3> <select> "+(w?'<option data-message="general:clicking_comments_slides_to_them:true">'+locale.On+'</option><option data-message="general:clicking_comments_slides_to_them:false">'+locale.Off+"</option>":'<option data-message="general:clicking_comments_slides_to_them:true">'+locale.On+'</option><option selected data-message="general:clicking_comments_slides_to_them:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Typing_Previews+"</h3> <select> "+(n?'<option data-message="general:textPreviewsEnabled:true">'+locale.On+'</option><option data-message="general:textPreviewsEnabled:false">'+locale.Off+"</option>":'<option data-message="general:textPreviewsEnabled:true">'+locale.On+'</option><option selected data-message="general:textPreviewsEnabled:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Show_Quick_Buttons_on_Posts+"</h3> <select> "+(e?'<option data-message="general:quickButtons:true">'+locale.On+'</option><option data-message="general:quickButtons:false">'+locale.Off+"</option>":'<option data-message="general:quickButtons:true">'+locale.On+'</option><option selected data-message="general:quickButtons:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Show_NSFW+' <span style="font-size: 75%">('+locale.requires_restart+")</span></h3> <select> "+k+' </select> </div> <div class="setting half"> <h3>'+locale.Live_Private_Messages+"</h3> <select> "+(q?'<option data-message="general:live_private_messages:true">'+locale.On+'</option><option data-message="general:live_private_messages:false">'+locale.Off+"</option>":'<option data-message="general:live_private_messages:true">'+locale.On+'</option><option selected data-message="general:live_private_messages:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Live_Notification_Updates+"</h3> <select> "+(d?'<option data-message="general:live_notification_updates:true">'+locale.On+'</option><option data-message="general:live_notification_updates:false">'+locale.Off+"</option>":'<option data-message="general:live_notification_updates:true">'+locale.On+'</option><option selected data-message="general:live_notification_updates:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Desktop_Notifications+"</h3> <select> "+(u?'<option data-message="general:show_desktop_notifications:true">'+locale.On+'</option><option data-message="general:show_desktop_notifications:false">'+locale.Off+"</option>":'<option data-message="general:show_desktop_notifications:true">'+locale.On+'</option><option selected data-message="general:show_desktop_notifications:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Redirect_Reddit_links_to_Reditr+"</h3> <select> "+(m?'<option data-message="general:redirectReddit:true">'+locale.On+'</option><option data-message="general:redirectReddit:false">'+locale.Off+"</option>":'<option data-message="general:redirectReddit:true">'+locale.On+'</option><option selected data-message="general:redirectReddit:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Hover_Over_Previews+' <span style="font-size: 75%">('+locale.requires_restart+")</span></h3> <select> "+(r?'<option data-message="general:postHoverOvers:true">'+locale.On+'</option><option data-message="general:postHoverOvers:false">'+locale.Off+"</option>":'<option data-message="general:postHoverOvers:true">'+locale.On+'</option><option selected data-message="general:postHoverOvers:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.NSFW_Ribbon+"</h3> <select> "+(p?'<option data-message="general:nsfwRibbon:true">'+locale.On+'</option><option data-message="general:nsfwRibbon:false">'+locale.Off+"</option>":'<option data-message="general:nsfwRibbon:true">'+locale.On+'</option><option selected data-message="general:nsfwRibbon:false">'+locale.Off+"</option>")+' </select> </div> <div class="setting half"> <h3>'+locale.Youtube_Video_Setting+"</h3> <select> "+(g=="html5"?'<option data-message="general:ytVideoType:html5">HTML5</option><option data-message="general:ytVideoType:flash">Flash</option>':'<option data-message="general:ytVideoType:html5">HTML5</option><option selected data-message="general:ytVideoType:flash">Flash</option>')+' </select> </div> <div class="setting half"> <h3>Show My Username</h3> <select> '+(x?'<option data-message="general:showMyUsername:true">On</option><option data-message="general:showMyUsername:false">Off</option>':'<option data-message="general:showMyUsername:true">On</option><option selected data-message="general:showMyUsername:false">Off</option>')+' </select> </div> <div class="setting half"> <h3>'+locale.Amount_of_History_Items_to_Keep+'</h3> <div class="incontainer"> <input type="text" id="historyToKeep" value="'+s+'"> </div> </div> <div class="setting half"> <h3>'+locale.Mark_Read_on_Hover_Over_Delay+'</h3> <div class="incontainer"> <input type="text" id="markReadDelay" value="'+f+'"> </div> </div> <div class="setting half"> <h3>'+locale.Language+' <span style="font-size: 75%">('+locale.requires_restart+')</span></h3> <select class="noToggle" id="selectLang"> '+h+" </select> </div>";c(t)})};settingsPopup.prototype.filterRender=function(c,b){c.html(b);var a=c.find("textarea");var d;a.autoHeight();a.on("keyup",function(){clearTimeout(d);var e=this;d=setTimeout(function(){var f=e.value.split("\n");var k=[];var h=[];for(var g in f){var j=f[g];if($.trim(j).length!=0){if(j.substr(0,3)=="/r/"){h.push(j.substr(3).toLowerCase().replace(/\/$/,""))}else{k.push(j)}}}reddit().clearFilter("banned-subs").filter("banned-subs",h);reddit().clearFilter("global").filter("global",k);if(window.tabManagerObj){window.tabManagerObj.refreshAll()}else{console.log("error: tab manager was not found!")}if(window.streamInstance){window.streamInstance.render()}else{console.log("error: stream was not found!")}},500)})};settingsPopup.prototype.filter=function(a){reddit().filter("banned-subs",function(b){reddit().filter("global",function(i){var g=b&&b.length>0;var d=i&&i.length>0;var f=g?"\n":"";var j=g?"/r/":"";var e=g?b.join("\n/r/"):"";var h=d?i.join("\n"):"";var c='• You can add phrases here (one per line) and posts that include these phrases will not be shown<br> 			    • Domains are also searched, so adding rt.com will block posts from rt.com<br>                 • Completely ban a subreddit by doing /r/beliebers<br>			    • Filtering is case insensitive (spider is the same as sPiDeR)<br><br> 			    <div class="incontainer"> 			  	<textarea>'+j+e+f+h+"</textarea> 			</div>";a(c)})})};settingsPopup.prototype.subsRender=function(b,a){b.html(a);b.find("select:not(.noToggle)").toggleSwitch();connection.subs(function(c){new subredditSelector(connection,b.find("#mySubredditBar"),c,function(d){connection.subs(d);subReddits(connection)})})};settingsPopup.prototype.subs=function(b){var a=this.connection;a.setting("subredditBar",function(c){a.setting("useQuickview",function(d){a.subs(function(f){var e='<div class="setting"> 								  <h3>'+locale.Enable_Subreddit_Bar+"</h3> 								  <select> 								  	   "+(c?'<option data-message="subredditbar_on">'+locale.On+'</option><option data-message="subredditbar_off">'+locale.Off+"</option>":'<option data-message="subredditbar_on">'+locale.On+'</option><option selected data-message="subredditbar_off">'+locale.Off+"</option>")+' 								  </select> 							  </div>							  <div class="setting"> 								  <h3>'+locale.Use_Quickview+"</h3> 								  <select> 								  	   "+(d?'<option data-message="useQuickview_on">'+locale.On+'</option><option data-message="useQuickview_off">'+locale.Off+"</option>":'<option data-message="useQuickview_on">'+locale.On+'</option><option selected data-message="useQuickview_off">'+locale.Off+"</option>")+' 								  </select> 							  </div>							  <div class="setting"> 								  <h3>'+locale.My_Subreddit_Bar+'</h3> 								  <div id="mySubredditBar"></div> 							  </div>';b(e)})})})};settingsPopup.prototype.flair=function(a){this.connection.setting("enableFlair",function(c){var b='<div class="setting"> 						  <h3>Display Flair Styles</h3> 						  <select> 						  	   '+(c?'<option data-message="general:enableFlair:true">'+locale.On+'</option><option data-message="general:enableFlair:false">'+locale.Off+"</option>":'<option data-message="general:enableFlair:true">'+locale.On+'</option><option selected data-message="general:enableFlair:false">'+locale.Off+"</option>")+' 						  </select> 					  </div> 					  <div class="setting"> 						  <h3>Manage My Flairs</h3> 						  <div class="incontainer"> 						  	<input type="text" data-message="fetchSubredditFlairs" id="subredditName" placeholder="Enter the name of a subreddit and press enter"> 						  </div> 						  <div id="flairPlayground"> 						  </div> 					  </div>';a(b)})};settingsPopup.prototype.about=function(c){var b=Math.round(Math.random())?'<a target="_blank" href="https://twitter.com/dave_canada">David Zorychta</a> and <a href="https://twitter.com/dimitryvin" target="_blank">Dimitry Vinogradov</a>':'<a href="https://twitter.com/dimitryvin" target="_blank">Dimitry Vinogradov</a> and <a target="_blank" href="https://twitter.com/dave_canada">David Zorychta</a>';var a='<div class="aboutReditr"> 					  <div class="reditrTitle">R<span data-message="eastereggStream">e</span>ditr '+window.version+'<span style="font-weight: light; font-size: 50%">'+window.build+'</span></div> 					  <div data-message="wallaMagic" class="logo"></div> 					  <div class="reditrDevs">Created and Developed by '+b+' <br>with awesome design advice from <a target="_blank" href="https://twitter.com/jeayese">Jason Farah</a> 					  	<br /> 					  	<br /> 					  </div> 					  <div class="reditrLinks buttongroup"> 					  	<button class="first" data-message="reditrDonate"><i class="icon-gift"></i><span>&nbsp;&nbsp;'+locale.Donate+'</span></button> 					  	<button class="middle" data-message="reditrWebsite"><i class="icon-globe"></i><span>&nbsp;&nbsp;'+locale.Visit_Website+'</span></button> 					 	<button class="middle" data-message="reditrSubreddit"><i class="icon-list-alt"></i><span>&nbsp;&nbsp;'+locale.Visit_Subreddit+'</span></button> 					 	<button class="middle" data-message="reditrBugsSubreddit"><i class="icon-pushpin"></i><span>&nbsp;&nbsp;'+locale.Report_Bugs+'</span></button> 					 	<button class="last" data-message="reditrTos"><i class="icon-briefcase"></i><span>&nbsp;&nbsp;'+locale.TOS+"</span></button> 					  </div> 				  </div>";c(a)};settingsPopup.prototype.appearanceRender=function(d,a){var b=this;d.html(a);if(window.isChromePackaged){d.find("img:not(.l)").each(function(){var g=$(this);getImageBlob(g.attr("data-thumb"),function(h){g.attr("src",h);g.addClass("l")})})}d.find("select:not(.noToggle)").toggleSwitch();var f=d.find("#defaultColumnWidth");f.on("keypress",function(g){var j=g||window.event;var h=j.keyCode||j.which;h=String.fromCharCode(h);var i=/[0-9]|\./;if(!i.test(h)){j.returnValue=false;if(j.preventDefault){j.preventDefault()}}});f.doneTyping(function(){var g=parseInt(f.val());if(g<100){g=100}if(g>3000){g=3000}column.prototype.width=g;b.connection.setting("defaultColumnWidth",g);tabManagerObj.resize(true)});var e=d.find("#defaultScrollBarWidth");e.on("keypress",function(g){var j=g||window.event;var h=j.keyCode||j.which;h=String.fromCharCode(h);var i=/[0-9]|\./;if(!i.test(h)){j.returnValue=false;if(j.preventDefault){j.preventDefault()}}});e.doneTyping(function(){var g=parseInt(e.val());if(g<1){g=1}if(g>20){g=20}$("#scrollBarSettings").remove();$("head").append('<style type="text/css" id="scrollBarSettings"> 							::-webkit-scrollbar { 							    width: '+g+"px !important; 							} 							</style>");b.connection.setting("scrollBarWidth",g)});var c=d.find('input[name="upload"]');c.on("change",function(h){var g=$(this).val();if(g.search(/.(png|jpg|jpeg|bmp|gif)/i)==-1){alert("Only images are allowed.");return}if(g!=""){d.find(".upload #text").html("Loading..");imgurUpload(h,function(i){d.find(".upload #text").html("Upload");if(!i){alert("An error connecting to Imgur has occured.");return false}connection.setting("backgrounds",function(j){j.push(i);connection.setting("backgrounds",j);key=j.length-1;var k=(window.isChromePackaged?"data-thumb='"+i+"'":"src='"+i+"'");d.find("#backgroundsContainer").append('<div class="bkg" key="'+key+'" data-message="general:background:'+(j.length-1)+'"><img '+k+'><div data-message="deleteBkg:'+key+'" class="del icon-remove-sign"></div></div>');if(window.isChromePackaged){d.find("img:not(.l)").each(function(){var l=$(this);getImageBlob(l.attr("data-thumb"),function(m){l.attr("src",m);l.addClass("l")})})}})})}})};settingsPopup.prototype.appearance=function(b){var a=this.connection;a.setting("defaultColumnWidth",function(c){a.setting("scrollBarWidth",function(d){a.setting("fontSize",function(e){a.setting("visual_animations",function(f){a.setting("theme",function(g){a.setting("backgrounds",function(h){a.setting("backgroundStretched",function(i){a.setting("backgroundPosition",function(j){a.setting("background",function(l){var r=['<select id="fontSize">'];for(var o=7;o<=24;o++){r.push("<option "+(e==o?"selected ":"")+'data-message="general:fontSize:'+o+'">'+o+"</option>")}r=r.join("")+"</select>";var s=["dark","light"];var t=["Dark","Light"];var q=s.length;var p=['<select id="theme">'];for(var o=0;o<q;o++){p.push("<option "+(g==s[o]?"selected ":"")+'data-message="general:theme:'+s[o]+'">'+t[o]+"</option>")}p=p.join("")+"</select>";var m=['<div id="backgroundsContainer"> <div data-message="general:background:-1" class="defaultUpload"><span id="text">'+locale.Default+'</span></div> <div class="defaultUpload upload"><span id="text">Upload</span><input type="file" name="upload"> </div>'];var q=h.length;for(var o=0;o<q;o++){var k=(window.isChromePackaged?"data-thumb='"+h[o]+"s.png'":"src='"+h[o]+"s.png'");m.push('<div class="bkg" key="'+o+'" data-message="general:background:'+o+'"><img '+k+'><div data-message="deleteBkg:'+o+'" class="del icon-remove-sign"></div></div>')}m.push("</div>");m=m.join("");var n='<div class="setting"> 															  <h3>'+locale.Font_Size+" (px)</h3> 															  "+r+' 														  </div> 														  														  <div class="setting"> 															  <h3>'+locale.Theme+"</h3> 															  	   "+p+' 														  </div> 														  														  <div class="setting half"> 															  <h3>'+locale.Default_Column_Width+' (px)</h3> 															  <div class="incontainer"> 															  	<input type="text" id="defaultColumnWidth" value="'+c+'"> 															  </div> 														  </div> 														  														   <div class="setting half"> 															  <h3>'+locale.Default_Scrollbar_Width+' (px)</h3> 															  <div class="incontainer"> 															  	<input type="text" id="defaultScrollBarWidth" value="'+d+'"> 															  </div> 														  </div> 														  														  <div class="setting half"> 															  <h3>'+locale.Visual_Animations+"</h3> 															  <select> 															  	   "+(f?'<option data-message="general:visual_animations:true">'+locale.On+'</option><option data-message="general:visual_animations:false">'+locale.Off+"</option>":'<option data-message="general:visual_animations:true">'+locale.On+'</option><option selected data-message="general:visual_animations:false">'+locale.Off+"</option>")+' 															  </select> 														  </div> 														  														  <div class="setting half"> 															  <h3>'+locale.Stretch_Background+"</h3> 															  <select> 															  	   "+(i?'<option data-message="general:backgroundStretched:true">'+locale.On+'</option><option data-message="general:backgroundStretched:false">'+locale.Off+"</option>":'<option data-message="general:backgroundStretched:true">'+locale.On+'</option><option selected data-message="general:backgroundStretched:false">'+locale.Off+"</option>")+' 															  </select> 														  </div> 														  														  <div style="clear: both"></div> 														  <div class="setting"> 															  <h3>'+locale.Background+"</h3> 															  "+m+" 														  </div>";b(n)})})})})})})})})})};settingsPopup.prototype.subscribedRender=function(c,a){c.html(a);c.find("select").toggleSwitch();var b=this.connection;b.mine(function(j){var f=[];var e={};var d=j.length;for(var h=0;h<d;h++){var g=j[h].data.display_name.toLowerCase();f.push(g);e[g]=true}new subredditSelector(b,c.find("#settingsSubscribedContainer"),f,function(o){var q={};var k=o.length;for(var n=0;n<k;n++){var m=o[n];q[m]=true;if(!e[m]){b.subredditAbout(m,function(i){b.subscribe(i.name)})}else{delete e[m]}}var p=$.map(e,function(r,i){return i});var l=this;if(p.length>0){confirmFancy("This will unsubscribe you from "+p.length+" subreddits:<br>"+p.join(", "),function(i){if(i){for(var r in e){b.subredditAbout(r,function(s){b.unsubscribe(s.name)})}}else{$.each(p,function(s,t){l.select(t);q[t]=true})}e=q})}else{e=q}})})};settingsPopup.prototype.subscribed=function(a){connection.setting("subscribed_subs_only",function(c){var b='<div id="subscribedOnly"> 						  <div class="setting"> 							  <h3>'+locale.Subscribed_Subreddits_as_Columns+"</h3> 							  <select> 							  	   "+(c?'<option data-message="general:subscribed_subs_only:true:reload">'+locale.On+'</option><option data-message="general:subscribed_subs_only:false:reload">'+locale.Off+"</option>":'<option data-message="general:subscribed_subs_only:true:reload">'+locale.On+'</option><option selected data-message="general:subscribed_subs_only:false:reload">'+locale.Off+"</option>")+" 							  </select> 						  </div> 					  </div> 					  <h3>"+locale.My_Subscribed_Subreddits+'</h3> 					  <div id="settingsSubscribedContainer" class="loading">'+locale.Loading+"...</div>";a(b)})};function Home(a,b,c){analytics().track("Startup","Launched Column View");reddit().setting("infiniteScroll",function(e){tabManager.prototype.infiniteScroll=e;window.tabManagerObj=new tabManager(reddit(),a,$("#pageSelectorContainer"),b.tabManagerWaitingFor,c);window.homeResize=function(){tabManagerObj.resize($(window).width(),$(window).height())};var d;$(window).on("resize.Home, focus.Home",function(){clearTimeout(d);d=setTimeout(window.homeResize,100)});reddit().setting("subscribed_subs_only",function(g){reddit().savedColumns(function(k){if(typeof k!="undefined"&&!g){f(k,true)}else{if(reddit().loggedin){reddit().mine(function(i){i.unshift({data:{url:"/r/all/",sort:"hot",title:"All",flags:{SORT:"hot",SPECIAL:true,EVE:true}}});i.unshift({data:{url:"/",sort:"hot",title:"Front Page",flags:{SORT:"new",SPECIAL:true,SUB:true}}});f(i)})}else{var k=[{data:{url:"/",sort:"hot",title:"Front Page"}}];var h=defaultSubs=reddit().defaultSubs;for(var j=0;j<defaultSubs.length;j++){k.push({data:{url:"/r/"+defaultSubs[j]+"/",sort:"hot",title:defaultSubs[j]}})}f(k)}}})});function f(k,m){var p=false;if(typeof b.tabManagerWaitingFor!="undefined"){var r=b.url.replace(/~/g,"/")}if(m){var o=k.length;for(var l=0;l<o;l++){var g=k[l];var n=g.url;var j=g.flags;var q=g.title;var h=g.width;if(typeof r!="undefined"&&r==n){p=true}tabManagerObj.insert(function(i){return new column(n,i,a,reddit(),this,j,q,undefined,h)})}}else{var o=k.length;for(var l=0;l<o;l++){var g=k[l].data;var n=g.url;var q=(typeof g.title=="undefined"||g.title.length>15)?n.slice(3,4).toUpperCase()+n.slice(4,-1):capitalize(g.title.replace("/r/",""));var j=typeof g.flags=="undefined"?{}:g.flags;if(typeof r!="undefined"&&r==n){p=true}tabManagerObj.insert(function(i){return new column(n,i,a,reddit(),this,j,q,undefined,h)})}}setTimeout(function(){storageWrapper.prototype.fetch("tutorialRan",function(i){if(!i){storageWrapper.prototype.save("tutorialRan",true);tutorial()}})},3000);if(typeof r!="undefined"&&!p){tabManagerObj.insert(function(i){return new column(r,i,a,reddit(),this,{SORT:b.sort,TEMP:true},b.title)})}}})}function Homedeconstructor(a){$(window).off(".Home");window.homeResize=function(){};a.off(".content");tabManagerObj.deconstructor(true);delete tabManagerObj;delete window.tabManagerObj}var streamSidebar=trick({events:{"click .node[data-url]:not(.search):not(.title)":"clickSubreddit","keyup .streamSubSearch":"search","keyup #subs":"keyNav","click .icon-cog":"sidebarPrefs"}});streamSidebar.prototype.deinit=function(){window.removeEventListener("reddit_subscription_change",this.render)};streamSidebar.prototype.init=function(){Handlebars.registerHelper("sidebarIcon",function(a){if(!a){return""}var b="icon-double-angle-right";if(a.substr(0,1)=="/"&&a.length==1){b="icon-home"}else{if(a.indexOf("/search.")>-1){b="icon-search"}else{if(a.substr(0,7)=="/r/all/"){b="icon-asterisk"}else{if(a.substr(0,4)=="/me/"||a.indexOf("+")>-1){b="icon-sitemap"}}}}return'<span class="subicon '+b+'"></span>'});Handlebars.registerHelper("formatURL",function(a){return a+(a.indexOf(".json")==-1?".json":"")});this.render();this.render=this.render.bind(this);window.addEventListener("reddit_subscription_change",this.render)};streamSidebar.prototype.getSubs=function(a){if(!reddit().loggedin){reddit().subs(function(b){b=b.map(function(c){return{title:c,url:"/r/"+c+"/"}});b.unshift({title:"All",url:"/r/all/"});b.unshift({title:"Front Page",url:"/"});a(b)});return}reddit().savedColumns(function(c){if(!c){var e,b;var f=2;reddit().multis(function(i){if(typeof i!="undefined"&&typeof i[0]!="undefined"&&typeof i[0].data!="undefined"){b=i}if(--f==0){h()}});reddit().mine(function(i){e=i;if(--f==0){h()}});function h(){c=(b||[]).map(function(i){return{title:i.data.name,url:"/me/m/"+i.data.path.split("/m/").pop()}}).concat(e.map(function(i){return{title:i.data.display_name,url:i.data.url}}));c.unshift({title:"All",url:"/r/all/"});c.unshift({title:"Front Page",url:"/"});a(c)}}else{var d=c.length<2||(c[0].url!="/r/all/"&&c[1].url!="/r/all/");var g=c.length<2||(c[0].url!="/"&&c[1].url!="/");if(d){c.unshift({title:"All",url:"/r/all/"})}if(g){c.unshift({title:"Front Page",url:"/"})}a(c)}})};streamSidebar.prototype.getNewSubscribedSubs=function(a,f){if(!reddit().loggedin){return f([])}var d={};for(var c in a){var e=a[c];if(!e.url){continue}d[e.url.toLowerCase()]=e}var b=[];reddit().mine(function(h){for(var g in h){var j=h[g].data;if(!j.url){continue}if(!d[j.url.toLowerCase()]){b.push({title:j.display_name,url:j.url})}}f(b)})};streamSidebar.prototype.saveColumns=function(){if(this.$el.find(".streamSubSearch").val().length>0){return}var a=[];this.$el.find(".node:not(.search):not(.title)").each(function(){var c=this.getAttribute("data-id");if(!c){c=c.replace(/\//,"-")}var b=this.getAttribute("data-flags");if(b){b=JSON.parse(b)}else{b={SORT:"hot",top_filter:"day"}}a.push({url:this.getAttribute("data-url").replace(/\.json$/,""),title:this.getAttribute("data-name"),id:c,flags:b})});reddit().saveColumns(a)};streamSidebar.prototype.clickSubreddit=function(b,a){this.$el.find(".selected").removeClass("selected");this.set("url",a.getAttribute("data-url"))};streamSidebar.prototype.search=function(g,f){var c=this.$el;if(g.keyCode==40||g.keyCode==38||(g.keyCode==13&&c.find(".selected").length>0)){return}if(g.keyCode==13){g.preventDefault();g.stopPropagation()}if(this._searchDisplaySuggestions){c.find(".suggestionNode").remove();this._searchDisplaySuggestions=false}var d=f.value;if(g.keyCode==13&&c.find(".enterToGo").length>0){this.set("url",c.find(".enterToGo").attr("data-url"));c.find(".selected").removeClass("selected");c.find(".node").show();c.find(".enterToGo").remove();c.find("input").val("").focus();return}else{if(d==""){c.find(".node:not(.search)").show();c.find(".enterToGo").remove()}else{var b=this;clearTimeout(this._searchTimer);this._searchTimer=setTimeout(function(){reddit().searchRedditNames(d,function(i){b._searchDisplaySuggestions=true;var h=i.map(function(j){return'<div class="suggestionNode node" data-url="/r/'+j+'/.json"> 																	   <span>/r/'+j+"</span> 																 </div>"});c.append(h.join(""));if(b._searchCurrentValue.toLowerCase()!=i[0].toLowerCase()){var e=c.find(".enterToGo");if(e.length>0){e.find("span").html("to visit /r/"+i[0]);e.attr("data-url","/r/"+i[0]+"/.json")}}})},500);c.find(".node:not(.search):not(.enterToGo):not(.title)").hide();c.find('.node:not(.search):not(.enterToGo):not(.title):icontains("'+d+'")').show();var a=c.find(".enterToGo");if(a.length>0){a.find("span").html("to visit /r/"+d);a.attr("data-url","/r/"+d+"/.json")}else{a=$('<div class="enterToGo node" data-url="/r/'+d+'/.json"> 							   <div class="smallEnterKey"></div> 							   <span>to visit /r/'+d+"</span> 						  </div>");c.find(".search").after(a)}this._searchCurrentValue=d}}c.find(".selected").removeClass("selected");if(g.keyCode==13){return false}};streamSidebar.prototype.keyNav=function(g){var b=this.$el;var f=b.find(".selected");var a=$("#leftNav");if(f.length==0&&(g.keyCode==40||g.keyCode==38)){b.find(".node:not(.title, .search)").first().addClass("selected")}else{if(g.keyCode==13){this.set("url",b.find(".node.selected").attr("data-url"));b.find(".node").show();b.find(".enterToGo").remove();b.find("input").val("").focus();b.find(".selected").removeClass("selected")}else{if(g.keyCode==27){b.find(".selected").removeClass("selected");a.scrollTop(0)}else{if(g.keyCode==40){var c=f.nextAll(":visible:not(.title, .search):first");if(c.length>0){f.removeClass("selected");c.addClass("selected");if(c.offset().top-a.offset().top>a.height()){a.scrollTop(c.offset().top)}}}else{if(g.keyCode==38){var d=f.prevAll(":visible:not(.title, .search):first");if(d.length>0){f.removeClass("selected");d.addClass("selected");if(d.offset().top<a.offset().top){a.scrollTop(d.offset().top)}}}}}}}};streamSidebar.prototype.sidebarPrefs=function(g,f){g.preventDefault();g.stopPropagation();var d=$(f.parentNode);var c;try{c=d.attr("data-url").match(/\/r\/([^\+]+?)\//).pop()}catch(g){c=false}var b=this;var a=new quickText({css:{width:"auto"},bindTo:d,initialContent:Handlebars.templates["stream.subsidebar.prefs"]()},function(h,j,i){if(h=="changeTitle"){b.changeColumnTitle(d)}else{if(h=="remove"){$(j).attr("data-message","confirmRemove").find(".label").html("Click to Confirm");return false}else{if(h=="confirmRemove"){b.removeColumn(d)}else{if(h=="manageSubreddits"){b.manageSubreddits(d)}else{if(h=="unsubscribe"){b.unsubscribeColumn(c)}else{if(h=="subscribe"){b.subscribeColumn(c)}}}}}}this.close()});if(!c){$(a.el).find(".subUnsub").remove()}if(d.attr("data-url").search(/\/r\/(.*?)\//)==-1){$(a.el).find('[data-message="manageSubreddits"]').remove()}else{reddit().subredditAbout(c,function(e){reddit().issubscribed(e.name,function(h){if(!h){$(a.el).find(".subUnsub").attr("data-message","subscribe").find(".label").html("Subscribe")}})})}};streamSidebar.prototype.manageSubreddits=function(c){var a=this;try{var b=c.attr("data-url").match(/\/r\/(.*?)\//).pop();column.prototype.manageSubreddits(b,function(e){c.attr("data-url","/r/"+e.join("+")+"/.json");c.find(".title").html(e.join(", "));c.attr("data-name",e.join(", "));a.saveColumns()})}catch(d){}};streamSidebar.prototype.unsubscribeColumn=function(a){reddit().subredditAbout(a,function(b){reddit().unsubscribe(b.name);$('.unsubscribe[data-name="'+b.name+'"]').removeClass("unsubscribe")})};streamSidebar.prototype.subscribeColumn=function(a){reddit().subredditAbout(a,function(b){reddit().subscribe(b.name);$('.subscribe[data-name="'+b.name+'"]').addClass("unsubscribe")})};streamSidebar.prototype.removeColumn=function(a){a.remove();this.saveColumns()};streamSidebar.prototype.changeColumnTitle=function(b){var c=b.attr("data-name");var a=this;promptFancy("Enter new title",function(d){if(d!=""){b.attr("data-name",d);b.find(".title").html(d);a.saveColumns()}},"text",c)};streamSidebar.prototype.render=function(){this.getSubs(function(a){var c=this.$el;var b=$(Handlebars.templates["stream.subsidebar"](Handlebars.templates["stream.subsidebar.list"](a)));c.html(b);this.getNewSubscribedSubs(a,function(d){c.find("#subs").append(Handlebars.templates["stream.subsidebar.list"](d))});b.sortable({containment:"parent",axis:"y",update:function(){this.saveColumns()}.bind(this)});reddit().userVariable("sidebarClosed",function(d){if(d&&d.sections&&d.sections.subs===false){c.find("#subs").removeClass("open").find(".icon-chevron-up").removeClass("icon-chevron-up").addClass("icon-chevron-down")}})}.bind(this))};var Stream=trick({events:{"click .ups, .downs":"politics","click .post img, .topComments img":"imageZoom","click .author":"followAuthor","click .fixedOrFluid a":"fixedOrFluid","click .inlineViewHandle":"inlineView","click .sub":"changeSubreddit","click a:not(#PostView a):not(.title)":"handleLink","click .fakeInput":"newPost","click .loadAllComments":"loadAllComments","click .post .title":"clickedPostTitle","click .subscribe":"toggleSubscribe","click .makeReply":"beginReplyToPost","click .streamPostOptions":"initPostContextMenu","contextmenu .post":"togglePostContextMenu","click .unhidePrompt":"handleUnhidePost","click .comment .reply":"replyToComment","click .comment .edit":"editComment","click .tags > div":"manageTag","click .showNSFWContent":"showNSFWContent","click .enableAllNSFW":"enableAllNSFW","change .multiTitle":"changeHeaderForMultireddit","click .tutorial .close":"closeTutorial","click .removeAds":function(){popupBrowser("http://reditr.com/subscription")},"click .ad":function(b,a){popupBrowser(a.getAttribute("data-href"))},"click .openSidebar":function(){if(this.sidebarOpen){$(".stream_subreddit_sidebar .close").click()}else{this.subredditSidebar()}},"contextmenu .comment":"toggleCommentContextMenu"},defaults:{url:"/.json",sort:"hot",sidebarOpen:false}});Stream.prototype.deinit=function(){$(window).off(".stream");if(this.sidebarObj){this.sidebarObj.deinit()}};Stream.prototype.init=function(c){analytics().track("Startup","Launched Stream View");this.cacheStore={};storageWrapper().fetch("stream_fixed",function(e){this.set("stream_fixed",typeof e=="undefined"||e==true?true:false);this.$el[this.stream_fixed?"addClass":"removeClass"]("fixed");this.on("change:stream_fixed",function(f){storageWrapper().save("stream_fixed",f);this.$el[f?"addClass":"removeClass"]("fixed");this.render()}.bind(this))}.bind(this));this.$el.addClass("streamContainer");if(this.getVars&&this.getVars.url){this.url=this.getVars.url.replace(/~/g,"/")}if(this.getVars&&this.getVars.sort){this.sort=this.getVars.sort}if(this.parent){this.parent.append(this.el)}reddit().setting("NSFW",function(e){this.NSFW=e}.bind(this));this.handlebarHelpers();this.on("change:sidebarOpen",function(e){this.$el[e?"addClass":"removeClass"]("sidebarOpen");storageWrapper().save("stream_subreddit_sidebar",e)}.bind(this));var a;this.on("change:sort",function(){clearTimeout(a);a=setTimeout(function(){this.render()}.bind(this),100)}.bind(this));this.on("change:url",function(g,f){if(!this.url||this.url==""){f("/.json")}else{f(this.url.replace(/~/g,"/"))}if(this.followHashtags&&setSilentHash){var e=this.url=="/.json"?"#/Stream":"#/Stream/url/"+this.url.replace(/\//g,"~")+"/sort/"+this.sort;setSilentHash(e)}delete this.getVars;clearTimeout(a);a=setTimeout(function(){this.render()}.bind(this),100)});if(this.followHashtags){$("body").addClass("streamEngaged");try{reddit().addHistory("Stream: "+(this.url=="/.json"?"Frontpage":this.url.match(/\/(.*?)\//).pop()),this.url=="/.json"?"#/Stream":"#/Stream/url/"+this.url.replace(/\//g,"~"),"http://reddit.com"+this.url.replace(".json",""))}catch(d){console.log("Could not add initial history record for "+this.url+" threw: "+d)}window.streamInstance=this;var b;$(window).off(".stream").on("accountSwitch.stream",function(){clearTimeout(b);b=setTimeout(function(){this.sidebar(false);this.sidebar(true)}.bind(this),250)}.bind(this));clearTimeout(b);b=setTimeout(function(){this.sidebar(true)}.bind(this),250);window.Streamdeconstructor=function(f,e,g){this.sidebar(false);delete window.streamVarsChanged;delete window.streamInstance;$("body").removeClass("streamEngaged")}.bind(this);window.streamVarsChanged=function(e){this.getVars=e;if(e.post){this.render()}else{if(e.url){this.set("url",e.url)}else{this.set("url","/.json")}}if(e.sort&&this.sort!=e.sort){this.set("sort",e.sort)}}.bind(this)}storageWrapper().fetch("stream_subreddit_sidebar",function(e){this.set("sidebarOpen",e===true)}.bind(this));this.render();storageWrapper.prototype.fetch("tutorialRan",function(e){if(!e){setTimeout(function(){storageWrapper.prototype.save("tutorialRan",true);tutorial("stream")},3000)}})};Stream.prototype.fixedOrFluid=function(b,a){b.preventDefault();b.stopPropagation();if((a.classList.contains("fluid")&&this.stream_fixed)||(a.classList.contains("fixed")&&!this.stream_fixed)){this.set("stream_fixed",!this.stream_fixed)}};Stream.prototype.handlebarHelpers=function(){Handlebars.registerHelper("streamTime",function(d){var c=formatDate(d);return'<span data-timestamp="'+d+'" class="date '+c[1]+'">'+c[0]+"</span>"});Handlebars.registerHelper("notFiltered",function(e,d){var c=reddit.prototype.filter_cache&&reddit.prototype.filter_cache["banned-subs"]&&reddit.prototype.filter_cache["banned-subs"].length>0&&reddit.prototype.filter_cache["banned-subs"].indexOf(e.toLowerCase())>=0;return c?d.inverse(this):d.fn(this)});reddit().filter("banned-subs",function(){});Handlebars.registerHelper("streamParseEntities",function(c){return $("<span>"+c+"</span>").text()});Handlebars.registerHelper("numberWithCommas",function(c){return numberWithCommas(c)});Handlebars.registerHelper("newCommentBuffer",function(d,e){var c=this.cacheStore[d];if(c&&c.contents&&e-c.contents.num_comments>0){return'<div class="newComments">'+(e-c.contents.num_comments)+" new</div>"}else{return""}}.bind(this));Handlebars.registerHelper("toJSON",function(c){if(!c){return""}return numberWithCommas(JSON.stringify(c).replace(/'/g,"\\'"))});this.lookupTable={};var b=this;Handlebars.registerHelper("isUniquePost",function(e,c){var d=typeof b.lookupTable[e]=="undefined"?c.fn(this):c.inverse(this);b.lookupTable[e]=true;return d});var a=reddit();Handlebars.registerHelper("iAmAuthor",function(c,d){return c&&a.user&&a.user.username&&c.toLowerCase()==a.user.username.toLowerCase()?d.fn(this):d.inverse(this)});Handlebars.registerHelper("politicsClass",function(c){if(c===true){return"true"}else{if(c===false){return"false"}else{return""}}})};Stream.prototype.render=function(){reddit().getAllLocalStorageCache(function(g){this.cacheStore=g||{}}.bind(this));if(this.followHashtags){$(".sortStreamBy").show()}if(this.getVars&&this.getVars.post){var b=this.getVars.post.replace(/~/g,"/");var f=b.match(/\/comments\/(.*?)\//).pop();this.openPostView(b,f,false,"t3_"+f);return}this.closePostView();var a=this.$el;var d=a.find('.stream[data-url="'+this.url+'"]:hidden');if(d.length>0){d.show();return}reddit().tags(function(g){Handlebars.registerHelper("tagsForUser",function(j){var h=j.toLowerCase();var i=g[h];if(!i){return""}else{return'<span class="tags '+h+'userTagList" data-username="'+h+'">'+i.map(function(l,k){return'<div id="'+k+'" class="uTag" style="background-color: '+l.b+"; color: "+l.c+'">'+l.t+"</div>"}).join("")+"</span>"}})});a.html('<div class="loadingcss"></div>');var e=false;this.buildSubredditHeader(function(g){if(a.find(".stream").length==0){e=g}else{a.find(".fixedOrFluid").after(g)}}.bind(this));var c=false;storageWrapper.prototype.fetch("themeLoaded",function(g){if(!g){storageWrapper.prototype.save("themeLoaded",true)}else{if(Date.now()/1000>window.noAdsUntil){getFusionAd(function(i){var h=Handlebars.templates["stream.ad"](i);if(a.find(".stream").length==0){c=h}else{a.find(".stream").prepend(h)}})}}});reddit().getPosts(this.url,0,undefined,function(g){this.lookupTable={};var i=g.splice(0,5);this.postStore=g;a.find(".loadingcss").remove();var h=Handlebars.templates["stream.list"](i);a.append(Handlebars.templates.stream({content:h,url:this.url}));if(c){a.find(".fixedOrFluid").after(c)}if(e){a.find(".fixedOrFluid").after(e)}storageWrapper.prototype.fetch("streamTutorialClosed",function(j){if(!j){a.find(".fixedOrFluid").after(Handlebars.templates["stream.tutorial"]())}}.bind(this));this.parseSmartContent(7);this.parseTopComments(7);this.stream=a.find(".stream");this.stream.off(".track").on("scroll.track",this.scroll.bind(this))}.bind(this),undefined,this.sort)};Stream.prototype.sidebar=function(a){var c=$(".navWrapper");if(!a){if(this.sidebarObj){this.sidebarObj.deinit();if(this.sidebarObj.$el){this.sidebarObj.$el.remove()}delete this.sidebarObj;c.find("#addColumn").show();c.find("#toggleStreamView .msg").html(locale.Stream_View);$(".sortStreamBy").remove()}return}var c=$(".navWrapper");setTimeout(function(){c.find("#addColumn").hide()},0);c.find("#toggleStreamView .msg").html(locale.Column_View);var e=$(Handlebars.templates["stream.sidebar.sortby"]());var d=e.find("select");$("body").find("#mainNav").append(e);d.change(function(g){var f=g.target.value;setSilentHash("#/Stream/url/"+this.url.replace(/\//g,"~")+"/sort/"+g.target.value);this.set("sort",g.target.value)}.bind(this));d.val(this.sort);var b=this.sidebarObj=new streamSidebar();c.find("#subs").remove();c.find("#viewNav").after(b.el);b.on("change:url",function(f){this.set("url",f)}.bind(this))};Stream.prototype.parseTopComments=function(a){var c=a?a:100;var b=this;reddit().setting("showTopComments",function(d){b.$el.find(".post:not(.withComments,.ad)").each(function(){if(d){if(c-->0){var g=$(this);g.addClass("withComments");var i=g.attr("data-permalink");var e=g.attr("data-name");var h=parseInt(g.attr("data-num_comments"));var f=$(Handlebars.templates["stream.contentPreviews"]({num_comments:h,name:e})).insertAfter(g);reddit().getcomments(i,"hot",function(k,p){g.find(".streamPolitics .downs .number").html(numberWithCommas(p.downs));var l=[];if(k.length>0){l[0]=k[0];l[0].data.permalink=i+l[0].data.id;if(k.length>1){l[1]=k[1];l[1].data.permalink=i+l[1].data.id;var o=Math.min(10,k.length);var r=l[0].data.body.length>l[1].data.body.length?0:1;for(var m=2;m<o;m++){if(l[0].data.body.length<=140&&l[1].data.body.length<=140){break}var n=k[m].data.body;if(n.length<l[r].data.body.length&&n!="[deleted]"&&n!="[removed]"){l[r]=k[m];r=l[0].data.body.length>l[1].data.body.length?0:1}}}}k=l;for(var m=0;m<k.length;m++){var n=k[m].data.body;if(n=="[deleted]"||n=="[removed]"){k.splice(m,1)}}var j=Handlebars.templates["stream.contentPreviews.list"]({comments:k});var q=f.find(".commentContainer");q.html(j.replace(/<a([^>]*?)\/([^>]*?)\/([^>]*?)>([^<]*?)<\/a>/gi,'<a$1/$2/$3>$4</a><span class="inlineViewHandle">+</span>'))})}}else{var g=$(this);g.addClass("withComments");var e=g.attr("data-name");var h=parseInt(g.attr("data-num_comments"));var f=$(Handlebars.templates["stream.contentPreviews"]({num_comments:h,name:e})).insertAfter(g)}})})};Stream.prototype.parseSmartContent=function(a){var f=a?a:100;var d=this.$el.find(".post").first();var c=d.css("padding-left");c=parseInt(c.substr(0,c.length-2));var g=d.css("padding-right");g=parseInt(g.substr(0,g.length-2));var e=d.width()-c-g;var b=this;this.$el.find(".smartContent[data-url]:not(.withSmartContent)").each(function(){if(f-->0){var i=$(this);i.addClass("withSmartContent");function h(k,l,j){if(j!="bareSource"&&k.indexOf("inlineViewHandle")==-1){k=k.replace(/<a([^>]*?)\/([^>]*?)\/([^>]*?)>(.{1,}?)<\/a>/gi,'<a$1/$2/$3>$4</a><span class="inlineViewHandle">+</span>')}i.html(k).addClass("loaded");i.css("opacity",0).animate({opacity:1},500);if(typeof l=="function"){l(i)}}infoHandler(i.attr("data-url"),function(k,l,j){if(!k||k.length==0){infoHandler(i.attr("data-preview"),function(n,o,m){h(n,o,m)},e,500,true)}else{h(k,l,j)}},e,500,true);i.removeAttr("data-url");if(b.NSFW&&i.hasClass("nsfw_true")){i.hide();i.parent().append('<div class="NSFWControls"> 										   <button class="showNSFWContent"> 										   <i class="icon-plus-sign-alt"></i>   Show NSFW Content</button> 										   <br> 										   <input type="checkbox" id="enableAllNSFW" class="enableAllNSFW" value="true">										   <label for="enableAllNSFW">Enable all NSFW</label> 									 </div>')}}})};Stream.prototype.enableAllNSFW=function(){reddit().setting("NSFW",false);this.set("NSFW",false);this.$el.find(".smartContent").show();this.$el.find(".NSFWControls").remove()};Stream.prototype.changeHeaderForMultireddit=function(c,b){var a=b.value.split(":");this.buildSubredditHeader(function(d){d=$(d);d.find("select").val(b.value);var e=this.$el.find(".headerElement");for(var f=0;f<e.length;f++){if(f==0){$(e[f]).replaceWith(d)}else{$(e[f]).remove()}}}.bind(this),a[0])};Stream.prototype.buildSubredditHeader=function(c,a){if(this.url.indexOf("/r/")>-1&&this.url.substr(0,7)!="/r/all/"){a=a?a:0;var b=this.url.match(/\/r\/(.*?)\//).pop().split("+");if(this.sidebarOpen){this.subredditSidebar(b[a])}reddit().subredditAbout(b[a],function(f){if(f.multisub=b.length>1){f.allsubs=b}f.selectedSubreddit=b[a];f.loggedin=reddit().loggedin;if(!f.public_description){f.public_description=f.header_title}f.public_description=$("<div></div>").html(f.public_description).text();try{f.public_description=SnuOwnd.getParser().render(f.public_description).replace(/<a([^>]*?)\/([^>]*?)\/([^>]*?)>(.{1,}?)<\/a>/gi,'<a$1/$2/$3>$4</a><span class="inlineViewHandle">+</span>')}catch(g){console.log("failed to parse public description")}var d=Handlebars.templates["stream.header"](f);if(reddit().apiVersion==2){d=$(d);reddit().issubscribed(b[a],function(e){d.find(".subscribe")[e?"addClass":"removeClass"]("unsubscribe")})}c(d)})}else{if(this.sidebarOpen){this.subredditSidebar(false)}}};Stream.prototype.closePostView=function(){analytics().track("Interaction","Closed a Post");if(this.poorColumn){this.poorColumn.shutdown()}delete this.poorColumn;delete this.postView;this.$el.find(".postViewContainer").remove()};Stream.prototype.openPostView=function(k,a,f,d,j){analytics().track("Interaction","Opened a Post");var h=this.$el.find(".postViewContainer");var l=h.length>0&&this.poorColumn;if(!l){this.closePostView()}var i=this.$el.find(".stream");i.hide();var c;if(l){c=h;c.show()}else{c=$('<div class="postViewContainer stream"> <div class="postViewData" id="PostView"><div class="loadingcss"></div></div> </div>').appendTo(this.$el)}var e=$('<div class="postViewData" id="PostView"><div class="loadingcss"></div></div>');c.find(".postViewData").replaceWith(e);this.postView=postViewObj=new redditpost(a,k,e,reddit(),this);if(f!==false){var b=this.url.replace(/\//g,"~");var g=k.replace(/\//g,"~");b="#/Stream/url/"+b+"/post/"+g;setSilentHash(b);this.set("getVars",{url:this.url.replace(/\//g,"~"),post:g})}reddit().setting("showColumnOnPostview",function(q){if(q){var o={SORT:this.sort,TEMP:true,startAt:j?j:d};var p=this.url.replace(".json","");if(this.followHashtags){$(".sortStreamBy").hide()}var n=function(s){if(!l){var r=$('<div id="ColumnContainer streamColumnPostView"><div class="container stickleft" style="top: 0px"></div></div>').appendTo(c);this.poorColumn=new column(s,r.find(".container"),$("body"),reddit(),undefined,o,s.replace(".json","").replace(/^\/$/,"Frontpage").replace(/\?(.*?)$/,""),60000,"100px").startup()}else{if(this.poorColumn.url!=s){this.poorColumn.setTitle(s.replace(".json","").replace(/^\/$/,"Frontpage").replace(/\?(.*?)$/,""));this.poorColumn.setUrl(s)}else{this.poorColumn.insertAd(true,true)}}}.bind(this);if(this.followHashtags&&window.location.hash.indexOf("/url/")>-1){n(window.location.hash.match(/url\/(.*?)(\/|$)/)[1].replace(/~/g,"/"));delete o.startAt}else{if(this.followHashtags&&window.location.hash.indexOf("~r~(.*?)~")>-1){n(window.location.hash.match(/~r~(.*?)~/).pop().replace(/~/g,"/"));delete o.startAt}else{if(this.getVars.url){n(this.getVars.url.replace(/~/g,"/"))}else{var m=this.postView.drawHeader;this.postView.drawHeader=function(r){n("/r/"+r.subreddit+"/");return m.call(postViewObj,r)}}}}}}.bind(this))};Stream.prototype.handleLink=function(c,b){c.stopPropagation();c.preventDefault();var a=b.getAttribute("href");if(a.substr(0,3)=="/r/"){this.set("url",(a+"/.json").replace(/\/\//g,"/"))}else{popupBrowser(a)}};Stream.prototype.newPost=function(){var a=this.url.match(/\/r\/(.*?)\//).pop();if(a.indexOf("+")>-1){a=this.el.querySelector("[data-selectedsubreddit]").getAttribute("data-selectedsubreddit")}createPost(this,connection,window.tabManagerObj,undefined,a)};Stream.prototype.showNSFWContent=function(b,a){a=$(a);window.x=a;a.parent().parent().find(".smartContent").fadeIn();a.parent().remove()};Stream.prototype.changeSubreddit=function(b,a){this.set("url",(a.innerHTML+"/.json").replace(/\/\//,"/"))};Stream.prototype.inlineView=function(b,a){b.stopPropagation();redditpost.prototype.inlineView($(a))};Stream.prototype.loadAllComments=function(g,f){$(f).find(".newComments").remove();var c=$(f.parentNode).prev();var d=c.attr("data-permalink");var b=c.attr("data-name");var a=c.prev().prev().attr("data-name");var h=b.split("_").pop();this.openPostView(d,h,undefined,b,a)};Stream.prototype.toggleSubscribe=function(d,c){var f=c.getAttribute("data-name");var a=this.$el.find(".subscriberCount");var b=parseInt(a.text().replace(/,/g,""));if(c.classList.contains("unsubscribe")){reddit().unsubscribe(f);c.classList.remove("unsubscribe");a.html(numberWithCommas(b-1))}else{reddit().subscribe(f);c.classList.add("unsubscribe");a.html(numberWithCommas(b+1))}};Stream.prototype.initPostContextMenu=function(d,c){d.stopPropagation();d.preventDefault();var b=$(c);var a=$.Event("contextmenu");a.pageX=b.offset().left-180;a.pageY=b.offset().top+b.outerHeight()-1;b.parent().trigger(a)};Stream.prototype.togglePostContextMenu=function(j,k){var l=$(k);var b="http://reddit6.com/"+l.attr("data-id");var f=l.attr("data-href");var a=l.attr("data-name");var n="http://reddit6.com"+l.attr("data-permalink");var h=n.match(/\/r\/(.*?)\//).pop();var m=this;var g=infoHandler(f,false)?"<li data-message='save' id='save'><i class='icon-save'></i><span>Save Image As...</span></li>":"";var i="";if(reddit().loggedin){var c="loading"+Date.now();i="<li id='"+c+"'><i class='icon-save'></i><span>Loading...</span></li>";reddit().isPostSaved(a,function(e){waitForSelector("#"+c,function(){$("#"+c).replaceWith(e?"<li data-message='Un_Save' id='save'><i class='icon-save'></i><span>"+locale.Un_Save+" Post</span></li>":"<li data-message='Save' id='save'><i class='icon-save'></i><span>"+locale.Save+" Post</span></li>")})})}var o="<li data-message='reply' id='reply'><i class='icon-comment'></i><span>Quick Reply</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='open' id='open'><i class='icon-eye-open'></i><span>Open Link in New Window</span></li>"+g+"<li data-message='copyLink' id='copyLink' data-clipboard-text='"+f+"'><i class='icon-copy'></i><span>Copy Link URL</span></li> 				   <li data-message='copyReddit' id='copyReddit' data-clipboard-text='"+n+"'><i class='icon-copy'></i><span>Copy Comments URL</span></li> 				   <div class='contextSeparator'></div>"+i+"<li data-message='hide' id='hide'><i class='icon-remove'></i><span>Hide</span></li>                    <li data-message='block' id='block'><i class='icon-trash'></i><span>Block Subreddit</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='facebook' id='fb'><i class='icon-facebook-sign'></i><span>Share with Facebook</span></li> 				   <li data-message='twitter' id='twitter'><i class='icon-twitter-sign'></i><span>Share with Twitter</span></li> 				   <li data-message='google' id='google'><i class='icon-google-plus-sign'></i><span>Share with Google+</span></li>";var d=$.contextMenu(o,j,function(w,r){if(w=="hide"){m.hidePost(l)}else{if(w=="facebook"){var s="537294919626568";var t=l.children(".title:first").text();var e="https://www.facebook.com/dialog/feed?app_id="+s+"&link="+b+"&name="+t+"&redirect_uri=http://reditr.com/fb.html";popupBrowser(e,"facebook")}else{if(w=="twitter"){var v="Reditr";var u=l.children(".title:first").text();var e="https://twitter.com/intent/tweet?url="+b+"&via="+v+"&text="+u+"&hashtags=reddit";popupBrowser(e,"twitter","popup")}else{if(w=="google"){var e="https://plus.google.com/share?url="+b;popupBrowser(e,"google","popup")}else{if(w=="open"){popupBrowser(f+((f.indexOf("reddit.com")!=-1)?"#oo":""))}else{if(w=="save"){downloadImage(f)}else{if(w=="block"){var p="Are you sure you want to block all posts from /r/"+h+"? To undo this, open settings, go to filter and remove "+h+" from the filter list";confirmFancy(p,function(x){if(x){reddit().filter("banned-subs",[h]);l.next(".topComments").remove();l.remove()}})}else{if(w=="copyLink"){clipboard_set(f)}else{if(w=="copyReddit"){clipboard_set(n)}else{if(w=="Save"){reddit().savePost(a)}else{if(w=="Un_Save"){reddit().unsavePost(a)}else{if(w=="reply"){var q={post:l,thing_name:l.attr("data-name"),sub:l.attr("data-permalink").match(/\/r\/(.*?)\//).pop(),author:l.find(".author").text()};m.beginReplyToPost(q)}}}}}}}}}}}}});if(window.clipboard_set_flash){clipboard_set_flash(d.find("#copyLink")[0]);clipboard_set_flash(d.find("#copyReddit")[0])}};Stream.prototype.closeTutorial=function(){this.$el.find(".tutorial").remove();storageWrapper.prototype.save("streamTutorialClosed",true)};Stream.prototype.toggleCommentContextMenu=function(g,f){var h=$(f);var d="http://reddit.com"+h.attr("data-permalink");var c=h.attr("data-name");var b="<li data-message='reply' id='reply'><i class='icon-comment'></i><span>Quick Reply</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='copyReddit' id='copyReddit'><i class='icon-copy'></i><span>Copy Comment's URL</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='facebook' id='fb'><i class='icon-facebook-sign'></i><span>Share with Facebook</span></li> 				   <li data-message='twitter' id='twitter'><i class='icon-twitter-sign'></i><span>Share with Twitter</span></li> 				   <li data-message='google' id='google'><i class='icon-google-plus-sign'></i><span>Share with Google+</span></li>";var a=this;$.contextMenu(b,g,function(n,m){if(n=="hide"){a.hidePost(l)}else{if(n=="facebook"){var j="537294919626568";var i="https://www.facebook.com/dialog/feed?app_id="+j+"&link="+d+"&redirect_uri=http://reditr.com/fb.html";popupBrowser(i,"facebook")}else{if(n=="twitter"){var e="Reditr";var i="https://twitter.com/intent/tweet?url="+d+"&via="+e+"&hashtags=reddit";popupBrowser(i,"twitter","popup")}else{if(n=="google"){var i="https://plus.google.com/share?url="+d;popupBrowser(i,"google","popup")}else{if(n=="open"){popupBrowser(d+((d.indexOf("reddit.com")!=-1)?"#oo":""))}else{if(n=="copyReddit"){clipboard_set(d)}else{if(n=="Save"){reddit().savePost(c)}else{if(n=="Un_Save"){reddit().unsavePost(c)}else{if(n=="reply"){var l=h.parent().parent().prev();var k=function(p){h.after(p)};var o={post:l,thing_name:h.attr("data-name"),sub:l.attr("data-permalink").match(/\/r\/(.*?)\//).pop(),author:h.find(".author").text(),insertCode:k};a.beginReplyToPost(o)}}}}}}}}}})};Stream.prototype.hidePost=function(b){analytics().track("Interaction","Hid Post");var a=b.attr("data-name");b.find(".postContent").slideUp(100);b.find(".unhidePrompt").fadeIn(100);this.retractCommentsForPost(b);reddit().hidepost(a)};Stream.prototype.unhidePost=function(b){analytics().track("Interaction","Unhid Post");var a=b.attr("data-name");b.find(".postContent").slideDown(100);b.find(".unhidePrompt").fadeOut(100);this.expandCommentsForPost(b);reddit().unhidepost(a)};Stream.prototype.handleUnhidePost=function(b,a){this.unhidePost($(a).parent())};Stream.prototype.retractCommentsForPost=function(a){var b=a.next();if(b.hasClass("topComments")){b.attr("data-height",b.height());b.animate({height:"0px"},100,function(){b.hide()})}};Stream.prototype.expandCommentsForPost=function(a){var b=a.next();if(b.hasClass("topComments")){b.show().animate({height:b.attr("data-height")},100,function(){b.css("height","auto")})}};Stream.prototype.imageZoom=function(b,a){imageZoom(a.getAttribute("src"))};Stream.prototype.followAuthor=function(b,a){new userInfo(a.innerHTML,reddit())};Stream.prototype.scroll=function(d){var f=this.stream[0];if(!this.loadingNew&&f.scrollHeight-f.clientHeight-f.scrollTop<500){var a=this.postStore;if(a&&a.length>0){var c=a.splice(0,3);this.stream.append(Handlebars.templates["stream.list"](c));this.parseSmartContent(7);this.parseTopComments(7)}else{var b=this.$el.find(".post:last");if(b.length>0){connection.getAllLocalStorageCache(function(e){this.cacheStore=e||{}}.bind(this));this.loadingNew=true;reddit().getPosts(this.url,0,b.attr("data-name"),function(e){var g=e.splice(0,3);this.postStore=e;this.stream.append(Handlebars.templates["stream.list"](g));this.parseSmartContent(3);this.parseTopComments(3);this.loadingNew=false}.bind(this),undefined,this.sort)}}}};Stream.prototype.clickedPostTitle=function(b,a){b.preventDefault();b.stopPropagation();popupBrowser(a.parentNode.parentNode.getAttribute("data-href")+"#oo")};Stream.prototype.editComment=function(d,c){var g=c.parentNode;var b=g.getAttribute("data-name");var a=g.getAttribute("data-id");var f=g.parentNode.parentNode.previousSibling.getAttribute("data-permalink");reddit().getSingleComment(f,a,function(e){var h;h=new replyBar({},reddit(),e.body,"Editing Comment","edit_"+b,function(i){reddit().editPost(b,i,function(k,j){if(k=="error"){alert("Reddit rejected your edit!")}else{g.querySelector(".md").innerHTML=j;reddit().updateLocalStorageCache("edit_"+b,i,1);h.delay(1000).clearDraft();h.close()}}.bind(this))}.bind(this),true,true)}.bind(this))};Stream.prototype.replyToComment=function(f,d){var g=$(d).parent();var b=g.parent().parent().prev();var a=function(e){g.after(e)};var c={post:b,thing_name:g.attr("data-name"),sub:b.attr("data-permalink").match(/\/r\/(.*?)\//).pop(),author:g.find(".author").text(),insertCode:a};this.beginReplyToPost(c)};Stream.prototype.beginReplyToPost=function(h,g){if(!reddit().loggedin){new quickText({bindTo:$(".accountsButton"),initialContent:"You must login before you can reply to posts!",buttons:"<button data-message='close' class='right red space'>"+locale.Close+"</button>"},function(){this.close()});return}if(h&&h.post&&h.thing_name){var b=h.post;var f=h.thing_name;var d=h.sub;var c=h.author;if(h.insertCode){var a=h.insertCode}}else{var b=$(g).parent().prev();var f=b.attr("data-name");var d=b.attr("data-permalink").match(/\/r\/(.*?)\//).pop();var c=b.find(".author").text()}new replyBar({},reddit(),"","Reply to "+c,f,function(e){reddit().comment(f,d,e,function(l,o){if(!l){alert(o)}else{this.delay(1000).clearDraft();this.close();var k=document.createElement("textarea");k.innerHTML='<div class="md"><p>'+SnuOwnd.getParser().render(e)+"</p></div>";var n=k.innerHTML;var j={comments:[{data:{name:l,id:l.split("_").pop(),likes:true,ups:1,downs:0,author:reddit().user.username,body_html:n,plainText:e}}]};console.log(j);var i=Handlebars.templates["stream.contentPreviews.list"](j);if(a){a(i)}else{b.next().find(".commentContainer").append(i)}var m=b.find(".commentCount").add(b.next().find(".commentCount"));if(m.length>0){m.html(translateNumberWithComma(m.first().text(),1))}}}.bind(this))},true,true)};Stream.prototype.manageTag=function(c,b){var f=b.getAttribute("id");var d=b.parentNode.getAttribute("data-username");var a=b.innerHTML;redditpost.prototype.manageTags(d,a,f)};Stream.prototype.subredditSidebar=function(c){if(this instanceof Stream){if(c===false){this.$el.removeClass("sidebarOpen");$(".stream_subreddit_sidebar").hide();return}else{this.$el.addClass("sidebarOpen");$(".stream_subreddit_sidebar").show()}this.set("sidebarOpen",true)}if(!c||typeof c!="string"){c=this.url.match(/\/r\/(.*?)\//).pop()}if(c.indexOf("+")>-1){c=this.el.querySelector("[data-selectedsubreddit]").getAttribute("data-selectedsubreddit")}$(".stream_subreddit_sidebar").remove();var b=$('<div class="stream_subreddit_sidebar"> 						 <div class="close icon-remove"></div> 					 	 <div class="content"> 					 	 	<div class="icon-spin icon-spinner loader"></div> 					 	 </div> 					 </div>').appendTo("#ColumnContainer");var a=this;b.find(".close").click(function(){b.remove();if(a instanceof Stream){a.set("sidebarOpen",false)}});b.on("click","a",function(f){f.preventDefault();f.stopPropagation();var d=f.currentTarget.getAttribute("href");var h=d.match(/\/r\/([^\/]*?)($|\/$)/);if(h){var g=h[1];if(window.location.hash.indexOf("#/Stream")>-1){window.location.hash="#/Stream/url/~r~"+g+"~.json/sort/hot"}else{new quickView(reddit(),capitalize(g),"/r/"+g+"/")}}else{popupBrowser(d.replace("reddit.com","reddit6.com"))}});reddit().sidebar(c,function(d){b.find(".content").html(d)})};Stream.prototype.politics=function(d,c){if(!reddit().loggedin){return}c=$(c);if((c.hasClass("ups")&&c.hasClass("true"))||(c.hasClass("downs")&&c.hasClass("false"))){reddit().removevote(c.parent().parent().parent().attr("data-name"));c.removeClass("true").removeClass("false");var a=c.find(".number");a.html(translateNumberWithComma(a.html(),-1))}else{if(c.hasClass("ups")){reddit().upvote(c.parent().parent().parent().attr("data-name"));c.addClass("true");var a=c.find(".number");a.html(translateNumberWithComma(a.html(),1));var b=c.parent().find(".downs");if(b.hasClass("false")){b.removeClass("false");a=b.find(".number");a.html(translateNumberWithComma(a.html(),-1))}}else{if(c.hasClass("downs")){reddit().downvote(c.parent().parent().parent().attr("data-name"));c.addClass("false");var a=c.find(".number");a.html(translateNumberWithComma(a.html(),1));var f=c.parent().find(".ups");if(f.hasClass("true")){f.removeClass("true");a=f.find(".number");a.html(translateNumberWithComma(a.html(),-1))}}}}};var _sharedStorageWrapperInstance;var storageWrapper=function(){if(_sharedStorageWrapperInstance){return _sharedStorageWrapperInstance}else{if(this instanceof storageWrapper){return _sharedStorageWrapperInstance=this}else{return _sharedStorageWrapperInstance=new storageWrapper()}}};if(typeof chrome!="undefined"&&typeof chrome.storage!="undefined"){storageWrapper.prototype={save:function(a,c,d){if(c==undefined||c==null){storageWrapper.prototype.remove(a);return}var b={};b[a]=c;chrome.storage.local.set(b);if(typeof d=="function"){d()}},fetch:function(a,b){chrome.storage.local.get(a,function(c){if(typeof b=="function"){b(c[a])}})},remove:function(a){chrome.storage.local.remove(a)}}}else{storageWrapper.prototype={save:function(a,b,c){window.localStorage[a]=JSON.stringify([b]);if(typeof c=="function"){c()}},fetch:function(b,c){var a=window.localStorage[b];if(a!=null){a=JSON.parse(a);if(typeof a!="boolean"){a=a[0]}}else{a=undefined}if(a==null){a=undefined}if(typeof c=="function"){c(a)}},remove:function(a){window.localStorage.removeItem(a)}}}var cookieManagerWrapper=function(){this.url="http://www.reddit.com"};var DESKTOP=(typeof chrome=="undefined")?true:false;if(DESKTOP){cookieManagerWrapper.prototype.set=function(a,c){this.remove(a);var d=new Date();d.setDate(d.getDate()+999);var b=escape(c)+d.toUTCString();document.cookie=a+"="+b};cookieManagerWrapper.prototype.get=function(b){var c,a,e,d=document.cookie.split(";");for(c=0;c<d.length;c++){a=d[c].substr(0,d[c].indexOf("="));e=d[c].substr(d[c].indexOf("=")+1);a=a.replace(/^\s+|\s+$/g,"");if(a==b){return unescape(e)}}};cookieManagerWrapper.prototype.remove=function(a){var c=new Date();c.setDate(c.getDate()-999);var b=escape(null)+c.toUTCString();document.cookie=a+"="+b}}else{if(typeof chrome!="undefined"&&typeof chrome.storage=="undefined"&&typeof chrome.extension!="undefined"){cookieManagerWrapper.prototype={set:function(a,c){this.remove(a);var b={url:this.url,name:a,value:c,domain:".reddit.com",path:"/"};chrome.cookies.set(b)},get:function(a){var b={url:this.url,name:a};chrome.cookies.get(b,function(c){return c.value})},remove:function(a){var b={url:this.url,name:a};chrome.cookies.remove(b)}}}else{cookieManagerWrapper.prototype={set:function(a,b){},get:function(a){return null},remove:function(a){}}}}var cookieMngr,cookieManager;cookieMngr=cookieManager=new cookieManagerWrapper();var cachedPosts={};if(typeof volatileUserCacheData=="undefined"){var volatileUserCacheData={}}function reddit(c,d){if(window._redditSharedInstance){return window._redditSharedInstance}if(!(this instanceof reddit)){return window._redditSharedInstance=new reddit(c?c:new storageWrapper(),d)}this.database=c;this.user={friends:{},modlist:{},id:"guest",username:"",subscribed:{}};this.settings={};if(this.apiVersion==2){var a=this;if(this.baseProxy!=""){var b=this.baseProxy.length+this.oauthBase.length+1;$.ajaxSetup({beforeSend:function(g,e){if(reddit().user.accesstoken&&(e.url.substr(0,b)==a.baseProxy+a.oauthBase+"/")){e.url=e.url.replace(/\?/g,"&").replace("&","?");var f="&";e.url+=f+"accesstoken="+reddit().user.accesstoken;e.url=e.url.replace(f+f,f)}}})}else{var b=this.baseProxy.length+this.oauthBase.length+1;$.ajaxSetup({beforeSend:function(f,e,g){if(reddit().user.accesstoken&&e.url.substr(0,b)==a.baseProxy+a.oauthBase+"/"){f.setRequestHeader("Authorization","Bearer "+reddit().user.accesstoken)}}})}}if(typeof d=="function"){d(this)}return this}reddit.prototype.mandatoryProxy="http://reditr.com/api/sync/?forward=";reddit.prototype.base="https://www.reddit.com";reddit.prototype.baseProxy="";reddit.prototype.jsonextension=".json?";reddit.prototype.oauthBase="https://oauth.reddit.com";reddit.prototype.apiVersion=1;reddit.prototype.crossDomain=false;reddit.prototype.loggedin=false;reddit.prototype.loggingIn=false;reddit.prototype.defaultSettings={infiniteScroll:false,load_all_comments_automatically:false,live_private_messages:true,live_notification_updates:true,show_desktop_notifications:true,locale:"en",visual_animations:true,subscribed_subs_only:false,macros_enabled:true,highlightNew:true,theme:"light",postHoverOvers:true,subredditBar:false,enableFlair:true,NSFW:2,fontSize:13,showColumnOnPostview:true,defaultColumnWidth:300,scrollBarWidth:3,textPreviewsEnabled:true,backgrounds:["http://imgur.com/K3JyO","http://imgur.com/lWvky","http://imgur.com/BdnaD","http://imgur.com/OPsLD","http://imgur.com/zvj6t"],background:-1,backgroundStretched:true,historyToKeep:200,redirectReddit:true,ytVideoType:"flash",dontShowAgain_redirectReddit:false,clicking_comments_slides_to_them:true,showPagePreviews:true,useQuickview:true,markReadOnHoverDelay:2000,quickButtons:true,nsfwRibbon:false,cacheSize:150,showTopComments:true,showMyUsername:true,macroShortcuts:{openSearch:window.keyModifierAsString+"+s",closePopup:"escape",nextGalleryItem:"right",prevGalleryItem:"left",columnDropdown:"up",reply:window.keyModifierAsString+"+r",newThread:window.keyModifierAsString+"+g",messages:window.keyModifierAsString+"+e",openSettings:window.keyModifierAsString+"+,",accounts:window.keyModifierAsString+"+d",goHome:window.keyModifierAsString+"+j",goBack:"alt+left",goForward:"alt+right",submit:window.keyModifierAsString+"+enter",toggleScopeLeft:"a",toggleScopeRight:"d",toggleItemUp:"w",toggleItemDown:"s",upvote:"e",downvote:"q",openQuickview:window.keyModifierAsString+"+b"}};reddit.prototype.accessToken=function(e){var a=this.user;var d=a.accesstoken_lastUsed;var c=Date.now();if(!a.accesstoken||(c-d>500000)){var b="http://reditr.com/api/sync/?getAccessToken&oauth="+a.refreshkey;if(!a.refreshkey){b="http://reditr.com/api/sync/?guest_access_token"}$.get(b,function(f){f=typeof f=="string"?JSON.parse(f):f;a.accesstoken=f.accesstoken||f.access_token;a.accesstoken_lastUsed=c;e(a.accesstoken)})}else{e(a.accesstoken)}return true};reddit.prototype.loginActiveUser=function(b){var a=this;this.database.fetch("skipSyncOnce",function(d){if(d){this.database.remove("skipSyncOnce");if(b){b(a)}return}function c(){a.database.fetch("reddit_activeuser",function(e){if(typeof e!="undefined"){a.switchUser(e,function(){if(typeof b=="function"){b(a)}})}else{a.logout(function(){if(typeof b=="function"){b(a)}})}})}if(window.isChrome&&!window.isChromePackaged&&a.apiVersion==1){a.me(function(e){if(e=="error"){c()}else{database.save("reddit_activeuser",a.user.username.toLowerCase());a.loggedin=true;if(typeof b=="function"){b(a)}}})}else{c()}})};reddit.prototype.defaultSubs=["Reditr","Funny","Pics","Aww","television","earthporn","explainlikeimfive","WorldNews","Politics","Videos","Gifs","Todayilearned","IamA","AskReddit","Music","Movies","BestOf","Gaming","Trees","Technology","Science","AskScience","Programming","Books"];reddit.prototype.subs=function(b,c){var a="reddit_"+this.user.username+"_subs";if(typeof b=="function"){this.database.fetch(a,function(d){if(typeof d=="undefined"){d=reddit.prototype.defaultSubs}b(d)})}else{this.database.save(a,b);sync_update(self);if(typeof c=="function"){c()}}};reddit.prototype.filter_cache=false;reddit.prototype.clearFilter=function(c){var a="reddit_"+((this.loggedin)?this.user.username:"guest")+"_filters";var b=this.database;b.fetch(a,function(d){if(d&&d[c]){delete d[c];reddit.prototype.filter_cache=d;b.save(a,d)}});return this};reddit.prototype.filter=function(d,c){if(reddit.prototype.filter_cache&&typeof c=="function"){c(reddit.prototype.filter_cache[d]);return}var a="reddit_"+((this.loggedin)?this.user.username:"guest")+"_filters";var b=this.database;b.fetch(a,function(f){if(!f){f={}}if(!f[d]){f[d]=[]}reddit.prototype.filter_cache=f;if(typeof c=="function"){c(f[d]);return}if(c instanceof Array){for(var e=0;e<c.length;e++){if(c[e]&&c[e]!=""){f[d].push(c[e].toLowerCase())}}}else{if(c&&c!=""){f[d].push(c.toLowerCase())}}b.save(a,f)});return this};reddit.prototype.tags=function(c,d){var a=this.database;var b="reddit_"+this.user.username+"_tags";if(typeof c=="function"){a.fetch(b,function(e){if(typeof e=="undefined"){e={macmee:[{c:"#FFFFFF",b:"#FF0000",t:"Reditr Dev"}],kortank:[{c:"#FFFFFF",b:"#FF0000",t:"Reditr Dev"}]}}c(e)})}else{a.save(b,c);sync_update(self);if(typeof d=="function"){d()}}};reddit.prototype.setting=function(f,b,a){var i=this;if(f.constructor===Array){var c=[];var h=0;function e(){i.setting(f[h],function(j){c.push(j);h++;if(h>=f.length){b.apply(null,c)}else{setTimeout(function(){e()},0)}})}return e()}var d="reddit_"+((this.loggedin)?this.user.username:"guest")+"_settings";var g=this.database;if(typeof b=="function"){if(typeof this.settings[f]!="undefined"){b(this.settings[f])}else{g.fetch(d,function(j){if(typeof j!="undefined"&&typeof j[f]!="undefined"){i.settings[f]=j[f]}else{i.settings[f]=i.defaultSettings[f]}b(i.settings[f])})}}else{g.fetch(d,function(j){i.settings[f]=b;if(typeof j!="undefined"){j[f]=b;g.save(d,j)}else{g.save(d,i.settings)}if(typeof a=="function"){a()}})}};reddit.prototype.removeUser=function(d,b,c){var a=this.database;d=d.toLowerCase();a.fetch("users",function(e){if(typeof e=="undefined"){e={}}delete e["reddit_"+d];a.save("users",e,function(){if(typeof c=="function"){c()}})})};reddit.prototype.switchUserOauth=function(b,d){this.logout();var c=this.database;var a=this;c.fetch("reddit_"+b.toLowerCase()+"_refreshkey",function(e){c.fetch("reddit_"+b.toLowerCase()+"_lastTimeAuthed",function(g){if(!e||!b||!g){$.get("http://reditr.com/api/sync/",{oauth:""},function(n){var l=document.createElement("div");l.className="authPopup";var h="<br><br><br><br>Click Here once you approved Reditr in the window that opened";var k;var m=0;var i=function(){clearInterval(k);k=setInterval(function(){if(m++>=20){clearInterval(k)}l.onclick()}.bind(this),1500)}.bind(this);if(window.open("http://reditr.com/api/sync/?oauth="+n)){l.innerHTML=h;setTimeout(i,1000)}else{l.innerHTML='<br><br><br><br><button class="openPopup"><i class="icon-lock"></i>Authenticate With Reddit</button>'}l.setAttribute("style","position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; background: black; text-align: center; z-index: 999999999999999999999999999999999999; color: white");document.body.appendChild(l);var j=false;l.onclick=function(){if(j){return}j=true;if(l.querySelector(".openPopup")){l.innerHTML=h;window.open("http://reditr.com/api/sync/?oauth="+n);setTimeout(i,1000)}$.get("http://reditr.com/api/sync/",{oauth:n,revive:true},function(q){j=false;q=typeof q=="string"?JSON.parse(q):q;var o=q.status;if(o!="waiting"){document.body.removeChild(l);clearInterval(k)}else{return}if(o=="failed"){alert("You could not be logged in due to a problem with Reddit.");d(false);return}else{if(o=="success"){a.loggedin=true;var p=q.name.toLowerCase();c.save("reddit_"+p+"_lastTimeAuthed",(Date.now()+(new Date().getTimezoneOffset())));if(b&&b.toLowerCase()!=p){alert('You asked to login to "'+b+'" but instead approved Reditr on "'+q.name+'". You have been logged into "'+q.name+'" instead.')}c.save("reddit_activeuser",p);c.save("reddit_"+p+"_refreshkey",q.refreshkey);c.fetch("users",function(r){if(!r){r={}}r["reddit_"+p]={type:"reddit",username:p};c.save("users",r)});a.user.refreshkey=q.refreshkey;a.user.username=q.name.toLowerCase();a.accessToken(function(){if(b){f()}else{if(d){d()}}})}}})}})}else{a.user.username=b.toLowerCase();a.loggedin=true;a.user.refreshkey=e;c.save("reddit_activeuser",b.toLowerCase());a.accessToken(function(){f()})}function f(){a.me(function(h){if(a.user.is_mod){a.modlist()}a.getFriends();if(d){d()}})}})})};reddit.prototype.switchUser=function(b,d){if(this.apiVersion==2){return this.switchUserOauth(b,d)}var c=this.database;var a=this;c.fetch("reddit_"+b,function(f){a.logout(function(){if(window.isChrome&&!window.isChromePackaged&&f&&f.cookie){cookieManager.set("reddit_session",f.cookie.replace(/,/g,"%2C").replace(/:/g,"%3A"));setTimeout(function(){e()},200)}else{c.fetch(b.toLowerCase()+"_session",function(h){if(typeof h=="undefined"||h==""){promptFancy("Please re-enter your password for the <b>Reddit</b> account "+b,function(i){c.save(b.toLowerCase()+"_session",btoa(i));if(!i){reloadApp();return}g(i)},"password")}else{g(atob(h))}});function g(h){a.login(b,h,function(i,j){if(j=="error"){if(i=="WRONG_PASSWORD"){alert("The password to your account "+b+" was incorrect!");c.save(b.toLowerCase()+"_session","");a.switchUser(b,d)}else{if(i=="RATELIMIT"){alert("Reddit has reported a rate limit error for your account "+b+". Please try logging in again in several minutes!");c.save(b.toLowerCase()+"_session","");reloadApp()}}}else{e()}})}}});function e(){c.save("reddit_activeuser",b.toLowerCase());a.loggedin=true;if(f){a.user=f;a.me();g()}else{a.me(function(){g()})}function g(){if(a.user.is_mod){a.modlist()}a.getFriends();if(typeof d=="function"){d()}}}})};reddit.prototype.itemsCached=[];reddit.prototype.setCache=function(b,c){if(!cachedPosts[b]){var a=this.itemsCached;a.push(b);this.setting("cacheSize",function(d){if(a.length>d){delete cachedPosts[a.shift()]}})}cachedPosts[b]=c};reddit.prototype.removeCache=function(a){if(cachedPosts[a]){this.itemsCached.splice(this.itemsCached.indexOf(a),1);delete cachedPosts[a]}};reddit.prototype.updateCache=function(d,a,b){var c=cachedPosts[d];if(typeof c=="undefined"){return false}cachedPosts[d][a]=b;return true};var redditGetCache=reddit.prototype.getCache=function(c,a){var b=cachedPosts[c];return(typeof b=="undefined")?false:cachedPosts[c][a]};reddit.prototype.updateLocalStorageCache=function(g,d,h,i){var a=new Date();var e=new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime();var b=e+(h*86400000);var c="reddit_"+(this.loggedin)?this.user.username:"guest";var f=this.database;var j=false;f.fetch(c+"_cache",function(k){if(typeof k=="undefined"){k={}}if(typeof k[g]!="undefined"){j=k[g].expires}k[g]={contents:d,expires:b};f.save(c+"_cache",k);if(typeof i=="function"){i(k)}});f.fetch(c+"_cache_expires",function(k){if(typeof k=="undefined"){k={}}if(typeof k[b]=="undefined"){k[b]={}}if(j!=false){try{delete k[j][g]}catch(l){console.log("A local storage caching error has occured: ",l)}}k[b][g]=true;f.save(c+"_cache_expires",k)})};reddit.prototype.getAllLocalStorageCache=function(b){var a="reddit_"+(this.loggedin)?this.user.username:"guest";this.database.fetch(a+"_cache",b)};reddit.prototype.getLocalStorageCache=function(b,c){var a="reddit_"+(this.loggedin)?this.user.username:"guest";this.database.fetch(a+"_cache",function(d){if(typeof d=="undefined"||typeof d[b]=="undefined"){c({})}else{c(d[b].contents,d[b].expires)}})};reddit.prototype.purgeLocalStorageCache=function(){var c=this.database;var a="reddit_"+(this.loggedin)?this.user.username:"guest";var b=Date.now();c.fetch(a+"_cache",function(d){c.fetch(a+"_cache_expires",function(h){for(var g in h){if(g<b){var e=h[g];for(var f in e){delete d[f]}delete h[g]}}c.save(a+"_cache",d);c.save(a+"_cache_expires",h)})})};reddit.prototype.userVariable=function(b,d){var c=this.database;var a="reddit_"+(this.loggedin)?this.user.username:"guest";c.fetch(a,function(e){if(typeof d=="function"){d((typeof e!="undefined")?e[b]:undefined);return}if(typeof e=="undefined"){e={}}e[b]=d;c.save(a,e)})};reddit.prototype.logout=function(a){this.settings={};window.volatileUserCacheData={};this.loggedin=false;this.database.save("reddit_activeuser",undefined);if(this.apiVersion==1){$.ajax({type:"POST",url:"http://www.reddit.com/logout",data:{top:"off",uh:this.user.modhash},success:a,error:a});this.user={friends:{},modlist:{},id:"guest",subscribed:{}}}else{this.user={friends:{},modlist:{},id:"guest",subscribed:{}};if(typeof a=="function"){a()}}};reddit.prototype.login=function(f,c,e){if(this.apiVersion==2){return this.switchUserOauth(f,e)}f=f.toLowerCase();var b=this;var a=this.user;var d=this.database;if(this.loggingIn){if(typeof e=="function"){e("RUNNING")}return}this.logout(function(){this.loggingIn=true;$.post("https://ssl.reddit.com/api/login/"+f,{api_type:"json",user:f,passwd:c},function(l,m,j){var h=l.json;var k=j.responseText;if(h.errors.length){var i="ERROR";if(k.indexOf("RATELIMIT")!=-1){i="RATELIMIT"}else{if(k.indexOf("WRONG_PASSWORD")!=-1){i="WRONG_PASSWORD"}}if(typeof e=="function"){e(i,"error")}b.loggingIn=false}else{if(!window.isChrome||window.isChromePackaged){database.save(f+"_session",btoa(c))}b.settings={};var g=h.data;database.fetch("users",function(n){if(typeof n=="undefined"){n={}}n["reddit_"+f]={username:f,type:"reddit"};database.save("users",n)});if(b.loggedin){database.fetch("reddit_activeuser",function(n){if(typeof n!="undefined"){b.logout(function(){b.switchUser(n)})}if(typeof e=="function"){e("SUCCESS_MULTIPLE",g)}});g.username=f;database.save("reddit_"+f,g);b.loggingIn=false;return}b.loggedin=true;if(!window.isChromePackaged){cookieManager.set("reddit_session",g.cookie)}b.me(function(){if(b.user.is_mod){b.modlist()}b.getFriends()});database.fetch("reddit_"+f,function(n){if(typeof n!="undefined"){a=n}else{a.tabPage=1}});a.username=f;a.cookie=g.cookie;a.modhash=g.modhash;if(typeof a.friends=="undefined"){a.friends={}}if(typeof a.savedPosts=="undefined"){a.savedPosts={}}if(typeof a.modlist=="undefined"){a.modlist={}}if(typeof a.id=="undefined"){a.id="guest"}if(typeof a.username=="undefined"){a.username=""}b.user=a;database.save("reddit_"+f,a);database.save("reddit_activeuser",f);if(typeof e=="function"){e("SUCCESS",g)}b.loggingIn=false}})})};reddit.prototype.getFriends=function(){var b=this.user.friends={};function c(g){var f=g[0].data.children;var d=f.length;for(var e=0;e<d;e++){b[f[e].name]=f[e].id}}if(this.apiVersion==2){var a=this;this.accessToken(function(d){$.getJSON(a.baseProxy+a.oauthBase+"/prefs/friends"+a.jsonextension,c)})}else{$.getJSON("https://ssl.reddit.com/prefs/friends"+this.jsonextension,c)}};reddit.prototype.multis=function(b){if(this.apiVersion==2){var a=this;this.accessToken(function(c){$.retryAjax({url:a.baseProxy+a.oauthBase+"/api/multi/mine",timeout:6000,retryLimit:10,success:b})})}else{$.retryAjax({url:this.base+"/api/multi/mine",timeout:6000,retryLimit:10,success:b})}};reddit.prototype.me=function(d){var a=this.user;var b=this;if(this.apiVersion==2){this.accessToken(function(e){$.getJSON(b.baseProxy+b.oauthBase+"/api/v1/me.json",c)})}else{$.getJSON(this.base+"/api/me"+this.jsonextension,function(e){c(e.data)})}function c(e){if(typeof e=="undefined"){if(typeof d=="function"){d("error")}return}a.has_mail=e.has_mail;a.username=a.name=e.name;a.created=e.created;a.created_utc=e.created_utc;a.link_karma=e.link_karma;a.comment_karma=e.comment_karma;a.is_gold=e.is_gold;a.is_mod=e.is_mod;a.id=e.id;a.has_mod_mail=e.has_mod_mail;a.modhash=e.modhash;b.database.save("reddit_"+a.username.toLowerCase(),a);if(typeof d=="function"){d(e)}}};reddit.prototype.modlist=function(d){if(!this.loggedin){return false}var c=this.user.modlist={};if(this.apiVersion==2){var b=this;this.accessToken(function(e){$.getJSON(b.baseProxy+b.oauthBase+"/reddits/mine/moderator.json",a)})}else{$.getJSON(this.base+"/reddits/mine/moderator"+this.jsonextension,a)}function a(h){var f=h.data.children;var e=f.length;for(var g=0;g<e;g++){c[f[g].data.url.toLowerCase().replace(/\//g,"-")]=true}if(typeof d=="function"){d()}}};reddit.prototype.ismod=function(a){if(typeof this.user.modlist=="undefined"){return false}return(this.user.modlist[a.toLowerCase().replace(/\//g,"-")]==true)?true:false};reddit.prototype.isfriend=function(a){if(typeof this.user.friends=="undefined"){return false}return(typeof this.user.friends[a]!="undefined")?true:false};reddit.prototype.mine=function(g){if(!this.loggedin){return g([])}var b=this;if(this.loading_mine){if(!this.mine_lineup){this.mine_lineup=[]}this.mine_lineup.push(g);return}this.loading_mine=true;var f=b.user.subscribed={};var c=[];var a=this.apiVersion==2?this.baseProxy+this.oauthBase+"/reddits/mine.json":this.base+"/reddits/mine"+this.jsonextension;var e=0;function d(i){i=i||"";var h;h={url:a,data:{limit:100,after:i},error:function(j){if(e++>5){if(g){g("error")}if(b.mine_lineup){while(b.mine_lineup.length>0){b.mine_lineup.pop()(dataSending)}b.mine_lineup=false}}else{console.log("dangerE",h);$.ajax(h)}},success:function(p,k,l){if(l.responseText.indexOf("heavy-load.png")>-1){console.log("dangerS",h);return $.ajax(h)}var l=(typeof p.data=="undefined")?[]:p.data.children;l.sort(function(s,r){return s.data.url[3]>r.data.url[3]?1:-1});var j=l.length;for(var o=0;o<j;o++){var m=l[o].data.name;var q=l[o].data.display_name.toLowerCase();f[m]=q;f[q]=m;c.push(l[o])}if(typeof p.data!="undefined"&&p.data.after!=null){d(p.data.after)}else{if(typeof g=="function"){b.loading_mine=false;var n=(p!="")?c:"error";g(n);if(b.mine_lineup){while(b.mine_lineup.length>0){b.mine_lineup.pop()(n)}}}}}};$.ajax(h)}if(this.apiVersion==1){d()}else{this.accessToken(function(h){d()})}};reddit.prototype.getPosts=function(b,d,a,h,g,c){var i=this;var d=d||0;var a=(a==null||a==undefined?"":a);var f={count:d,after:a,limit:25};if(c){b=b.replace(/\./,c+"/.")}if(g){f._=Date.now()}var e=function(m){if(!m.data){h([]);return}var k=m.data.children;h(k);var j=k.length;for(var l=0;l<j;l++){if(k[l].kind!="t1"){var m=k[l].data;i.setCache(m.id,m)}}};b=b.match(/\.json$/)?b+"?":b;b=b.replace(".json?",this.jsonextension);if(this.apiVersion==2){return this.accessToken(function(){$.retryAjax({url:i.baseProxy+i.oauthBase+b,data:f,timeout:6000,retryLimit:3,success:e})})}else{$.retryAjax({url:i.base+b,data:f,timeout:6000,retryLimit:3,success:e})}};reddit.prototype.morecomments=function(c,a,b,e,g){var d=this.user;var f=this.apiVersion;if(f==1){$.post(this.baseProxy+this.base+"/api/morechildren",{children:c,link_id:a,r:b,api_type:"json"},h)}else{var i=this;this.accessToken(function(){$.post(i.baseProxy+i.oauthBase+"/api/morechildren",{children:c,link_id:a,r:b,api_type:"json"},h)})}function h(m){var k=m.json.data.things;if(k.length==0){g(false);return false}var r={};function j(w){var s={};var u=s.data={};var t=w.contentHTML;u.id=w.id.split("_").pop();u.name=w.id;u.body_html=t;u.parent_id=w.parent;u.replies=(w.replies==null)?r[u.name]={data:{children:[]}}:"";try{u.ups=w.content.match(/data-ups="(.*?)"/).pop()}catch(v){u.ups=0}try{u.downs=w.content.match(/data-downs="(.*?)"/).pop()}catch(v){u.downs=0}try{u.author=w.content.match(/\/user\/(.*?)"/).pop()}catch(v){return false}try{u.created_utc=Math.floor((new Date(w.content.match(/datetime="(.*?)"/).pop())).getTime()/1000)}catch(v){return false}if(t.indexOf("upmod")!=-1){u.likes=true}else{if(t.indexOf("downmod")!=-1){u.likes=false}else{u.likes=null}}return s}var l=[];var o=[];var q=k.length;for(var n=0;n<q;n++){var p=(f==2)?k[n]:j(k[n].data);if(p){if(p.data.parent_id==e||!r[p.data.parent_id]){l.push(p)}else{r[p.data.parent_id].data.children.push(p)}}}g(l)}};reddit.prototype.upvote=function(d,c){if(d[0]!="t"||d[2]!="_"){var a=this.getCache(d,"name");if(a===false){a="t1_"+d}}else{var a=d}this.updateCache(d,"likes",true);this.updateCache(d,"ups",this.getCache(d,"ups")+1);if(this.apiVersion==1){$.post(this.base+"/api/vote",{id:a,dir:1,uh:this.user.modhash},function(e){if(typeof e.jquery!=undefined&&typeof c=="function"){c("success",e)}})}else{var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/vote",{id:a,dir:1,uh:b.user.modhash},function(e){if(typeof e.jquery!=undefined&&typeof c=="function"){c("success",e)}})})}};reddit.prototype.downvote=function(d,c){if(d[0]!="t"||d[2]!="_"){var a=this.getCache(d,"name");if(a===false){a="t1_"+d}}else{var a=d}this.updateCache(d,"likes",false);this.updateCache(d,"downs",this.getCache(d,"downs")+1);if(this.apiVersion==1){$.post(this.base+"/api/vote",{id:a,dir:-1,uh:this.user.modhash},function(e){if(typeof e.jquery!=undefined&&typeof c=="function"){c("success",e)}})}else{var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/vote",{id:a,dir:-1,uh:b.user.modhash},function(e){if(typeof e.jquery!=undefined&&typeof c=="function"){c("success",e)}})})}};reddit.prototype.remove=function(f,c,d,e){var a=this.getCache(f,"name");if(a===false){a=f}if(this.apiVersion==1){$.post(this.base+"/api/remove",{id:a,r:d,spam:c,uh:this.user.modhash},function(g){if(typeof e=="function"){e("success")}})}else{var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/remove",{id:a,r:d,spam:c,uh:b.user.modhash},function(g){if(typeof e=="function"){e("success")}})})}};reddit.prototype.deletepost=function(e,c,d){var a=this.getCache(e,"name");if(a===false){a="t1_"+e}if(this.apiVersion==1){$.post(this.base+"/api/del",{id:a,r:c,uh:this.user.modhash},function(f){if(typeof d=="function"){d("success")}})}else{var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/del",{id:a,r:c,uh:b.user.modhash},function(f){if(typeof d=="function"){d("success")}})})}};reddit.prototype.approve=function(a,c){if(this.apiVersion==1){$.post(this.base+"/api/approve",{id:a,uh:this.user.modhash},function(d){if(typeof c=="function"){c("success")}})}else{var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/approve",{id:a,uh:b.user.modhash},function(d){if(typeof c=="function"){c("success")}})})}};reddit.prototype.removevote=function(d,c){if(d[0]!="t"||d[2]!="_"){var a=this.getCache(d,"name");if(a===false){a="t1_"+d}}else{var a=d}if(this.apiVersion==1){$.post(this.base+"/api/vote",{id:a,dir:0,uh:this.user.modhash},function(e){if(typeof e.jquery!=undefined&&typeof c=="function"){c("success",e)}})}else{var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/vote",{id:a,dir:0,uh:b.user.modhash},function(e){if(typeof e.jquery!=undefined&&typeof c=="function"){c("success",e)}})})}};reddit.prototype.getpost=function(h,e,g,f){if(e.indexOf("/?")>-1){e=e.replace("/?","/"+this.jsonextension)}else{e=e.replace(".json?",this.jsonextension)}var d=this;var c=cachedPosts[h];var b=(typeof c=="object"&&typeof f=="function")?true:false;if(b){g(c)}if(this.apiVersion==2&&this.loggedin&&this.crossDomain){this.accessToken(function(){$.retryAjax({url:d.baseProxy+d.oauthBase+e,timeout:6000,retryLimit:3,success:a})})}else{$.retryAjax({url:this.base+e,timeout:6000,retryLimit:3,success:a})}function a(i){if(!b){c=i[0].data.children[0].data;d.setCache(h,c);g(c)}if(typeof f=="function"){f(i[1].data.children)}}};reddit.prototype.getcomments=function(c,b,e){function d(g){if(typeof e=="function"){if(typeof g=="string"){g=JSON.parse(g)}var f=g[0].data.children[0].data;f.downs=Math.floor(f.ups/f.upvote_ratio-f.ups);e(g[1].data.children,f)}}if(this.apiVersion==2){var a=this;this.accessToken(function(f){$.retryAjax({url:a.oauthBase+c+a.jsonextension+"sort="+b,timeout:6000,retryLimit:3,success:function(g){d(g)}})})}else{$.retryAjax({url:this.base+c+this.jsonextension+"sort="+b,timeout:6000,retryLimit:3,success:function(f){d(f)}})}};reddit.prototype.subreddits=function(a,b){$.getJSON(this.base+"/reddits/"+a+this.jsonextension,function(d){var c=d.data.children;if(typeof b=="function"){b(c)}})};reddit.prototype.submit=function(a,b,c,g,d,h,i){var k={};var j=this;k.title=a;k.sr=c;k.kind=g;k.api_type="json";if(d!=null){k.iden=d}if(h!=null){k.captcha=h}if(k.kind=="self"){k.text=b}else{k.url=b}var f=this.user;k.uh=(typeof f!="undefined")?f.modhash:0;if(this.apiVersion==1){$.post(this.base+"/api/submit",k,e)}else{this.accessToken(function(){$.post(j.baseProxy+j.oauthBase+"/api/submit",k,function(l){e(typeof l=="string"?JSON.parse(l):l)})})}function e(o){var m=o.json;if(m.errors.length==0){var n=m.data.url;var l="noerror"}else{if(m.errors[0][0]=="BAD_CAPTCHA"){var n=m.captcha;var l=m.errors[0][0]}else{var n=m.errors[0][1];var l=m.errors[0][0]}}if(typeof i=="function"){i(l,n)}}};reddit.prototype.comment=function(c,e,d,f){if(this.apiVersion==1){$.ajax({type:"POST",url:this.base+"/api/comment",data:{r:e,thing_id:c,text:d,uh:this.user.modhash},success:b,error:function(h,g){f(false,h.status)}})}else{var a=this;this.accessToken(function(){$.ajax({type:"POST",url:a.baseProxy+a.oauthBase+"/api/comment",data:{r:e,thing_id:c,text:d,uh:a.user.modhash},success:b,error:function(h,g){f(false,h.status)}})})}function b(k,n,m){var h=m.responseText;var g="SUCCESS";if(h.indexOf("you are doing that too much")!=-1){g="FREQUENCY"}var j=h.match(/t1_(.*?)"/g);var i="error";if(j&&j.length>0){var l=j.pop();i=l.substr(0,l.length-1)}if(typeof f=="function"){f(i,g)}}};reddit.prototype.hidepost=function(c,b){if(this.apiVersion==1){$.post(this.base+"/api/hide",{id:c,uh:this.user.modhash},function(d){if(typeof b=="function"){b("success")}})}else{var a=this;this.accessToken(function(){$.post(a.baseProxy+a.oauthBase+"/api/hide",{id:c,uh:a.user.modhash},function(d){if(typeof b=="function"){b("success")}})})}};reddit.prototype.unhidepost=function(c,b){if(this.apiVersion==1){$.post(this.base+"/api/unhide",{id:c,uh:this.user.modhash},function(d){if(typeof b=="function"){b("success")}})}else{var a=this;this.accessToken(function(){$.post(a.baseProxy+a.oauthBase+"/api/unhide",{id:c,uh:a.user.modhash},function(d){if(typeof b=="function"){b("success")}})})}};reddit.prototype.report=function(c,b){if(this.apiVersion==1){$.post(this.base+"/api/report",{id:c,uh:this.user.modhash},function(d){if(typeof b=="function"){b("success")}})}else{var a=this;this.accessToken(function(){$.post(a.baseProxy+a.oauthBase+"/api/report",{id:c,uh:a.user.modhash},function(d){if(typeof b=="function"){b("success")}})})}};reddit.prototype.deletePost=function(d,b,c){if(this.apiVersion==1){$.post(this.base+"/api/del",{id:d,uh:this.user.modhash,r:b,executed:"deleted"},function(e){if(typeof c=="function"){c("success")}})}else{var a=this;this.accessToken(function(){$.post(a.baseProxy+a.oauthBase+"/api/del",{id:d,uh:a.user.modhash,r:b,executed:"deleted"},function(e){if(typeof c=="function"){c("success")}})})}};reddit.prototype.editPost=function(e,c,d){if(this.apiVersion==1){$.post(this.base+"/api/editusertext",{thing_id:e,text:c,uh:this.user.modhash,api_type:"json"},function(f,h,g){b(f,h,g,c)})}else{var a=this;this.accessToken(function(){$.post(a.baseProxy+a.oauthBase+"/api/editusertext",{thing_id:e,text:c,uh:a.user.modhash,api_type:"json"},function(f,h,g){b(f,h,g,c)})})}function b(g,i,h,f){var f=h.responseText.indexOf('"errors": []')==-1?"error":f;if(typeof d=="function"){d(f,SnuOwnd.getParser().render(f))}}};reddit.prototype.sidebar=function(d,e){var c=cachedPosts["sidebar_"+d];if(typeof c!="undefined"){if(typeof e=="function"){e(c)}}else{var a=this;var b=!this.crossDomain?this.mandatoryProxy+"&sidebar="+d:this.base+"/r/"+d;$.get(b,function(g){var f=!a.crossDomain?g:(g.match(/<form action="#"[\s\S]*?form>/i)||[""]).pop();if(typeof toStaticHTML=="function"){f=toStaticHTML(f)}a.setCache("sidebar_"+d,f);if(typeof e=="function"){e(f)}})}};reddit.prototype.getModerators=function(e,f){var c=[];var b=[];if(typeof window.cachedPosts["mods_"+e]!="undefined"){var d=window.cachedPosts["mods_"+e];if(typeof f=="function"){f(d[0],d[1])}return}var a=this;$.getJSON("http://www.reddit.com/r/"+e+"/about/moderators"+this.jsonextension,function(l){var g=l.data.children;var k=g.length;for(var j=0;j<k;j++){var h=g[j].name;b.push(h);c.push(h.toLowerCase())}a.setCache("mods_"+e,[b,c]);if(typeof f=="function"){f(b,c)}})};reddit.prototype.siteadmin=function(a,b){a.uh=this.user.modhash;$.post(this.base+"/api/site_admin",a,function(c){if(typeof b=="function"){b()}})};reddit.prototype.addHistory=function(e,d,b){var c=window.volatileUserCacheData.history;var a=this;if(!c){this.database.fetch("reddit_"+this.user.username+"_history",function(f){if(!f){f=[]}else{if(f[0]&&f[0][0]==e){window.volatileUserCacheData.history=f;return false}}a.setting("historyToKeep",function(g){f.unshift([e,d,b]);if(f.length>g){f=f.splice(0,g)}a.database.save("reddit_"+a.user.username+"_history",f);window.volatileUserCacheData.history=f})})}else{if(c[0]&&c[0][0]==e){return false}c.unshift([e,d,b]);a.setting("historyToKeep",function(f){if(c.length>f){c=c.splice(0,f)}a.database.save("reddit_"+a.user.username+"_history",c);window.volatileUserCacheData.history=c})}};reddit.prototype.getHistory=function(b){var a=window.volatileUserCacheData.history;if(!a){this.database.fetch("reddit_"+this.user.username+"_history",function(c){if(!c){c=[]}window.volatileUserCacheData.history=c;if(typeof b=="function"){b(c)}})}else{if(typeof b=="function"){b(a)}}};reddit.prototype.clearHistory=function(a){window.volatileUserCacheData.history=[];this.database.save("reddit_"+this.user.username+"_history",[],function(){if(typeof a=="function"){a()}})};reddit.prototype.isCommentSaved=function(a,c){var b=window.volatileUserCacheData.favourites;if(!b){this.database.fetch("reddit_"+this.user.username+"_savedComments",function(d){if(!d){d={}}window.volatileUserCacheData.favourites=d;c(d[a]?true:false)})}else{c(b[a]?true:false)}};reddit.prototype.favouriteComments=function(b){var a=window.volatileUserCacheData.favourites;if(!a){this.database.fetch("reddit_"+this.user.username+"_savedComments",function(c){if(!c){c={}}window.volatileUserCacheData.favourites=c;b(c)})}else{b(a)}};reddit.prototype.saveComment=function(b,c){var a=this;this.database.fetch("reddit_"+this.user.username+"_savedComments",function(d){if(!d){d={}}d[b]=c;if(window.volatileUserCacheData.favourites){window.volatileUserCacheData.favourites[b]=c}else{window.volatileUserCacheData.favourites=d}a.database.save("reddit_"+a.user.username+"_savedComments",d,function(){sync_update(a)})})};reddit.prototype.unsaveComment=function(b){var a=this;this.database.fetch("reddit_"+this.user.username+"_savedComments",function(c){if(!c){c={}}delete c[b];if(window.volatileUserCacheData.favourites){delete window.volatileUserCacheData.favourites[b]}else{window.volatileUserCacheData.favourites=c}a.database.save("reddit_"+a.user.username+"_savedComments",c,function(){sync_update(a)})})};reddit.prototype.isPostSaved=function(d,f){if(this.user.savedPosts){if(f){f(this.user.savedPosts[d])}return}if(!this.user.username){return}else{var e=this.user.username}var c=this.user.savedPosts={};var a=this;function b(j){var h=j.data.children;for(var g in h){c[h[g].data.name]=true}a.isPostSaved(d,f)}if(this.apiVersion==2){this.accessToken(function(){$.post(a.baseProxy+a.oauthBase+"/user/"+e+"/saved.json",b)})}else{$.getJSON(this.base+"/user/"+e+"/saved"+this.jsonextension,b)}};reddit.prototype.savePost=function(a,c){if(this.user.savedPosts){this.user.savedPosts[a]=true}if(this.apiVersion==2){var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/save",{id:a},function(d){if(typeof c=="function"){c()}})})}else{$.post(this.base+"/api/save",{id:a,uh:this.user.modhash},function(d){if(typeof c=="function"){c()}})}};reddit.prototype.unsavePost=function(a,c){if(this.user.savedPosts){this.user.savedPosts[a]=false}if(this.apiVersion==2){var b=this;this.accessToken(function(){$.post(b.baseProxy+b.oauthBase+"/api/unsave",{id:a},function(d){if(typeof c=="function"){c()}})})}else{$.post(this.base+"/api/unsave",{id:a,uh:this.user.modhash},function(d){if(typeof c=="function"){c()}})}};reddit.prototype.friend=function(d,a,e){e=e||a;var b=this;function c(f){if(d.type=="friend"){var g=f.jquery[29][3][0][0].id}f.jquery.id=g;b.user.friends[d.name]=g;if(typeof e=="function"){e(f.jquery,a)}}if(this.apiVersion==2){this.accessToken(function(){if(d.type=="friend"){$.ajax({type:"PUT",url:b.baseProxy+b.oauthBase+"/api/v1/me/friends/"+d.name,success:function(f){b.user.friends[f.name]=f.id;if(typeof e=="function"){e(f,a)}},data:JSON.stringify({name:d.name}),contentType:"application/json; charset=utf-8",traditional:true})}else{$.post(b.baseProxy+b.oauthBase+"/api/friend",d,c)}})}else{d.uh=b.user.modhash;$.post(this.base+"/api/friend",d,c)}};reddit.prototype.unfriend=function(c,d){var a=this;function b(){if(c.type=="friend"){delete a.user.friends[c.name]}if(typeof d=="function"){d()}}if(this.apiVersion==2){this.accessToken(function(){if(c.type=="friend"){$.ajax({type:"DELETE",url:a.baseProxy+a.oauthBase+"/api/v1/me/friends/"+c.name,success:b,data:JSON.stringify({name:c.name}),contentType:"application/json; charset=utf-8",traditional:true})}else{$.post(a.baseProxy+a.oauthBase+"/api/unfriend",c,b)}})}else{c.uh=a.user.modhash;$.post(this.base+"/api/unfriend",c,b)}};reddit.prototype.getUser=function(f,d){var a=this;function c(g){var e={user:g.data};a.trophies(f,function(h){e.trophies=h;if(typeof d=="function"){d(e)}})}if(!this.crossDomain){try{$.getJSON(a.base+"/user/"+f+"/about/.json?jsonp=?",c)}catch(b){d(false)}return}$.ajax({url:a.base+"/user/"+f+"/about.json",dataType:"json",data:{},success:c,error:function(e){if(typeof d=="function"){d(false)}}})};reddit.prototype.trophies=function(b,c){var a=this;this.accessToken(function(d){$.retryAjax({url:a.baseProxy+a.oauthBase+"/api/v1/user/"+b+"/trophies",timeout:6000,retryLimit:10,success:function(e){var f=e&&e.data&&e.data.trophies;c&&c(f.map&&f.map(function(g){return g.data}))}})})};reddit.prototype.saveColumns=function(a){this.database.save("reddit_"+this.user.username.toLowerCase()+"_columns",a);sync_update(this)};reddit.prototype.savedColumns=function(b){var a=this;this.database.fetch("reddit_"+this.user.username.toLowerCase()+"_columns",function(c){if(!c){this.database.fetch("reddit_"+a.user.username+"_columns",function(d){if(!d){a.database.fetch("reddit__columns",function(e){b(e)})}else{b(d)}})}else{b(c)}})};reddit.prototype.getModContent=function(b,a,c){$.getJSON(this.base+a+"about/"+b+".json",function(d){if(typeof c=="function"){c(d)}})};reddit.prototype.getSingleComment=function(b,a,c){$.retryAjax({url:this.base+b+a+this.jsonextension+"r="+Date.now(),timeout:6000,retryLimit:3,success:function(d){c(d[1].data.children[0].data)}})};reddit.prototype.subscribe=function(c,e){function d(){window.dispatchEvent(new Event("reddit_subscription_change"))}e=typeof e=="undefined"?"sub":e;if(this.apiVersion==2){var b=this;this.accessToken(function(){var f={uh:b.user.modhash,action:e,sr:c};$.post(b.baseProxy+b.oauthBase+"/api/subscribe",f,d)})}else{$.post(this.base+"/api/subscribe",{uh:this.user.modhash,action:e,sr:c},d)}this.user.subscribed[c]=e=="sub"?true:false;var a=window.cachedPosts["about_"+c];if(e=="unsub"&&a){delete a.user_is_subscriber}else{if(a){a.user_is_subscriber=true}}};reddit.prototype.unsubscribe=function(a){var b=this.user.subscribed[a];delete this.user.subscribed[a];delete this.user.subscribed[b];this.subscribe(a,"unsub")};reddit.prototype.issubscribed=function(c,d){if(!this.loggedin){if(typeof d=="function"){d(false)}return false}if(!this.user||!this.user.subscribed||$.isEmptyObject(this.user.subscribed)){if(this.loading_mine){var b=this;return setTimeout(function(){b.issubscribed(c,d)},500)}else{var b=this;this.mine(function(){d(b.user.subscribed[c.toLowerCase()]?true:false)});return false}}var a=this.user.subscribed[c.toLowerCase()]?true:false;if(typeof d=="function"){d(a)}return a};reddit.prototype.subredditAbout=function(b,c){if(typeof cachedPosts["about_"+b]!="undefined"){c(cachedPosts["about_"+b]);return}var a=this;$.retryAjax({url:this.base+"/r/"+b+"/about"+this.jsonextension,timeout:6000,retryLimit:3,success:function(d){c(d.data);a.setCache("about_"+d.data.name,d.data);a.setCache("about_"+b,d.data)}})};reddit.prototype.searchRedditNames=function(c,d){var b;if(this.apiVersion==2){b=this.baseProxy+this.oauthBase+"/api/search_reddit_names.json";var a=this;this.accessToken(function(e){$.post(b,{uh:a.user.modhash,query:c},function(f){d(f.names)})})}else{b=this.baseProxy+this.base+"/api/search_reddit_names.json";$.post(b,{uh:this.user.modhash,query:c},function(e){d(e.names)})}return;var b=this.baseProxy+this.base+"/api/search_reddit_names.json";if(!this.crossDomain){b=this.mandatoryBaseProxy+this.base+"/api/search_reddit_names.json"}$.post(b,{uh:this.user.modhash,query:c},function(e){d(e.names)})};reddit.prototype.searchForSubreddit=function(a,b){$.get(this.base+"/api/subreddits_by_topic"+this.jsonextension,{query:a},function(c){b(c)})};reddit.prototype.randomSubreddit=function(b){if(!this.crossDomain){$.get(this.baseProxy+"&random",b);return}var a=this;$.get(this.base+"/r/random",function(c){var d=c.match(/\/r\/(.*?)\/\.rss/).pop().split(" ")[0];b(d)})};reddit.prototype.getMessage=function(c,b){if(this.apiVersion==1){$.getJSON(this.base+"/message/messages/"+c+".json",function(d){try{b(d)}catch(f){}})}else{var a=this;this.accessToken(function(d){$.getJSON(a.baseProxy+a.oauthBase+"/message/messages/"+c+".json",function(f){try{b(f)}catch(g){}})})}};reddit.prototype.markUnread=function(b,c){if(this.apiVersion==2){var a=this;this.accessToken(function(d){$.post(a.baseProxy+a.oauthBase+"/api/unread_message",{uh:a.user.modhash,id:b},function(){if(typeof c=="function"){c()}})})}else{$.post(this.base+"/api/unread_message",{uh:this.user.modhash,id:b},function(){if(typeof c=="function"){c()}})}};reddit.prototype.markRead=function(c,g){if(typeof c=="object"){var e=c.length;var f=0;function a(){if(++f==e){g()}}for(var d=0;d<e;d++){this.markRead(c[d],function(){a()})}return}if(this.apiVersion==2){var b=this;this.accessToken(function(h){$.post(b.baseProxy+b.oauthBase+"/api/read_message",{uh:b.user.modhash,id:c},function(){if(typeof g=="function"){g()}})})}else{$.post(this.base+"/api/read_message",{uh:this.user.modhash,id:c},function(){if(typeof g=="function"){g()}})}};reddit.prototype.messageReply=function(b,d,e){if(this.apiVersion==2){var a=this;this.accessToken(function(f){$.post(a.baseProxy+a.oauthBase+"/api/comment",{uh:a.user.modhash,thing_id:b,text:d,id:"#commentreply_"+b},c)})}else{$.post(this.base+"/api/comment",{uh:this.user.modhash,thing_id:b,text:d,id:"#commentreply_"+b},c)}function c(f,j,i){if(typeof e!="undefined"){try{var g=decodeURIComponent($("<div />").html(i.responseText.match(/&lt;!\-\- SC_OFF \-\-&gt;(.*?)&lt;!\-\- SC_ON \-\-&gt;/).pop()).text());e(g)}catch(h){e(false)}}}};reddit.prototype.sendMessage=function(h,f,d,c,b,g){if(this.apiVersion==2){var a=this;this.accessToken(function(i){$.post(a.baseProxy+a.oauthBase+"/api/compose",{api_type:"json",uh:a.user.modhash,to:h,subject:f,thing_id:"",text:d,id:"#compose-message",iden:c,captcha:b},e)})}else{$.post(this.base+"/api/compose",{api_type:"json",uh:this.user.modhash,to:h,subject:f,thing_id:"",text:d,id:"#compose-message",iden:c,captcha:b},e)}function e(l){var j=l.json;if(j.errors.length==0){var k="";var i="noerror"}else{if(j.errors[0][0]=="BAD_CAPTCHA"){var k=j.captcha;var i=j.errors[0][0]}else{var k=j.errors[0][1];var i=j.errors[0][0]}}if(typeof g=="function"){g(i,k)}}};var alreadyFlairStyle={};reddit.prototype.buildFlairCSS=function(c,d){if(!c){if(typeof d=="function"){d()}return}c=c.toLowerCase();var b=this.base;if(alreadyFlairStyle[c]||!c){if(typeof d=="function"){d()}return}alreadyFlairStyle[c]=true;if(!this.crossDomain){$.get("http://reditr.com/api/sync/?stylesheet="+c,function(e){reddit.prototype._parseStylesheet(e,c,d)});return}var a=this;$.get(b+"/r/"+c,function(e){$.get(e.match(/http([^ ]+?)redditmedia([^ ]+?)\.css/)[0],function(f){reddit.prototype._parseStylesheet(f,c,d)})})};reddit.prototype._parseStylesheet=function(c,e,f){c=c.replace(/\.flair \{/g,".flair{");c=c.replace(/(\r\n|\n|\r)/gm,"");c=c.replace(/\/\*([\s\S]*?)\*\//gm,"");var d="";var a=c.match(/\.res\-nightmode \.flair{(.*?)}/g);if(a!=null&&a.length>0){d=a.join("").replace(/\.res-nightmode \.flair/,".darkTheme ."+e+".flair");c=c.replace(/\.res-nightmode \.flair/,"NO")}delete a;var b=[];c.split("}").forEach(function(g){if(g.search(/^([^{]*?)flair([^{]*?){/)!=-1){var h=g.split(",").map(function(i){i=i.trim();if(i[0]=="."){return""}return"."+e+i}).join(",");b.push(h+"}")}});d=b.join("");if(typeof toStaticHTML=="function"){d=toStaticHTML(d)}$("head").append("<style>"+d+"</style>");if(typeof f=="function"){f()}};reddit.prototype.fetchFlairHTML=function(c,e){c=c.toLowerCase();var b=0;var a="";this.buildFlairCSS(c,function(){b++;d()});$.post(this.base+"/api/flairselector",{uh:this.user.modhash,r:c,name:""},function(f){f=f.replace(/<(form|h2)([\s\S]*?)(form|h2)>/gi,"");a=f;b++;d()});function d(){if(b>1){e(a)}}};reddit.prototype.setNewFlair=function(c,d,a){this.toggleFlairEnabled(c,true);var b={subRedditStyleCheckbox:"on",flair_enabled:"on",name:this.user.name,flair_template_id:d,r:c,uh:this.user.modhash};if(typeof a!="undefined"&&a!=""){b.text=a}$.post(this.base+"/api/selectflair",b)};reddit.prototype.subredditExists=function(a,b){if(a==""){return false}$.getJSON(this.base+"/r/"+a+"/about"+this.jsonextension,function(c){b(true)}).error(function(){b(false)})};reddit.prototype.toggleFlairEnabled=function(c,a){var b={id:"",r:c,uh:this.user.modhash};if(a){b.flair_enabled="on"}$.post(this.base+"/api/setflairenabled",b)};var shameful_popup_zindex=100000;(function(a){a.popup=function(m,k){if(!j){var j={Close:"Close",Back:"Back"}}var l=(typeof m.id=="undefined")?Date.now():m.id;var c=a(".complexAlertBackdrop");if(!c.length){var c=a('<div class="animate complexAlertBackdrop" style="z-index: '+(window.shameful_popup_zindex++)+'"></div>').appendTo("body");var i='<i class="icon-remove"></i><span>&nbsp;&nbsp;'+j.Close+"</span>"}var g=a(".complexAlertContainer");if(g.length){g.hide();g.each(function(){var n=a.data(a(this)[0],"onDisappear");if(n){n()}});var i='<i class="icon-arrow-left"></i><span>&nbsp;&nbsp;'+j.Back+"</span>"}var b=m.sidebar?'<div class="sidebar"><div class="contentContainer"><div class="content">'+m.sidebar+"</div></div></div>":"";var f=(m.menubar!=false)?("<div class='alertOptions'>"+((typeof m.buttons!="undefined")?m.buttons.replace(/\[suggestedCloseText\]/g,i):'<button data-message="close">'+i+"</button>")+"<div style='clear: both'></div></div>"):"";var e=a("<div class='complexAlertContainer' id='"+l+"' style='position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: "+(window.shameful_popup_zindex++)+"'> 								  <div style='position: relative; width: 100%; height: 100%'> 									  <table class='complexAlert' style='margin-left: "+(m.translateX?m.translateX:0)+"px'> 										<tr valign='middle'> 											<td style='text-align: center;'> 												<div class='container'> 													<div class='alert'> 														"+((typeof m.title!="undefined")?"<div class='alertTitle'>"+m.title+"</div>":"")+" 														<div class='alertText content canscroll'>"+m.message+"</div> 														"+f+" 													</div> 													"+b+" 												</div> 											</td> 										</tr> 									</table> 								</div> 							</div>").prependTo("body");if(m.onReappear){a.data(e[0],"onReappear",m.onReappear)}var h=e.find(".complexAlert");setTimeout(function(){h.addClass("animate")},a('head link[href*="css/stylesheet_blockanimations.css"]').length?1:200);var d=h.find(".content").first();a(window).resize(function(){d.css({"max-height":a(this).height()-100})}).trigger("resize");e.on("click",".complexAlert",function(n){n.stopPropagation();e.find('[data-message="close"]').click()});e.on("click",".complexAlert .container",function(n){n.stopPropagation()});e.find("input, textarea").first().focus();if(typeof k=="function"){e.on("click","*:not(input)[data-message]",function(n){var o=k.call(e,a(this).attr("data-message"),a(this),n);if(o=="close"){e.closePopup()}});e.on("keypress","*[data-message]",function(n){if(n.keyCode==13){var o=k.call(e,a(this).attr("data-message"),a(this));if(o=="close"){e.closePopup()}}})}return e};a.fn.onPopupShow=function(b){a.data(a(this)[0],"onReappear",b)};a.fn.onPopupHide=function(b){a.data(a(this)[0],"onDisappear",b)};a.fn.setOffsetX=function(b){a(this).find(".complexAlert").animate({"margin-left":b+"px"})};a.fn.closePopup=function(d){if(d){a(".complexAlertContainer, .complexAlertBackdrop").remove();return}var c=a(this);var e=c.find(".complexAlert");var b=a(".complexAlertBackdrop");c.off();e.removeClass("animate");setTimeout(function(){c.remove();var g=a(".complexAlertContainer");if(g.length){var h=g.last();h.show();var f=a.data(h[0],"onReappear");if(f){f()}}else{b.remove()}},200)}})(jQuery);function promptFancy(d,f,c,b){if(c=="subreddit"){c="text";var h=true}if(c=="input"){c="text"}if(!l){var l={Done:"Done"}}var j="promptFancyInput"+Date.now();b=(typeof b=="undefined")?"":b;var i='<button class="right green" data-message="add"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+l.Done+'</span></button> 				   <button class="left" data-message="close">[suggestedCloseText]</button>';var m='<div class="incontainer"><input style="margin-bottom: 0px" type="'+((typeof c!="undefined")?c:"text")+'" data-message="add" id="'+j+'" value="'+b+'"></div><div id="addSubreddit_results"></div>';var g;var k;g=$.popup({id:"promptFancy",title:d,message:m,buttons:i},function(o,n){if(o=="subreddit_item"){k.val(n.html()).focus().select();return}o=(o=="close")?false:$("#"+j).val();g.closePopup();setTimeout(function(){f(o)},250)});k=g.find("input");if(k){setTimeout(function(){k.focus();var n=k.val();k.val("");k.val(n)},250)}if(h){var a=window.connection;var e=g.find("#addSubreddit_results");k.doneTyping(function(){var n=k.val().toLowerCase().replace(/(\/r\/|r\/)/,"");k.addClass("loading");a.searchRedditNames(n,function(r){e.find("div:not(.selected)").remove();if(r.length!=0){e.append('<div data-message="subreddit_item">'+r.join('</div><div data-message="subreddit_item">')+"</div>")}var p=false;var o=r.length;for(var q=0;q<o;q++){if(n==r[q].toLowerCase()){p=true}}k.removeClass("loading");if(!p){a.subredditExists(n,function(s){if(s){e.append('<div data-message="subreddit_item">'+capitalize(n)+"</div>")}})}})})}}function confirmFancy(e,d,a){var f=a&&a.confirmMessage?a.confirmMessage:locale.Confirm;var c='<button class="right green" data-message="confirm"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+f+'</span></button> 				   <button class="left" data-message="close">[suggestedCloseText]</button>';var b;b=$.popup({message:e,buttons:c},function(g){b.closePopup();setTimeout(function(){d(g=="confirm"?true:false)},250)})}function modtools(c,b){var a=this;this.subreddit=c;this.connection=b;this.viewport="<div class='Viewport'> 		<div class='leftView'> 			<div href='edit' class='item'>"+locale.Community_Settings+"</div> 			<div href='moderators' class='item'>"+locale.Edit_Moderators+"</div> 			<div href='contributors' class='item'>"+locale.Edit_Approved_Submitters+"</div> 			<div href='traffic' class='item'>"+locale.Traffic_Stats+"</div> 			<div href='modqueue' class='item'>"+locale.Moderation_Queue+"</div> 			<div href='reports' class='item'>"+locale.Reported_Links+"</div> 			<div href='spam' class='item'>"+locale.Spam+"</div> 			<div href='banned' class='item'>"+locale.Ban_Users+"</div> 			<div href='unmoderated' class='item'>"+locale.Unmoderated_Links+"</div> 		</div> 		<div class='rightView'> 			<div class='loadingcss block'></div> 		</div> 	</div>";this.startup(function(){a.bindings()});return this}modtools.prototype.startup=function(b){var a=this;a.content=$.popup({id:"modpopup",title:a.subreddit+" Mod Tools",message:a.viewport,buttons:'<div id="optionButtons" class="buttongroup"><button class="Button" id="close" data-message="close">[suggestedCloseText]</button></div>'},function(k){if(k=="save_community_settings"){var c=a.subreddit.replace("/r/","").replace("/","");var d={allow_top:$("#allow_top").is(":checked")?true:false,description:$(".info #sidebar").val(),lang:$("#lang").find("option:checked").val(),link_type:$('input:checked[name="srcontent"]').val(),over_18:$("#over_18").is(":checked")?true:false,public_description:$("#description").val(),show_media:$("#show_media").is(":checked")?true:false,sr:a.subredditname,title:$("#title").val(),type:$('input[name="srtype"]:checked').val(),"header-title":$("#header_hover_text").val(),r:c,sr:a.id,wiki_edit_age:$("#wiki_edit_age").val(),wiki_edit_karma:$("#wiki_edit_karma").val(),wikimode:$('input:checked[name="wikimode"]').val()};a.connection.siteadmin(d,function(){a.home()})}if(k=="goback"){a.home()}if(k=="addMod"){var j=a.content.find("input#modName").val();var c=a.subreddit.replace("/r/","").replace("/","");if(j==""){return}var d={container:a.subredditname,name:j,type:"moderator",r:c};a.connection.friend(d,function(m){var l=m[29][3][0][0].id;a.content.find(".modlist").append('<div class="mod">'+j+' - <a id="'+l+'" class="removeMod">'+locale.Remove+"</a></div>")})}if(k=="cancelRemoveMod"){var h=a.content.find("input#selectMod").val();a.content.find("a#"+h).addClass("removeMod").text("remove")}if(k=="removeMod"){var h=a.content.find("input#selectMod").val();var c=a.subreddit.replace("/r/","").replace("/","");var d={container:a.subredditname,id:h,type:"moderator",r:c};a.content.find("a#"+h).parent().fadeOut(350);a.connection.unfriend(d)}if(k=="addCont"){var f=a.content.find("input#contName").val();var c=a.subreddit.replace("/r/","").replace("/","");if(f==""){return}var d={container:a.subredditname,name:f,type:"contributor",r:c};a.connection.friend(d,function(m){var l=m[29][3][0][0].id;a.content.find(".contlist").append('<div class="cont">'+f+' - <a id="'+l+'" class="removeCont">'+locale.Remove+"</a></div>")})}if(k=="cancelRemoveCont"){var g=a.content.find("input#selectCont").val();a.content.find("a#"+g).addClass("removeCont").text("remove")}if(k=="removeCont"){var g=a.content.find("input#selectCont").val();var c=a.subreddit.replace("/r/","").replace("/","");var d={container:a.subredditname,id:g,type:"contributor",r:c};a.content.find("a#"+g).parent().fadeOut(350);a.connection.unfriend(d)}if(k=="addBan"){var i=a.content.find("input#banName").val();var c=a.subreddit.replace("/r/","").replace("/","");if(i==""){return}var d={container:a.subredditname,name:i,type:"banned",r:c};a.connection.friend(d,function(m){var l=m[29][3][0][0].id;a.content.find(".banlist").append('<div class="ban">'+i+' - <a id="'+l+'" class="removeBan">'+locale.Remove+"</a></div>")})}if(k=="cancelRemoveBan"){var e=a.content.find("input#selectBan").val();a.content.find("a#"+e).addClass("removeBan").text(locale.Remove)}if(k=="removeBan"){var e=a.content.find("input#selectBan").val();var c=a.subreddit.replace("/r/","").replace("/","");var d={container:a.subredditname,id:e,type:"banned",r:c};a.content.find("a#"+e).parent().fadeOut(350);a.connection.unfriend(d)}return k});a.home();a.content.on("click","a.time",function(){$(this).addClass("loading")});if(typeof b=="function"){b()}};modtools.prototype.bindings=function(a){var b=this;var a=false||a;if(a){}b.content.find(".leftView").on("click.modtools",".item",function(g){var c=$(this).attr("href");var f=b.content.find(".rightView");var d="";f.html('<div class="loadingcss block"></div>');b.grabContent.call(b,c,function(e){if(c=="edit"){d=b.communitySettings(e)}else{if(c=="message/inbox"){}else{if(c=="moderators"){d=b.editModerators(e)}else{if(c=="contributors"){d=b.editContributors(e)}else{if(c=="traffic"){d=b.trafficStats(e)}else{if(c=="modqueue"){d=b.modqueue(e)}else{if(c=="reports"){d=b.reportedlinks(e)}else{if(c=="spam"){d=b.spamlinks(e)}else{if(c=="banned"){d=b.bannedusers(e)}else{if(c=="unmoderated"){d=b.unmoderatedlinks(e)}}}}}}}}}}f.html(d).find("textarea").autoHeight()})});b.content.find(".rightView").on("click.modtools",".item",function(g){var c=$(this).attr("href");var f=b.content.find(".rightView");var d="";f.html('<div class="loadingcss block"></div>');b.grabContent.call(b,c,function(e){if(c=="edit"){d=b.communitySettings(e)}else{if(c=="moderators"){d=b.editModerators(e)}else{if(c=="contributors"){d=b.editContributors(e)}else{if(c=="traffic"){d=b.trafficStats(e)}else{if(c=="modqueue"){d=b.modqueue(e)}else{if(c=="reports"){d=b.reportedlinks(e)}else{if(c=="spam"){d=b.spamlinks(e)}else{if(c=="banned"){d=b.bannedusers(e)}else{if(c=="unmoderated"){d=b.unmoderatedlinks(e)}}}}}}}}}f.html(d).find("textarea").autoHeight()})})};modtools.prototype.grabContent=function(b,c){var a=this;a.connection.getModContent(b,a.subreddit,function(d){if(typeof c=="function"){c(d)}})};modtools.prototype.home=function(){var a=this;var c=Date.now();var b='<button class="Button" data-message="close">'+locale.Close+"</button>";a.content.find("#optionButtons").html(b);var e=a.content.find(".rightView");var d='<div class="leftPush info"> 		<div href="edit" id="communitysettings" class="item">'+locale.Settings+'</div> 		<div href="traffic" id="stats" class="item">'+locale.Traffic+'</div> 		<div href="message/inbox" id="modmail" class="item">'+locale.Mod_Mail+'</div> 		<div href="modqueue" id="modqueue" class="item">'+locale.Modqueue+"</div> 	</div>";e.html(d)};modtools.prototype.communitySettings=function(c){var i=this;var a=c.data;i.id=a.subreddit_id;var d='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+'</button><button class="Button time" data-message="save_community_settings">'+locale.Save_Options+"</button>";i.content.find("#optionButtons").html(d);var b=$('<select id="lang" name="lang"><option value="ar">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577; [ar] (*)</option><option value="be">&#1041;&#1077;&#1083;&#1072;&#1088;&#1091;&#1089;&#1082;&#1072;&#1103; &#1084;&#1086;&#1074;&#1072; [be] (*)</option><option value="bg">&#1073;&#1098;&#1083;&#1075;&#1072;&#1088;&#1089;&#1082;&#1080; &#1077;&#1079;&#1080;&#1082; [bg] (*)</option><option value="ca">catal&#224; [ca] (*)</option><option value="cs">&#269;esky [cs]</option><option value="da">dansk [da] (*)</option><option value="de">Deutsch [de]</option><option value="el">&#917;&#955;&#955;&#951;&#957;&#953;&#954;&#940; [el]</option><option value="en">English [en]</option><option value="eo">Esperanto [eo]</option><option value="es">espa&#241;ol [es]</option><option value="et">eesti keel [et] (*)</option><option value="eu">Euskara [eu]</option><option value="fa">&#1601;&#1575;&#1585;&#1587;&#1740; [fa] (*)</option><option value="fi">suomi [fi]</option><option value="fr">fran&#231;ais [fr]</option><option value="he">&#1506;&#1489;&#1512;&#1497;&#1514; [he] (*)</option><option value="hi">&#2350;&#2366;&#2344;&#2325; &#2361;&#2367;&#2344;&#2381;&#2342;&#2368; [hi] (*)</option><option value="hr">hrvatski [hr]</option><option value="hu">Magyar [hu] (*)</option><option value="hy">&#1344;&#1377;&#1397;&#1381;&#1408;&#1381;&#1398; &#1388;&#1381;&#1382;&#1400;&#1410; [hy] (*)</option><option value="id">Bahasa Indonesia [id] (*)</option><option value="is">&#237;slenska [is] (*)</option><option value="it">italiano [it]</option><option value="ja">&#26085;&#26412;&#35486; [ja] (*)</option><option value="ko">&#54620;&#44397;&#50612; [ko] (*)</option><option value="la">Latin [la] (*)</option><option value="lt">lietuvi&#371; kalba [lt] (*)</option><option value="lv">latvie&#353;u valoda [lv] (*)</option><option value="nl">Nederlands [nl]</option><option value="no">Norsk [no]</option><option value="pl">polski [pl]</option><option value="pt">portugu&#234;s [pt]</option><option value="ro">rom&#226;n&#259; [ro] (*)</option><option value="ru">&#1088;&#1091;&#1089;&#1089;&#1082;&#1080;&#1081; [ru]</option><option value="sk">sloven&#269;ina [sk] (*)</option><option value="sl">sloven&#353;&#269;ina [sl] (*)</option><option value="sr">&#1089;&#1088;&#1087;&#1089;&#1082;&#1080; &#1112;&#1077;&#1079;&#1080;&#1082; [sr]</option><option value="sv">Svenska [sv] (*)</option><option value="ta">&#2980;&#2990;&#3007;&#2996;&#3021; [ta] (*)</option><option value="th">&#3616;&#3634;&#3625;&#3634;&#3652;&#3607;&#3618; [th] (*)</option><option value="tr">T&#252;rk&#231;e [tr]</option><option value="uk">&#1091;&#1082;&#1088;&#1072;&#1111;&#1085;&#1089;&#1100;&#1082;&#1072; &#1084;&#1086;&#1074;&#1072; [uk] (*)</option><option value="vi">Ti&#7871;ng Vi&#7879;t [vi] (*)</option><option value="zh">&#20013;&#25991; [zh] (*)</option></select>');b.find("option[value="+a.language+"]").attr("selected","selected");var f='<input id="public_type" '+(a.subreddit_type=="public"?"checked":"")+' type="radio" name="srtype" value="public" /><label for="public_type">public</label>	<input id="restricted_type" '+(a.subreddit_type=="restricted"?"checked":"")+' type="radio" name="srtype" value="restricted" /><label for="restricted_type">restricted</label>	<input id="private_type" '+(a.subreddit_type=="private"?"checked":"")+' type="radio" name="srtype" value="private" /><label for="private_type">private</label>';var e='<input id="any_type" '+(a.content_options=="any"?"checked":"")+' type="radio" name="srcontent" value="any" /><label for="any_type">any</label>	<input id="link_type" '+(a.content_options=="link"?"checked":"")+' type="radio" name="srcontent" value="link" /><label for="link_type">links only</label>	<input id="self_type" '+(a.content_options=="self"?"checked":"")+' type="radio" name="srcontent" value="self" /><label for="self_type">text posts only</label>';var h='<input id="over_18" type="checkbox" '+(a.over_18?"checked":"")+' /><label for="over_18">viewers must be over eighteen years old</label><br />	<input id="allow_top" '+(a.default_set?"checked":"")+' type="checkbox" /><label for="allow_top">allow this reddit to be shown in the default set</label><br />	<input id="show_media" '+(a.show_media?"checked":"")+' type="checkbox" /><label for="show_media">show thumbnail images of content</label>';var j='<input value="disabled" name="wikimode" id="wikimode_disabled" type="radio" '+(a.wikimode=="disabled"?"checked":"")+' /><label for="wikimode_disabled">disabled</label>	<input value="modonly" name="wikimode" id="wikimode_modonly" '+(a.wikimode=="modonly"?"checked":"")+' type="radio" /><label for="modonly">mod editing</label>	<input value="anyone" name="wikimode" id="wikimode_anyone" '+(a.wikimode=="anyone"?"checked":"")+' type="radio" /><label for="anyone">anyone</label>';var g='<div class="leftPush info">		<h3>title</h3>		<input type="text" value="'+a.title+'" id="title" />		<h3>public description</h3>		<textarea type="text" id="description">'+a.public_description+'</textarea>		<h3>sidebar</h3>		<textarea type="text" id="sidebar">'+a.description+"</textarea>		<h3>language</h3>		"+$("<div />").html(b).html()+"		<h3>type</h3>		"+f+"		<h3>content options</h3>		"+e+"		<h3>wiki</h3>		"+j+'		<h4>Subreddit karma required to edit wiki</h4> 		<input type="text" value="'+a.wiki_edit_karma+'" id="wiki_edit_karma" />		<h4>Account age required to edit wiki</h4> 		<input type="text" value="'+a.wiki_edit_age+'" id="wiki_edit_age" />		<h3>other options</h3>		'+h+'		<h3>header mouseover text</h3>		<input type="text" value="'+a.header_hover_text+'" id="header_hover_text" />	</div>';return g};modtools.prototype.editModerators=function(h){var c=this;var g=h.data.children;var d='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";c.content.find("#optionButtons").html(d);var b=[];var a="";for(var e in g){a=(c.connection.user.username==g[e].name?"</div>":' - <a id="'+g[e].id+'" class="removeMod">'+locale.Remove+"</a></div>");b.push('<div class="mod">'+g[e].name+a)}c.content.on("click.edit",".removeMod",function(){$("#selectMod").val($(this).attr("id"));$(this).removeClass("removeMod").html('Are you sure?  <a data-message="removeMod" data-ignore="true">'+locale.Yes+'</a> / <a data-message="cancelRemoveMod" data-ignore="true">'+locale.No+"</a>")});var f='<div class="leftPush info"> 		<h3>Add Moderator</h3> 		<input class="short" type="text" id="modName" /> 		<a data-message="addMod" class="Button rightInput">'+locale.Add+'</a> 		<h3>Moderators</h3> 		<div class="modlist"> 		'+b.join("")+' 		</div> 		<input type="hidden" id="selectMod" value="" /> 	</div>';return f};modtools.prototype.editContributors=function(h){var b=this;var d=h.data.children;var c='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";b.content.find("#optionButtons").html(c);var g=[];var a="";for(var e in d){a=(b.connection.user.username==d[e].name?"</div>":' - <a id="'+d[e].id+'" class="removeCont">'+locale.Remove+"</a></div>");g.push('<div class="cont">'+d[e].name+a)}b.content.on("click.edit",".removeCont",function(){$("#selectCont").val($(this).attr("id"));$(this).removeClass("removeCont").html('Are you sure?  <a data-message="removeCont" data-ignore="true">'+locale.Yes+'</a> / <a data-message="cancelRemoveCont" data-ignore="true">'+locale.No+"</a>")});var f='<div class="leftPush info"> 		<h3>Add Submitter</h3> 		<input class="short" type="text" id="contName" /> 		<a data-message="addCont" class="Button rightInput">'+locale.Add+'</a> 		<h3>Submitters</h3> 		<div class="contlist"> 		'+g.join("")+' 		</div> 		<input type="hidden" id="selectCont" value="" /> 	</div>';return f};modtools.prototype.trafficStats=function(h){var q=this;var m=h.day;var k=h.month;var e=h.hour;var j='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";q.content.find("#optionButtons").html(j);var n=[],c=[],b=[],a=[],p=[],l=[],g=[];for(var f in m){var d=m[f][0]*1000;n.push([d,m[f][1]]);c.push([d,m[f][2]]);b.push([d,m[f][3]])}for(var f in k){var d=k[f][0]*1000;a.push([d,k[f][1]]);p.push([d,k[f][2]])}for(var f in e){var d=e[f][0]*1000;l.push([d,e[f][1]]);g.push([d,e[f][2]])}var o=$('<div id="trafficStats" class="leftPush info"> 		<div class="plotSection"> 		<h3>Month Uniques <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="monthu"></div></div> 		</div> 		<div class="plotSection"> 		<h3>Month Page Views <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="monthpv"></div></div> 		</div> 		<div class="plotSection"> 		<h3>Day Uniques <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="dayu"></div></div> 		</div> 		<div class="plotSection"> 		<h3>Day Page Views <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="daypv"></div></div> 		</div> 		<div class="plotSection"> 		<h3>Day Subscribers <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="daysb"></div></div> 		</div> 		<div class="plotSection"> 		<h3>Hour Uniques <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="houru"></div></div> 		</div> 		<div class="plotSection"> 		<h3>Hour Page Views <a class="Button">'+locale.Show+'</a> 		<div class="plotHolder"><div class="plot" style="width:350px;height:200px;" id="hourpv"></div></div> 		</div> 	</div>');o.on("click.stats","a",function(){if($(this).text()==locale.Show){$(this).text(locale.Hide).next(".plotHolder").show()}else{$(this).text(locale.Show).next(".plotHolder").hide()}});$.plot(o.find("#dayu"),[n],{xaxis:{mode:"time"}});$.plot(o.find("#daypv"),[c],{xaxis:{mode:"time"}});$.plot(o.find("#daysb"),[b],{xaxis:{mode:"time"}});$.plot(o.find("#monthu"),[{data:a,color:"#FF0000"}],{xaxis:{mode:"time"}});$.plot(o.find("#monthpv"),[{data:p,color:"#FF0000"}],{xaxis:{mode:"time"}});$.plot(o.find("#houru"),[{data:l,color:"#228b22"}],{xaxis:{mode:"time"}});$.plot(o.find("#hourpv"),[{data:g,color:"#228b22"}],{xaxis:{mode:"time"}});return o};modtools.prototype.modqueue=function(d){var m=this;var l=d.data.children;var k=[];var f='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";m.content.find("#optionButtons").html(f);var g="link";var a=0;var h="";var e="";var b="";for(var c=0;c<l.length;c++){if(l[c].kind=="t1"){g="comment";a=l[c].data.ups-l[c].data.downs;h=l[c].data.link_title;e=$("<div />").html(l[c].data.body_html).text()}else{if(l[c].kind=="t3"){g="link";a=l[c].data.score;h=l[c].data.title;e=""}}b="";if(l[c].data.likes==true){b="Likes"}else{if(l[c].data.likes==false){b="DisLikes"}}k.push('<div href="'+l[c].data.permalink+'" data-postid="'+l[c].data.name+'" class="Post"> 			<div class="Voting"><div class="upVote '+b+'"></div><div class="Score">'+a+'</div><div class="downVote '+b+'"></div></div> 			<div class="TopInfo"><span class="Title">'+h+' - <span class="Reports">'+l[c].data.num_reports+" reports</span></span></div> 			"+e+' 			<div class="BottomInfo"><div class="Options"><a class="Button spam">spam</a><a class="Button remove">'+locale.Remove+'</a><a class="Button approve">'+locale.Approve+"  "+g+"</a></div></div> 		</div>")}var j=$('<div class="info">'+k.join("")+"</div>");j.on("click.modqueue",".upVote",function(i){i.stopPropagation();m.upVote($(this))});j.on("click.modqueue",".downVote",function(i){i.stopPropagation();m.downVote($(this))});j.on("click.modqueue",".spam",function(n){n.stopPropagation();var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var o=i.attr("data-postid");$(this).addClass("Active");m.connection.remove(o,true,m.subreddit.split("/")[2])});j.on("click.modqueue",".remove",function(n){n.stopPropagation();var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var o=i.attr("data-postid");$(this).addClass("Active");m.connection.remove(o,false,m.subreddit.split("/")[2])});j.on("click.modqueue",".approve",function(n){n.stopPropagation();var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var o=i.attr("data-postid");$(this).addClass("Active");m.connection.approve(o)});j.on("click.modqueue",".Post",function(n){n.stopPropagation();var o=$(this).attr("data-postid");var i=$(this).attr("href");window.location.href="#/Home/post/"+o+"/permalink/"+i.replace(/\//g,"~")+"/column/"+m.subreddit.replace(/\//g,"-")});return j};modtools.prototype.reportedlinks=function(d){var m=this;var l=d.data.children;var k=[];var f='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";m.content.find("#optionButtons").html(f);var g="link";var a=0;var h="";var e="";var b="";for(var c=0;c<l.length;c++){if(l[c].kind=="t1"){g="comment";a=l[c].data.ups-l[c].data.downs;h=l[c].data.link_title;e=$("<div />").html(l[c].data.body_html).text()}else{if(l[c].kind=="t3"){g="link";a=l[c].data.score;h=l[c].data.title;e=""}}b="";if(l[c].data.likes==true){b="Likes"}else{if(l[c].data.likes==false){b="DisLikes"}}k.push('<div href="'+l[c].data.permalink+'" data-postid="'+l[c].data.name+'" class="Post"> 			<div class="Voting"><div class="upVote '+b+'"></div><div class="Score">'+a+'</div><div class="downVote '+b+'"></div></div> 			<div class="TopInfo"><span class="Title">'+h+' - <span class="Reports">'+l[c].data.num_reports+" reports</span></span></div> 			"+e+' 			<div class="BottomInfo"><div class="Options"><a class="Button spam">spam</a><a class="Button remove">remove</a><a class="Button approve">'+locale.Approve+"  "+g+"</a></div></div> 		</div>")}var j=$('<div class="info">'+k.join("")+"</div>");j.on("click.modqueue",".upVote",function(i){i.stopPropagation();m.upVote($(this))});j.on("click.modqueue",".downVote",function(i){i.stopPropagation();m.downVote($(this))});j.on("click.modqueue",".spam",function(){var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var n=i.attr("data-postid");$(this).addClass("Active");m.connection.remove(n,true,m.subreddit.split("/")[2])});j.on("click.modqueue",".remove",function(){var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var n=i.attr("data-postid");$(this).addClass("Active");m.connection.remove(n,false,m.subreddit.split("/")[2])});j.on("click.modqueue",".approve",function(){var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var n=i.attr("data-postid");$(this).addClass("Active");m.connection.approve(n)});j.on("click.modqueue",".Post",function(n){n.stopPropagation();var o=$(this).attr("data-postid");var i=$(this).attr("href");window.location.href="#/Home/post/"+o+"/permalink/"+i.replace(/\//g,"~")+"/column/"+m.subreddit.replace(/\//g,"-")});return j};modtools.prototype.spamlinks=function(d){var m=this;var l=d.data.children;var k=[];var f='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";m.content.find("#optionButtons").html(f);var g="link";var a=0;var h="";var e="";var b="";for(var c=0;c<l.length;c++){if(l[c].kind=="t1"){g="comment";a=l[c].data.ups-l[c].data.downs;h=l[c].data.link_title;e=$("<div />").html(l[c].data.body_html).text()}else{if(l[c].kind=="t3"){g="link";a=l[c].data.score;h=l[c].data.title;e=""}}b="";if(l[c].data.likes==true){b="Likes"}else{if(l[c].data.likes==false){b="DisLikes"}}k.push('<div href="'+l[c].data.permalink+'" data-postid="'+l[c].data.name+'" class="Post"> 			<div class="Voting"><div class="upVote '+b+'"></div><div class="Score">'+a+'</div><div class="downVote '+b+'"></div></div> 			<div class="TopInfo"><span class="Title">'+h+"</span></div> 			"+e+' 			<div class="BottomInfo"><div class="Options"><a class="Button approve">'+locale.Approve+"  "+g+"</a></div></div> 		</div>")}var j=$('<div class="info">'+k.join("")+"</div>");j.on("click.modqueue",".upVote",function(i){i.stopPropagation();m.upVote($(this))});j.on("click.modqueue",".downVote",function(i){i.stopPropagation();m.downVote($(this))});j.on("click.modqueue",".approve",function(){var i=$(this).parent().parent().parent();i.find("a.Active").removeClass("Active");var n=i.attr("data-postid");$(this).addClass("Active");m.connection.approve(n)});j.on("click.modqueue",".Post",function(n){n.stopPropagation();var o=$(this).attr("data-postid");var i=$(this).attr("href");window.location.href="#/Home/post/"+o+"/permalink/"+i.replace(/\//g,"~")+"/column/"+m.subreddit.replace(/\//g,"-")});return j};modtools.prototype.bannedusers=function(h){var b=this;var f=h.data.children;var c='<button class="Button" data-message="close">'+locale.Close+'</button><button class="Button time" data-message="goback">'+locale.Go_Back+"</button>";b.content.find("#optionButtons").html(c);var e=[];var a="";for(var d in f){a=' - <a id="'+f[d].id+'" class="removeBan">remove</a></div>';e.push('<div class="Ban">'+f[d].name+a)}b.content.on("click.edit",".removeBan",function(){$("#selectBan").val($(this).attr("id"));$(this).removeClass("removeBan").html('Are you sure?  <a data-message="removeBan" data-ignore="true">'+locale.Yes+'</a> / <a data-message="cancelRemoveBan" data-ignore="true">'+locale.No+"</a>")});var g='<div class="leftPush info"> 		<h3>Ban User</h3> 		<input class="short" type="text" id="banName" /> 		<a data-message="addBan" class="Button rightInput">'+locale.Add+'</a> 		<h3>Banned Users</h3> 		<div class="banlist"> 		'+e.join("")+' 		</div> 		<input type="hidden" id="selectBan" value="" /> 	</div>';return g};modtools.prototype.unmoderatedlinks=function(d){var l=this;var k=d.data.children;var j=[];var f="link";var a=0;var g="";var e="";var b="";for(var c=0;c<k.length;c++){if(k[c].kind=="t1"){f="comment";a=k[c].data.ups-k[c].data.downs;g=k[c].data.link_title;e=$("<div />").html(k[c].data.body_html).text()}else{if(k[c].kind=="t3"){f="link";a=k[c].data.score;g=k[c].data.title;e=""}}b="";if(k[c].data.likes==true){b="Likes"}else{if(k[c].data.likes==false){b="DisLikes"}}j.push('<div href="'+k[c].data.permalink+'" data-postid="'+k[c].data.name+'" class="Post"> 			<div class="Voting"><div class="upVote '+b+'"></div><div class="Score">'+a+'</div><div class="downVote '+b+'"></div></div> 			<div class="TopInfo"><span class="Title">'+g+' - <span class="Reports">'+k[c].data.num_reports+" reports</span></span></div> 			"+e+' 			<div class="BottomInfo"><div class="Options"></div></div> 		</div>')}var h=$('<div class="info">'+j.join("")+"</div>");h.on("click.modqueue",".upVote",function(i){i.stopPropagation();l.upVote($(this))});h.on("click.modqueue",".downVote",function(i){i.stopPropagation();l.downVote($(this))});h.on("click.modqueue",".Post",function(m){m.stopPropagation();var n=$(this).attr("data-postid");var i=$(this).attr("href");window.location.href="#/Home/post/"+n+"/permalink/"+i.replace(/\//g,"~")+"/column/"+l.subreddit.replace(/\//g,"-")});return h};modtools.prototype.upVote=function(d){var a=this.connection;var b=d.parent();var f=b.children(".downVote:first");var e=b.children(".Score:first");if(!d.hasClass("Likes")){d.addClass("Likes");var c=(f.hasClass("DisLikes")?2:1);f.removeClass("DisLikes");e.text(parseInt(e.text())+c);a.upvote(b.parent().attr("data-postid"))}else{d.removeClass("Likes");f.removeClass("DisLikes");e.text(parseInt(e.text())-1);a.removevote(b.parent().attr("data-postid"))}};modtools.prototype.downVote=function(d){var a=this.connection;var b=d.parent();var f=b.children(".upVote:first");var e=b.children(".Score:first");if(!d.hasClass("DisLikes")){d.addClass("DisLikes");var c=(f.hasClass("Likes")?-2:-1);f.removeClass("Likes");e.text(parseInt(e.text())+c);a.downvote(b.parent().attr("data-postid"))}else{d.removeClass("DisLikes");f.removeClass("Likes");e.text(parseInt(e.text())+1);a.removevote(b.parent().attr("data-postid"))}};function userInfo(d,b,c){var a=this;userInfo.prototype.lastUserInfoViewed=d;this.realTabManagerObj=c;this.username=d;this.connection=b;this.id="-user-"+d+"-.json";this.url="/user/"+a.username+"/.json";this.startup(function(){a.bindings()})}userInfo.prototype.lastUserInfoViewed="";userInfo.prototype.startup=function(f){var a=this;var b='<div class="Viewport"> 			<div class="leftView"> 				<div class="loadingcss block icon-spin"></div> 			</div> 			<div class="rightView"> 			</div> 		</div>';var d='<button class="left Button" id="close" data-message="close">[suggestedCloseText]</button><div id="optionButtons" class="buttongroup"></div>';a.content=$.popup({id:"userinfo",title:a.username,message:b,buttons:d},function(i){if(i=="sendMessage"){a.content.closePopup();notifications(a.connection,window.tabManagerObj,{action:"compose",username:a.username})}else{if(i=="manageTags"){a.connection.tags(function(l){a.tags=l;redditpost.prototype.manageTags.call(a,a.username)});return}else{if(i=="addFriend"){var h=a.content.find(".addFriend").addClass("loading");var j={action:"add",type:"friend",container:"t2_"+a.connection.user.id,name:a.username};a.connection.friend(j,function(){h.removeClass("loading addFriend").addClass("removeFriend").html('<i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Remove_Friend+"</span>").attr("data-message","removeFriend")})}else{if(i=="removeFriend"){var h=a.content.find(".removeFriend").addClass("loading");var g={action:"remove",type:"friend",container:"t2_"+a.connection.user.id,name:a.username};a.connection.unfriend(g,function(){h.removeClass("loading removeFriend").addClass("addFriend").html('<i class="icon-plus"></i><span>&nbsp;&nbsp;'+locale.Add_Friend+"</span>").attr("data-message","addFriend")})}else{if(i=="copyLink"){clipboard_set(a.getLink())}else{if(i=="toggleColumn"){var h=a.content.find(".toggleColumn");if(h.text().trim()==locale.Add_Column){var k=tabManagerObj.insert(function(l){return new column(a.url,l,activePlayground,connection,this,{SPECIAL:true,SORT:"new",USER:true},a.username+"'s Posts")},"SYNC");a.content.closePopup();tabManagerObj.lastPage();h.html('<i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Remove_Column+"</span>")}else{tabManagerObj.removeColumn(a.id);h.html('<i class="icon-plus"></i><span>&nbsp;&nbsp;'+locale.Add_Column+"</span>")}}}}}}}return i});var c=new column("/user/"+a.username+".json",$(".rightView"),activePlayground,connection,false,{SPECIAL:true,SORT:"new",USER:true},a.username+"'s Posts").startup();var e=c.openPost;c.openPost=function(g){a.content.closePopup();e.call(c,g)};reddit().getUser(a.username,function(h){if(!h){alert("The user "+a.username+" does not exist.");a.content.closePopup();return}var l=a.realTabManagerObj&&a.realTabManagerObj.isPermanentColumn(a.url);var g='<button data-message="toggleColumn" class="toggleColumn Button">'+(l?'<i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Remove_Column+"</span>":'<i class="icon-plus"></i><span>&nbsp;&nbsp;'+locale.Add_Column+"</span>")+"</button>";if(!a.realTabManagerObj){g=""}var i='<button style="margin-right: -3px;" data-message="manageTags" class="Button"><i class="icon-tag"></i><span>&nbsp;&nbsp;'+locale.Manage_Tags+'</span></button> 			<button data-clipboard-text="'+a.getLink()+'" data-message="copyLink" class="Button"><i class="icon-link"></i><span>&nbsp;&nbsp;'+locale.Copy_Link+"</span></button>"+(a.connection.isfriend(a.username)?'<button data-message="removeFriend" class="removeFriend Button"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Remove_Friend+"</span></button>":'<button data-message="addFriend" class="addFriend Button"><i class="icon-user"></i><span>&nbsp;&nbsp;'+locale.Add_Friend+"</span></button>")+g+'<button data-message="sendMessage" class="Button"><i class="icon-envelope"></i><span>&nbsp;&nbsp;'+locale.Send_Message+"</span></button>";var j=h.user;var m=h.trophies.map(function(n){return'<div class="trophy"><img src="'+n.icon_40+'"><div class="name">'+n.name+"</div></div>"}).join("");var k='<div class="userStats"> 					<div class="User">'+a.username+'</div> 					<div class="statSection"><span class="stat">'+numberWithCommas(j.link_karma)+'</span><br /> <span class="statLabel">'+locale.link_karma+'</span></div> 										<div class="statSection"><span class="stat">'+numberWithCommas(j.comment_karma)+'</span> 					<br /> <span class="statLabel">'+locale.comment_karma+'</span></div>						<div class="statSection"><span class="stat date">'+formatDate(j.created_utc)[0]+'</span> 					<br /> <span class="statLabel">'+locale.registered+'</span></div> 				</div> 				<div class="trophies"><h3>'+locale.Trophy_Case+"</h3> 				"+m+" 				</div>";a.content.find(".leftView").html(k);a.content.find("#optionButtons").append(i);if(typeof f=="function"){f()}});analytics().track("Interaction","Opened a profile")};userInfo.prototype.getLink=function(){return"http://reddit.com"+this.url.replace(".json","")};userInfo.prototype.bindings=function(){if(window.clipboard_set_flash){clipboard_set_flash(this.content.find('[data-message="copyLink"]')[0])}};function friendsList(b,c){var a=this;this.connection=b;this.tabManager=c;this.startup(function(){a.bindings()})}friendsList.prototype.startup=function(e){var b=this;var d='<div class="Viewport"> 		</div>';b.content=$.popup({id:"friendslist",title:"Friends",message:d,buttons:'<button class="Button" id="close" data-message="close"><i class="icon-remove"></i><span>&nbsp;&nbsp;Close</span></button><div id="optionButtons" class="left buttongroup"><button class="left Button" id="toggleNewFriend"><i class="icon-plus"></i><span>&nbsp;&nbsp;Add Friend</span></button><input type="text" placeholder="Seperate usernames by spaces" id="newFriendInput" /></div>'},function(f){if(f=="addFriend"){}else{if(f=="removeFriend"){}}return f});var a=[];for(var c in b.connection.user.friends){a.push('<div class="friend" data-username="'+c+'" id="'+b.connection.user.friends[c]+'"><div class="userName">'+c+'</div><div class="options"><button class="toggleFriend Button"><i class="icon-remove"></i></button></div></div><div class="clearBoth"></div></div>')}b.content.find(".Viewport").html(a.join(""));if(typeof e=="function"){e()}};friendsList.prototype.bindings=function(){var a=this;a.content.on("click.friendslist",".friend",function(){var b=new userInfo($(this).find(".userName").text(),a.connection,a.tabManager)});a.content.on("click.friendslist",".toggleFriend",function(d){d.stopPropagation();var c=$(this).addClass("loading");if(c.text()==locale.Add){var f={action:"add",type:"friend",container:"t2_"+a.connection.user.id,name:c.parent().parent().attr("data-username")};a.connection.friend(f,function(){c.removeClass("loading").html('<i class="icon-remove"></i>')})}else{var b={action:"remove",type:"friend",container:"t2_"+a.connection.user.id,name:c.parent().parent().attr("data-username")};a.connection.unfriend(b,function(){c.removeClass("loading").text("Add")})}});a.content.on("keypress.friendslist","#newFriendInput",function(f){if(f.which==13){var d=a.content.find("#newFriendInput").removeClass("expand").val().split(" ");a.content.find("#toggleNewFriend").text("Add Friends");for(var c=0;c<d.length;c++){var b=$.trim(d[c]);var g={action:"add",type:"friend",container:"t2_"+a.connection.user.id,name:b};a.connection.friend(g,b,function(h,e){a.content.find(".Viewport").append('<div class="friend" data-username="'+e+'" id="'+h.id+'"><div class="userName">'+e+'</div><div class="options"><button class="toggleFriend Button"><i class="icon-remove"></i></button></div></div><div class="clearBoth"></div></div>')})}}});a.content.on("click.friendslist","#toggleNewFriend",function(f){a.content.find("#newFriendInput").focus();if($(this).text()!=locale.Cancel){a.content.find("#newFriendInput").addClass("expand").val("");$(this).html('<i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Cancel+"</span>")}else{var d=a.content.find("#newFriendInput").removeClass("expand").val().split(" ");$(this).text('<i class="icon-plus"></i><span>&nbsp;&nbsp;'+locale.Add_Friend+"</span>");for(var c=0;c<d.length;c++){var b=$.trim(d[c]);var g={action:"add",type:"friend",container:"t2_"+a.connection.user.id,name:b};a.connection.friend(g,b,function(h,e){a.content.find(".Viewport").append('<div class="friend" data-username="'+e+'" id="'+h[29][3][0][0].id+'"><div class="userName">'+e+'</div><div class="options"><button class="toggleFriend Button"><i class="icon-remove"></i></button></div></div><div class="clearBoth"></div></div>')})}}})};if(typeof window.volatileUserCacheData=="undefined"){window.volatileUserCacheData={}}function column(a,f,g,c,h,d,i,k,b){var j=this;c.setting("NSFW",function(l){j.NSFW=l});if(typeof b!="undefined"&&b>150){this.width=b}var e=a.match(/r\/(.*?)\//);this.subreddit=(e!=null)?this.subreddit=e.pop().toLowerCase():false;if(typeof d.SORT=="undefined"&&(a=="/"||d.USER)){d.SORT="new"}else{if(typeof d.SORT=="undefined"){d.SORT="hot"}}this.flags=d?d:{};if(typeof k!="undefined"){this.refreshTime=k}this.url=a=a.toLowerCase();this.shouldIncludeAd=true;if(this.url.indexOf("/message/")!=-1){this.shouldIncludeAd=false}this.title=i;this.playground=g;this.tabManagerObj=typeof h=="boolean"?this.pseudoTabManager():h;this.connection=c;this.id=a.replace(/\//g,"-");this.selector=f;this.updateIntervalPages=[];this.pagesActive=[];return this}window.COLUMN_HAS_AD=false;column.prototype.thisColumnContainsAd=false;column.prototype.refreshIntervalRunning=false;column.prototype.refreshTime=120000;column.prototype.count=70;column.prototype.loading=false;column.prototype.yScrollPos=40;column.prototype.binded=false;column.prototype.running=false;column.prototype.width=300;column.prototype.currentFilterText="";column.prototype.activeColumn=undefined;window.COLUMNS_STARTED={};column.prototype.setUrl=function(a){a=a.toLowerCase();this.url=a;this.id=a.replace(/\//g,"-");this.content.attr("id",this.id);this.refresh()};column.prototype.fetchDataAfter=function(d,e,c){var a=this.url;if(a.indexOf("subreddits_by")!=-1){var b=a.match(/query=(.*?)$/).pop();this.connection.searchForSubreddit(b,function(f){e(f,false)});return}this.flags.top_filter=typeof this.flags.top_filter=="undefined"?"all":this.flags.top_filter;this.connection.getPosts((a.indexOf(".json")!=-1)?((a.indexOf(".json?")!=-1)?a+"&sort="+this.flags.SORT+"&t="+this.flags.top_filter:a+"?sort="+this.flags.SORT+"&t="+this.flags.top_filter):a+this.flags.SORT+".json?t="+this.flags.top_filter,this.count,d,function(f){e(f)},c)};column.prototype.armBindings=function(){var a=this;this.selector.unbind("mouseover.initialize").bind("mouseover.initialize",function(){if(typeof a.postContainer=="undefined"){return}a.selector.unbind("mouseover.initialize");a.bindings(true)});if(this.refreshTime!=0){this.refreshInterval(true)}this.hoverOverPopups()};column.prototype.hoverOverPopups=function(){var b=this;var a=this.tabManagerObj;var c;this.connection.setting("postHoverOvers",function(d){if(d){b.selector.off(".popup").on("mouseenter.popup",".Post:not(.ad)",function(g){if(a&&a.scrolling&&!a.mailViewActive){return}var f=$(this);smartContentPopup(f,function(){b.connection.setting("markReadOnHoverDelay",function(e){c=setTimeout(function(){b.markVisited(f);b.connection.updateLocalStorageCache(f.attr("data-name"),{lastViewed:Date.now(),num_comments:f.attr("data-comments")},2)},e)})})}).on("mouseleave.popup",".Post",function(f){smartContentPopupPrevent($(this));clearTimeout(c)})}})};column.prototype.bindings=function(b,l){var h=this.binded;if(h&&b){return}if(h==false&&b==false){return}var f=this.content;var a=this.connection;var m=this;var j=this.postContainer;var c=this.selector;var g=this.tabManagerObj;if(b==false){this.binded=false;this.postContainer.unbind(".columnEvents");f.off(".columnEvents");c.off(".columnEvents");this.selector.off();if(typeof l=="function"){l()}clearInterval(this.refreshInterval);for(var d in this.updateIntervalPages){clearInterval(this.updateIntervalPages[d])}this.updateIntervalPages=[];if(typeof this.sidebarObject!="undefined"){this.sidebarObject.off();this.sidebarObject.remove()}return}this.binded=true;var k=this.pagesActive;var e=k.length;m.initializeUpdateScoresLoop(null,false);if(e>0){for(var d=0;d<e;d++){m.initializeUpdateScoresLoop(k[d],false)}}if(navigator.appVersion.indexOf("Mac")!=-1){j.bind("mousewheel",function(n){var i=$(this).scrollTop();if(i<1&&n.originalEvent.wheelDelta>1){n.preventDefault();return false}else{if(i==($(this).children(".PostScroller").height()-$(this).height())&&n.originalEvent.wheelDelta<0){n.preventDefault();return false}}})}j.bind("scroll",function(i){clearTimeout(m.scrollEvent);m.scrollEvent=setTimeout(function(){m.handleScroll(i)},500)});c.on("click",".ColumnTitle",function(){m.scrollToTop()});this.hoverOverPopups();if(a.loggedin){f.on("click.columnEvents",".upVote",function(i){i.stopPropagation();m.upVote($(this),$(this).parent().parent().attr("id"))});f.on("click.columnEvents",".subscribeToggle",function(n){n.stopPropagation();var i=$(this);var o=i.attr("subreddit");if(i.html()=="Subscribe"){analytics().track("Interaction","Subscribed from Subreddit");i.html("Unsubscribe").removeClass("green").addClass("red");a.subscribe(o)}else{analytics().track("Interaction","Unsubscribed from Subreddit");i.html("Subscribe").removeClass("red").addClass("green");a.unsubscribe(o)}});f.on("click.columnEvents",".downVote",function(i){i.stopPropagation();m.downVote($(this),$(this).parent().parent().attr("id"))});f.on("click.columnEvents",".subredditOptions #Modtools",function(i){i.stopPropagation();m.createModtools(m.url,m.connection);m.columnOptions()});f.on("click.columnEvents",".subredditOptions #subscribeColumn",function(n){n.stopPropagation();var i=$(this);m.toggleSubscribe(i.attr("subreddit"),m.connection,i);m.columnOptions()})}f.on("mouseenter.columnEvents",".galleryView, .quickReply",function(i){i.stopPropagation();i.preventDefault();smartContentPopupPrevent($(this).parent().parent())});f.on("click.columnEvents",".galleryView",function(n){n.stopPropagation();var i=$(this).parent().parent();i.addClass("visited");m.connection.updateLocalStorageCache(i.attr("data-name"),{lastViewed:Date.now(),num_comments:i.attr("data-comments")},2);m.openGallery("fromPost",i)});f.on("click.columnEvents",".quickReply",function(n){n.stopPropagation();var i=$(this).parent().parent();m.openQuickReply(i)});f.on("click.columnEvents",".removeAds",function(i){i.preventDefault();i.stopPropagation();popupBrowser("http://reditr.com/subscription");return false});c.on("click.columnEvents",function(){if(c.is(column.prototype.activeColumn)&&!m.makeColumnGlow){c.removeClass("glow");column.prototype.activeColumn=undefined;return}if(typeof column.prototype.activeColumn!="undefined"){column.prototype.activeColumn.removeClass("glow")}column.prototype.activeColumn=m.selector;c.addClass("glow")});f.on("mouseleave.columnEvents",function(){m.hideFilter()});f.on("click.columnEvents","#removeContents",function(i){f.find("#searchElements input").val("").focus();m.applyFilter("");i.stopPropagation()});f.on("keyup.columnEvents","#searchElements input",function(i){if(i.keyCode==27){$(this).val("").blur();$(".current").removeClass("current");f.find(".Post:first").addClass("current")}m.applyFilter($(this).val());if(m.makeColumnGlow!=true){m.makeColumnGlow=true;c.click()}clearTimeout(m.makeColumnGlowTimeout);m.makeColumnGlowTimeout=setTimeout(function(){m.makeColumnGlow=false},1000)});f.on("keydown.columnEvents","input",function(i){i.stopPropagation()});f.on("click.columnEvents",".columnOptions, .Sorter",function(n){n.stopPropagation();var i=$(this);m.columnOptions.call(m,i,i.hasClass("Sorter"));analytics().track("Interaction","Changed Column Sort Type")});f.on("click.columnEvents",".quickOptions .refreshColumns",function(){m.refresh()});f.on("click.columnEvents",".quickOptions .galleryMode",function(){m.openGallery()});f.on("click.columnEvents",".subredditOptions #toggleAddDeleteColumn",function(i){i.stopPropagation();m.toggleAddDeleteColumn(m.id,$(this))});f.on("click.columnEvents",".subredditOptions .left.item",function(i){i.stopPropagation();g.moveColumn(m.id,"left");analytics().track("Interaction","Rearranged Column")});f.on("click.columnEvents",".subredditOptions .right.item",function(i){i.stopPropagation();g.moveColumn(m.id,"right");analytics().track("Interaction","Rearranged Column")});f.on("click.columnEvents",".sortby",function(i){m.switchSort({name:locale[$(this).attr("id")],type:$(this).attr("id")});m.columnOptions();analytics().track("Interaction","Changed Column Sort")});f.on("click.columnEvents, change.columnEvents","#topSortFilter",function(i){i.stopPropagation();m.flags.top_filter=$(this).val()});f.on("click.columnEvents","#refreshData",function(i){m.refresh();m.columnOptions();analytics().track("Interaction","Refreshed Column")});f.on("click.columnEvents","#galleryMode",function(i){m.openGallery();m.columnOptions()});f.on("click.columnEvents","#manageSubreddits",function(i){m.manageSubreddits();m.columnOptions()});f.on("click.columnEvents","#openSidebar",function(i){Stream.prototype.subredditSidebar(this.getAttribute("data-sub"));m.columnOptions();analytics().track("Interaction","Opened Subreddit Sidebar")});f.on("click.columnEvents","#changeTitle",function(i){m.setTitle(function(n){if(n){m.columnOptions()}})});f.on("click.columnEvents","#resize",function(i){m.widthChanger($(this))});f.on("click.columnEvents","#sideBar",function(i){m.sideBar();m.columnOptions();analytics().track("Interaction","Opened Subreddit Sidebar")});f.on("click.columnEvents",".Post:not(.LoadingPost)",function(){m.openPost.call(m,$(this))});f.on("click.columnEvents",".Author",function(i){i.stopPropagation();var n=$(this).text();m.userProfile(n)});f.on("contextmenu.columnEvents",".Post",function(i){m.openContextMenu(i,$(this))});if(typeof l=="function"){l()}return this};column.prototype.openQuickReply=function(b){var a=b;var c=this;new quickText({bindTo:a},function(f){if(f==false){this.close()}else{this.loading(true);var e=f;var d=this;c.connection.comment(a.attr("data-name"),a.attr("data-subreddit"),e,function(h,g){if(!h||g!="SUCCESS"){if(g=="FREQUENCY"){alert("You must wait 5 minutes before posting again.")}else{if(g==403){alert('Reddit has returned a 403 forbidden error, stating: "you are not allowed to do that".')}}d.loading(false)}if(g=="SUCCESS"){d.close()}})}})};column.prototype.openContextMenu=function(i,g){var j=g;var b="http://reddit6.com/"+j.attr("id");var d=g.attr("data-href");var a=j.attr("data-name");var l="http://reddit6.com"+j.attr("data-permalink");var m=this;var f=infoHandler(d,false)?"<li data-message='save' id='save'><i class='icon-save'></i><span>Save Image As...</span></li>":"";var h="";var k=infoHandler(d,false)?"<li data-message='gallery' id='gallery'><i class='icon-picture'></i><span>"+locale.View_in_Gallery+"</span></li>":"";if(m.connection.loggedin){var c="loading"+Date.now();h="<li id='"+c+"'><i class='icon-save'></i><span>Loading...</span></li>";this.connection.isPostSaved(a,function(e){waitForSelector("#"+c,function(){$("#"+c).replaceWith(e?"<li data-message='Un_Save' id='save'><i class='icon-save'></i><span>"+locale.Un_Save+" Post</span></li>":"<li data-message='Save' id='save'><i class='icon-save'></i><span>"+locale.Save+" Post</span></li>")})})}var n="<li data-message='reply' id='reply'><i class='icon-comment'></i><span>Quick Reply</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='open' id='open'><i class='icon-eye-open'></i><span>Open Link in New Window</span></li>"+f+"<li data-message='copyLink' id='copyLink'><i class='icon-copy'></i><span>Copy Link URL</span></li> 				   <li data-message='copyReddit' id='copyReddit'><i class='icon-copy'></i><span>Copy Comments URL</span></li> 				   <div class='contextSeparator'></div>"+h+k+"<li data-message='hide' id='hide'><i class='icon-remove'></i><span>Hide</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='facebook' id='fb'><i class='icon-facebook-sign'></i><span>Share with Facebook</span></li> 				   <li data-message='twitter' id='twitter'><i class='icon-twitter-sign'></i><span>Share with Twitter</span></li> 				   <li data-message='google' id='google'><i class='icon-google-plus-sign'></i><span>Share with Google+</span></li>";$.contextMenu(n,i,function(r,q){if(r=="hide"){m.hidePost(j)}else{if(r=="facebook"){var p="537294919626568";var t=j.children(".Title:first").text();var o="https://www.facebook.com/dialog/feed?app_id="+p+"&link="+b+"&name="+t+"&redirect_uri=http://reditr.com/fb.html";popupBrowser(o,"facebook")}else{if(r=="twitter"){var e="Reditr";var s=j.children(".Title:first").text();var o="https://twitter.com/intent/tweet?url="+b+"&via="+e+"&text="+s+"&hashtags=reddit";popupBrowser(o,"twitter","popup")}else{if(r=="google"){var o="https://plus.google.com/share?url="+b;popupBrowser(o,"google","popup")}else{if(r=="open"){popupBrowser(d+((d.indexOf("reddit.com")!=-1)?"#oo":""))}else{if(r=="save"){downloadImage(d)}else{if(r=="copyLink"){clipboard_set(d)}else{if(r=="copyReddit"){clipboard_set(l)}else{if(r=="Save"){m.connection.savePost(a)}else{if(r=="Un_Save"){m.connection.unsavePost(a)}else{if(r=="gallery"){m.openGallery("fromPost",j)}else{if(r=="reply"){m.openQuickReply(j)}}}}}}}}}}}}});analytics().track("Interaction","Opened Context Menu")};column.prototype.scrollToTop=function(c,b){if(!c){c=0}if(!b){b=2}if(this.postContainer.scrollTop()<80){this.postContainer.scrollTop(40)}else{b*=++c;this.postContainer.scrollTop(this.postContainer.scrollTop()-b);var a=this;setTimeout(function(){a.scrollToTop(c,b)},10)}};column.prototype.hideFilter=function(){var a=this;clearTimeout(this.hideFilterTimeout);this.hideFilterTimeout=setTimeout(function(){if(a.tabManagerObj&&a.tabManagerObj.mailViewActive){return}if(a.yScrollPos<=40){a.yScrollPos=40;a.postContainer.animate({scrollTop:"40px"},150)}},250)};column.prototype.userProfile=function(b){var a=new userInfo(b,this.connection,this.tabManagerObj)};column.prototype.pseudoTabManager=function(){return{moveColumn:function(){},isPermanentColumn:function(){return false},setSort:function(){},makePermanent:function(){},removeColumn:function(){},isFake:true}};column.prototype.columnOptions=function(f,k){var j=this.content.find(".subredditOptions");var b=this.connection;var m=this;if(!f||j.find("div").length!=0){j.css("height","0px");setTimeout(function(){j.find("div").remove();j.css("height","auto")},500);return}var d=[];if(!k){d.push("<div id='Navigation' class='left item'></div> 							   <div id='Navigation' class='right item'></div> 							   <div style='clear: both'></div>");d.push("<div id='changeTitle' class='item'><i class='icon-pencil'></i>&nbsp;&nbsp;"+locale.Change_Column_Title+"</div>");if(!this.flags.SPECIAL&&this.subreddit&&("/"+this.url).indexOf("/r/")!=-1){d.push("<div id='manageSubreddits' class='item'><i class='icon-tasks'></i>&nbsp;&nbsp;"+locale.Manage_Subreddits+"</div>")}d.push("<div id='refreshData' class='item'><i class='icon-refresh'></i>&nbsp;&nbsp;"+locale.Refresh_Content+"</div>");if(!(this.flags.SPECIAL||this.id.indexOf("+")!=-1||this.id=="-")){d.push("<div id='sideBar' class='item'><i class='icon-bullhorn'></i>&nbsp;&nbsp;"+locale.Sidebar+"</div>")}d.push("<div id='galleryMode' class='item'><i class='icon-picture'></i>&nbsp;&nbsp;"+locale.Gallery_Mode+"</div> 							   <div id='resize' class='item'><i class='icon-resize-horizontal'></i>&nbsp;&nbsp;Width: <span id='width'>"+this.width+"</span>px</div>");if(this.connection.ismod(this.url)){d.push("<div id='Modtools' class='item'><i class='icon-certificate'></i>&nbsp;&nbsp;"+locale.Moderation_Tools+"</div>")}d.push("<div id='toggleAddDeleteColumn' "+(m.tabManagerObj.isPermanentColumn(m.url)?"class='item'><i class='icon-trash'></i>&nbsp;&nbsp;"+locale.Remove_Column_from_Reditr:"class='item'><i class='icon-plus-sign'></i>&nbsp;&nbsp;"+locale.Add_Column_to_Reditr)+"</div>")}else{if(m.flags.SORT!=false&&!m.flags.SEARCH){d.push("<div id='new' class='item sortby'><i class='icon-asterisk'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.New+"</div> 								   <div id='hot' class='item sortby'><i class='icon-fire'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Hot+"</div> 								   <div id='controversial' class='item sortby'><i class='icon-legal'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Controversial+"</div> 								   <div id='top' class='item sortby'><i class='icon-list-ol'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Top+"<select id='topSortFilter'> 								   		<option "+((m.flags.top_filter=="hour")?"selected":"")+" value='hour'>by this hour</option> 								   		<option "+((m.flags.top_filter=="day")?"selected":"")+" value='day'>by today</option> 								   		<option "+((m.flags.top_filter=="week")?"selected":"")+" value='week'>by this week</option> 								   		<option "+((m.flags.top_filter=="month")?"selected":"")+" value='month'>by this month</option> 								   		<option "+((m.flags.top_filter=="year")?"selected":"")+" value='year'>by this year</option> 								   		<option "+((m.flags.top_filter=="all")?"selected":"")+" value='all'>by all-time</option> 								   	</select> 								   </div>")}if(m.flags.SEARCH){d.push("<div id='relevance' class='item sortby'><i class='icon-bar-chart'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Relevance+"</div> 								   <div id='new' class='item sortby'><i class='icon-asterisk'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.New+"</div> 								   <div id='top' class='item sortby'><i class='icon-list-ol'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Top+"<select id='topSortFilter'> 								   		<option "+((m.flags.top_filter=="hour")?"selected":"")+" value='hour'>by this hour</option> 								   		<option "+((m.flags.top_filter=="day")?"selected":"")+" value='day'>by today</option> 								   		<option "+((m.flags.top_filter=="week")?"selected":"")+" value='week'>by this week</option> 								   		<option "+((m.flags.top_filter=="month")?"selected":"")+" value='month'>by this month</option> 								   		<option "+((m.flags.top_filter=="year")?"selected":"")+" value='year'>by this year</option> 								   		<option "+((m.flags.top_filter=="all")?"selected":"")+" value='all'>by all-time</option> 								   	</select> 								   </div> 								   <div id='comments' class='item sortby'><i class='icon-comments'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Comments+"</div> 								   <div id='hot' class='item sortby'><i class='icon-fire'></i>&nbsp;&nbsp;"+locale.Sort_by+" "+locale.Hot+"</div>")}}if(!this.flags.SPECIAL&&b.loggedin&&this.subreddit&&!k){var h=Date.now();var l=this.subreddit.split("+");var c=l.length;var a=0;for(var e=0;e<c;e++){d.push('<div id="subscribedPlaceholder'+h+"_"+e+"\" class='item'><i class='icon-heart'></i>&nbsp;&nbsp;Loading...</div>");d.push("<div id='openSidebar' class='item' data-sub='"+l[e]+"'><i class='icon-info-sign'></i>&nbsp;&nbsp;"+capitalize(l[e])+" Sidebar</div>");(function(){var n=l[e];var i=e;b.issubscribed(n,function(o,p){waitForSelector("#subscribedPlaceholder"+h+"_"+i,function(q){q.replaceWith("<div id='subscribeColumn' subreddit='"+m.subreddit_id+"' class='item'><i class='icon-heart'></i>&nbsp;&nbsp;"+(o?locale.Unsubscribe_from:locale.Subscribe_to)+" "+n+"</div>")})})})()}}j.addClass("loading");j.html(d.join(""));var g=j.height();j.css("height","0px").removeClass("loading");j.css("height",g+"px")};column.prototype.columnOptionsDropdown=function(b,d){var a=this;var c=this.content;var f=c.find(".subredditOptions");if(f.hasClass("active")){f.removeClass("active")}else{f.addClass("active")}};column.prototype.createModtools=function(b,a){var c=new modtools(b,a)};column.prototype.handleScroll=function(){var b=this.postScroller;var c=this.yScrollPos=this.postContainer.scrollTop();var a=this;this.playground.find(".smartContentPopup").remove();if(c>40){this.content.find(".ColumnTitle").addClass("clickable")}else{this.content.find(".ColumnTItle").removeClass("clickable")}if(b.height()-(c+this.postContainer.height())<250&&!this.loading&&this.url.indexOf("subreddits_by")==-1){var e=this.postContainer.find(".LoadingPost");var d=b.children(".Post:not(.LoadingPost):last").attr("data-name");this.loading=true;this.count+=25;if(this.count>74){this.content.addClass("noAnimate")}a.fetchDataAfter(d,function(f){a.createPostBuffer(f,function(g){e.remove();b.append(g);if(f.length==0){b.find(".LoadingPost").remove()}a.loading=false;a.initializeUpdateScoresLoop(d,true);if(window.isChromePackaged){a.loadThumbnails()}},true)})}};column.prototype.createPostBuffer=function(s,e,m){var l=this;var o=this.activePosts;var j=this.connection;var n=this.subreddit;var k=this.NSFW;var b=0;var d=typeof this.flags.highlight=="undefined"?false:this.flags.highlight;var h=[];var t="";var p="NoThumb";var i,g,c,q;var r=m&&s.length==25?'<div class="Post LoadingPost"><div class="loadingcss block"></div></div>':"";var f=j.loggedin;a();function a(){j.getAllLocalStorageCache(function(u){j.setting("quickButtons",function(v){j.filter("global",function(w){j.filter("banned-subs",function(x){j.setting("nsfwRibbon",function(L){if(!u){u={}}var C="";bufferBuildingLoop:for(var P in s){var K=s[P].data;var F=s[P].kind;if(typeof K=="undefined"){var U=s[P].name;h.push('<div type="context" class="Post isSubreddit" data-href="/r/'+U+'"> <div class="Comment">'+U+'</div><div style="clear:both;"></div>'+(f?'<button class="loading subSearch-'+U+' subscribeToggle"></button>':"")+"</div>");if(f){j.issubscribed(U,function(V,X,W){waitForSelector(".subSearch-"+W,function(Y){Y.attr("subreddit",X);if(V){Y.removeClass("loading").addClass("red").html("Unsubscribe")}else{Y.removeClass("loading").addClass("green").html("Subscribe")}})})}continue}if((k==2&&K.over_18)||(k==3&&!K.over_18)){b++;continue}if(x&&x.length>0&&x.indexOf(K.subreddit.toLowerCase())>=0){continue bufferBuildingLoop}if(w&&w.length>0&&K.title&&K.domain){var R=K.title.toLowerCase();var T=K.domain.toLowerCase();for(var P in w){if(R.indexOf(w[P])>-1||T.indexOf(w[P])>-1){continue bufferBuildingLoop}}}var N=u[K.name]?u[K.name].contents:{};if(K.hidden){continue}if(o[K.name]){continue}o[K.name]=true;i="";if(K.likes==true){i="Likes"}else{if(K.likes==false){i="DisLikes"}}var A=parseInt(K.created_utc);var H=formatDate(A);var O=(typeof K.dest!="undefined")?'<span class="Author">'+K.author+'</span> to <span class="Author">'+K.dest+"</span>":'<span class="Author">'+K.author+"</span>";var D=(K.num_comments-N.num_comments);var S=(typeof N.num_comments!="undefined"&&D>0)?'<span id="newComments"> ('+(K.num_comments-N.num_comments)+")</span>":"";var y=(typeof K.num_comments!="undefined")?" - "+K.num_comments+" "+locale.comments:"";infobottom='<div class="InfoBottom"><span class="AuthorContainer">'+O+'<span id="commentInfo">'+y+S+'</span> </span> <span class="date '+H[1]+'" data-timestamp="'+A+'">'+H[0]+"</span></div>";var G=(d==K.id)?"current ":"";if(F=="t4"){var E="/message/messages/"+K.id;var J=(K["new"])?"unread":"read";C='<div type="t4" data-subreddit="'+K.subreddit+'" class="'+G+"Post "+J+'" data-name="'+K.name+'" data-comments="'+K.num_comments+'" data-url="http://www.reddit.com'+E+'" data-permalink="'+E+'" id="'+K.id+'" data-postid="'+K.id+'"><div class="Comment">'+K.subject+'</div><div style="clear:both;"></div>'+infobottom+"</div>"}else{if(F=="t1"&&typeof K.context!="undefined"){var Q=(n==K.subreddit.toLowerCase())?"":capitalize(K.subreddit)+" - ";var E="/r/"+K.subreddit+"/comments/"+K.context.match(/comments\/(.*?)\?context/).pop()+".json?context=3";var J=(K["new"])?"unread":"read";var B=K.context.match(/comments\/(.*?)\//).pop();C='<div type="context" data-subreddit="'+K.subreddit+'" class="'+G+"Post "+J+'" data-postid="'+B+'" data-comments="'+K.num_comments+'" data-name="'+K.name+'" data-url="http://www.reddit.com'+E+'" data-permalink="'+E+'" id="'+K.id+'" data-postid="'+K.id+'"> <div class="Comment">'+Q+K.body+'</div><div style="clear:both;"></div>'+infobottom+"</div>"}else{if(F=="t1"){var Q=(n==K.subreddit.toLowerCase())?"":capitalize(K.subreddit);var E="/r/"+K.subreddit+"/comments/"+K.link_id.replace("t3_","")+"/post/"+K.id+".json?context=1";C='<div data-subreddit="'+K.subreddit+'" class="'+G+'Post" data-name="'+K.name+'" data-url="http://www.reddit.com'+E+'" data-comments="'+K.num_comments+'" data-permalink="'+E+'" id="'+K.id+'" data-postid="'+K.id+'"><div class="Voting"><div class="upVote '+i+'"></div><div class="Score">'+(K.ups-K.downs)+'</div><div class="downVote '+i+'"></div></div><div data-url="'+E+'" class="Title NoThumb">'+K.link_title+' <div class="Domain">('+Q+')</div> </div><div class="Comment">'+$("<div />").html(K.body_html).text()+'</div><div style="clear:both;"></div>'+infobottom+"</div>"}else{var Q=(n==K.subreddit.toLowerCase())?"":capitalize(K.subreddit)+" - ";if(K.thumbnail!=""&&K.thumbnail!="self"&&K.thumbnail!="default"&&K.thumbnail!="nsfw"){t=window.isChromePackaged?'<img data-thumb="'+K.thumbnail+'" class="Thumb" />':'<img class="Thumb" src="'+K.thumbnail+'" />';p=""}else{if(K.thumbnail=="self"||K.thumbnail=="default"||K.thumbnail=="nsfw"){t='<div class="Thumb '+K.thumbnail+'"></div>';p=""}else{t="";p="NoThumb"}}var M="";if(v){M="<div class='quickOptions'><div class='option quickReply'><i class='icon-comment'></i></div>";M+=infoHandler(K.url,false)?"<div class='option galleryView'><i class='icon-picture'></i></div>":"";M+="</div>"}var I=typeof N.num_comments=="undefined"?"":'<div class="visited-marker icon-eye-open"></div>';var z=(L?((K.over_18)?'<span class="NSFW"></span>':""):"");C='<div data-subreddit="'+K.subreddit+'" class="'+G+"Post"+((typeof N.num_comments=="undefined")?"":" visited")+" "+(K.over_18?"nsfw":"")+'" data-comments="'+K.num_comments+'" data-href="'+K.url+'" data-name="'+K.name+'" data-permalink="'+K.permalink+'" id="'+K.id+'" data-postid="'+K.id+'">'+I+M+'<div class="Voting"><div class="upVote '+i+'"></div><div class="Score">'+K.score+'</div><div class="downVote '+i+'"></div></div><div data-url="'+K.url+'" class="Title '+p+'">'+t+z+K.title+' <div class="Domain">('+Q+K.domain+')</div> </div><div style="clear:both;"></div>'+infobottom+"</div>"}}}h.push(C)}if(b>4){l.promptEnableNSFW(b)}e(h.join("")+r)})})})})})}};column.prototype.promptEnableNSFW=function(b){var a=this;storageWrapper.prototype.fetch("hasShownNSFWEnable",function(c){if(c!="y"){storageWrapper.prototype.save("hasShownNSFWEnable","y");confirmFancy(b+" NSFW items were found in "+a.title+", enable NSFW mode? ",function(d){if(d){a.NSFW=true;connection.setting("NSFW",true);setTimeout(function(){a.refresh()},750)}})}})};column.prototype.switchSort=function(e,d){var c=this.postContainer=this.content.find("#PostContainer");this.individualColumn.addClass("loading");var a=(this.url.indexOf("subreddits_by")==-1)?true:false;if(typeof this.content=="undefined"){return}this.activePosts={};var b=this;this.flags.SORT=e.type;if(d!=true){this.content.find(".Sorter").html(e.name)}clearTimeout(this.switchSortTimeout);this.switchSortTimeout=setTimeout(function(){b.bindings(false);b.refreshInterval(false);b.loading=true;b.yScrollPos=40;var f=b;b.fetchDataAfter(null,function(h,g){f.createPostBuffer(h,function(j){if(h.length>0&&a){b.firstPost=h[0].data.name}var i="<div class=\"PostScroller\"> 									<div id='searchElements'> 										<input type=\"text\" placeholder='Type to filter' id='search'> 										<div id='removeContents' class='icon deleteTextInput'></div> 									</div> 									"+j+" 								  </div>";setTimeout(function(){c.html(i);b.postContainer.scrollTop(40);var k=b.postScroller=c.find(".PostScroller");b.searchElements=k.find("#searchElements input");if(c.height()>k.height()){c.find(".LoadingPost").remove()}c.find(".PostScroller").addClass("loaded");b.individualColumn.removeClass("loading");setTimeout(function(){if(window.isChromePackaged){f.loadThumbnails()}},0)},1000);f.bindings(true);f.loading=false;if(f.refreshTime!=0){f.refreshInterval(true)}},(typeof g=="undefined"?true:g))});if(d!=true){b.tabManagerObj.setSort(b.id,e.type)}},1000);analytics().track("Interaction","Switched column sort")};column.prototype.refresh=function(){if(this.running){this.switchSort({name:locale[this.flags.SORT],type:this.flags.SORT},true)}analytics().track("Interaction","Refreshed Columns")};column.prototype.openGallery=function(c,a){c=c||"default";var b=new gallery(this,c,a);analytics().track("Interaction","Opened Gallery")};column.prototype.hidePost=function(c){var a=this.connection;var b=c.attr("data-name");c.fadeOut(300);a.hidepost(b);analytics().track("Interaction","Hid Post")};column.prototype.upVote=function(d,g){var a=this.connection;var f=$('[data-postid="'+g+'"] .downVote');var e=$('[data-postid="'+g+'"] .Score');d=$('[data-postid="'+g+'"] .upVote');var b=d.parent();if(!d.first().hasClass("Likes")){analytics().track("Interaction","Upvoted");d.addClass("Likes");var c=(f.first().hasClass("DisLikes")?2:1);f.removeClass("DisLikes");e.text(parseInt(e.first().text())+c);a.upvote(b.parent().attr("data-postid"))}else{d.removeClass("Likes");f.removeClass("DisLikes");analytics().track("Interaction","Unvoted");e.text(parseInt(e.first().text())-1);a.removevote(b.parent().attr("data-postid"))}};column.prototype.downVote=function(d,g){var a=this.connection;var f=$('[data-postid="'+g+'"] .upVote');var e=$('[data-postid="'+g+'"] .Score');d=$('[data-postid="'+g+'"] .downVote');var b=d.parent();var b=d.parent();if(!d.first().hasClass("DisLikes")){d.addClass("DisLikes");analytics().track("Interaction","Downvoted");var c=(f.first().hasClass("Likes")?-2:-1);f.removeClass("Likes");e.text(parseInt(e.first().text())+c);a.downvote(b.parent().attr("data-postid"))}else{d.removeClass("DisLikes");f.removeClass("Likes");e.text(parseInt(e.first().text())+1);a.removevote(b.parent().attr("data-postid"));analytics().track("Interaction","Unvoted")}};column.prototype.removeAd=function(){if(this.thisColumnContainsAd){window.COLUMN_HAS_AD=false;this.postScroller.find(".Post.ad").remove();this.thisColumnContainsAd=false}};column.prototype.insertAd=function(b,c){if((!window.COLUMN_HAS_AD||c)&&this.shouldIncludeAd&&Date.now()/1000>window.noAdsUntil){window.COLUMN_HAS_AD=this;this.thisColumnContainsAd=true;var a=this;getFusionAd(function(e){var g=window.isChromePackaged?'data-thumb="'+e.image_address+'"':'src="'+e.image_address+'"';var d=$('<div data-ad="true" class="Post ad" data-href="'+e.banner_link+'"> 								 <div class="Title ad"><img class="Thumb ad" '+g+'">'+e.banner_text+'</div> <div style="clear:both;"></div> 								 <div class="InfoBottom">Powered by Fusion <span class="removeAds">Remove Ads</span></div></div>');function f(j,h){var i=h.postContainer.find("#searchElements").first();if(i.length!=0){$("body").find(".Post.ad").remove();i.after(j);if(window.isChromePackaged){h.loadThumbnails()}}else{setTimeout(function(){f(j,h)},500)}}f(d,a)})}};column.prototype.createColumnLayout=function(){if(!this.content){this.content=$("<div id='"+this.id+"' class='Column canscroll'> 			     <div class='individualColumn loading'>"+((this.flags.SORT!=false)?"<div class='Sorter'>"+locale[this.flags.SORT]+"</div>":"")+"<div class='ColumnTitle'> 				    	<span class='columnOptions icon settings'></span> 				    	<div class='title'>"+this.title+"</div> 				     </div> 					 <div class='subredditOptions'></div> 					 <div id='PostContainer'> 						<div class='PostScroller'> 						</div> 					 </div> 			 	  </div> 			  </div>");this.postContainer=this.content.find("#PostContainer");this.postScroller=this.content.find(".PostScroller");this.individualColumn=this.content.find(".individualColumn");if(typeof this.selector!="undefined"){this.selector.html(this.content)}}};column.prototype.startup=function(d){var c=this;if(this.running){return}if(!this.content){this.createColumnLayout()}else{this.individualColumn.addClass("loading")}this.running=true;this.loading=true;var b=window.volatileUserCacheData[this.id];if(typeof b!="undefined"&&d!=true&&typeof this.selector!="undefined"){setTimeout(function(){c.individualColumn.removeClass("loading");c.postScroller=c.content.find(".PostScroller");c.postScroller.html(b.content);c.searchElements=c.postScroller.find("#searchElements input");if(typeof c.flags.highlight!="undefined"){c.content.find(".current").removeClass("current");c.content.find("#"+c.flags.highlight).addClass("current")}c.postContainer=c.content.find("#PostContainer");c.postContainer.scrollTop(b.yScrollPos);c.insertAd()},500);this.activePosts=b.activePosts;this.url=b.url;this.title=b.title;this.count=b.count;this.yScrollPos=b.yScrollPos;this.pagesActive=b.pagesActive;this.refreshTime=b.refreshTime;this.armBindings();this.loading=false;window.COLUMNS_STARTED[this.id]=this;return this}this.activePosts={};var g=false;var h=this.individualColumn;var f=setTimeout(function(){h.append('<div id="notResponding">Reddit.com isn\'t responding, <a>try again</a>.</div> <div id="deleteNotResponding">(Or <a>click here</a> to delete this column)</div>');c.notResponding=true;h.find("#notResponding a").one("click",function(){$(this).parent().remove();h.find("#deleteNotResponding").remove();g=true;delete window.volatileUserCacheData[c.id];c.running=false;c.startup()});h.find("#deleteNotResponding a").click("click",function(){c.removeColumn()});analytics().track("Issues","Column didn't load: "+c.url)},10000);var a=c.flags.startAt?c.flags.startAt:null;c.fetchDataAfter(a,function e(j,i){if(a!=null&&j.length==0){a=null;return c.fetchDataAfter(a,e)}if(c.notResponding){delete c.notResponding;h.find("#deleteNotResponding, #notResponding").remove()}if(g){return}clearTimeout(f);window.COLUMNS_STARTED[c.id]=c;if(j.length>0&&c.url.indexOf("subreddits_by")==-1){c.firstPost=j[0].data.name;c.subreddit_id=j[0].data.subreddit_id}c.createPostBuffer(j,function(k){h.removeClass("loading");c.postScroller.html("<div id='searchElements'> 											<input type='text' placeholder='Type to filter' id='search'> 											<div id='removeContents' class='icon deleteTextInput'></div> 										</div>"+k);c.searchElements=c.postContainer.find("#searchElements input");c.insertAd();setTimeout(function(){c.postContainer.scrollTop(40)},0);if(c.postContainer.height()>c.postScroller.height()){c.postContainer.find(".LoadingPost").remove()}if(typeof c.loaded=="function"){c.loaded()}if(window.isChromePackaged){c.loadThumbnails()}if(typeof c.selector!="undefined"){c.armBindings()}setTimeout(function(){c.loading=false},500)},(typeof i=="undefined"?true:i))});return this};column.prototype.loadThumbnails=function(){this.selector.find("img.Thumb:not(.l)").each(function(){var a=$(this);getImageBlob(a.attr("data-thumb"),function(b){a.attr("src",b);a.addClass("l")})})};column.prototype.shutdown=function(d,e,c){if(typeof d=="undefined"){d=true}else{if(typeof d=="function"){e=d;d=true}}if(!this.running){return}this.running=false;if(!c){this.removeAd()}delete window.COLUMNS_STARTED[this.id];if(!c){this.applyFilter("")}if(!c){this.bindings(false)}if(this.refreshTime!=0){this.refreshInterval(false)}var a=this.postScroller;if(!this.loading&&d&&!this.flags.TEMP&&a){var b=a.html();if(b&&b.length>200){window.volatileUserCacheData[this.id]={url:this.url,flags:this.flags,count:this.count,content:b,yScrollPos:this.yScrollPos,title:this.title,pagesActive:this.pagesActive,refreshTime:this.refreshTime,activePosts:this.activePosts}}}if(a&&!c){a.html("")}this.content.addClass("loading");if(typeof e=="function"){e()}};column.prototype.sideBar=function(){var a=this;if(typeof this.sidebarObject!="undefined"){this.sidebarObject.removeClass("loaded");var a=this;setTimeout(function(){a.sidebarObject.remove();a.sidebarObject=undefined;a.content.find("#PostContainer").show()},500);return}this.content.find("#PostContainer").hide();var b=this.sidebarObject=$('<div class="sidebar"> <div class="loadingcss"></div> </div>').appendTo(this.content.find(".individualColumn"));setTimeout(function(){b.addClass("loaded")},1);this.connection.sidebar(a.title,function(c){b.html(c);b.on("click.postview"+a.id,"a[data-ignore!=true]",function(d){d.preventDefault();d.stopPropagation();redditpost.prototype.clickLink.call(a,$(this).attr("href"),d)})})};column.prototype.hide=function(){this.selector.hide()};column.prototype.show=function(){this.selector.show()};column.prototype.remove=function(){this.shutdown();delete window.volatileUserCacheData[this.id];var a=this;setTimeout(function(){a.content.remove()},100)};column.prototype.toggleAddDeleteColumn=function(b,a){if(!this.tabManagerObj.isPermanentColumn(b)){this.tabManagerObj.makePermanent(b);return}this.removeColumn()};column.prototype.removeColumn=function(b){var a=this;$.popup({title:"Are You Sure?",message:"Are you certain you wish to delete this column from Reditr?",buttons:'<button class="left" data-message="close"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Cancel+'</span></button> <button class="first" data-message="remove"><i class="icon-trash"></i><span>&nbsp;&nbsp;'+locale.Remove+'</span></button><button class="last green space right" data-message="unsubscribe"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Remove_and_Unsubscribe+"</span></button>"},function(c){if(c=="unsubscribe"){a.connection.unsubscribe(a.subreddit_id)}if(c!="close"){tabManagerObj.removeColumn(a.id)}if(typeof b=="callback"){b()}return"close"})};column.prototype.toggleSubscribe=function(b,a,c){if(a.issubscribed(b)){a.unsubscribe(b);c.html(locale.Subscribe_to+" Subreddit")}else{a.subscribe(b);c.html(locale.Unsubscribe_from+" Subreddit")}};column.prototype.openPost=function(b){analytics().track("Interaction","Opened a Post");$(".smartContentPopup").remove();if(typeof b.attr("data-ad")!=="undefined"&&b.attr("data-ad")!==false){popupBrowser(b.attr("data-href"));return}if(b.hasClass("isSubreddit")){var a=(b.attr("data-href")+"/").match(/\/r\/(.*?)\//).pop();new quickView(self.connection,capitalize(a),"/r/"+a+"/");return}window.armForEnter=b;this.markCurrent(b);var c=b.attr("data-permalink");var d=b.attr("data-postid");if(window.location.hash.indexOf("Stream")>-1){window.location.href="#/Stream/post/"+c.replace(/\//g,"~")+"/url/"+this.url.replace(/\//g,"~")}else{window.location.href="#/Home/post/"+d+"/permalink/"+c.replace(/\//g,"~")+"/column/"+this.id+"/title/"+this.title+"/url/"+this.url.replace(/\//g,"~")+"/sort/"+this.flags.SORT+"/highlight/"+b.attr("id")}};column.prototype.markVisited=function(a){if(a.hasClass("visited")){return}a.addClass("visited");a.append('<div class="visited-marker icon-eye-open"></div>')};column.prototype.markCurrent=function(a){this.markVisited(a);$(".Post.current").removeClass("current");a.addClass("current")};column.prototype.initializeUpdateScoresLoop=function(d,b){if(b){this.pagesActive.push(d)}var c=this;var a=this.connection;c.updateIntervalPages.push(setInterval(function(){c.fetchDataAfter(d,function(g){for(var f in g){var e=g[f].data;if(!e){continue}a.getLocalStorageCache(e.name,function(i){var h=c.postContainer.find("#"+e.id);h.find(".Score").text(g[f].data.score);if(i.num_comments=="reload"){i.num_comments=e.num_comments;self.connection.updateLocalStorageCache(e.name,i,6)}else{if(typeof i.num_comments!="undefined"&&e.num_comments>i.num_comments){h.find("#commentInfo").html(" - "+e.num_comments+' comments <span id="newComments">('+(e.num_comments-i.num_comments)+")</span>")}}})}})},60000))};column.prototype.prependNewPosts=function(){var b=this;var c=this.firstPost;var a=[];this.fetchDataAfter(null,function(h){var f=b.activePosts;var e=h.length;for(var g=0;g<e;g++){var j=h[g].data.name;if(j==c){break}if(f[j]){continue}a.push(h[g])}if(a.length>0){b.firstPost=h[0].data.name;var d=b.postContainer.scrollTop();b.createPostBuffer(a,function(k){if(d>40){var l=$("<div>"+k+"</div>").insertAfter(b.searchElements.parent());var m=parseInt(l.outerHeight());l.replaceWith(k);b.postContainer.scrollTop(d+m);if(window.isChromePackaged){b.loadThumbnails()}}else{var l=$('<div class="dynamicNewPosts noOpacity" style="position: absolute; top: -1000px">'+k+"</div>").insertAfter(b.searchElements.parent());var i=l.height();l.css({position:"static",height:"0px"});l.animate({height:i},250,function(){l.css("height","auto")});setTimeout(function(){l.replaceWith(k);if(window.isChromePackaged){b.loadThumbnails()}},600)}b.applyFilter(b.currentFilterText)},false)}b.count+=a.length;if(b.count>74){b.content.addClass("noAnimate")}},(b.title=="Subscribed")?true:false)};column.prototype.refreshInterval=function(b){if(b==false){this.refreshIntervalRunning=false;clearInterval(this.refreshIntervalId);return}if(this.refreshTime>30000&&this.url=="/"&&this.flags.SORT=="new"){this.refreshTime=30000}else{if(this.refreshTime>180000&&this.flags.SORT=="new"){this.refreshTime=180000}}this.refreshIntervalRunning=true;var a=this;clearInterval(this.refreshIntervalId);this.refreshIntervalId=setInterval(function(){a.prependNewPosts.call(a)},this.refreshTime)};column.prototype.widthChanger=function(a){if(a.find("input").length!=0){return}var c=this;var d=a.find("#width");d.hide();var b=$('<input class="widthSettingInput" value="'+d.html()+'">').insertAfter(d).focus().select();b.on("keypress",function(e){var h=e||window.event;var f=h.keyCode||h.which;f=String.fromCharCode(f);var g=/[0-9]|\./;if(!g.test(f)){h.returnValue=false;if(h.preventDefault){h.preventDefault()}}});b.bind("keydown",function(f){f.stopPropagation();if(event.keyCode==13){c.width=parseInt($(this).val());if(c.width>$(document).width()-140){c.width=$(document).width()-140}if(c.width<100){c.width=100}c.tabManagerObj.resizeColumn(c.id,c.width)}})};column.prototype.applyFilter=function(b){var a=this;this.filterTimeout=setTimeout(function(){if(b==""&&a.currentFilterText==""){return}a.currentFilterText=b;content=a.content;if(b.length==0){content.find(".Post").show();content.find("#searchElements #removeContents").hide();return}content.find("#searchElements #removeContents").show();var c=content.find(".Post");c.show();setTimeout(function(){c.filter(':not(:icontains("'+b+'"))').hide()},250);analytics().track("Interaction","Used Column Filter")},250)};column.prototype.setTitle=function(c,b){if(typeof c!="function"&&typeof c!="undefined"){if(this.tabManagerObj){this.tabManagerObj.setTitle(this.id,c,b)}this.title=c;this.selector.find(".ColumnTitle .title").html(c);return}var a=this;promptFancy("Enter a new title for this column",function(d){if(!d){if(typeof c=="function"){c(false)}return}d=d.replace(/<(.*?)>/g,"").trim();a.setTitle(d,b);if(typeof c=="function"){c(true)}analytics().track("Interaction","Set a title for a Column")},"text",a.title)};column.prototype.manageSubreddits=function(d,g){var c=reddit();var h=this;if(!d){var f=("/"+this.url).indexOf("/r/");var d=(f!=-1)?this.url.substring(f+2):this.url;if(d.charAt(d.length-1)=="/"){d=d.substring(0,d.length-1)}}var i='<div id="addSubreddit"></div>';var e='<button class="left" data-message="close"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Close+'</span></button> <button id="saveButton" class="green" data-message="save"><span><i class="icon-ok"></i>&nbsp;&nbsp;'+locale.Save+"</span></button>";var b=null;var a=$.popup({id:"manageSubreddits",title:"Manage Subreddits",message:i,buttons:e},function(k,j){if(k=="save"){b.subreddits(function(m){if(typeof g=="function"){g(m);k="close";return"close"}if(m.length>0){var p=capitalize(m).join(", ");var l=("/r/"+m.join("+")+"/").toLowerCase();var o=l.replace(/\//g,"-");var n=h.tabManagerObj.setUrl(h.id,l,false);if(!n){alert("You already have a column with these subreddits.");return}else{h.url=l;h.id=o;h.subreddit=m.join("+");h.setTitle(p);h.refresh();k="close"}}})}return k});b=new subredditSelector(c,a.find("#addSubreddit"),d.split("+"),function(j){if(j.length>0){a.find("#saveButton").show()}else{a.find("#saveButton").hide()}})};function redditpost(f,e,b,d,a){if(a instanceof column){a.loaded=function(){a.markCurrent($('[data-postid="'+f+'"]'))}}var c=this;this.id=redditpost.prototype.incriment++;this.permalink=e;this.columnObject=a;this.subreddit=a instanceof column?a.subreddit:e.match(/\/r\/(.*?)\//).pop();this.columnURL="/r/"+this.subreddit+"/";this.selector=b;this.connection=d;this.postid=f;this.name="t3_"+f;this.selector=b;this.storedComments={};this.storedTagBuffers={};d.setting("enableFlair",function(g){if(g&&!window.forceFlairOff){d.buildFlairCSS(c.subreddit)}});d.userVariable("commentSortType",function(g){c.sort=(typeof g=="undefined")?"hot":g});this.connection.getLocalStorageCache(this.name,function(i){c.lastViewed=(typeof i.lastViewed=="undefined")?9999990037210:i.lastViewed;var h=Date.now();i.lastViewed=Math.floor(h/1000);c.storage=i;c.connection.updateLocalStorageCache(c.name,i,6);var g=c.getPostURL=(e.indexOf(".json")==-1)?e+".json?sort="+c.sort:e;d.getpost(f,g,function(j){c.drawHeader.call(c,j)},function(j){c.drawComments.call(c,j)})});return this}redditpost.prototype.incriment=1;redditpost.prototype.replyBar=undefined;redditpost.prototype.deconstructor=function(){this.bindings(false)};redditpost.prototype.bindings=function(c){var f=this.id;var m=this;var d=this.selector;var b=this.connection;if(!c){clearInterval(redditpost.prototype.politicsInterval);$(window).unbind(".postview"+f);d.off(".postview"+f);$("body").off(".postview"+f);if(typeof this.replyBar!="undefined"){this.replyBar.close()}if(this.sort=="new"&&this.refreshTime!=0){this.refreshInterval(false)}return}clearInterval(redditpost.prototype.politicsInterval);redditpost.prototype.politicsInterval=setInterval(function(){b.getpost(m.postid,m.getPostURL,function(n){$(".politics .upbutton .count").html(n.ups);$(".politics .downbutton .count").html(n.downs)})},60000);var l;d.on("mouseenter.postview"+f,".Comment",function(n){var o=$(this);o.addClass("highlighted");o.parent().removeClass("highlighted");clearTimeout(l);l=setTimeout(function(){var p=d.find(".highlighted").last();d.find(".highlighted").removeClass("highlighted");p.addClass("highlighted");m.showCommentTools(o)},100)}).on("mouseleave.postview"+f,".Comment",function(n){var o=$(this);o.removeClass("highlighted");o.find(".highlighted").removeClass("highlighted");o.parent().addClass("highlighted")});d.on("click.postview"+f,".Comment",function(o){var n=this;m.connection.setting("clicking_comments_slides_to_them",function(p){if(p&&o.target.className.indexOf("Comment")>-1){m.scrollToComment.call(m,$(n));o.stopPropagation()}})});d.on("click.postview"+f,"#navigateBy",function(n){m.navigateByInvoke(true);d.find("#CommentContent").addClass("navigateBy")});d.on("click.postview"+f,"#scrollToTop",function(n){m.selector.animate({scrollTop:"0px"})});d.on("click.postview"+f,"#navigateDone",function(n){m.navigateByInvoke(false);d.find("#CommentContent").removeClass("navigateBy")});d.on("click.postview"+f,"#navigateNext",function(n){m.navigateBySwitch("next",m.navigateBy.type)});d.on("click.postview"+f,"#navigatePrev",function(n){m.navigateBySwitch("prev",m.navigateBy.type)});d.on("click.postview"+f,".setNavigateType",function(o){var p=$(this);d.find(".commentButton.selected").removeClass("selected");p.addClass("selected");var n=p.attr("type");m.navigateBySwitch("next",n)});d.on("click.postview"+f,".setNavigateTypeUser",function(n){m.navigateBySelectUser($(this))});d.on("click.postview"+f,"#navigateByIterator",function(o){var n=m.navigateBy.type;m.navigateByInput($(this).find("#inputContainer"),parseInt($(this).find("#maxCount").text()),n)});d.on("click.postview"+f,".setNavigateTypeSearch",function(n){promptFancy("Type something to search for",function(o){if(!o){return}m.navigateBySearch=o;m.navigateBySwitch("next","Search")},"input",(typeof m.navigateBySearch=="undefined")?"":m.navigateBySearch)});d.on("click.postview"+f,".uTag",function(n){m.manageTags($(this).parent().parent().find(".Author").html(),$(this).html(),$(this).attr("id"));n.stopPropagation()});d.on("click.postview"+f,".Comment #addTag",function(n){m.manageTags($(this).parent().parent().find(".Author").html());n.stopPropagation()});d.on("click.postview"+f,".showhideleft",function(n){m.toggleHideComments.call(m,$(this).parent().attr("id"));n.stopPropagation()});d.on("click.postview"+f,".editPost",function(n){m.editPostPopup();n.stopPropagation()});d.on("click.postview"+f,".openSubreddit",function(n){m.clickLink("/r/"+m.subreddit,n);n.stopPropagation()});d.on("click.postview"+f,"a[data-ignore!=true]",function(n){m.clickLink.call(m,$(this).attr("href"),n);n.stopPropagation()});d.on("click.postview"+f,".CommentPermalinkContainer",function(n){m.copyLink($(this).parent().parent().attr("id").split("_").pop());n.stopPropagation()});d.on("click.postview"+f,".CommentPermalinkVisitContainer",function(n){m.visitPermalink($(this).parent().parent().attr("id").split("_").pop());n.stopPropagation()});d.on("click.postview"+f,".CommentSourceContainer",function(n){m.viewSource($(this).parent().parent().attr("id").split("_").pop());n.stopPropagation()});d.on("click.postview"+f,"#commentSort",function(n){m.sortCommentsDropdown.call(m,$(this),n);n.stopPropagation()});d.on("click.postview"+f,".postbutton.more",function(n){m.loadMoreComments.call(m,$(this),n);n.stopPropagation()});d.on("click.postview"+f,".Author",function(n){m.openUserInfo($(this).text());n.stopPropagation()});d.on("click.postview"+f,".copyLink",function(n){m.copyPostLink();n.stopPropagation()});d.on("click.postview"+f,".copyLinkUrl",function(n){m.copySiteLink();n.stopPropagation()});d.on("click.postview"+f,".visitLink, .actualTitle",function(n){m.visitPostLink();n.stopPropagation()});d.on("click.postview"+f,".openReddit",function(n){m.openReddit();n.stopPropagation()});d.on("click.postview"+f,"#reloadComments",function(){m.refreshComments()});d.on("click.postview"+f,".load-all-comments",function(){m.visitPermalink()});d.on("click.postview"+f,".load-context",function(){var n=Number(m.permalink.match(/context=(\d+)/).pop());var o=m.permalink.match(/\/post\/([a-z0-9]*)(\.|$)/)[1];m.visitPermalink(o,n+1)});d.on("click.postview"+f,"#reloadComments",function(){m.refreshComments()});d.on("click.postview"+f,"#loadAllComments",function(){$(".postbutton.more").click()});d.on("click.postview"+f,".subscribeToSubreddit",function(n){m.toggleSubscribe(n)});d.on("click.postview"+f,"#closePostView",function(){if(m.columnObject instanceof column){window.location="#/Home/page/"+tabManagerObj.currentPage}else{var n=betterHistory.lastPageContaining(/(Home|Stream)/,/post/);if(!n){storageWrapper.prototype.fetch("mainPage",function(o){window.location="#/"+o})}else{window.location=n}}});d.on("click.postview"+f,".savePost",function(){m.savePost($(this))});d.on("click.postview"+f,".removePost",function(){m.removePost($(this))});d.on("click.postview"+f,".reportPost",function(){m.reportPost($(this))});d.on("click.postview"+f,".openProfile",function(){m.openUserInfo(m.author)});d.on("click.postview"+f,".deletePost",function(){m.deletePost($(this))});d.on("click.postview"+f,".galleryFromPost",function(){m.columnObject.openGallery("fromPost",m.columnObject.selector.find(".Post.current"))});if(DESKTOP){d.on("click.postview"+f,"a",function(n){if(n.button==1){n.preventDefault();$(this).trigger("click")}})}d.on("click.postview"+f,".moreOptions",function(o){o.preventDefault();o.stopPropagation();var n=$.Event("contextmenu");n.pageX=$(this).offset().left;n.pageY=$(this).offset().top+$(this).outerHeight()-1;d.trigger(n)});d.on("click.postview"+f,".contentPreview img, .inlineContentArea img",function(){var o=$(this);var n=o.attr("data-url");imageZoom(n?n:o.attr("src"),o.attr("data-title"),parseInt(o.attr("data-key")),m.articleImageArray,m.articleCaptionArray,m.articlePreviewArray)});d.on("click.postview",".inlineViewHandle",function(n){n.stopPropagation();m.inlineView($(this))});var e=$("#header_container").height();var g=d.find(".commentsStickPlaceholder");var i=d.find(".commentsStick");var a=i[0];var k=false;var h;d.scroll(function(n){if(g.offset().top<e){if(!k){k=true;i.addClass("stick");g.addClass("stick")}}else{if(k){k=false;i.removeClass("stick");g.removeClass("stick")}}});$(window).bind("resize.postview"+f,function(){m.resize.call(m)});d.on("click.postview"+f,".CommentSaveContainer",function(o){o.stopPropagation();var n=$(this);m.saveComment(n.parent().parent().attr("id").split("_").pop(),n.find(".icon"),n)});d.on("mouseover.postview"+f,'a:not([href="/spoiler"], [href="/c"], [href="/s"])',function(n){smartContentPopup($(this))}).on("mouseleave.postview"+f,'a:not([href="/spoiler"], [href="/c"], [href="/s"])',function(n){smartContentPopupPrevent($(this))});d.on("contextmenu.postview"+f,function(n){m.openPostContextMenu(n)});d.on("contextmenu.postview"+f,"a",function(n){n.stopPropagation()});if(b.loggedin){d.on("click.postview"+f,".ups, .downs",function(){m.upvotePost.call(m,$(this))});d.on("click.postview"+f,".upVote, .downVote",function(n){m.upvoteComment.call(m,$(this));n.stopPropagation()});d.on("click.postview"+f,".reportContainer",function(n){m.reportComment.call(m,$(this).parent().parent().attr("id"),n);n.stopPropagation()});d.on("click.postview"+f,".deleteContainer",function(n){m.deleteComment.call(m,$(this).parent().parent().attr("id"),n);n.stopPropagation()});var j=function(){m.createReplyBar("Post",m.name,"","post")};d.on("click.postview"+f,"#replyGlobal",j);d.on("click.postview"+f,".replyContainerButton, .editContainerButton",function(r){r.stopPropagation();var o=$(this).parent().parent().attr("id");var n=$(this).parent().parent().find(".Author").html();var q=($(this).hasClass("editContainerButton"))?"edit":"comment";var p=(q=="edit")?m.storedComments[o]:"";m.createReplyBar(n,o,p,q)})}};redditpost.prototype.toggleSubscribe=function(b){var a=this;reddit().subredditAbout(this.subreddit,function(c){reddit().issubscribed(c.name,function(d){var e=a.selector.find(".subscribeToSubreddit");if(d){reddit().unsubscribe(c.name);e.html(e.html().replace("Unsubscribe","Subscribe"))}else{reddit().subscribe(c.name);e.html(e.html().replace("Subscribe","Unsubscribe"))}})})};redditpost.prototype.openPostContextMenu=function(f){var i=this;var d=infoHandler(i.url,false)?"<li data-message='save' id='save'><i class='icon-save'></i><span>Save Image As...</span></li>":"";var g="";var h=infoHandler(i.url,false)?"<li data-message='gallery' id='gallery'><i class='icon-picture'></i><span>"+locale.View_in_Gallery+"</span></li>":"";var b=window.getSelection().toString();var c=(b!="")?"<li data-message='copyText' id='copyText'><i class='icon-copy'></i><span>Copy</span></li><div class='contextSeparator'></div>":"";var k=(b!="")?"<li data-message='search' id='search'><i class='icon-search'></i><span>Search Google for '"+b+"'</span></li><div class='contextSeparator'></div>":"";var j=c+k+"<li data-message='open' id='open'><i class='icon-eye-open'></i><span>Open Link in New Window</span></li> 			       <li data-message='openComments' id='open'><i class='icon-eye-open'></i><span>Open Comments in New Window</span></li>"+d+"<li data-message='copyLink' data-clipboard-text='"+i.url.replace(".json","")+"' id='copyLink'><i class='icon-copy'></i><span>Copy Link URL</span></li> 				   <li data-message='copyReddit' data-clipboard-text='http://reddit6.com"+i.permalink+"#oo' id='copyReddit'><i class='icon-copy'></i><span>Copy Reddit URL</span></li> 				   <div class='contextSeparator'></div> 				   <li data-message='openProfile'><i class='icon-user'></i><span>"+i.author+"'s Profile</span></li> 				   <li data-message='report' id='report'><i class='icon-flag'></i><span>Report Post</span></li>"+h+"<div class='contextSeparator'></div> 				   <li data-message='facebook' id='fb'><i class='icon-facebook-sign'></i><span>Share with Facebook</span></li> 				   <li data-message='twitter' id='twitter'><i class='icon-twitter-sign'></i><span>Share with Twitter</span></li> 				   <li data-message='google' id='google'><i class='icon-google-plus-sign'></i><span>Share with Google+</span></li>";var a=$.contextMenu(j,f,function(o,n){if(o=="facebook"){var m="537294919626568";var q=i.title;var l="https://www.facebook.com/dialog/feed?app_id="+m+"&link=http://reddit6.com/"+i.postid+"&name="+q+"&redirect_uri=http://reditr.com/fb.html";popupBrowser(l,"facebook")}else{if(o=="twitter"){var e="Reditr";var p=i.title;var l="https://twitter.com/intent/tweet?url=http://reddit6.com/"+i.postid+"&via="+e+"&text="+p+"&hashtags=reddit";popupBrowser(l,"twitter","popup")}else{if(o=="google"){var l="https://plus.google.com/share?url=http://reddit6.com/"+i.postid;popupBrowser(l,"google","popup")}else{if(o=="open"){popupBrowser(i.url.replace(".json","")+((i.url.indexOf("reddit.com")!=-1)?"#oo":""))}else{if(o=="openComments"){popupBrowser("http://reddit.com"+i.permalink.replace(/\.jsonp|\.json/,"")+"#oo")}else{if(o=="save"){downloadImage(i.url)}else{if(o=="copyLink"){clipboard_set(i.url.replace(".json",""))}else{if(o=="copyReddit"){clipboard_set("http://reddit6.com"+i.permalink)}else{if(o=="Save"){i.connection.user.savedPosts[i.name]=true;i.connection.savePost(i.name)}else{if(o=="Un_Save"){i.connection.user.savedPosts[i.name]=false;i.connection.unsavePost(i.name)}else{if(o=="report"){confirmFancy("Are you sure?",function(r){if(r){i.connection.report(i.name)}})}else{if(o=="gallery"){i.columnObject.openGallery("fromPost",i.columnObject.selector.find(".Post.current"))}else{if(o=="openProfile"){i.openUserInfo(i.author)}else{if(o=="copyText"){clipboard_set(b)}else{if(o=="search"){popupBrowser("https://www.google.ca/search?q="+b)}}}}}}}}}}}}}}}});if(window.clipboard_set_flash){clipboard_set_flash(a.find("#copyLink")[0]);clipboard_set_flash(a.find("#copyText").attr("data-clipboard-text",b)[0]);clipboard_set_flash(a.find("#copyReddit")[0])}};redditpost.prototype.openUserInfo=function(b){var a=new userInfo(b,this.connection,this.columnObject.tabManagerObj)};redditpost.prototype.inlineView=function(c){var d=c.prev("a");var b=d.attr("href");var a=c.next(".inlineContentArea");if(a.length==0){c.after('<div class="inlineContentArea"></div>').html('<i class="icon-spinner icon-spin"></i>');a=c.next(".inlineContentArea");infoHandler(b,function(f,g){c.html("-");if(f.indexOf("<center>")==0){a.html($(f).html())}else{a.html(f)}if(typeof g=="function"){var e=g(a)}},800,600)}else{c.html("+");a.remove()}};redditpost.prototype.createReplyBar=function(g,e,f,d){var c=this;var a=this.selector;var b=this.connection;b.setting("textPreviewsEnabled",function(h){if(d=="edit"){var i=false;i=new replyBar({},b,f,"Editing Comment","edit_"+e,function(j){this.loading(true);b.editPost(e,j,function(k,l){c.storedComments[e]=j;if(l=="error"){alert("Reddit rejected your edit, please reload Reditr and try again later.");i.loading(false);return}a.find("#"+e+" .commentBody").first().html(SnuOwnd.getParser().render(j));i.delay(1000).clearDraft();i.close();c.replyBar=undefined})},false,h);if(i){c.replyBar=i}}else{var i=false;i=new replyBar({},b,f,"Replying to "+g,"reply_"+e,function(j){this.loading(true);var k=this;b.comment(e,c.subreddit,j,function(p,l){if(!p||l!="SUCCESS"){if(l=="FREQUENCY"){alert("You must wait 5 minutes before posting again.")}else{if(l==403){alert('Reddit has returned a 403 forbidden error, stating: "you are not allowed to do that".')}}k.loading(false);return}var n="c";if(d=="comment"){n=(a.find("#"+e+".Comment").hasClass("c")?"cc":"c")}var o=document.createElement("textarea");o.innerHTML=SnuOwnd.getParser().render(j);var m=[];m[0]={data:{likes:true,author:b.user.username,name:p,id:p.replace("t1_",""),ups:1,downs:0,created_utc:Date.now()/1000,replies:null,body_html:o.innerHTML,body:j}};c.createCommentBuffer(m,n,function(q){c.storage.num_comments=++c.num_comments;c.connection.updateLocalStorageCache(c.name,c.storage,2);if(d=="post"){a.find("#CommentContent").prepend(q)}else{a.find("#"+e+".Comment").append(q)}c.loadDeletedComments();i.loading(false);i.delay(1000).clearDraft();i.close();c.replyBar=undefined})})},false,h);if(i){c.replyBar=i}}})};redditpost.prototype.drawHeader=function(n){if(typeof n.domain=="undefined"){n.domain="";n.url=""}var c=this.subreddit=n.subreddit;var q=this;var a=this.connection;if(n.domain.indexOf("self.")!=-1){this.selftext=n.selftext}var j=this.url=n.url;this.author=n.author;var k=this.authorLowercase=(typeof n.author=="undefined")?"":n.author.toLowerCase();this.num_comments=n.num_comments;var o=this.permalink.match(/r\/(.*?)\/comments\/(.*?)\/(.*?)\//);if(o){var b=this.columnObject;var l="~r~"+o[1]+"~comments~"+o[2]+"~"+o[3]+"~";if(b instanceof column){var h="#/Home/post/"+this.postid+"/highlight/"+this.postid+"/permalink/"+l+".json/column/"+b.id+"/title/"+b.title+"/url/"+b.url.replace(/\//g,"~")+"/sort/"+b.sort}else{var h="#/Stream/url/"+b.url.replace(/\//g,"~")+"/post/"+l}a.addHistory(n.title,h,j)}var e=this.likes=n.likes;var g=this.ups=n.ups;var p=this.downs=n.downs;var d=this.selector;var i=parseInt(n.created_utc);this.storage.num_comments=n.num_comments;a.updateLocalStorageCache(n.name,this.storage,2);this.title=n.title;if(typeof a.user.username=="undefined"){a.user.username=""}var f=(typeof n.author=="undefined")?"":a.user.username.toLowerCase();var m=k==f;q.comments=$(Handlebars.templates["postview.comments"]());d.append(q.comments);new Promise(function(s,r){a.setting("highlightNew",function(t){a.issubscribed(c,function(u,w,v){s([t,u])})})}).spread(function(r,t){d.prepend(Handlebars.templates.postview({logged_in:a.loggedin,subreddit:c,post:n,sort:q.sort,authorLowercase:k,locale:locale,vote:{up_button_class:(e)?"upsliked":"ups",down_button_class:(!e)?"downsliked":"downs",ups:g,downs:p},timestamp:i,timestamp_text:formatDate(i).shift(),buttons:{show_edit:m&&(n.domain.indexOf("self.")!=-1),show_mod:a.ismod("/r/"+c+"/"),show_browse_subreddit:!(c.toLowerCase()==q.columnObject.subreddit),show_subscribe:!t&&a.loggedin,show_gallery:infoHandler(j.toLowerCase(),false),save:{button_class:n.saved?"saved":"",text:n.saved?locale.Un_Save:locale.Save},copy_url:q.copyPostLink(true),highlight_new_text:r?"Don't Highlight":"Highlight New"}}));var s=d.find(".contentPreview");q.commentsHeader=d.find(".commentsHeader");if(window.clipboard_set_flash){clipboard_set_flash(d.find("#copyLink")[0])}d.find(".loadingcss").remove();infoHandler(j,function(u,v){s.html(u);if(typeof v=="function"){var w=v(s)}},d.width()-20,d.height()/2);q.bindings(true)})};redditpost.prototype.drawComments=function(c,b){var a=this;this.createCommentBuffer(c,undefined,function(e){var d="";if(a.permalink.search(/\/post\/([a-z0-9]{5,})(\.|$)/)!=-1){d='<div class="single-comment">                    <span class="load-context link">More Context</span>                    <span class="bullet">•</span>                    <span class="load-all-comments link">Load All Comments</span>                  </div>'}a.comments.html(d+e+'<div id="end"></div>');a.loadDeletedComments();a.connection.setting("load_all_comments_automatically",function(f){if(f){$(".postbutton.more").click()}})})};redditpost.prototype.createCommentBuffer=function(c,n,o,i){var b=this.connection;var q=this;var j=this.storage;var d=this.subreddit;var e=d.toLowerCase();var h=this.storedTagBuffers;var l=this.authorLowercase;var p;var m=this.lastViewed;var f=[];var k=b.ismod(this.columnURL);var g=b.user.username.toLowerCase();var a=(l==g&&typeof this.selftext!="undefined")?true:false;b.tags(function(r){b.setting("highlightNew",function(t){var s=t?"newComment ":"fakeNewComment ";function v(z,H,S,B){var Q=z.length;for(var P=0;P<Q;P++){if(i&&(P>1||B>1)){continue}if(z[P].kind=="more"){var G=z[P].data.children;G=G.join(",");f.push('<div data-children="'+G+'" class="postbutton more">'+z[P].data.count+" more comments</div>");continue}var N=z[P].data;var R=N.author.toLowerCase();if(N.author==null){N.author="[deleted]"}if(N.created_utc>m&&g!=R){var F=s;if(a&&N.parent_id.substr(0,2)=="t3"){b.markRead(N.name,function(){clearTimeout(p);p=setTimeout(function(){window.userNotifications.scan()},1000)})}else{if(S==g){b.markRead(N.name,function(){clearTimeout(p);p=setTimeout(function(){window.userNotifications.scan()},1000)})}}}else{var F=""}var O=(j[N.name+"_hidden"])?true:false;if(N.likes==true){var M="Likes"}else{if(N.likes==false){var M="DisLikes"}else{var M=""}}if(b.loggedin&&g==R){q.storedComments[N.name]=N.body}var D=parseInt(N.created_utc);var J=formatDate(D);var U=(N.author_flair_text!=null)?' - <span class="'+e+" flair flair-"+N.author_flair_css_class+'">'+N.author_flair_text+"</span>":"";var T="";if(typeof r[R]!="undefined"){if(typeof h[R]=="undefined"){var L=r[R];var E=L.length;for(var K=0;K<E;K++){T+='<div id="'+K+'" class="uTag" style="background-color: '+L[K].b+"; color: "+L[K].c+'">'+L[K].t+"</div>"}h[R]=T;if(l==R){q.selector.find(".headerStatistics ."+R+"userTagList").html(T);q.tookCareOfAuthorTags=true}}else{T=h[R]}}var I=(N.author=="[deleted]")?"deleted":"";var C=decode_html_entities(N.body_html);C=C.replace(/<a([^>]*?)\/([^>]*?)\/([^>]*?)>([^<]*?)<\/a>/gi,'<a$1/$2/$3>$4</a><span class="inlineViewHandle">+</span>');var A="";if(N.gilded>0){A="<span class='icon-star gilded' title='"+N.author+" was gilded "+N.gilded+" time(s)'></span>"}f.push('<div data-timeposted="'+D+'" class="user-'+R+" "+(N.author==q.author?"OP ":"")+F+"Comment "+H+(O?" hidden":"")+" "+I+'" id="'+N.name+'"> 									<div data-postid="'+N.id+'" class="Voting"><div class="upVote '+M+'"></div><div class="Score">'+(N.ups-N.downs)+'</div><div class="downVote '+M+'"></div></div> 									<div class="AuthorContainer"><span class="Author">'+N.author+'</span><span class="'+R+'userTagList">'+T+"</span>"+A+'<div class="icon tag" id="addTag"><div class="tagTip">Manage Tags</div></div></div>'+U+'<div class="commentBody">'+C+'</div><span class="commentPostedTime '+J[1]+'" data-timestamp="'+D+'">'+J[0]+'</span><div class="showhideleft"></div>');if(typeof N.replies=="object"&&N.replies!=null){v(N.replies.data.children,(H=="c"?"cc":"c"),N.author,B+1)}f.push("</div>")}}v(c,(typeof n=="undefined")?"c":n,undefined,0);if(q.tookCareOfAuthorTags!=true&&typeof r[l]!="undefined"){var u=r[l];var x=u.length;var y="";for(var w=0;w<x;w++){y+='<div id="'+w+'" class="uTag" style="background-color: '+u[w].b+"; color: "+u[w].c+'">'+u[w].t+"</div>"}h[l]=y;q.selector.find(".headerStatistics ."+l+"userTagList").html(y);q.tookCareOfAuthorTags=true}o(f.join(""))})})};redditpost.prototype.refreshIntervalRunning=false;redditpost.prototype.refreshTime=10000;redditpost.prototype.refreshInterval=function(b){if(b==false){this.refreshIntervalRunning=false;clearInterval(this.refreshIntervalId);return}this.refreshIntervalRunning=true;var a=this;this.refreshIntervalId=setInterval(function(){a.prependNewComments.call(a)},this.refreshTime)};redditpost.prototype.refreshComments=function(){var a=this;var b=this.permalink=this.permalink.match(/\/r\/(.*?)\/comments\/(.*?)\/(.*?)\//)[0].replace(/post\/(.*?).json/,"post.json");this.connection.getLocalStorageCache(a.name,function(d){a.lastViewed=(typeof d.lastViewed=="undefined")?9999990037210:d.lastViewed;var c=Date.now();d.lastViewed=Math.floor(c/1000);d.num_comments="reload";a.storage=d;a.connection.updateLocalStorageCache(a.name,d,2);$('[data-postid="'+a.postid+'"] #newComments').remove();a.comments.html('<div class="loadingcss icon-spin"></div>').addClass("loading");connection.getcomments(b,a.sort,function(g,f){if(g.length==0){a.comments.html("");return}a.commentsHeader.find(".posttitle").html(f.num_comments+" Comments");a.storedComments=g;a.firstPost=a.storedComments[0].data.name;a.drawComments.call(a,g,false)})})};redditpost.prototype.savePost=function(b){var a=this;if(!b.hasClass("saved")){b.addClass("saved");b.html('<i class="icon-save"></i>   '+locale.Un_Save+'<div id="inner"></div>');a.connection.savePost(a.name)}else{b.removeClass("saved");b.html('<i class="icon-save"></i>   '+locale.Save+'<div id="inner"></div>');a.connection.unsavePost(a.name)}};redditpost.prototype.removePost=function(b){var a=this;if(b.text()=="   "+locale.Remove){b.text("   "+locale.Click_to_confirm)}else{if(b.text()=="   "+locale.Click_to_confirm){b.text("   "+locale.Removed);a.connection.remove(a.postid,false,a.subreddit)}}};redditpost.prototype.deletePost=function(b){var a=this;if(b.text()=="   "+locale.Delete){b.text("   "+locale.Click_to_confirm)}else{if(b.text()=="   "+locale.Click_to_confirm){b.text("   "+locale.Deleted);a.connection.deletepost(a.postid,a.subreddit)}}};redditpost.prototype.reportPost=function(b){var a=this;if(b.text()=="   "+locale.Report){b.text("   "+locale.Click_to_confirm)}else{if(b.text()=="   "+locale.Click_to_confirm){b.text("   "+locale.Reported);a.connection.report(a.name)}}};redditpost.prototype.prependNewComments=function(){var b=this;var a=[];var c=b.firstPost;reddit().getcomments(b.permalink,b.sort,function(g){var e=b.storedComments;var d=g.length;for(var f=0;f<d;f++){var h=g[f].data.name;if(h==c){break}if(e[h]){continue}a.push(g[f])}if(a.length>0){b.firstPost=a[a.length-1];b.createCommentBuffer(a,undefined,function(j){var i=$("<div>"+j+"</div>").prependTo(b.comments);b.loadDeletedComments()})}})};redditpost.prototype.copyLink=function(b){var c=this.permalink.match(/r\/(.*?)\/comments\/(.*?)\/(.*?)\//);var a="http://reddit6.com/r/"+c[1]+"/comments/"+c[2]+"/"+c[3]+"/"+b+"?context=3";clipboard_set(a);return a};redditpost.prototype.copySiteLink=function(){var a=this.url;clipboard_set(a);return a};redditpost.prototype.copyPostLink=function(b){var a="http://reddit6.com"+this.permalink.replace(".json","");if(!b){clipboard_set(a)}return a};redditpost.prototype.editPostPopup=function(){var b=this;var e='<div class="incontainer"><textarea style="margin-bottom: -3px;" id="editPostContent">'+b.selftext+"</textarea></div>";var a;var g=false;var f=$.popup({translateX:-200,id:"editpost",title:"Edit Post",message:e,buttons:'<button class="left Button" id="close" data-message="close"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Close+'</span></button><div id="optionButtons" class="buttongroup"><button class="Button" data-message="submit"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Save+"</span></button></div>"},function(j){if(j=="submit"){if(g){return}g=true;var i=f.find('[data-message="submit"]');var h=i.html();i.html('<div class="icon-spin icon-spinner"></div>');b.selftext=a.val();reddit().editPost(b.name,b.selftext,function(k){if(k=="error"){alert("An error occured while editing this post.");i.html(h);g=false;return}b.selector.find(".infoDescription").html(k);f.closePopup()});j=""}return j});a=$("#editPostContent");a.autoHeight().css("max-height",parseInt($("body").height()-300)+"px").reditor();var c=new quickText({bindTo:$(".alert"),background:false,autoExpandHeight:true,letterCount:false,formattingOptions:false,initialContent:"<strong>Preview</strong><br>"});setTimeout(function(){c.contentHTML="<strong>Preview</strong><br>"+SnuOwnd.getParser().render(a[0].value)},200);a[0].addEventListener("keyup",function(){c.contentHTML="<strong>Preview</strong><br>"+SnuOwnd.getParser().render(a[0].value)});f.onPopupShow(function(){if(c&&a[0].value!=""){c.positionPopup();c.show()}});f.onPopupHide(function(){if(c){c.hide()}});f.on("click",".ButtonGroup a",function(){if(c){c.contentHTML="<strong>Preview</strong><br>"+SnuOwnd.getParser().render(a[0].value)}});var d=f.closePopup;f.closePopup=function(){if(c){c.close()}d.call(f)}};redditpost.prototype.visitPostLink=function(){popupBrowser(this.url.replace(".json",""))};redditpost.prototype.openReddit=function(){popupBrowser("http://reddit.com/"+this.permalink+"#oo")};redditpost.prototype.viewSource=function(a,b){var c=$.popup({title:"Loading...",message:"Loading..."},function(d){return d});this.connection.getSingleComment(this.permalink,a,function(d){c.find(".alertTitle").html(locale.You_are_viewing_the_source_of+" "+d.author+"'s "+locale.comment);c.find(".alertText").html('<textarea class="viewSource nomargins">'+d.body+"</textarea>");c.find(".alertText .viewSource").autoHeight()})};redditpost.prototype.visitPermalink=function(c,b){columnObject=this.columnObject;var e=this.permalink.match(/r\/(.*?)\/comments\/(.*?)\/(.*?)\//);var d="~r~"+e[1]+"~comments~"+e[2]+"~"+e[3]+"~";if(c){d+=c+".json"}if(b){d+="?context="+b}var a;if(window.location.hash.indexOf("Stream")>-1){a="#/Stream/url/"+window.location.hash.match(/\/url\/(.*?)(\/|$)/)[1]+"/post/"+d}else{a="#/Home/post/"+this.postid+"/permalink/"+d+"/column/"+columnObject.id+"/title/"+columnObject.title+"/url/"+columnObject.url.replace(/\//g,"~")+"/sort/"+columnObject.sort}window.location.href=a;if(typeof this.closeHook=="function"){this.closeHook()}};redditpost.prototype.saveComment=function(c,a,d){var b=this.connection;var f=this.permalink.match(/r\/(.*?)\/comments\/(.*?)\/(.*?)\//);var e="/r/"+f[1]+"/comments/"+f[2]+"/"+f[3]+"/"+c+".json";b.isCommentSaved(c,function(g){if(!g){b.saveComment(c,e);a.addClass("active");d.addClass("active")}else{b.unsaveComment(c);a.removeClass("active");d.removeClass("active")}})};redditpost.prototype.setColumn=function(a){this.columnObject=a};redditpost.prototype.upvotePost=function(a){var e=this.postid;var r=this.selector;var l=this.connection;if(a.hasClass("ups")){var t=true;var u=false;var q="upvote";var s="downbutton";var x="downsliked";var f="downs";var d="downVote";var i="DisLikes";var b=-1;var m=1;var o="ups";var y="upsliked";var v="upVote";var w="Likes";var g=1;var h=1}else{var t=false;var u=true;var q="downvote";var s="upbutton";var x="upsliked";var f="ups";var d="upVote";var i="Likes";var b=-1;var m=-1;var o="downs";var y="downsliked";var v="downVote";var w="DisLikes";var g=1;var h=-1}var k=this.likes;var n=$("body").find(".Post[data-postid="+e+"]").find(".Voting");var p=n.find(".Score");var c=parseInt((p.html()||"0").trim());if(k==u){var j=r.find("."+s);j.removeClass(x).addClass(f);j.find("span").html("&nbsp;&nbsp;"+(this[f]+=b));n.find("."+d).removeClass(i);p.html(c+=m)}a.removeClass(o).addClass(y);a.find("span").html("&nbsp;&nbsp;"+(this[o]+=g));n.find("."+v).addClass(w);p.html(c+=h);l[q](e);this.likes=t};redditpost.prototype.upvoteComment=function(h){var b=this.connection;var l=h.parent();var f=l.find(".Score");var i=parseInt(f.html());var a=l.attr("data-postid");if(h.hasClass("upVote")){var g="upvote";var e="upVote";var c="Likes";var m="DisLikes";var k="downVote";var d=1}else{var g="downvote";var e="downVote";var c="DisLikes";var m="Likes";var k="upVote";var d=-1}if(h.hasClass(e)&&h.hasClass(c)){b.removevote(a);h.removeClass(c);f.html(i-=d);return}var j=l.find("."+k);if(h.hasClass(c)){return}if(j.hasClass(m)){j.removeClass(m);f.html(i+=d)}h.addClass(c);f.html(i+=d);b[g](a)};redditpost.prototype.clickLink=function(c,g,i){g.preventDefault();if(c.indexOf("http")==-1){c="http://www.reddit.com"+c}if(c.search(/.(jpg|jpeg|bmp|gif|png)/i)!=-1){imageZoom(c)}else{if(c.search(/r\/(.*?)\/comments\/(.*?)\//)!=-1){var f=c.match(/r\/(.*?)\/comments\/(.*?)\//);var h=f[2];var d="~r~"+("/"+c).split("/r/").pop().replace(/\//g,"~");var b=(c+"/").match(/\/r\/(.*?)\//).pop();if(window.location.hash.indexOf("Stream")>-1){window.location.href="#/Stream/post/"+d+"/url/~r~"+b+"~.json"}else{window.location.href="#/Home/post/"+h+"/permalink/"+d+"/column/-r-"+b+"-/url/~r~"+b+"~/title/"+capitalize(b)+"/highlight/"+h}if(typeof this.closeHook=="function"){this.closeHook()}if(typeof i=="function"){i(true)}}else{if((typeof this.postid!="undefined"&&typeof this.permalink!="undefined")&&(c.search(/\/r\/(.*?)$/)!=-1||c.search(/\/r\/(.*?)\/$/)!=-1)){var b=(c+"/").match(/\/r\/(.*?)\/$/).pop();if(window.location.hash.indexOf("Stream")>-1){window.location.href="#/Stream/post/"+this.permalink.replace(/\//g,"~")+"/url/~r~"+b+"~.json"}else{window.location.href="#/Home/post/"+this.postid+"/permalink/"+this.permalink.replace(/\//g,"~")+"/column/-r-"+b+"-/url/~r~"+b+"~/title/"+capitalize(b)+"/highlight/"+h}if(typeof this.closeHook=="function"){this.closeHook()}if(typeof i=="function"){i(true)}}else{if(c.toLowerCase()=="/spoiler"){if(typeof i=="function"){i(false)}return}else{if(c.search(/\/r\/(.*?)\/$/)!=-1){var a=c.match(/\/r\/(.*?)\/$/);new quickView(this.connection,a[1],a[0],undefined,undefined)}else{popupBrowser(c);if(typeof i=="function"){i(false)}}}}}}};redditpost.prototype.sortCommentsDropdown=function(b,d){var a=this;var c=b.parent();var f=b.next("#commentSortTypes");f.css({top:b.position().top+b.height()+"px",left:(b.position().left-(f.outerWidth()-b.outerWidth()))+"px",display:"block"});f.find(".item").one("click",function(){var e=a.selector;var j=e.find("#commentSortTypes");var g=e.find("#commentSort");var i=$(this);var h=g.text();g.text(i.text());i.text(h);a.sort=g.text();a.connection.userVariable("commentSortType",a.sort);a.refreshInterval(false);a.comments.html('<div class="icon-spin loadingcss"></div>').addClass("loading");connection.getcomments(a.permalink,a.sort,function(k){a.storedComments=k;a.firstPost=a.storedComments[0].data.name;a.drawComments.call(a,k,false)});if(a.sort=="new"&&a.refreshTime!=0){a.refreshInterval(true)}});setTimeout(function(){$(document).one("click",function(g){f.find(".item").unbind("click");$("#commentSortTypes").hide()})},500)};redditpost.prototype.reportComment=function(a,b){confirmFancy(locale["Are_you_sure_you_want_to_report_this_comment?"],function(c){if(c){self.connection.report(a)}})};redditpost.prototype.deleteComment=function(b,d){var a=this;var c='<button class="right" data-message="true">'+locale.Yes+'</button> 				   <button class="left" data-message="close">'+locale.No+"</button>";$.popup({title:locale.Confirm_Delete_Comment,message:locale["Are_you_sure_you_want_to_delete_this_comment?"],buttons:c},function(e){if(e=="true"){a.connection.deletePost(b,a.subreddit);var f=$("#"+b);f.find(".Author").first().html("[deleted]");f.find(".md").first().html("[deleted]")}return"close"})};redditpost.prototype.loadDeletedComments=function(){var b=this.selector;var a=b.find(".Comment.user-\\[deleted\\]");var c=[];a.each(function(){this.classList.remove("user-[deleted]");c.push(this.id.split("_").pop())});if(c.length==0){return}$.getJSON("http://reditr.com:3010/deleted-comment?ids="+c.join(","),function(d){d.forEach(function(g){if(!g||!g.id||!g.author||!g.body){return}var e=b.find("#t1_"+g.id+".Comment");e.first().addClass(g.author);e.find(".Author").first().html(g.author);var f='<div class="md">'+SnuOwnd.getParser().render(g.body)+"</div>";e.find(".commentBody").first().html(f)})})};redditpost.prototype.loadMoreComments=function(c,g){var a=this;var d=c.parent();var b=c.text("Loading");var f=redditGetCache(this.postid,"name");if(!f){f="t1_"+this.postid}this.connection.morecomments(c.attr("data-children"),f,this.subreddit,c.parent().attr("id"),function(e){var h=(d.hasClass("c")?"cc":"c");a.createCommentBuffer(e,h,function(i){b.fadeOut(250,function(){c.remove();d.append($(i).fadeIn(500));a.loadDeletedComments()})})})};redditpost.prototype.resize=function(){};redditpost.prototype.toggleHideComments=function(e){var d=$("#"+e);var c=d.find(".toggleHideIcon");var a=false;var b=(this.storage[e+"_hidden"])?true:false;if(!b){c.removeClass("hide").addClass("show");d.addClass("hidden");a=true}else{c.removeClass("show").addClass("hide");d.removeClass("hidden")}if(!a){delete this.storage[e+"_hidden"]}else{this.storage[e+"_hidden"]=a}this.connection.updateLocalStorageCache(this.name,this.storage,2)};redditpost.prototype.scrollToComment=function(c,b){if(c.hasClass("current")&&!b){c.removeClass("current");return}var a=this.selector;a.find(".Comment.current").removeClass("current");c.addClass("current");var e=(a.height()-c.children(".md").height()-200)/2;var d=c.offset();if(typeof d!="undefined"){d=d.top;clearTimeout(this.scrollToCommentTimeout);this.scrollToCommentTimeout=setTimeout(function(){a.animate({scrollTop:(a.scrollTop()+d-132-e)+"px"})},50)}};redditpost.prototype.hoverOverTitle=function(a,b){if(b){a.scrollAmount=6}else{a.scrollAmount=0}};redditpost.prototype.showCommentTools=function(c){var a=this.connection;var b=a.ismod(this.columnURL);var e=c.find(".Author").html();var d=a.user.name;a.isCommentSaved(c.attr("id").split("_").pop(),function(h){var g=h?" active":"";var f='<div class="Options"> 					  	  '+(a.loggedin?'<div class="iconContainer replyContainerButton"> <div class="icon reply"></div> <a data-ignore="true" class="text Option CommentReply">'+locale.Reply+"</a> </div>":"");if(a.loggedin){f+='<div class="iconContainer reportContainer"> <div class="icon report"></div> <a data-ignore="true" class="text Option CommentReport">'+locale.Report+"</a> </div> 					  "+((b||d==e)?'<div class="iconContainer deleteContainer"> <div class="icon delete"></div> <a data-ignore="true" class="text Option CommentDelete">'+locale.Delete+"</a> </div>":"")+" 					  "+(e==d?'<div class="iconContainer editContainerButton"> <div class="icon edit"></div> <a data-ignore="true" class="text Option CommentEdit">'+locale.Edit_This+"</a> </div>":"")}f+='<div class="iconContainer CommentSourceContainer"> <div class="icon source"></div> <a data-ignore="true" class="text Option CommentSource">'+locale.Source+'</a> </div> 							  <div class="iconContainer CommentPermalinkContainer"> <div class="icon link"></div> <a data-ignore="true" class="text Option CommentPermalink">'+locale.Copy_URL+'</a> </div> 							  <div class="iconContainer CommentPermalinkVisitContainer"> <div class="icon globe"></div> <a data-ignore="true" class="text Option CommentPermalinkVisit">'+locale.Permalink+'</a> </div> 							  <div class="iconContainer CommentSaveContainer"> <div class="icon star'+g+'"></div> <a data-ignore="true" class="text Option CommentSave">'+(h?locale.Unsave_Comment:locale.Save_Comment)+"</a> </div> 					</div>";c.children(".Options").remove();c.append(f)})};redditpost.prototype.manageTags=function(g,e,f){var c=this;var d=g.toLowerCase();var b=reddit();var a=this.storedTagBuffer||{};b.tags(function(u){var i=(typeof f=="undefined")?"new":f;function t(y,v){var A=['<select id="listTags"><option value="new:#000000:#FFFFFF:">New Tag</option>'];if(typeof y!="undefined"){var w=y.length;for(var x=0;x<w;x++){var z=y[x].t;A.push("<option "+(v==z?"selected ":"")+'value="'+x+":"+y[x].c+":"+y[x].b+":"+z+'">'+z+"</option>")}}A.push("</select>");return A.join("")}var j=[["#FFFFFF","White"],["#C0C0C0","Silver"],["#808080","Gray"],["#000000","Black"],["#FF0000","Red"],["#800000","Maroon"],["#FFFF00","Yellow"],["#808000","Olive"],["#00FF00","Lime"],["#008000","Green"],["#00FFFF","Aqua"],["#008080","Teal"],["#0000FF","Blue"],["#000080","Navy"],["#FF00FF","Fuchsia"],["#800080","Purple"],["#FF6EC7","Pink"],["#FF5721","Orange"]];var k=j.length;function l(w,z,y){var v='<h3>Font Colour</h3> 						  <select id="fontColour">';for(var x=0;x<k;x++){v+="<option "+(j[x][0]==w?"selected ":"")+"value="+j[x][0]+">"+j[x][1]+"</option>"}v+="</select>";v+='<h3>Background Colour</h3> 					   <select id="backgroundColour">';for(var x=0;x<k;x++){v+="<option "+(j[x][0]==z?"selected ":"")+"value="+j[x][0]+">"+j[x][1]+"</option>"}v+="</select>";v+='<h3>Tag Text</h3> 					   <div class="incontainer"><input data-message="save" type="text" id="text" placeholder="Tag Message" value="'+y+'"></div> 					   <h3>Preview</h3> 					   <div id="TagPreviewContainer" style="color: '+w+"; background-color: "+z+'">'+y+"</div>";return v}var r='<button class="left" data-message="close">[suggestedCloseText]</button><button class="right space green" data-message="save">'+locale.Add+'</button><button style="display: none" class="right" data-message="delete"><i class="icon-trash"></i><span>&nbsp;&nbsp;'+locale.Remove+" Tag</span></button>";var n=(typeof f=="undefined")?l("#000000","#ffffff",""):l(u[d][f].c,u[d][f].b,u[d][f].t);var q,p,h,s,m;var o=$.popup({id:"tagManager",buttons:r,title:"Manage Tags For "+g,message:"<h3>Select Tag</h3>"+t(u[d],e)+'<div id="playground">'+n+"</div>"},function(E,A){if(E=="save"&&i=="new"){var x=o.find("#fontColour").val();var w=o.find("#backgroundColour").val();var D=o.find("#text").val().replace(/<(.*?)>/g,"");if(D==""){return}var y={c:x,b:w,t:D};if(typeof u[d]=="undefined"){u[d]=[]}u[d].push(y);b.tags(u);o.find("#text").val("");p.html("").css("color","black").css("background-color","white");h.replaceWith(t(u[d]));h=o.find("#listTags")}else{if(E=="save"){var x=o.find("#fontColour").val();var w=o.find("#backgroundColour").val();var D=o.find("#text").val().replace(/<(.*?)>/g,"");if(D==""){return}var y={c:x,b:w,t:D};u[d][i]=y;b.tags(u);h.replaceWith(t(u[d],D));h=o.find("#listTags")}else{if(E=="delete"){u[d].splice(i,1);if(u[d].length==0){delete u[d]}b.tags(u);if(typeof u[d]=="undefined"){u[d]=[]}h.replaceWith(t(u[d]));h=o.find("#listTags");o.find("#text").val("");p.html("").css("color","black").css("background-color","white");s.hide();m.html("Add")}}}if(typeof c.storedTagBuffers=="undefined"){c.storedTagBuffers=a={}}var B=u[d];if(typeof B!="undefined"){var v=B.length;var C="";for(var z=0;z<v;z++){C+='<div id="'+z+'" class="uTag" style="background-color: '+B[z].b+"; color: "+B[z].c+'">'+B[z].t+"</div>"}a[d]=C;$("."+d+"userTagList").html(C)}return E});q=o.find("#playground");p=o.find("#TagPreviewContainer");h=o.find("#listTags");s=o.find('button[data-message="delete"]');m=o.find('button[data-message="save"]');o.on("keyup.tagBinding","#text",function(){p.html($(this).val().replace(/<(.*?)>/g,""))});o.on("change.tagBinding","#fontColour",function(){p.css("color",$(this).val())});o.on("change.tagBinding","#backgroundColour",function(){p.css("background-color",$(this).val())});o.on("change.tagBinding","#listTags",function(){var v=$(this).val().split(":");i=v[0];q.html(l(v[1],v[2],v[3]));q=o.find("#playground");p=o.find("#TagPreviewContainer");h=o.find("#listTags");if(i!="new"){s.show();m.html('<i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Save+"</span>")}else{s.hide();m.html('<i class="icon-plus"></i><span>&nbsp;&nbsp;'+locale.Add+"</span>")}});if(typeof e!="undefined"&&typeof f!="undefined"){s.show();m.html('<i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Save+"</span>")}})};redditpost.prototype.toggleHighlightNewComments=function(a){connection.setting("highlightNew",function(b){if(b){connection.setting("highlightNew",false);a.html(locale.Highlight_New);$(".newComment").removeClass("newComment").addClass("fakeNewComment")}else{connection.setting("highlightNew",true);a.html(locale.Dont_Highlight);$(".fakeNewComment").removeClass("fakeNewComment").addClass("newComment")}})};redditpost.prototype.navigateByInvoke=function(c){var a=this.selector;if(c){if(typeof this.navigateBy=="undefined"){var b=(this.subreddit.toLowerCase()=="iama")?"Answered":"Hot";this.navigateBy={type:b,navigateByIterator:a.find("#navigateByIterator"),currentItemId:""};a.find('[type="'+b+'"]').addClass("selected");this.navigateBySwitch("next",b)}a.find("#navigateControls").show();a.find("#primaryControls").hide()}else{a.find("#navigateControls").hide();a.find("#primaryControls").show()}};redditpost.prototype.navigateByFetchSelectorMethod=function(h,c){var d=this.selector;var m=this;if(h=="DirectReplies"){c(function(){return d.find("#CommentContent > .Comment")})}else{if(h=="Me"){c(function(){return d.find(".Comment.user-"+this.connection.user.username.toLowerCase())})}else{if(h=="User"){c(function(){return d.find(m.navigateByUsernameSelector)})}else{if(h=="Submitter"){c(function(){return d.find(".Comment.OP")})}else{if(h=="Time"){var f={};var b=[];var l=0.001;d.find(".Comment").each(function(){var n=$(this);var o=parseInt(n.attr("data-timeposted"));if(typeof f[o]!="undefined"){o+=l;l+=0.001}var i=n.attr("id");f[o]=i;b.push(o)});b.sort(function(n,i){return i-n});var g=$();var a=b.length;for(var e=0;e<a;e++){g[e]=$("#"+f[b[e]])[0]}g.length=a;g.context=undefined;c(function(){return g})}else{if(h=="Hot"){var f={};var b=[];var l=0.001;d.find(".Comment").each(function(){var n=$(this);var o=parseInt(n.find(".Voting .Score").html());if(typeof f[o]!="undefined"){o+=l;l+=0.001}var i=n.attr("id");f[o]=i;b.push(o)});b.sort(function(n,i){return i-n});var g=$();var a=b.length;for(var e=0;e<a;e++){g[e]=$("#"+f[b[e]])[0]}g.length=a;g.context=undefined;c(function(){return g})}else{if(h=="New"){c(function(){return d.find(".newComment, .fakeNewComment")})}else{if(h=="Search"){c(function(){return d.find('.Comment:icontains("'+m.navigateBySearch+'")')})}else{if(h=="Deleted"){c(function(){return d.find('.Comment[class*="[deleted]"]')})}else{if(h=="Mod"){this.connection.getModerators(this.subreddit,function(n,o){var i=".user-"+o.join(", .user-");c(function(){return d.find(i)})})}else{if(h=="Friend"){var k="";var j=this.connection.user.friends;for(var e in j){k+=", .user-"+e.toLowerCase()}c(function(){return d.find(k.substr(2))})}else{if(h=="Answered"){var g=$();d.find("#CommentContent > .Comment > .Comment.OP").each(function(){g=g.add($(this).parent())});c(function(){return g})}else{if(h=="Images"){var g=$();d.find(".Comment > .commentBody").each(function(){if($(this).html().search(/(\.png|\.gif|\.jpeg|\.jpg|\.bmp|imgur|tinypic|photobucket|tumblr)/i)!=-1){g=g.add($(this).parent())}});c(function(){return g})}else{if(h=="Links"){var g=$();d.find(".Comment > .commentBody").each(function(){if($(this).html().search(/<a/i)!=-1){g=g.add($(this).parent())}});c(function(){return g})}}}}}}}}}}}}}}};redditpost.prototype.navigateBySwitch=function(b,e){var c=this;var a=this.selector;var d=this.navigateBy;if(d.type!=e||d.currentItemId==""){d=this.navigateBy={navigateByIterator:d.navigateByIterator,type:e,currentItemId:"",alreadyViewed:[]}}this.navigateByFetchSelectorMethod(e,function(f){if(b=="next"){if(d.currentItemId==""){var g=f();if(g.length==0){d.navigateByIterator.html('<span id="inputContainer">0</span> / <span id="maxCount">0</span>');return}var j=g.first();d.currentItemId=j.attr("id");d.counter=1;d.maxItems=g.length;d.alreadyViewed.push(d.currentItemId);d.navigateByIterator.html('<span id="inputContainer">1</span> / <span id="maxCount">'+g.length+"</span>");c.scrollToComment(j,true)}else{var i=d.alreadyViewed;var l=f();var j=undefined;l.each(function(){var m=$(this);if($.inArray(m.attr("id"),i)==-1){j=m;return false}});if(typeof j=="undefined"){d.currentItemId="";c.navigateBySwitch("next",e);return}d.currentItemId=j.attr("id");d.maxItems=l.length;d.alreadyViewed.push(d.currentItemId);d.navigateByIterator.html('<span id="inputContainer">'+ ++d.counter+'</span> / <span id="maxCount">'+l.length+"</span>");c.scrollToComment(j,true)}}else{if(d.currentItemId==""||d.alreadyViewed.length==0){var l=f();var h=d.counter=d.maxItems=l.length;var j=l.last();var i=[];l.each(function(){i.push($(this).attr("id"))});d.alreadyViewed=i;d.currentItemId=j.attr("id");d.navigateByIterator.html('<span id="inputContainer">'+h+'</span> / <span id="maxCount">'+h+"</span>");c.scrollToComment(j,true)}else{var i=d.alreadyViewed;var k=i.pop();if(k==d.currentItemId){if(i.length==0){d.currentItemId="";c.navigateBySwitch("prev",e);return}k=i.pop()}i.push(k);var j=a.find("#"+k);d.currentItemId=j.attr("id");d.navigateByIterator.html('<span id="inputContainer">'+ --d.counter+'</span> / <span id="maxCount">'+d.maxItems+"</span>");c.scrollToComment(j,true)}}})};redditpost.prototype.navigateByInput=function(b,h,f){var d=this;var a=this.selector;var e=this.navigateBy;if(b.find("input").length>0){return}var g=b.html();var c=$('<input type="text" value="'+g+'">');b.html(c);c.focus().select();b.off().on("keyup","input",function(i){if(i.keyCode==13){d.navigateByFetchSelectorMethod(f,function(j){var m=parseInt(c.val());if(isNaN(m)){m=1}b.html(m);if(m<1){m=1}if(m>h){m=h}var k=[];var n=j();var l=undefined;count=0;n.each(function(){var o=$(this);k.push(o.attr("id"));if(++count==m){l=o;return false}});if(typeof l=="undefined"){e.currentItemId="";d.navigateBySwitch("next",f);return}e.currentItemId=l.attr("id");e.maxItems=n.length;e.alreadyViewed=k;e.counter=m;e.navigateByIterator.html('<span id="inputContainer">'+m+'</span> / <span id="maxCount">'+n.length+"</span>");d.scrollToComment(l,true)})}})};redditpost.prototype.navigateBySelectUser=function(g){var n=this;var b=this.selector;var c=[];var f={};b.find(".Comment .Author").each(function(){var i=$(this).text();if(typeof f[i]=="undefined"&&i!="[deleted]"){c.push(i);f[i]=true}});c.sort(function(o,i){if(o.toLowerCase()<i.toLowerCase()){return -1}if(o.toLowerCase()>i.toLowerCase()){return 1}return 0});userBuffer="";var a=c.length;for(var e=0;e<a;e++){userBuffer+='<div data-username="'+c[e].toLowerCase()+'">'+c[e]+"</div>"}var k='<button class="green right" data-message="done"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Done+'</span></button> 				   <button class="left" data-message="close">[suggestedCloseText]</button>';var d='<div class="incontainer"><input type="text" data-message="close" placeholder="Enter Usernames Here with a space inbetween each" value="'+(typeof n.navigateByUsernameList!="undefined"?n.navigateByUsernameList:"")+'"></div> 				  <div class="userList">'+userBuffer+"</div>";var l=undefined;var j=$.popup({id:"navigateByPopup",buttons:k,title:"Choose Users",message:d},function(p,o){if(p=="done"){var q=l.val();var i=q.toLowerCase();n.navigateByUsernameList=q;n.navigateByUsernameSelector=".user-"+$.trim(i.replace(/  /g," ")).replace(/ /g,", .user-");b.find(".commentButton.selected").removeClass("selected");g.addClass("selected");n.navigateBy={navigateByIterator:n.navigateBy.navigateByIterator};n.navigateBySwitch("next","User");p="close"}return p});l=j.find("input");var h=j.find(".userList div");function m(){var p=l.val();h.filter(".selected, .highlighted").removeClass("selected").removeClass("highlighted");var o='div:icontains("'+$.trim(p.toLowerCase().replace(/  /g," ")).replace(/ /g,'"), div:icontains("')+'")';h.filter(o).addClass("highlighted");var i='[data-username="'+$.trim(p.toLowerCase().replace(/  /g," ")).replace(/ /g,'"], [data-username="')+'"]';h.filter(i).addClass("selected")}if(typeof n.navigateByUsernameList!="undefined"){m()}l.on("keyup",m);j.on("click",".userList div",function(o){o.preventDefault();o.stopPropagation();var p=$(this).html();var i=" "+l.val()+" ";if(i.search(new RegExp(" "+p+" ","i"))==-1){l.val($.trim(i+p).replace(/  /g," ")+" ");$(this).addClass("selected")}else{l.val($.trim(i.replace(new RegExp(" "+p+" ","i")," ")).replace(/  /g," ")+" ");$(this).removeClass("selected")}l.focus();return false})};function notificationsCenter(a,c){this.selector=a;this.connection=c;var b=this;return this}notificationsCenter.prototype.messages=-1;notificationsCenter.prototype.desktopNotification=function(d,c){this.connection.setting("show_desktop_notifications",function(a){if(a){desktopNotification(d,c)}})};notificationsCenter.prototype.startup=function(){var a=this;a.messages=-1;a.scan();this.connection.setting("live_notification_updates",function(b){if(b){a.interval=setInterval(function(){a.scan.call(a)},60000)}});return this};notificationsCenter.prototype.shutdown=function(){clearInterval(this.interval);return this};notificationsCenter.prototype.setBadge=function(a){window.setBadge(a)};notificationsCenter.prototype.scan=function(){var a=this;this.connection.getPosts("/message/unread.json",25,null,function(g){if(g.length==a.amountNew){return}var e=a.amountNew=g.length;a.newItems=g;if(e==0){var f='<i class="icon-envelope" /><div class="info">'+locale.Messages+"</div>";a.setBadge("")}else{if(e==1){var f='<div class="messageCount">1</div><i class="icon-envelope" /><div class="info">1 '+locale.New_Message+"</div>";a.setBadge("1")}else{if(e>1){var f='<div class="messageCount">'+e+'</div><i class="icon-envelope" /><div class="info">'+e+" "+locale.New_Messages+"</div>";a.setBadge(e)}}}a.selector.html(f);if(e<1){a.selector.removeClass("alert")}else{a.selector.addClass("alert")}if(a.messages!=-1){var b=e-a.messages;var h=false;var c=false;if(b>4){a.desktopNotification("New Messages!","You just received "+b+" new messages.");h=true;c=true}else{for(var d=0;d<b;d++){if(g[d].kind=="t4"){h=true;a.desktopNotification("New message from "+g[d].data.author,g[d].data.body)}else{c=true;a.desktopNotification("You were quoted by "+g[d].data.author,g[d].data.body)}}}}a.messages=e})};notificationsCenter.prototype.restart=function(){this.messages=-1;this.scan()};function notifications(j,b,s){analytics().track("Interaction","Opened Messages");if(typeof s=="undefined"){s={}}if(typeof s.action=="undefined"&&window.userNotifications.amountNew>0&&!s.ignoreDropdown){notifications_messagesDropdown(window.userNotifications.newItems);return false}var n='<div id="leftSide" class="Viewport noSort"></div> 				   <div id="leftSide" class="compose" style="display: none"> 				   <div class="incontainer usernameContainer"> <input type="text" id="username" placeholder="Usernames (separate multiple users by space) OR /r/subreddit for modmail"> </div> 				   <div class="incontainer titleContainer"> <input type="text" id="title" placeholder="Subject (ie: I found the King of the North!)"> </div> 				   <div class="textcontainer"> <textarea placeholder="Message"></textarea> </div> 				   </div> 				   <div id="rightSide" class="ViewportPost"></div> 				   <div class="clear"></div>';var p='<div class="left"> 					  <select id="messagesType"> 					   	  <option data-message="compose">'+locale.Compose+'</option> 					   	  <option data-message="all" selected>'+locale.All+'</option> 					   	  <option data-message="unread">'+locale.Unread+'</option> 					   	  <option data-message="messages">'+locale.PMs+'</option> 					   	  <option data-message="sent">'+locale.Sent+'</option> 					   	  <option data-message="comments">'+locale.Comments+'</option> 					   	  <option data-message="posts">'+locale.Posts+'</option> 					   	  <option data-message="myposts">'+locale.My_Posts+'</option> 					   	  <option data-message="mod">'+locale.Mod+'</option> 				      </select> 				   </div> 				   <div class="right"> 				   		  <button data-message="close" class="close">[suggestedCloseText]</button> 				   		  <button data-message="send" style="display: none" class="send green"><i class="icon-envelope-alt"></i><span>&nbsp;&nbsp;'+locale.Send+"</span></button> 				   </div>";var t='<div class="topControls"> <a data-message="checkAll">'+locale.Select_All+'</a> <a data-message="uncheckAll">'+locale.Unselect_All+'</a> <a data-message="markRead">'+locale.Mark_Read+'</a> <a data-message="markUnread">'+locale.Mark_Unread+"</a></div>";var g=null;var h=false;var k=false;var m,r,i,f,o,c;g=$.popup({title:t,id:"notificationsPopup",message:n,buttons:p},function(D,x){var C=$(this);if(c=="compose"&&D!="compose"&&D!="send"){$(".bottomInterface").show();g.find(".Viewport, .close, .ViewportPost, .alertTitle").show();g.find(".compose, .send").hide()}else{if(c=="myposts"){g.find(".Viewport").addClass("noSort");g.find(".alertTitle").show()}}c=D;if(D=="unread"){m.url="/message/unread.json";m.refresh()}else{if(D=="markRead"){g.find(".Post.checked.unread").each(function(){var F=$(this);var E=F.attr("data-name");j.markRead(E);F.removeClass("unread")});g.find('[data-message="uncheckAll"]').click()}else{if(D=="markUnread"){g.find(".Post.checked").each(function(){var F=$(this);var E=F.attr("data-name");j.markUnread(E);F.addClass("unread")});g.find('[data-message="uncheckAll"]').click()}else{if(D=="checkAll"){g.find(".Post:not(.checked)").trigger("mouseenter");g.find('.Post:not(.checked) input[type="checkbox"]').click()}else{if(D=="uncheckAll"){g.find(".Post.checked").trigger("mouseenter");g.find('.Post.checked input[type="checkbox"]').click()}else{if(D=="send"){if(k){return}k=true;g.find(".send").addClass("loading");var u=g.find("#username").val().split(" ");var D=g.find("textarea").val();var A=g.find("#title").val();var w=g.find("#captchaEnter").attr("iden");var z=g.find("#captchaEnter").val();var B=false;var y=u.length;for(var v=0;v<y;v++){j.sendMessage(u[v],A,D,w,z,function(E,H){if(E=="BAD_CAPTCHA"){g.find(".send").removeClass("loading");k=false;if(!B){B=true;var G='<img style="margin-left: 10px;margin-bottom: -2px;" id="captchaCode" src="http://reddit.com/captcha/'+H+'.png" />';var F='<div class="titleContainer incontainer">								<input style="width:615px;margin-bottom: 1px;" placeholder="Enter the captcha code above" type="text" iden="'+H+'" id="captchaEnter"> 							</div>';g.find("#title").parent().after(G+F)}else{alert("You entered the captcha incorrectly, try again.");g.find("#captchaCode").attr("src","http://reddit.com/captcha/"+H+".png")}}else{if(E=="noerror"){k=false;g.closePopup()}else{k=false;alert(H);g.find(".send").removeClass("loading")}}})}}else{if(D=="all"){m.url="/message/inbox.json";m.refresh()}else{if(D=="compose"){$(".bottomInterface").hide();g.find(".Viewport, .close, .ViewportPost, .alertTitle").hide();g.find(".compose, .send").show();g.find("#username").focus();if(!h){h=true;g.find("textarea").reditor()}}else{if(D=="sent"){m.url="/message/sent.json";m.refresh()}else{if(D=="mod"){m.url="/message/moderator.json";m.refresh()}else{if(D=="messages"){m.url="/message/messages.json";m.refresh()}else{if(D=="comments"){m.url="/message/comments.json";m.refresh()}else{if(D=="posts"){m.url="/message/selfreply.json";m.refresh()}else{if(D=="myposts"){g.find(".alertTitle").hide();m.url="/user/"+j.user.name+".json";m.refresh();g.find(".Viewport").removeClass("noSort")}else{if(D=="close"){if(typeof o!="undefined"){o.deconstructor()}window.userNotifications.scan();m.shutdown(false)}}}}}}}}}}}}}}}return D});f=g.find("#leftSide");rightSide=g.find("#rightSide");m=new column("/message/inbox.json",g.find("#leftSide"),activePlayground,j,false,{SPECIAL:true,SORT:"new"},locale.Messages);m.refreshTime=10000;m.loaded=function(){if(typeof s.openMessage!="undefined"){m.openPost($("#notificationsPopup #"+s.openMessage))}};m.startup();var a=g.find("#messagesType");a.toggleSwitch();window.x=g;g.on("mouseenter",".Post",function(){if(!$(this).hasClass("hasCheckbox")){$(this).addClass("hasCheckbox").prepend('<label class="checkboxContainer"><input type="checkbox"></label>')}});var e,d,q=true;g.on("click",'.Post input[type="checkbox"]',function(u){u.stopPropagation();clearTimeout(e);clearTimeout(d);q=false;d=setTimeout(function(){q=true},500);$(this).parent().parent().toggleClass("checked")});r=m.openPost;m.openPost=function(u){e=setTimeout(function(){if(!q){return}var x=u.attr("data-permalink");var y=u.attr("data-postid");var v=u.attr("data-name");var w=u.attr("type");if(u.hasClass("unread")){u.removeClass("unread");j.markRead(v)}f.addClass("slideLeft");rightSide.addClass("slideRight");u.addClass("visited");if(typeof o!="undefined"){o.deconstructor();o=undefined;rightSide.html("")}if(w=="context"||typeof w=="undefined"){window.cachedNotificationsPost={type:"redditpost",postid:y,permalink:x};o=new redditpost(y,x,rightSide,j,m)}else{if(w=="t4"){window.cachedNotificationsPost={type:"redditmessages",postname:v};o=new redditmessages(v,rightSide,j)}}o.closeHook=function(){window.userNotifications.scan();g.find('[data-message="close"]').click()}},250)};if(typeof window.cachedNotificationsPost!="undefined"){f.addClass("slideLeft");rightSide.addClass("slideRight");var l=window.cachedNotificationsPost;if(l.type=="redditpost"){o=new redditpost(l.postid,l.permalink,rightSide,j,m)}else{o=new redditmessages(l.postname,rightSide,j)}o.closeHook=function(){window.userNotifications.scan();g.find('[data-message="close"]').click()}}if(s.action=="compose"){g.find('[data-message="compose"]').click();g.find("#username").val(s.username)}}function notifications_messagesDropdown(g){var f=$("#notificationsQuick");if(f.length>0){f.off().remove();return}var h=['<div id="notificationsQuick" class="menubarDropdown"> 					   <div class="header node"> 					   		<div class="title">'+locale.Notifications+'</div> 					   		<div class="clearMessages">'+locale.Clear_Messages+'</div><span class="seperator">|</span><div class="newMessage">'+locale.New_Message+'</div>					   		<div style="clear: both"></div> 					   	</div> 					   	<div class="itemContainer" style="max-height: '+($(document).height()-100)+'px">'];var d={};var c=g.length;for(var j=0;j<c;j++){var e=g[j].data;var l=parseInt(e.created_utc);var a=formatDate(l);var k='<span class="date '+a[1]+'" data-timestamp="'+l+'">sent '+a[0]+"</span>";if(e.context==""){h.push('<div class="node message" data-href="http://www.reddit.com/message/messages/'+e.id+'.json" data-messageid="'+e.id+'" data-name="'+e.name+'" data-author="'+e.author+'" data-subject="'+e.subject+'"> 							<div class="delete">Clear</div> 							<div class="title"><strong>'+e.author+'</strong> sent you a message</div> 							<div class="message">'+e.body+'</div> 							<div class="timeInfo">'+k+'</div> 							<div class="quickReply">Quick Reply</div> 						 </div>')}else{var n=e.context.match(/comments\/(.*?)\//).pop();if(typeof d[n]=="undefined"){d[n]=[e.name]}else{d[n].push(e.name)}h.push('<div post="'+n+'" class="node post" data-href="http://www.reddit.com'+e.context+'" data-context="'+e.context+'" data-name="'+e.name+'" data-subreddit="'+e.subreddit+'"> 							<div class="delete">Clear</div> 							<div class="title"><strong>'+e.author+"</strong> replied in <strong>"+e.subreddit+'</strong></div> 							<div class="message">'+e.body+'</div> 							<div class="timeInfo">'+k+'</div> 							<div class="quickReply">Quick Reply</div> 						 </div>')}}h.push('<div class="footer node"> See All </div></div></div>');var b=$(h.join("")).appendTo("body");b.on("mouseenter",".node",function(i){smartContentPopup($(this))}).on("mouseleave",".node",function(i){smartContentPopupPrevent($(this))});function m(i){connection.markRead(i.attr("data-name"),function(){window.userNotifications.scan()});i.animate({height:0,opacity:0},250,function(){$(this).remove()})}b.on("click",".node, .header, .footer, .newMessage, .clearMessages, .node .delete, .node .quickReply",function(p){var o=$(this);if(o.hasClass("quickReply")){p.preventDefault();p.stopPropagation();new quickText({bindTo:o},function(s){if(s==false){this.close()}else{this.loading(true);var r=o.parent();var t=r.attr("data-subreddit");if(t){var q=this;connection.comment(r.attr("data-name"),t,s,function(v,u){if(!v){alert(u)}else{q.close();m(o.parent())}})}else{var q=this;connection.sendMessage(r.attr("data-author"),"re: "+r.attr("data-subject"),s,"","",function(v,u){if(v!="noerror"){alert(u)}else{q.close();m(o.parent())}})}}});return false}else{if(o.hasClass("delete")){p.preventDefault();p.stopPropagation();m(o.parent());return false}else{if(o.hasClass("clearMessages")){p.preventDefault();p.stopPropagation();o.parent().parent().children(".itemContainer:first").children(".node.post, .node.message").each(function(){var q=$(this);connection.markRead(q.attr("data-name"),function(){window.userNotifications.scan();q.animate({height:0,opacity:0},250,function(){$(this).remove()})});setTimeout(function(){b.off().remove()},1000)})}else{if(o.hasClass("message")){notifications(connection,tabManagerObj,{ignoreDropdown:true,openMessage:o.attr("data-messageid")});b.off().remove()}else{if(o.hasClass("newMessage")){notifications(connection,tabManagerObj,{ignoreDropdown:true,action:"compose"});b.off().remove()}else{if(o.hasClass("post")){var i=o.attr("data-context").match(/\/r\/(.*?)\/comments\/(.*?)\/(.*?)\/(.*?)\?/);if(window.location.hash.indexOf("Stream")>-1){window.location.href="#/Stream/post/~r~"+i[1]+"~comments~"+i[2]+"~"+i[3]+"~"+i[4]+"~.json?context=3/url/~r~"+i[1]+"~.json"}else{window.location.href="#/Home/post/"+i[2]+"/permalink/~r~"+i[1]+"~comments~"+i[2]+"~"+i[3]+"~"+i[4]+".json?context=3/column/-r-"+i[1]+"-/title/"+capitalize(i[1])+"/url/~r~"+i[1]+"~/sort/hot"}b.off().remove();connection.markRead(d[o.attr("post")],function(){window.userNotifications.scan()})}else{if(o.hasClass("footer")){notifications(connection,tabManagerObj,{ignoreDropdown:true});b.off().remove()}}}}}}}p.stopPropagation()});setTimeout(function(){$("body").click(function(){b.off().remove()})})}function redditmessages(a,b,d){var c=this;var f=this.id=Date.now();this.storedTagBuffers={};this.livePrivateMessages=true;d.setting("live_private_messages",function(g){if(g==false){c.livePrivateMessages=g}});var e=this.postid=a.split("_").pop();this.postname=a;this.container=b;this.connection=d;this.username=d.user.name.toLowerCase();this.messageInsertedCache={};b.html('<div class="bigLoadingText downloadingComments">'+locale.Downloading_comments+"</div>");d.getMessage(e,function(j){var i=j.data.children[0].data;var h=i.author.toLowerCase();var g=i.dest;c.otherUser=(h==c.username)?g.toLowerCase():h;c.subject=j.data.children[0].data.subject.replace(/re: /g,"");c.messageCount=j.data.children.length;c.makeBuffer(j,undefined,undefined,function(k){b.html('<div id="CommentContent">'+k+"</div>");c.commentsContainer=b.find("#CommentContent");b.animate({scrollTop:b.prop("scrollHeight")},700);d.setting("textPreviewsEnabled",function(l){c.replyBarObj=new replyBar({},d,"","Replying to "+h,"pm",function(m){var n=this.clear().loading(true);c.connection.messageReply(c.postname,m,function(q){n.loading(false);c.lastUpdateTime=Date.now();if(q==false){textarea.val(m);alert("Reddit did not receive your message.")}else{c.messageCount++;var p=Date.now()/1000;var o=formatDate(p);c.commentsContainer.append('<div class="message"> 																<div class="topstrip"> 															     	<span class="title">'+c.connection.user.name+'</span> 															     	<span class="date '+o[1]+'" data-timestamp="'+p+'">'+o[0]+'</span> 															    </div> 															    <div class="content">'+q.replace(/\\n/g,"")+"</div> 														    </div>");c.container.animate({scrollTop:c.container.prop("scrollHeight")},700)}})},true,l)});c.lastUpdateTime=Date.now();c.startAutoUpdate(3);b.on("click.chat"+f,"a",function(l){c.clickLink.call(c,$(this).attr("href"),l);l.stopPropagation()})})});b.on("click",".uTagPM",function(){redditpost.prototype.manageTags.call(c,$(this).parent().parent().find("#Author").html(),$(this).html(),$(this).attr("id"))})}redditmessages.prototype.lastUpdateTime=0;redditmessages.prototype.calculateNextRuntime=function(a){return 2000};redditmessages.prototype.markRead=function(a){this.connection.markRead(a);$('div[data-name="'+a+'"]').removeClass("unread")};redditmessages.prototype.makeBuffer=function(f,h,d,g){var c=this;var b=[];var e=this.messageInsertedCache;redditmessages_object=this;var a=this.storedTagBuffers;if(typeof d=="undefined"){d=0}this.connection.tags(function(i){function j(p){var l=p.data.children;var q=l.length;for(var o=d;o<q;o++){var u=l[o].data;if(u["new"]){redditmessages_object.markRead(u.name)}if(e[u.id]){continue}e[u.id]=true;var r=parseInt(u.created_utc);var m=formatDate(r);var t="";var k=u.author.toLowerCase();if(typeof i[k]!="undefined"){if(typeof a[k]=="undefined"){var s=i[k];var n=s.length;for(var o=0;o<n;o++){t+='<div id="'+o+'" class="uTag uTagPM" style="background-color: '+s[o].b+"; color: "+s[o].c+'">'+s[o].t+"</div>"}a[k]=t}else{t=a[k]}}b.push('<div class="message"> 								 <div class="topstrip"> 							     	<span class="title"><span id="Author">'+u.author+'</span><span class="'+k+'userTagList">'+t+'</span></span> 							     	<span class="date '+m[1]+'" data-timestamp="'+r+'">'+m[0]+'</span> 							     </div> 							     <div class="content">'+$("<div />").html(u.body_html.replace("&lt;!-- SC_OFF --&gt;","").replace("&lt;!-- SC_ON --&gt;","")).text()+"</div> 							 </div>");if(typeof u.replies=="object"){j(u.replies)}}}j(f);g(b.join(""))})};redditmessages.prototype.updateMessages=function(){var a=this;var b=this.messageInsertedCache;this.connection.getPosts("/message/unread.json",25,null,function(j){var c=j.length;var k=false;for(var e=0;e<c;e++){if(j[e].data.author.toLowerCase()==a.otherUser&&j[e].kind=="t4"&&j[e].data.subject.replace(/re: /g,"")==a.subject){var f=j[e].data;if(f["new"]){a.markRead(f.name)}if(b[f.id]){continue}b[f.id]=true;k=true;var h=parseInt(f.created_utc);var g=formatDate(h);var d='<div class="message"> 								 <div class="topstrip"> 							     	<span class="title">'+f.author+'</span> 							     	<span class="date '+g[1]+'" data-timestamp="'+h+'">'+g[0]+'</span> 							     </div> 							     <div class="content">'+$("<div />").html(f.body_html.replace("&lt;!-- SC_OFF --&gt;","").replace("&lt;!-- SC_ON --&gt;","")).text()+"</div> 							   </div>";a.commentsContainer.append(d);a.container.animate({scrollTop:a.container.prop("scrollHeight")},700)}}if(k){a.lastUpdateTime=Date.now()}a.startAutoUpdate(Date.now()-a.lastUpdateTime)})};redditmessages.prototype.shouldStopRunning=false;redditmessages.prototype.stopAutoUpdate=function(){clearTimeout(this.lastUpdateTimeout);this.shouldStopRunning=true};redditmessages.prototype.startAutoUpdate=function(b){if(this.shouldStopRunning||!this.livePrivateMessages){return}var a=this;this.lastUpdateTimeout=setTimeout(function(){a.updateMessages.call(a)},this.calculateNextRuntime(b))};redditmessages.prototype.deconstructor=function(){console.trace();this.replyBarObj.close();this.stopAutoUpdate();this.container.off(".chat"+this.id)};redditmessages.prototype.clickLink=function(b,f){f.preventDefault();if(b.search(/r\/(.*?)\/comments\/(.*?)\//)!=-1){var d=b.match(/r\/(.*?)\/comments\/(.*?)\//);var g=d[2];var c="~r~"+("/"+b).split("/r/").pop().replace(/\//g,"~");var a=(b+"/").match(/\/r\/(.*?)\//).pop();window.location.href="#/Home/post/"+g+"/permalink/"+c+"/column/-r-"+a+"-/url/~r~"+a+"~/title/"+capitalize(a);if(typeof this.closeHook=="function"){this.closeHook()}}else{if(b.search(/\/r\/(.*?)$/)!=-1||b.search(/\/r\/(.*?)\/$/)!=-1){var a=(b+"/").match(/\/r\/(.*?)\/$/).pop();new quickView(this.connection,capitalize(a),"/r/"+a+"/");if(typeof this.closeHook=="function"){this.closeHook()}}else{if(b.toLowerCase()=="/spoiler"){return}else{popupBrowser(b)}}}};function historyDropdown(b){var a=$("body");var c=$("#historyDropdown");if(c.length){c.remove();return false}b.getHistory(function(g){var d=g.length;var e=[];for(var f=0;f<d;f++){e.push('<div class="node historyRecord" data-key="'+f+'" data-href="'+g[f][2]+'">'+g[f][0]+"</div>")}c=$('<div id="historyDropdown" class="menubarDropdown" style="overflow-y: scroll; max-height: '+($(document).height()-100)+'px !important"> 					  	 <div class="header node"> 					  	 	 <div class="title">'+d+" "+locale.Items_in_History+'</div> 					  	 	 <div id="clearHistory" class="newMessage">'+locale.Clear_History+'</div> 					  	 	 <div style="clear: both"></div> 					  	 </div> 					  	 <div class="itemContainer">'+e.join("")+"</div> 					  </div>").appendTo(a);setTimeout(function(){a.off(".historyPopup").on("click.historyPopup",function(){c.remove();a.off(".historyPopup")});c.on("click.historyPopup",function(h){h.preventDefault();h.stopPropagation();return false})},500);c.on("click.historyPopup",".historyRecord",function(i){var h=parseInt($(this).attr("data-key"));window.location.href=g[h][1];c.remove()});c.on("click.historyPopup","#clearHistory",function(h){b.clearHistory();c.remove()});c.on("mouseenter.historyPopup",".historyRecord",function(h){smartContentPopup($(this))}).on("mouseleave.historyPopup",".historyRecord",function(h){smartContentPopupPrevent($(this))})})}function tabManager(e,d,a,g,f){var b=this.colWidth;this.tabManagerWaitingFor=g;this.callback=f;this.redditConnection=e;var h=this;this.navigationSelector=a;this.id=Date.now();var i=window.location.href.match(/\/page\/(.*?)($|\/)/);if(i){h.currentPage=h.originalPage=parseInt(i[1])}else{e.userVariable("tabPage",function(j){h.currentPage=h.originalPage=parseInt((typeof j=="undefined")?1:j)})}var c=this.playground=d;this.width=c.width();this.height=c.height();this.sideSpacing=this.width%b;this.columns={};this.columnsOrder=[];this.pageWidths=[];this.pageOffsets=[];this.columnsPerPage={"1":[]};this.totalXOffset=0;this.pageSelector=$("<div id='pageSelector'></div>");a.html(this.pageSelector);this.populatePageSelector();this.nextPageButton=$("<div id='next' class='pageNav pageNavNext' style='position: absolute; right: 0; top: 0px; bottom: 0px'></div>").appendTo(c);this.bindings(true);return this}tabManager.prototype.colWidth=300;tabManager.prototype.columnSpacing=9;tabManager.prototype.colTop=11;tabManager.prototype.colBottom=50;tabManager.prototype.pages=1;tabManager.prototype.currentPage=1;tabManager.prototype.amountTotalColumns=0;tabManager.prototype.mailViewLeftPixelAmount=-6;tabManager.prototype.mailViewActive=false;tabManager.prototype.insertX=tabManager.prototype.columnSpacing;tabManager.prototype.columnsOrderValue=0;tabManager.prototype.tabManagerWaitingFor=false;tabManager.prototype.infiniteScroll=false;tabManager.prototype.scrollX=0;tabManager.prototype.bindings=function(c){var i=this;var a=this.id;var g=this.pageSelector;var f=this.playground;var e=this.navigationSelector;if(c==false){g.off("click.tabManager"+a);f.off("click.tabManager"+a);e.off("click.tabManager"+a);g.off("click.tabManager"+a);return}var d=-1;this.scrolling=false;var j;var f=this.playground;if(this.infiniteScroll){var b=f[0].classList;var h=0;f.on("scroll",function(k,l){if(!i.scrolling){i.scrolling=true;$(".temp").remove()}if(i.mailViewActive){return}clearTimeout(j);j=setTimeout(function(){i.scrolling=false;i.scrollX=f.scrollLeft();i.resize()},250)})}g.on("click.tabManager"+a,".push:not(.pageManager)",function(){if(typeof i.pagePreviewSelector!="undefined"){i.pagePreviewSelector.remove()}var k=parseInt($(this).attr("data-forpage"));i.changePage(k)});f.on("click.tabManager"+a,".pageNav",function(){i.changePage(parseInt(i.currentPage)+1)});e.on("click.tabManager"+a,".pageManagerColumn",function(){i.switchToColumn($(this).attr("id"));if(typeof i.pageManagerObject!="undefined"){i.pageManagerObject.remove();i.pageManagerObject=undefined}});e.on("click.tabManager"+a,".pageManagerColumn .remove",function(l){l.stopPropagation();var k=$(this).parent();i.removeColumn(k.attr("id"));k.remove()});this.redditConnection.setting("showPagePreviews",function(k){if(k){g.on("mouseenter.tabManager"+a,".notPage",function(){i.pagePreview($(this).attr("data-forpage"))}).on("mouseleave.tabManager"+a,".notPage",function(){if(i.pagePreviewSelector){i.pagePreviewSelector.remove()}})}});e.on("mouseenter.tabManager"+a,".menubarDropdown",function(){if(i.pagePreviewSelector){i.pagePreviewSelector.remove()}});g.on("click.tabManager"+a,".pageManager",function(){i.pageManager($(this))})};tabManager.prototype.pagePreview=function(c){var b=this.getColumnTitlesAtPage(c);var d="";for(var a=0;a<b.length;a++){d+='<div class="node">'+b[a]+"</div>"}if(this.pagePreviewSelector){this.pagePreviewSelector.remove()}this.pagePreviewSelector=$('<div id="pagePreview" class="menubarDropdown">'+d+"</div>").prependTo(this.navigationSelector)};tabManager.prototype.getColumnTitlesAtPage=function(a){var d=this.columns;var c=[];for(var b in d){var e=d[b];if(typeof e!="undefined"&&e.page==a){c.push(e.sourceObject.title)}}return c};tabManager.prototype.startupAndShutdown=function(f){var a=this.infiniteScroll;var d=window.COLUMNS_STARTED;for(var e in window.COLUMNS_STARTED){e=d[e];if(e.page!=f&&e.running&&e.tabManagerObj&&!e.tabManagerObj.isFake){e.shutdown(true);if(!a){e.hide()}}}var c=this.columnsPerPage[f];for(var b in c){var e=c[b];if(!e.running){e.startup();e.show()}}};tabManager.prototype.refreshAll=function(){if(this.mailViewActive){return}for(var a in window.tabManagerObj.columns){this.columns[a].sourceObject.refresh()}};tabManager.prototype.deconstructor=function(f){this.pageSelector.remove();this.bindings(false);var e=this.columns;var b=this.columnsOrder;var a=b.length;for(var d=0;d<a;d++){var c=e[b[d].id];if(c.sourceObject.running){c.sourceObject["shutdown"](false,undefined,f)}c.sourceObject.selector.remove()}};tabManager.prototype.fixForwardBackButtons=function(a){if(this.infiniteScroll){this.nextPageButton.hide();return}this.nextPageButton.css("left",this.pageWidths[a]+"px");this.nextPageButton.css("display",(a==this.pages)?"none":"block")};tabManager.prototype.populatePageSelector=function(){var c=this.pageSelector;var a=[];for(var b=1;b<=this.pages;b++){a.push('<div class="push '+((this.currentPage==b)?"currentPage":"notPage")+'" data-forpage="'+b+'">'+b+"</div>")}a.push('<div class="push pageManager"> &nbsp; <div class="icon alien"></div> </div> <div class="clear"></div>');c.html(a.join(""))};tabManager.prototype.changePage=function(c,e){var a=this;if(this.mailViewActive){return}if(!e){if(window.location.href.indexOf("Home")>-1){window.location.href="#/Home/page/"+c}return}if(c==-1){this.lastPage(e);return}if(/^\d+$/.test(c)==false){this.switchToColumn(c,e);return}var b=this.currentPage;if(c==b){return}if(this.infiniteScroll){if(!this.changePageByScrolling){this.preventChangePageByScrolling=true;var f=this.columns[this.columnsPerPage[c][0].id].insertX-this.columnSpacing;this.playground.animate({scrollLeft:f},1000)}else{this.changePageByScrolling=false}}else{$("[data-page="+b+"]").hide();$("[data-page="+c+"]").show();this.startupAndShutdown(c);this.fixForwardBackButtons(c)}var d=this.pageSelector;tabManager.prototype.currentPage=c;this.currentPage=c;this.redditConnection.userVariable("tabPage",c);d.find(".currentPage").removeClass("currentPage").addClass("notPage");d.find("[data-forpage="+c+"]").addClass("currentPage").removeClass("notPage")};tabManager.prototype.lastPage=function(a){if(window.location.hash.indexOf("/post/")==-1){this.changePage(this.pages,a)}};tabManager.prototype.insert=function(f,b,i){var n=this;var j=this.playground;i=i||0;var e=f.call(this,undefined);var a=e.id+(i!=0?i:"");e.id=a;if(typeof this.columns[a]!="undefined"){return this.insert(f,b,++i)}var g=(e.width>this.width-100)?this.width-100:e.width;var m=this.width=this.playground.width();var h=this.currentPage;var k=this.pageWidths;var l=this.insertX;this.insertX+=g+this.columnSpacing;if((l+g)>m){this.totalXOffset+=l-this.columnSpacing;k[this.pages]=l;this.pages++;this.columnsPerPage[this.pages]=[];l=this.columnSpacing;this.insertX=l+g+this.columnSpacing;clearTimeout(this.populatePageSelectorTimer);var n=this;this.populatePageSelectorTimer=setTimeout(function(){n.populatePageSelector()},500)}var d=$('<div data-page="'+this.pages+'" class="container" style="position: absolute; '+(this.infiniteScroll?"":"display: none;")+" left: "+(this.infiniteScroll?this.totalXOffset+l:l)+"px; top: "+this.colTop+"px; bottom: "+this.colBottom+"px; width: "+g+'px"></div>');e.selector=d;j.append(d);this.columns[a]={selector:d,page:this.pages,sourceObject:e,insertX:(this.infiniteScroll?this.totalXOffset+l:l),flags:e.flags,width:g};this.columnsOrder.push({id:a,order:this.columnsOrderValue+=10,flags:e.flags,url:e.url,title:e.title});this.columnsPerPage[this.pages].push(e);e.page=this.pages;if(b=="SYNC"){this.redditConnection.saveColumns(this.columnsOrder)}if(this.infiniteScroll){this.playground.css("overflow","scroll");if(!this.first&&this.currentPage==this.pages){this.first=this.columns[a]}if(this.first){this.playground.scrollLeft(this.first.insertX-this.columnSpacing)}}var c=this.playground.scrollLeft();if(this.tabManagerWaitingFor==a&&typeof this.callback=="function"){this.tabManagerWaitingFor=false;var n=this;setTimeout(function(){n.callback()},500)}else{if(this.infiniteScroll){if(this.currentPage==this.pages&&this.infiniteScroll&&this.totalXOffset+l+g>=c&&this.totalXOffset+l<c+this.playground.width()){e.startup()}else{e.createColumnLayout()}}else{if(h==this.pages&&!this.mailViewActive){e.startup();e.show()}}}this.fixForwardBackButtons(h);return -1};tabManager.prototype.resize=function(w,b){if(this.mailViewActive||this.scrolling){return}var f=this.infiniteScroll;if(f){var e=false;var h=false}var y=this.columnSpacing;var g=this.playground;var l=this.scrollX?this.scrollX:this.playground.scrollLeft();var s=this.currentPage;var d=this.pageWidths;var k=this.width=g.width();this.height=g.height();if(!f){k-=35}var x=k-30;var z=this.insertX=y;var j=1;var r=this.columnsPerPage={"1":[]};var a=this.columns;var p=this.columnsOrder;var v=p.length;var u=0;for(var t=0;t<v;t++){var n=p[t].id;var o=a[n];var A=o.sourceObject.width;if(A>x){A=x}var c=z;z+=A+y;var q=$(o.selector);if(w){q.width(A)}if((c+A)>k){u+=c-y;d[j]=c;j++;r[j]=[];c=y;z=c+y+A}o.sourceObject.page=j;r[j].push(o.sourceObject);o.page=j;if(f){q.attr("data-page",j).css("left",(u+c)+"px");o.insertX=u+c;if(u+c+A>l&&u+c<l+k){if(!e){e=o}else{h=o}o.sourceObject.startup()}else{o.sourceObject.shutdown()}}else{q.attr("data-page",j).css("left",c+"px");o.insertX=c}}this.pages=j;this.insertX=z;this.totalXOffset=u;if(!f){g.find(".container").hide();$("[data-page="+s+"]").show();this.nextPageButton.css("left",d[s]+"px")}else{this.playground.css("overflow","scroll");this.preventChangePageByScrolling=false;if(!this.preventChangePageByScrolling){this.changePageByScrolling=true;this.changePage(h.sourceObject.id==p[v-1].id?j:e.page);var m=this;setTimeout(function(){m.changePageByScrolling=false},1500)}}if(s>j){this.changePage(j)}else{if(!f){this.fixForwardBackButtons(s);this.startupAndShutdown(s)}}this.populatePageSelector();if(typeof b=="function"){b()}};tabManager.prototype.mailViewStart=function(o,n,j){this.pageSelector.hide();$("#pageSelectorAdjuster").addClass("hidden");var p=this;var m=this.infiniteScroll;if(typeof this.columns[o]=="undefined"){this.tabManagerWaitingFor=o;this.callback=function(){p.mailViewStart(o,n,j)};this.insert(function(i){return new column(j.url.replace(/~/g,"/"),i,activePlayground,this.redditConnection,this,{SORT:j.sort,TEMP:true,highlight:j.highlight},j.title)});return}var c=this.columnWorkingWith!=this.columns[o]&&typeof this.columnWorkingWith!="undefined";var h=(this.currentPost!=j.post)?true:false;this.currentPost=j.post;$('[data-postid="'+j.post+'"] #newComments').remove();if(!this.mailViewActive||c||!this.currentpost){if(window.COLUMN_HAS_AD){window.COLUMN_HAS_AD.removeAd()}tabManager.prototype.mailViewActive=true;var r=null;var f=this.columns;var b=this.columnsOrder;var l=b.length;for(var g=0;g<l;g++){var q=f[b[g].id];if(o==q.sourceObject.id){if(!q.sourceObject.running){var a=q.sourceObject;a.show();a.startup()}}else{if(q.sourceObject.running){var a=q.sourceObject;a.shutdown();a.hide()}else{if(m){q.sourceObject.hide()}}}}if(c){var e=this.columnWorkingWith;if(!e.flags.TEMP){e.selector.css({left:this.columnWorkingWith.insertX+"px",top:this.colTop+"px",bottom:this.colBottom+"px"}).removeClass("stickleft").removeClass("stickleftNoAnimate")}}this.columnWorkingWith=r=f[o];var d=r.selector;d.addClass(c?"stickleftNoAnimate":"stickleft");if(c){this.currentpost.setColumn(r.sourceObject)}if(h){if(typeof this.currentpost!="undefined"){this.currentpost.deconstructor()}$("#PostView").remove();this.nextPageButton.hide();var k=$('<div id="PostView" class="canscroll"> <div class="loadingcss"></div> </div>').appendTo(this.playground);setTimeout(function(){k.show()},500);this.currentpost=n.call(k,r.sourceObject)}}else{this.currentpost.deconstructor();$("#PostView").remove();var k=$('<div id="PostView" class="canscroll"></div>').appendTo(this.playground);this.currentpost=n.call(k,this.columnWorkingWith.sourceObject)}this.columnWorkingWith.sourceObject.insertAd(true,true);this.playground.addClass("mailViewActive").scrollLeft(0)};tabManager.prototype.mailViewStop=function(){if(!this.mailViewActive){return false}if(window.COLUMN_HAS_AD){window.COLUMN_HAS_AD.removeAd()}tabManager.prototype.mailViewActive=false;this.currentPost=false;var m=this.columnWorkingWith;var b=m.sourceObject.id;m.selector.css({left:m.insertX+"px",top:this.colTop+"px",bottom:this.colBottom+"px"}).removeClass("stickleft").removeClass("stickleftNoAnimate");this.currentpost.deconstructor();$("#PostView").remove();var g=this.currentPage;var d=g!=m.page&&(typeof m.flags=="object"&&!m.flags.TEMP);if(d){this.changePage(m.page)}this.columnWorkingWith=undefined;var j=this.infiniteScroll;var e=this.columns;var c=this.columnsOrder;var h=c.length-1;for(var f=h;f>-1;f--){var l=e[c[f].id];if(typeof c[f].flags!="undefined"&&c[f].flags.TEMP){l.sourceObject.remove();delete e[c[f].id];c.splice(f,1);h--}else{if(l.sourceObject.running!=true&&!d&&l.page==g){var a=l.sourceObject;a.show();a.startup()}else{if(j){l.sourceObject.show()}}}}if(!j){this.nextPageButton.show()}this.playground.removeClass("mailViewActive").scrollLeft(this.scrollX);this.pageSelector.show();$("#pageSelectorAdjuster").removeClass("hidden");var k=this;this.preventChangePageByScrolling=true;this.resize(undefined,function(){k.preventChangePageByScrolling=false});return true};tabManager.prototype.moveColumn=function(g,k){var b=this.columns;var l=this.columnsOrder;if(k=="left"){if(l[0].id==g){return}}if(k=="right"){if(l[l.length-1].id==g){return}}var n=l.length-1;var c=null;for(var m=n;m>-1;m--){if(l[m].id==g){c=m;break}}if(k=="left"){var q=c;var h=c-1}else{var q=c+1;var h=c}var p=l.splice(q,1).pop();var f=l[h];var r=b[f.id];var a=b[p.id];var e=r.page;var s=r.insertX;var o=a.page;var d=a.insertX;r.page=o;r.insertX=d;a.page=e;a.insertX=s;l.splice(h,0,p);var j=(k=="left")?e:o;this.changePage(j);this.saveColumns();this.resize()};tabManager.prototype.saveColumns=function(){this.redditConnection.saveColumns(this.columnsOrder)};tabManager.prototype.removeColumn=function(f){f=f.toLowerCase();var e=this.columns;var b=this.columnsOrder;var a=b.length-1;for(var d=a;d>-1;d--){var c=e[b[d].id];if(b[d].id==f){if(this.mailViewActive){c.flags.TEMP=true;b[d].flags.TEMP=true}else{if(typeof c!="undefined"){c.sourceObject.remove();delete e[b[d].id]}b.splice(d,1)}}}this.resize();this.redditConnection.saveColumns(this.columnsOrder)};tabManager.prototype.isPermanentColumn=function(b){var a=this.columns[b.replace(/\//g,"-").toLowerCase()];return(typeof a!="undefined"&&!a.flags.TEMP)?true:false};tabManager.prototype.makePermanent=function(g){var f=this.columns;var c=this.columnsOrder;var b=c.length-1;var a=undefined;for(var e=b;e>-1;e--){var d=f[c[e].id];if(c[e].id==g){a=e;break}}if(typeof c[a].flags!="undefined"){delete c[a].flags.TEMP}if(typeof f[g].flags!="undefined"){delete f[g].flags.TEMP}this.redditConnection.saveColumns(this.columnsOrder)};tabManager.prototype.setSort=function(h,g){var f=this.columns;var c=this.columnsOrder;var b=c.length-1;var a=undefined;for(var e=b;e>-1;e--){var d=f[c[e].id];if(c[e].id==h){a=e;break}}if(typeof c[a].flags=="undefined"){c[a].flags={}}c[a].flags.SORT=g;this.redditConnection.saveColumns(this.columnsOrder)};tabManager.prototype.setTitle=function(b,g,c){var d=this.columns;var a=this.columnsOrder;var f=a.length-1;var h=undefined;for(var e=f;e>-1;e--){var j=d[a[e].id];if(a[e].id==b){h=e;break}}if(typeof a[h].flags=="undefined"){a[h].flags={}}a[h].title=g;if(typeof c=="undefined"||c==true){this.redditConnection.saveColumns(this.columnsOrder)}};tabManager.prototype.setUrl=function(b,d,c){d=d.toLowerCase();var h=d.replace(/\//g,"-");var a=this.columnsOrder;var e=this.columns;if(typeof e[h]!="undefined"){return false}var g=a.length-1;var j=undefined;for(var f=g;f>-1;f--){var k=e[a[f].id];if(a[f].id==b){j=f;break}}a[j].url=d;if(typeof a[j].flags=="undefined"){a[j].flags={}}a[j].id=h;e[h]=e[b];delete e[b];$("#"+b).attr("id",h);if(typeof c=="undefined"||c==true){this.redditConnection.saveColumns(this.columnsOrder)}return true};tabManager.prototype.pageManager=function(f){if(typeof this.pageManagerObject!="undefined"){this.pageManagerObject.remove();this.pageManagerObject=undefined;return}var h=this.navigationSelector;var b=['<div id="pageManagerContainer" class="menubarDropdown canscroll" style="max-height: '+($("body").height()-100)+'px"><div class="nodeList">'];var d=this.columnsOrder;var a=d.length;for(var e=0;e<a;e++){b.push('<div class="pageManagerColumn node" id="'+d[e].id+'"> <div class="icon remove"></div> <div class="text">'+d[e].title+'</div> <div class="icon verticalArrows"></div> </div>')}b.push('</div><input id="search" type="text" placeholder="Start typing...">');b.push("</div>");var g=this.pageManagerObject=$(b.join("")).appendTo(h);var c=this;g.find(".nodeList").sortable({containment:"parent",axis:"y",update:function(){c.pageManagerSort.call(c)}});var c=this;setTimeout(function(){$("body").one("click",function(){g.remove();c.pageManagerObject=undefined})},1000);h.find("#search").focus();h.on("click.tabManager"+this.id,"#search",function(i){i.preventDefault();i.stopPropagation()});h.on("keyup.tabManager"+this.id,"#search",function(j){var i=$(this).val();if(j.keyCode==13){h.find('.pageManagerColumn:icontains("'+i+'")').first().click();return}if(i==""){h.find(".pageManagerColumn").show();return}h.find(".pageManagerColumn").hide();h.find('.pageManagerColumn:icontains("'+i+'")').show()})};tabManager.prototype.pageManagerSort=function(){var c=this.columnsOrder;var e={};var a=c.length;for(var d=0;d<a;d++){e[c[d].id]=c[d]}var b=[];this.pageManagerObject.find(".pageManagerColumn").each(function(){b.push(e[$(this).attr("id")])});this.redditConnection.saveColumns(b);this.columnsOrder=b;this.resize()};tabManager.prototype.switchToColumn=function(d,b){var a=this.columns[d];var c=this.columns[d].page;setTimeout(function(){a.selector.addClass("glow")},500);setTimeout(function(){a.selector.removeClass("glow")},1500);this.changePage(c,b)};tabManager.prototype.resizeColumn=function(f,d){var b=this.columnsOrder;var a=b.length-1;var e=null;for(var c=a;c>-1;c--){if(b[c].id==f){e=c;break}}if(d==column.prototype.width){delete b[e].width}else{b[e].width=d}self.tabManagerObj.resize(true);self.tabManagerObj.saveColumns()};function subredditSelector(b,d,h,c){if(typeof h=="function"||typeof h=="undefined"){c=h;h=[]}this.selector=d=$(d);var k=null;var l=this;onChangeCallbackExists=(typeof c=="undefined")?false:true;var e=[];var j=h.length;for(var g=0;g<j;g++){e.push('<div class="selected subredditSelectorItem">'+h[g]+"</div>")}d.html('<div class="subredditSelector"> 				      <div class="toggleSwitchContainer"> 					      <select id="viewType"> 					      	  <option selected>'+locale.Editor+"</option> 					      	  <option>"+locale.List+'</option> 					      </select> 					  </div> 					  <div id="editor" class="active"> 					   	  <div class="incontainer"> 					   	  	  <input type="text" placeholder="Type in a subreddit and hit enter"> 					   	  </div> 					   	  <div id="addSubreddit_results">'+e.join("")+'</div> 				   	  </div> 				   	  <div id="list" style="display: none"> 				   	  	  <div id="textareaContainer" class="incontainer"></div> 				   	  </div> 				   </div>');d.off(".subredditSelector").on("click.subredditSelector","#addSubreddit_results div",function(){$(this).toggleClass("selected");if(onChangeCallbackExists){l.subreddits(c)}k.select().focus()});var a="Editor";d.find("#viewType").toggleSwitch().off(".subredditSelector").on("change.subredditSelector",function(){var n=$(this).val();if(a=="Editor"&&n=="List"){a=n;var m=d.find("#list");l.subreddits(function(o){m.find("#textareaContainer").html('<textarea placeholder="Specify one subreddit per line">'+o.join("\n")+"</textarea>").find("textarea").autoHeight().doneTyping(function(){if(onChangeCallbackExists){l.subreddits(c)}})});d.find("#editor").hide().removeClass("active");m.show().addClass("active")}else{if(a=="List"&&n=="Editor"){a=n;var i=d.find("#editor");l.subreddits(function(o){i.find("#addSubreddit_results").html('<div class="subredditSelectorItem selected">'+o.join('</div><div class="subredditSelectorItem selected">')+"</div>")});i.show().addClass("active");d.find("#list").hide().removeClass("active")}}});k=d.find("input").focus();var f=d.find("#addSubreddit_results");k.doneTyping(function(){k.addClass("loading");var i=k.val().toLowerCase();i=i.replace("/r/","");if(i.substr(0,2)=="r/"){i=i.substr(2)}b.searchRedditNames(i,function(p){f.find("div:not(.selected)").remove();if(p.length!=0){f.append('<div class="subredditSelectorItem">'+p.join('</div><div class="subredditSelectorItem">')+"</div>")}var n=false;var m=p.length;for(var o=0;o<m;o++){if(i==p[o].toLowerCase()){n=true}}if(!n){b.subredditExists(i,function(q){if(q){f.append('<div class="subredditSelectorItem">'+capitalize(i)+"</div>")}})}k.removeClass("loading")})})}subredditSelector.prototype.select=function(b){selector=this.selector;if(selector.find(".active").attr("id")=="list"){var a=selector.find("textarea");subs=a.val().toLowerCase().split(/\r\n|\r|\n/g).map(function(c){return $.trim(c)});subs.push(b);subs.sort();a.val(subs.join("\n"))}else{selector.find('.subredditSelectorItem:contains("'+b+'")').addClass("selected")}};subredditSelector.prototype.subreddits=function(g){selector=this.selector;var c=this;if(selector.find(".active").attr("id")=="list"){var d=selector.find("textarea").val();var b=d.toLowerCase().split(/\r\n|\r|\n/g);var f=[];var a=b.length;for(var e=0;e<a;e++){if(b[e]!=""){f.push($.trim(b[e]).toLowerCase())}}g.call(c,f)}else{var f=[];selector.find(".subredditSelectorItem.selected").each(function(){f.push($(this).html().toLowerCase())});g.call(c,f)}};function parseSubreddit(a,b){reddit.prototype.subredditAbout(a,function(d){if(!d){b("");return false}var c="<div class='subredditInfo infoDescription'> 						 <center> 						 <span style='font-size: 150%'>/r/"+capitalize(a)+"</span> 						 <br><br> 						 <strong>Subscribed:</strong><br> 						 "+d.subscribers+" 						 <br><br> 						 <strong>Active Users:</strong><br> 						 "+d.accounts_active+" 						 <br><br> 						 <strong>Created On:</strong><br> 						 "+formatDate(d.created)[0]+" 						 </center> 					 </div>";b(c)})}function parseAMA(c,d,b,a){$.getJSON(c+reddit().jsonextension+"sort=top",function(j){var e=j[0].data.children[0].data;var g=e.author;var k=j[1].data.children;var f=['<div class="AMA"> 						   <div class="infoDescription ama"> 								<div class="q"> 									<span class="Author">'+e.author+"</span>: "+SnuOwnd.getParser().render(e.selftext)+" 								</div> 						   </div>"];var i=false;if(a){i=Math.round(a/250)}function h(o,n){var l=o.length;for(var m=0;m<l;m++){var p=o[m].data;if(n&&p.author==g){f.push('<div class="infoDescription ama" '+(i===false||i>1&&i-->0?"":'style="display:none"')+'> 									<div class="q"> 										<span class="Author">'+n.author+"</span>: "+SnuOwnd.getParser().render(n.body)+' 									</div> 									<br> 									<div class="a"> 										<span class="Author">'+p.author+"</span>: "+SnuOwnd.getParser().render(p.body)+" 									</div> 								 </div>")}if(p.replies&&typeof p.replies=="object"&&p.replies.data&&p.replies.data.children){h(p.replies.data.children,p)}}}h(k);if(i==1&&f.length-1>2){f.push('<div class="showMore">Show All '+(f.length-1)+" Answers</div>")}f.push("</div>");f=f.join("").replace(/<a([^>]*?)\/([^>]*?)\/([^>]*?)>([^<]*?)<\/a>/gi,'<a$1/$2/$3>$4</a><span class="inlineViewHandle">+</span>');d(f,function(l){l.find(".showMore").one("click",function(){var m=$(this);m.parent().find(".infoDescription").show();m.hide()})})})}function parseImage(b,g,f,c,e){b=b.replace(/\.gifv$/i,".gif");var a=document.createElement("img");var d;if(window.isChromePackaged){getImageBlob(b,function(h){a.setAttribute("src",h)})}else{a.setAttribute("src",b)}if(typeof e==="function"){a.onerror=e}a.onload=function(){if(a.width!=0&&a.height!=0){clearInterval(d);var m=a.width;var h=a.height;var j=(typeof f=="undefined")?window.outerWidth:f;var n=(typeof c=="undefined")?window.outerHeight:c;var l,i;var l=m;var i=h;if(m>j){l=j;i=h*(j/m)}if(i>n){var k=n/i;i=n;l=l*k}g('<center><img class="l" src="'+a.src+'" style="width: '+l+"px; height: "+i+'px"></center>',function(){return{handledBy:"parseImage"}})}}}function parseTinyPic(b,d,c,a){$.get(b,function(f){var e=decodeURIComponent(f.match(/fo\.addVariable\("ipt"\, "(.*?).jpg"\);/).pop());parseImage(e,d,c,a)})}function parseFlickr(b,d,c,a){$.get((reddit().crossDomain?"":"http://api.reditr.com/sync/?forward=")+"http://api.reditr.com/sync/?forward="+b,function(g){var e=g.match(/<meta property="og:image" content="(.*?)" \/>/im);if(e!=null){var f=e[1]}else{var e=g.match(/rel="image_src" href="(.*?)"/im);var f=e[1]}parseImage(f,d,c,a)})}function parseTwitter(a,b){$.getJSON("https://api.twitter.com/1/statuses/oembed.json"+(reddit().crossDomain?"":"?callback=?"),{url:a,align:"left",omit_script:"true"},function(c){b(c.html)})}function parseImgur(b,e,d,a){var c=b.replace(/#(.*?)$/,"").match(/\/(a|gallery)\/(.*?)(\/|$|#)/)[2];$.ajax({url:"https://api.imgur.com/3/gallery/album/"+c+"/images",type:"GET",beforeSend:function(g,f){g.setRequestHeader("Authorization","Client-ID 6d5f34e8c30918b")},error:function(){$.ajax({url:reddit().baseProxy+"http://imgur.com/a/"+c,type:"GET",success:f,error:function(){$.ajax({url:reddit().baseProxy+"http://imgur.com/gallery/"+c,type:"GET",success:f})}});function f(m){var j=$(m);var n=[];var h=[];var p=j.find(".thumb-title");for(var k=0;k<p.length;k++){var g=p[k];h[parseInt(g.getAttribute("data-index"))]=g.getAttribute("data-src").replace(/^\/\//,"http://")}var l=[];var o=j.find("#image-container .image");if(o.length>0){o.each(function(){var i=$(this).find(".wrapper img").attr("data-src");if(i.substr(0,2)=="//"){i="http:"+i}n.push(i);l.push($(this).find("h2").text())})}else{j.find("#thumbs-top img").each(function(){var i=$(this).attr("data-src");var q=i.replace("s.",".");if(q.substr(0,2)=="//"){q="http:"+q}n.push(q);h.push(i);l.push("")})}if(n.length==0){return parseImage(j.find(".main-image img").attr("src"),e,d,a)}e('<div style="width: '+d+"px; height: "+a+'px; overflow: hidden"></div>',function(i){i.width(d);imageZoom(n[0],l[0],0,n,l,h,i);return{TTL:30}})}},success:function(k){var j=[];var f=[];var h=[];var k=k.data;if(k.images){k=k.images}for(var g in k){var l=k[g];if(typeof l=="string"){parseImage("http://i.imgur.com/"+c+".png",e,d,a);return}j.push(l.link);f.push(l.title?l.title:l.description);h.push(l.link.replace(/\.(png|bmp|gif|jpg|jpeg|bmp)/i,"s.$1"))}e('<div style="width: '+d+"px; height: "+a+'px; overflow: hidden"></div>',function(i){i.width(d);imageZoom(j[0],f[0],0,j,f,h,i);return{TTL:30}})}})}function parseYoutube(b,g,c,a){try{var f=b.match(/v=(.*?)(&|$)/i)[1];connection.setting("ytVideoType",function(h){if(window.isChromePackaged){var e;if(h=="html5"){e="http://www.youtube.com/embed/"+f}else{e="https://www.youtube.com/v/"+f+"?hl=en_GB&amp;version=3"}g('<center><webview class="youtubePlayer" src="'+e+'"></webview></center>')}else{if(h=="html5"){g('<center><iframe allowfullscreen frameborder="0" type="text/html" class="youtubePlayer" src="http://www.youtube.com/embed/'+f+'?html5=1"></iframe></center>')}else{g('<center><object width="560" height="315"> 						<param name="movie" value="https://www.youtube.com/v/'+f+'?hl=en_GB&amp;version=3"></param> 						<param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param> 						<embed src="https://www.youtube.com/v/'+f+'?hl=en_GB&amp;version=3" type="application/x-shockwave-flash" width="560" height="315" allowscriptaccess="always" allowfullscreen="true"><param name="wmode" value="opaque" /></embed> 						</object></center>')}}})}catch(d){g("")}}function parseYoutubeShortURL(b,e,c,a){var d=b.split("/").pop();connection.setting("ytVideoType",function(g){if(window.isChromePackaged){var f;if(g=="html5"){f="http://www.youtube.com/embed/"+d}else{f="https://www.youtube.com/v/"+d+"?hl=en_GB&amp;version=3"}e('<center><webview class="youtubePlayer" src="'+f+'"></webview></center>')}else{if(g=="html5"){e('<center><iframe class="youtubePlayer" src="http://www.youtube.com/embed/'+d+'"></iframe></center>')}else{e('<center><object width="560" height="315"> 					<param name="movie" value="https://www.youtube.com/v/'+d+'?hl=en_GB&amp;version=3"></param> 					<param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param> 					<embed src="https://www.youtube.com/v/'+d+'?hl=en_GB&amp;version=3" type="application/x-shockwave-flash" width="560" height="315" allowscriptaccess="always" allowfullscreen="true"></embed> 					</object></center>')}}})}function parseRedditComments(a,b,d,c){a=a.replace(/\?context=([0-9]{1})/,"")+reddit().jsonextension+"context=3";$.getJSON(a,function(f){var e={createCommentBuffer:redditpost.prototype.createCommentBuffer,subreddit:"value",columnURL:a,connection:connection,storage:{},storedComments:{},storedTagBuffers:{}};e.createCommentBuffer(f[1].data.children,undefined,function(g){e.connection.setting("fontSize",function(h){d("<div class='redditComments heightRestriction' style='font-size: "+h+"px;'>"+g+"<div class='showMoreComments'>Show More Comments</div></div>",function(i){i.find(".showMoreComments").click(function(){var j=$(this);j.remove();if(i.hasClass("heightRestriction")){i.removeClass("heightRestruction")}else{i.find(".heightRestriction").first().removeClass("heightRestriction")}})})})},true)})}function parseRedditMessage(b,a){connection.getMessage(b,function(c){a("<div class='infoDescription'>"+c.data.children[0].data.body+"</div>")})}function parseReddit(b,i,d,c,a){try{var h=b.match(/comments\/(.*?)\/(.*?)\/(.*?)(\/|$|\?context)/);if(h[3]!=""){parseRedditComments(b,h[3],i,d);return}if(h!=null){h=h[1]}else{i("");return}var g=$("<div />").html(nl2br(redditGetCache(h,"selftext_html")).replace("&lt;!-- SC_OFF --&gt;","").replace("&lt;!-- SC_ON --&gt;","")).text();if(g=="null"){g=redditGetCache(h,"title")}if(g=="false"||!g){$.getJSON(b+reddit().jsonextension,function(j){try{j=j[0]["data"]["children"][0]["data"];var l=j.selftext_html;if(j.url!=null&&(!l||l==""||l==null)){return infoHandler(j.url,i,c,a,d)}if(l==""||l==null){l=j.body_html}var l=$("<div />").html(l.replace("&lt;!-- SC_OFF --&gt;","").replace("&lt;!-- SC_ON --&gt;","")).text();if(l.length<700){i("<div class='infoDescription'>"+l+"</div>")}else{i("<div class='infoDescription heightRestriction'><div class='more'>Show More..</div><div class='desc'>"+l+"</div></div>",function(e){e.find(".more").one("click",function(){$(this.parentNode).removeClass("heightRestriction").css("height","auto")})})}}catch(k){}})}else{i("<div class='infoDescription'>"+g+"</div>");if(g.length<700){i("<div class='infoDescription'>"+g+"</div>")}else{i("<div class='infoDescription heightRestriction'><div class='more'>Show More..</div><div class='desc'>"+g+"</div></div>",function(e){e.find(".more").one("click",function(){$(this.parentNode).removeClass("heightRestriction").css("height","auto")})})}}}catch(f){i("<div class='infoDescription'>Error: Failed parsing reddit post.</div>")}}function parseDeviantArt(b,d,c,a){if(b.indexOf("#")!=-1){b="http://fav.me/"+(b+"/").match(/#\/(.*?)\//).pop()}b=!reddit().crossDomain?"http://backend.deviantart.com/oembed?url="+b+"&format=jsonp&callback=?":"http://backend.deviantart.com/oembed?url="+b+"&format=json";$.getJSON(b,function(e){parseImage(e.url,d,c,a)})}function parseInstagram(b,d,c,a){$.get((reddit().crossDomain?"":"http://api.reditr.com/sync/?forward=")+b,function(f){var e=f.match(/property="og:image" content="(.*?)"/i).pop();parseImage(e,d,c,a)})}function parseGfycat(b,e,c,a){var d=b.split("/").pop();parseImage("http://giant.gfycat.com/"+d+".gif",e,c,a)}function parseXkcd(a,b){$.get(a,function(d){var c=d.match(/<div id="comic"[\s\S]*?div>/i).pop().replace(/<img(.*?)>/,"<center><img$1></center>");b(c)})}function parsePostimage(a,b){$.get(a,function(d){var c=d.match(/<img [\s\S]*? \/>/i).pop();b(c)})}function parseWikipedia(c,g,e,d,a){var f=c.match(/(wiki\/|title=)(.*?)($|\/|#)/);if(f.length<3){return g("")}var b=f[2];$.getJSON(reddit().crossDomain?"http://en.wikipedia.org/w/api.php?action=parse&format=json":"http://en.wikipedia.org/w/api.php?action=parse&format=json&callback=?",{page:b,prop:"text|images",uselang:"en"},function(j){function n(p){$.get("http://api.reditr.com/sync/",{wikiImage:b},function(q){p(q)})}function m(q,t,r,p,s){if(!s){s=450}else{s-=100}if(s<50){return}else{parseImage(q,t,r,p,function(){m(q.replace(/[0-9]+px/,s+"px"),t,r,p,s)})}}if(j.parse&&j.parse.text){var o=$("<div>"+j.parse.text["*"]+"</div>");var l=o.find(".infobox img");var i=false;try{i=l.attr("src").replace(/^\/\//,"http://").replace(/[0-9]+px/,"450px")}catch(k){}if(i){h(i)}else{n(function(p){h(p)})}}else{if(e){return n(function(p){m(p,g,d,a)})}else{return g("")}}function h(q){if(e){return m(q,g,d,a)}var s=o.find("p");var r=s.first().html()+s.first().next().html();var r=r.replace(/<sup(.*?)<\/sup>/g,"").replace(/<a(\s[^>]*)?>(.*?)<\/a>/ig,"$2");l=q?"<img class='previewImage' style='float: left; margin-right: 10px; margin-bottom: 10px; max-height: 325px; max-width: 325px' data-thumb='"+q+"' />":"";g("<div class='infoDescription'> <div id='readability'><a href='http://www.readability.com/m?url="+c+"' target='blank'>Provided by Readability</a></div> <div class='title'>"+j.parse.title+"</div> "+l+"<div class='desc'> "+r+"</div> </div>",function(p){if(window.isChromePackaged){p.find("img:not(.l)").each(function(){var u=$(this);getImageBlob(u.attr("data-thumb"),function(v){u.attr("src",v);u.addClass("l")})})}else{var t=p.find(".previewImage");if(t.length>0){t[0].onerror=function(){t.remove()};t[0].onload=function(){p.find(".infoDescription").css("height",(t.height()+27)+"px")};t.attr("src",t.attr("data-thumb"))}}return"parseBareSource"},"bareSource")}})}function parseVimeo(a,c){var b=a.split("/")[3];if(window.isChromePackaged){c('<center><webview class="vimo" src="http://player.vimeo.com/video/'+b+'"></webview></center>')}else{c('<center><iframe class="vimo" src="http://player.vimeo.com/video/'+b+'"></iframe></center>')}}function parseTwitch(a,c){var b=a.split("/")[3];if(window.isChromePackaged){c("<div class='infoDescription'>Twitch.tv is not supported on this version of Reditr.</div>")}else{c('<object type="application/x-shockwave-flash" height="400" width="656" id="live_embed_player_flash" data="https://www.twitch.tv/widgets/live_embed_player.swf?channel='+b+'" bgcolor="#000000"><param name="allowFullScreen" value="true" /><param name="allowScriptAccess" value="always" /><param name="allowNetworking" value="all" /><param name="movie" value="https://www.twitch.tv/widgets/live_embed_player.swf" /><param name="flashvars" value="hostname=www.twitch.tv&channel='+b+'&auto_play=true&start_volume=25" /></object>')}}function parseMixcloud(a,b){$.getJSON("http://www.mixcloud.com/oembed",{url:a,format:"json"},function(d){var c=d.html.replace('src="//','src="https://').replace('value="//','value="https://');if(window.isChromePackaged){c=c.replace(/iframe/,"webview")}b(c)})}function parseSoundcloud(a,b){$.getJSON("https://soundcloud.com/oembed?callback=?",{format:"js",url:a,iframe:true},function(c){b(c.html)})}function parseBareSource(b,e,c,a,d){$.getJSON("https://www.readability.com/api/content/v1/parser"+(!reddit().crossDomain?"?callback=?":""),{url:b,token:"e97c4f658162139ec8e04c4cbb2e80518c66757f"},function(g){if(d){if(g.lead_image_url){return parseImage(g.lead_image_url,e,c,a)}else{return e("")}}var f=g.content.replace(/<img(.*?)>/g,"").replace(/<iframe>/g,"<center><iframe>").replace(/<\/iframe>/g,"</iframe></center>");e("<div class='infoDescription heightRestriction'> <div id='readability'><a href='http://www.readability.com/m?url="+b+"' target='blank'>Provided by Readability</a></div> <div class='title'>"+g.title+"</div> <img class='previewImage' style='float: left; margin-right: 10px; margin-bottom: 10px; max-height: 325px; max-width: 325px' data-thumb='"+g.lead_image_url+"' /><div class='more'>Show More..</div> <div class='desc'> "+f+"</div> </div>",function(h){h.find(".more").one("click",function(){$(this.parentNode).removeClass("heightRestriction").css("height","auto")});if(window.isChromePackaged){h.find("img:not(.l)").each(function(){var j=$(this);getImageBlob(j.attr("data-thumb"),function(k){j.attr("src",k);j.addClass("l")})})}else{var i=h.find(".previewImage");i[0].onerror=function(){i.remove()};i[0].onload=function(){h.find(".infoDescription").css("height",(i.height()+27)+"px")};i.attr("src",g.lead_image_url)}return"parseBareSource"},"bareSource")})}function infoHandler(b,i,c,j,g){var f=(i==false)?false:true;var h=b.toLowerCase();if(h.indexOf("instagram.com")!=-1){if(f){parseInstagram(b,i,c,j)}return true}else{if(h.indexOf("redditmedia.com")!=-1){if(f){parseImage(b,i,c,j)}}else{if(h.indexOf("reddituploads.com")!=-1){if(f){parseImage(b.replace(/&amp;/g,"&"),i,c,j)}}else{if(h.indexOf("/r/iama/comments/")!=-1&&h.indexOf("?")==-1&&(h.indexOf("request")==-1||h.indexOf("requested")>-1)){if(f){parseAMA(b,i,c,j)}return false}else{if(h.indexOf("deviantart.com")!=-1||h.indexOf("fav.me")!=-1){if(f){parseDeviantArt(b,i,c,j)}return true}else{if(h.indexOf("reddit.com/message")!=-1){var a=h.match(/messages\/(.*?).json/);parseRedditMessage(a[1],i)}else{if(h.indexOf("reddit.com/r/")!=-1){if(f){parseReddit(b,i,g,c,j)}return false}else{if(h.indexOf("wikipedia.org")!=-1){if(f){parseWikipedia(b,i,g,c,j)}return false}else{if(h.indexOf("imgur.com/a/")!=-1||h.indexOf("imgur.com/gallery/")!=-1){if(f){parseImgur(b,i,c,j)}return true}else{if(h.indexOf("tinypic.com/view.php?pic=")!=-1){b=b.replace("&amp;s","&s");if(f){parseTinyPic(b,i,c,j)}return true}else{if(h.indexOf("tinypic.com/r/")!=-1){var e=(h+"/").match(/\/r\/(.*?)\/(.*?)\//);if(f){parseTinyPic("http://tinypic.com/view.php?pic="+e[1]+"&s="+e[2]+"",i,c,j)}return true}else{if($.inArray(h.split(".").pop(),["png","jpg","jpeg","bmp","gif","tiff","gifv"])!=-1){if(f){parseImage(b,i,c,j)}return true}else{if(h.indexOf("imgur.com")!=-1){var d=b.match(/\/([^\/]*?)($|\?|_)/i)[1];if(f){parseImage("http://imgur.com/"+d+".png",i,c,j)}return true}else{if(h.indexOf("flickr.com")!=-1){if(f){parseFlickr(b,i,c,j)}return true}else{if(h.indexOf("youtube.com")!=-1){if(f){parseYoutube(b,i)}return true}else{if(h.indexOf("youtu.be")!=-1){if(f){parseYoutubeShortURL(b,i)}return true}else{if(h.indexOf("quickmeme.com")!=-1){var d=b.split("/")[4];if(f){parseImage("http://i.qkme.me/"+d+".jpg",i,c,j)}return true}else{if(h.indexOf("livememe.com")!=-1){if(f){parseImage(b+".gif",i,c,j)}return true}else{if(h.indexOf("qkme.me")!=-1){var d=b.replace("http://qkme.me","").replace(/\?id=[0-9]+/,"");if(f){parseImage("http://i.qkme.me/"+d+".jpg",i,c,j)}return true}else{if(h.indexOf("twitter.com")!=-1){if(f){parseTwitter(b,i)}return false}else{if(h.indexOf("xkcd.com")!=-1){if(f){parseXkcd(b,i)}return true}else{if(h.indexOf("gfycat.com")!=-1){if(f){parseGfycat(b,i,c,j)}return true}else{if(h.indexOf("vimeo.com")!=-1){if(f){parseVimeo(b,i)}return true}else{if(h.indexOf("mixcloud.com")!=-1){if(f){parseMixcloud(b,i)}return true}else{if(h.indexOf("soundcloud.com")!=-1){if(f){parseSoundcloud(b,i)}return true}else{if(h.indexOf("twitch.tv")!=-1){if(f){parseTwitch(b,i)}return true}else{if(h.indexOf("postimage.org")!=-1){if(f){parsePostimage(b,i,c,j)}return true}else{if(h.indexOf("puu.sh")!=-1){if(f){parseImage(b,i,c,j)}return true}else{if((h+"/").search(/\/r\/(.*?)\/$/)!=-1){if(f){parseSubreddit((h+"/").match(/\/r\/(.*?)\/$/).pop(),i)}return false}else{if(h.indexOf("steampowered.com")!=-1&&h.indexOf("cloud")!=-1){if(f){parseImage(b,i,c,j)}return true}else{if(f){parseBareSource(b,i,c,j,g)}return false}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}var body;$(document).ready(function(){body=$("body")});function smartContentPopupPrevent(a){if(window.preventPreviewClose){return}var d=a.attr("timeout");if(typeof d!="undefined"){clearTimeout(d)}var c=a.attr("p");if(typeof c=="undefined"){return}var b=$("#"+c);body.unbind("mousemove."+c);b.remove();a.removeAttr("p")}function smartContentPopup(a,e){if(window.preventPreviewClose){return}var d=a.attr("href");if(typeof d=="undefined"){d=a.attr("data-href")}if(typeof d=="undefined"){return false}if(typeof a.attr("p")!="undefined"){return}var c=a.attr("timeout");if(typeof c!="undefined"){clearTimeout(c)}var b=setTimeout(function(){var o=a.offset().left;var n=a.offset().top;var p=a.outerWidth();var i=a.outerHeight();var j=o;var h=n;var g=h+i;var r=body.outerWidth();var m=body.outerHeight();var l=r-(j+p);function k(u,s,x){if(typeof x=="undefined"){x=0}var w=s.outerWidth();var y=s.outerHeight();var v=(l>j)?(j+p):(j-w);var t=h-(y-i)/2;if(t<0){t=0}if((t+y)>m){t=m-y-30}s.css({left:v,top:t});if(x-->0){setTimeout(function(){k(u,s,x)},500)}}if(!window.preventPreviewClose){body.find(".smartContentPopup").not(f).remove()}var f,q;q=Date.now();a.attr("p",q);f=$('<div id="'+q+'" class="temp smartContentPopup" style="z-index: '+(window.shameful_popup_zindex++)+' !important"> <div class="loadingcss"></div> </div>').appendTo(body);k(a,f,0);infoHandler(d,function(t,v){f.html(t);if(typeof v=="function"){var s=v(f);var u=(s&&typeof s.TTL!="undefined")?s.TTL:5}else{var u=5}k(a,f,u);if(e){e()}},((l>j)?l:j)-30,m-30);body.bind("mousemove."+q,function(t){var s=a.offset();if(!window.preventPreviewClose&&(s.left>t.pageX||s.top>t.pageY||(s.left+a.width())<t.pageX||(s.top+a.height())<t.pageY)){body.unbind("mousemove."+q);f.remove();a.removeAttr("p")}})},500);a.attr("timeout",b)}function subReddits(a){a.setting("subredditBar",function(c){var b="#SubredditBar";if(!c){$(b).hide();$("#ColumnContainer, #leftNav").addClass("noSubredditBar");return}else{$("#ColumnContainer, #leftNav").removeClass("noSubredditBar");$(b).show()}a.subs(function(h){subredditBarExists=true;var o='<div class="Subreddit" style="display: none">QuickView</div><div class="Subreddit" style="display: none">'+h.join('</div><div class="Subreddit" style="display: none">')+"</div>";var l=$(b).html("");var p=$('<div id="less"></div>').appendTo(l);var r=$('<div id="content"></div>').appendTo(l);var n=$('<div id="more"></div>').appendTo(l);r.html($(o));var q=r.find(".Subreddit");var m=18;var g=18;function j(){if(f!=d){n.show()}else{n.hide()}if(f!=1){p.show()}else{p.hide()}}var f,k,d;function e(){var t=r.width()-m;var s=0;f=1;k=1;d=1;q.each(function(){var v=$(this);var u=s;s+=v.outerWidth()+3;if(s>t){k++;d++;s=v.outerWidth()+3+g;u=g}v.attr("data-subredpage",k).css({left:u,display:"none"})});j();$("[data-subredpage="+f+"]").show()}setTimeout(e,1000);var i;$(window).unbind("resize.subRedditBar").bind("resize.subRedditBar",function(){clearTimeout(i);i=setTimeout(function(){e()},500)});l.off();l.on("click","#more",function(s){q.hide();$("[data-subredpage="+(++f)+"]").show();j()});l.on("click","#less",function(s){q.hide();$("[data-subredpage="+(--f)+"]").show();j()});l.on("click",".Subreddit",function(){var t=$(this).text();if(t=="QuickView"){promptFancy(locale.Enter_name_of_subreddit,function(u){if(u==""||u==false||u==null){return}u=u.replace("/r/","");if(u.substr(0,2)=="r/"){u=u.substr(2)}s(u)})}else{s(t)}function s(u){a.setting("useQuickview",function(w){if(w){var v="/r/"+u+"/";new quickView(a,u,v)}else{a.getPosts("/r/"+u+"/.json",0,null,function(y){var x=y[0].data;window.location.href="#/Home/post/"+x.id+"/permalink/"+x.permalink.replace(/\//g,"~")+"/column/-r-"+u+"-/url/~r~"+u+"~/title/"+capitalize(u)+"/highlight/"+x.id},false)}})}})})})}(function(a){a.fn.reditor=function(d){var c=this;c.instance=Date.now();c.extend({get_selection:function(){var g=this.get(0);if("selectionStart" in g){var f=g.selectionEnd-g.selectionStart;return{start:g.selectionStart,end:g.selectionEnd,length:f,text:g.value.substr(g.selectionStart,f)}}},set_selection:function(f,h){var g=this.get(0);if("selectionStart" in g){g.focus();g.selectionStart=f;g.selectionEnd=h}return this.get_selection()},replace_selection:function(g){var i=this.get(0);selection=this.get_selection();var f=selection.start;var h=f+g.length;i.value=i.value.substr(0,f)+g+i.value.substr(selection.end,i.value.length);this.set_selection(f,h);return{start:f,end:h,length:g.length,text:g}},wrap_selection:function(f,k,j,h){var i=this.get_selection().text;var g=this.replace_selection(f+i+k);if(j!==undefined&&h!==undefined){g=this.set_selection(g.start+j,g.start+j+h)}else{if(i==""){g=this.set_selection(g.start+f.length,g.start+f.length)}}return g},cut:function(i,f){var h=this.val();var g=h.substr(0,i)+h.substr(f+1);this.val(g)},multiline:function(j){var f=this.get_selection();var k=f.text;var l=this.val();var h=j.length;var m=j.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");var n=new RegExp(m,"g");if(k.indexOf(j)!=-1){var o=k.split(j);var i=o.length;var g=k.replace(n,"");l=l.substr(0,f.start)+g+l.substr(f.end);this.val(l);c.set_selection(f.start,f.end-((i*h)-h))}else{var o=k.split(/\r|\r\n|\n/);var i=o.length;var g=j+k.replace(/\n\r?/g,"\n"+j);l=l.substr(0,f.start)+g+l.substr(f.end);this.val(l);this.set_selection(f.start,f.end+(h*i))}},destroy:function(){this.parent().off(".WYSIWYG"+this.instance)}});c.wrap('<div class="reditor" />');var b='<div class="ButtonGroup"> 						<a id="Bold" class="Button middle"><span class="icon-bold"></span><span class="tooltip">Bold</span></a>						<a id="Italic" class="Button middle"><span class="icon-italic"></span><span class="tooltip">Italic</span></a>						<a id="Quote" class="Button middle"><span class="icon-comments-alt"></span><span class="tooltip">Quote</span></a>						<a id="Strike" class="Button middle"><span class="icon-strikethrough"></span><span class="tooltip">Strikethrough</span></a>						<a id="Bullet" class="Button middle"><span class="icon-list"></span><span class="tooltip">List</span></a>						<a id="Link" class="Button middle"><span class="icon-link"></span><span class="tooltip">Link</span></a>						<a id="Code" class="Button middle">'+locale.Code+"</a>						"+(!d||!d.brief?'<a id="Promote" class="Button">'+locale.Promote_Reditr+"</a>":"")+'						<a id="Super" class="last Button">'+locale.Superscript+'</a>						<div class="clear"></div>					</div>';var e=c.parent();e.off("WYSIWYG");e.prepend(b);e.on("click.WYSIWYG"+c.instance,"#Bold",function(){var f=c.get_selection();var g=c.val();if(g.charAt(f.end)+g.charAt(f.end+1)=="**"&&g.charAt(f.start-1)+g.charAt(f.start-2)=="**"){c.cut(f.end,f.end+1);c.cut(f.start-2,f.start-1);c.set_selection(f.start-2,f.end-2)}else{c.wrap_selection("**","**",2,c.get_selection().text.length)}});e.on("click.WYSIWYG"+c.instance,"#Strike",function(){var f=c.get_selection();var g=c.val();if(g.charAt(f.end)+g.charAt(f.end+1)=="~~"&&g.charAt(f.start-1)+g.charAt(f.start-2)=="~~"){c.cut(f.end,f.end+1);c.cut(f.start-2,f.start-1);c.set_selection(f.start-2,f.end-2)}else{c.wrap_selection("~~","~~",2,c.get_selection().text.length)}});e.on("click.WYSIWYG"+c.instance,"#Promote",function(){c.replace_selection("[Reditr](http://reditr.com)")});e.on("click.WYSIWYG"+c.instance,"#Super",function(){var f=c.get_selection();var g=c.val();if(g.indexOf("^")==-1){g="^"+g.replace(/( |\n)/g,"$1^")}else{g=g.replace(/\^/g,"")}c.replace_selection(g)});e.on("click.WYSIWYG"+c.instance,"#Link",function(){var i=c.get_selection();var f=i.text;var j=c.val();if(j.charAt(i.start-1)=="["&&j.charAt(i.end)+j.charAt(i.end+1)=="]("){c.cut(i.start-1,i.start-1);var g=i.end-1;var h=i.end;while(j.charAt(h)!=")"){h++}c.cut(g,h-1);c.set_selection(i.start-1,i.end-1)}else{promptFancy("Please enter a URL:",function(k){if(!k){return}if(k!=null){c.wrap_selection("[","]("+k+")",1,i.text.length)}else{c.set_selection(i.start,i.end)}},"text","http://")}});e.on("click.WYSIWYG"+c.instance,"#Bullet",function(){c.multiline("* ")});e.on("click.WYSIWYG"+c.instance,"#Code",function(){c.multiline("    ")});e.on("click.WYSIWYG"+c.instance,"#Quote",function(){c.multiline(">")});e.on("click.WYSIWYG"+c.instance,"#Italic",function(){var f=c.get_selection();var g=c.val();if(g.charAt(f.end)=="*"&&g.charAt(f.end+1)!="*"&&g.charAt(f.start-1)=="*"&&g.charAt(f.start-2)!="*"){c.cut(f.end,f.end);c.cut(f.start-1,f.start-1);c.set_selection(f.start-1,f.end-1)}else{c.wrap_selection("*","*",1,c.get_selection().text.length)}});e.on("click.WYSIWYG",function(){c.change()});return this}})(jQuery);function gallery(d,e,c,f){this.connection=reddit();this.posts=[];this.currentPost=0;this.after=null;this.loadingNext=false;this.mode=e;this.stopLoadingNewPosts=false;this.otherPostLoaded=false;if(typeof c=="object"){this.selectedPost=c;this.callback=f}else{this.selectedPost==null;this.callback=c}var b=this;if(typeof d=="string"){var a=$('<div style="position: absolute; top: -1000px; opacity: 0;">').appendTo("body");this.columnObject=new d("/r/"+d+"/",undefined,a,reddit(),tabManagerObj,{SORT:"hot",SPECIAL:true},d).startup();this.callback=function(){b.columnObject.shutdown();delete b.columnObject}}else{this.columnObject=d}this.sort=this.columnObject.flags.SORT;this.startup()}gallery.prototype.startup=function(){var b=this;var a=$(".complexAlertBackdrop");if(!a.length){b.backdrop=$('<div class="complexAlertBackdrop" style="z-index: '+(window.shameful_popup_zindex++)+'"></div>').appendTo("body");setTimeout(function(){b.backdrop.addClass("animate")},10)}else{b.backdrop=a}var d=$(".complexAlertContainer");if(d.length){d.hide();d.each(function(){var e=$.data($(this)[0],"onDisappear");if(e){e()}});var c='<i class="icon-arrow-left"></i><span>&nbsp;&nbsp;'+locale.Back+"</span>"}b.playground=$('<div class="complexAlertContainer" id="galleryPlayground"> 		<div class="galleryButtons"> 		  <div class="buttongroup buttonContainer"><button class="galleryHome">'+locale.Gallery_Home+'</button> 		  <button class="copyLink openContainer">'+locale.Copy_URL+'</button> 		  <button class="visitLink openContainer">'+locale.View_Comments+'</button></div></div> 		<div data-message="close" id="closeGallery"></div> 		<div class="backButton"></div> 		<div class="galleryTitle"></div> 		<div class="galleryThumbs"><div class="loadingcss block"></div></div> 		<div class="galleryThumbsShadow"></div> 		<div class="galleryContent"></div> 		<div class="forwardButton"></div> 	</div>').appendTo("body");b.thumbContainer=b.playground.find(".galleryThumbs");b.postTitle=b.playground.find(".galleryTitle");b.postContent=b.playground.find(".galleryContent");b.buttons=b.playground.find(".galleryButtons");b.playground.on("click.gallery","#closeGallery, .galleryContent",function(){b.closeGallery()});b.playground.on("click.gallery",".forwardButton",function(){b.loadNext()});b.playground.on("click.gallery",".backButton",function(){b.loadPrev()});b.playground.on("click.gallery",".galleryHome",function(){b.defaultLayout()});b.playground.on("click.gallery",".copyLink",function(){b.copyLink()});b.playground.on("click.gallery",".visitLink",function(){b.openLink()});b.postTitle.on("click.gallery",".upVote",function(){b.upVote($(this))});b.postTitle.on("click.gallery",".downVote",function(){b.downVote($(this))});b.thumbContainer.on("click.gallery",".thumb",function(){var e=$(this).attr("id");if(b.posts.length-(e+1)<=5){b.loadMore(b.after)}b.singleLayout($(this).attr("id"))});b.playground.on("scroll.gallery",function(e){clearTimeout(b.scrollEvent);b.scrollEvent=setTimeout(function(){b.handleScroll(e)},500)});if(b.mode=="default"){b.defaultLayout()}else{if(b.mode=="fromPost"){b.fromPost()}}};gallery.prototype.fromPost=function(){var b=this;var a=[];var e=b.selectedPost;b.backdrop.addClass("animate");b.posts=[];b.after=b.columnObject.selector.find(".Post:last").prev().attr("name");var c=0;b.columnObject.selector.find(".Post").each(function(i,k){var j=$(this);if(typeof j.attr("data-href")!="undefined"){if(infoHandler(j.attr("data-href"),false)){var l=j.find(".Thumb").outerHTML()==""?'<div title="'+j.find(".Title").text()+'" class="noThumb"></div>':j.find(".Thumb").attr("title",j.find(".Title").text()).outerHTML();a.push('<div id="'+c+'" class="thumb '+(j.hasClass("current")?"selected":"")+' hide" href="'+j.attr("data-href")+'"><div class="thumbEffects">'+l+"</div></div>");var h=null;if(j.find(".upVote").hasClass("Likes")){h=true}else{if(j.find(".upVote").hasClass("DisLikes")){h=false}}if(j.attr("data-name")==e.attr("data-name")){b.currentPost=c}b.posts[c]={id:j.attr("data-postid"),permalink:j.attr("data-permalink"),likes:h,url:j.attr("data-href"),title:j.find(".Title").text(),score:j.find(".Score").text()};c++}}});var d=b.posts.length*90;b.thumbContainer.html(a.join("")).addClass("forceBottom").css("width",d+"px");var g=0;function f(){var j=$(window).height();var i=(Math.floor((b.posts.length*133)/$(window).width()))*133;var h=b.posts.length;b.getData(b.after,function(){b.thumbContainer.css("width",b.posts.length*90+"px").append(b.createPostBuffer(h));if(window.isChromePackaged){b.loadThumbs()}if(i<j&&g<=5){f()}});g++}f();b.buttons.show();b.highlight(b.currentPost)};gallery.prototype.handleScroll=function(){var b=this.playground;var c=b.scrollTop();var a=this;this.yScrollPos=c;if(b.height()-(c+b.height())<650&&!this.loadingNext){this.loadingNext=true;this.count+=25;a.loadMore(a.after)}};gallery.prototype.loadMore=function(){var a=this;a.loadingNext=true;var c=a.posts.length;var d=0;function b(e){if(a.posts.length-c<=5&&d<=5){a.getData(a.after,function(f){var g=a.createPostBuffer(e,false);if(window.isChromePackaged){a.loadThumbs()}setTimeout(function(){a.thumbContainer.append(g);if(a.thumbContainer.hasClass("forceBottom")){a.thumbContainer.css("width",(a.posts.length+25)*90+"px")}a.loadingNext=false;b(a.posts.length);d++},100)})}}b(c)};gallery.prototype.closeGallery=function(){var b=$(".complexAlertBackdrop");var a=this;setTimeout(function(){var d=$(".complexAlertContainer");if(d.length){var e=d.last();e.show();var c=$.data(e[0],"onReappear");if(c){c()}}else{a.backdrop.remove()}},200);this.stopLoadingNewPosts=true;this.playground.remove();this.playground=undefined;delete this};gallery.prototype.defaultLayout=function(){var a=this;var c=0;a.backdrop.addClass("animate");a.playground.find(".backButton, .forwardButton").hide();a.buttons.hide();if(a.thumbContainer.find(".thumb").length==0){a.posts=[];a.after=null;a.stopLoadingNewPosts=false;function b(){var g=$(window).height();var e=(Math.floor((a.posts.length*133)/$(window).width()))*133;var d=a.posts.length;var f=a.after;a.getData(a.after,function(){if(f==null){a.thumbContainer.html("")}a.thumbContainer.append(a.createPostBuffer(d));if(window.isChromePackaged){a.loadThumbs()}if(e<g&&!a.stopLoadingNewPosts&&c<=11){b()}});c++}b()}else{a.thumbContainer.removeClass("forceBottom").css("width","100%");a.playground.find(".backButton, .forwardButton").hide();a.postTitle.hide();a.postContent.hide();a.buttons.hide()}};gallery.prototype.loadNext=function(){if(!this.toggleCommentsButtonText(true)){this.toggleCommentsButtonText()}if(this.currentPost>=(this.posts.length-1)){this.highlight(this.posts.length-1)}else{if(this.currentPost>=(this.posts.length-25)){this.highlight(++this.currentPost);this.loadMore(self.after)}else{this.highlight(++this.currentPost)}}};gallery.prototype.loadPrev=function(){if(!this.toggleCommentsButtonText(true)){this.toggleCommentsButtonText()}if(this.currentPost==0){this.highlight(0)}else{this.highlight(--this.currentPost)}};gallery.prototype.singleLayout=function(b){var a=this;a.stopLoadingNewPosts=true;if(!a.thumbContainer.hasClass("forceBottom")){a.thumbContainer.addClass("forceBottom").css({width:(a.posts.length+25)*90+"px"});a.playground.find(".backButton, .forwardButton").show();a.postTitle.show();a.postContent.show();a.buttons.show()}setTimeout(function(){a.highlight(b)},225)};gallery.prototype.loadContent=function(c){var b=this;var d=b.posts[c];var a=d.url;b.postContent.contents().fadeOut(100,function(){$(this).parent().html('<div class="loadingcss block"></div>')});infoHandler(a,function(i,k){if(c==b.currentPost){b.postContent.html('<div class="contentAlign">'+i+'<div class="galleryPostComments"></div></div>');if(typeof k=="function"){var g=k(b.postContent);if(g.handledBy){var j=b.postContent.find("img");var f=j.width();var e=j.height();var h=true;j.draggable({start:function(){h=false},stop:function(){setTimeout(function(){h=true},250)}});j.on("click",function(l){l.stopPropagation();l.preventDefault();if(!h){return false}f*=1.2;e*=1.2;j.css("width",f+"px").css("height",e+"px");return false});j.on("contextmenu",function(l){l.stopPropagation();l.preventDefault();if(!h){return false}f*=0.8;e*=0.8;j.css("width",f+"px").css("height",e+"px");return false});j.on("mousewheel",function(o){o.preventDefault();o.stopPropagation();var l=o.originalEvent.wheelDeltaY;var m=f+(l/600)*f;var n=e+(l/600)*e;if(l<0&&(n<50||m<50)){return false}j.css("width",(f=m)+"px").css("height",(e=n)+"px");return false})}}}},b.playground.width()-200,b.playground.height()-240)};gallery.prototype.highlight=function(g){var d=this;d.currentPost=g;var c=d.thumbContainer.find("#"+g);var f=$(document).width();if(d.posts.length*90>f){var h=c.position().left-(f/2)+41;d.thumbContainer.css("left",-1*h+"px")}d.thumbContainer.find(".highlight").removeClass("highlight");c.addClass("highlight");var b=d.posts[g];var a="";if(b.likes==true){a="Likes"}else{if(b.likes==false){a="DisLikes"}}var e='<div class="Voting"><div class="controls"><div class="upVote '+a+'"></div><div class="Score">'+b.score+'</div><div class="downVote '+a+'"></div></div><div class="theTitle">'+c.find("div:not(.thumbEffects), img").attr("title")+"</div></div>";d.loadContent(g);d.setTitle(e)};gallery.prototype.setTitle=function(b){var a=this;a.postTitle.html(b)};gallery.prototype.createPostBuffer=function(e,d){var f=[];var j=this;var d=d||false;for(var c=e;c<j.posts.length;c++){var h=j.posts[c];var b='<div title="'+h.title.replace(/\"/g,"&quot;")+'" class="noThumb"></div>';var g="";if(h.thumbnail!=""&&h.thumbnail!="self"&&h.thumbnail!="default"&&h.thumbnail!="nsfw"){var a=(window.isChromePackaged?"data-thumb='"+h.thumbnail+"'":"src='"+h.thumbnail+"'");b='<img title="'+h.title.replace(/\"/g,"&quot;")+'" '+a+" />"}else{if(h.thumbnail=="self"||h.thumbnail=="default"||h.thumbnail=="nsfw"){b='<div title="'+h.title.replace(/\"/g,"&quot;")+'" class="'+h.thumbnail+'"></div>'}}f.push('<div id="'+c+'" class="thumb '+(d?"hide":"")+'" href="'+h.url+'"><div class="thumbEffects">'+b+"</div></div>")}return f.join("")};gallery.prototype.getData=function(b,c){var a=this;a.columnObject.fetchDataAfter(b,function(h){var d=h.length;var e=a.posts.length;for(var g in h){var f=h[g].data;if(a.isMedia(f.url)){a.posts[e]=h[g].data;e++}if(g=d-1){a.after=f.name}}if(typeof c=="function"){c(h)}})};gallery.prototype.isMedia=function(a){var b=a.toLowerCase();return infoHandler(b,false)};gallery.prototype.upVote=function(f){var b=this;var a=b.connection;var c=b.posts[b.currentPost];var e=f.parent();var h=e.children(".downVote:first");var g=e.children(".Score:first");if(!f.hasClass("Likes")){f.addClass("Likes");var d=(h.hasClass("DisLikes")?2:1);h.removeClass("DisLikes");g.text(parseInt(g.text())+d);a.upvote(c.id)}else{f.removeClass("Likes");h.removeClass("DisLikes");g.text(parseInt(g.text())-1);a.removevote(c.id)}};gallery.prototype.downVote=function(f){var b=this;var a=b.connection;var c=b.posts[b.currentPost];var e=f.parent();var h=e.children(".upVote:first");var g=e.children(".Score:first");if(!f.hasClass("DisLikes")){f.addClass("DisLikes");var d=(h.hasClass("Likes")?-2:-1);h.removeClass("Likes");g.text(parseInt(g.text())+d);a.downvote(c.id)}else{f.removeClass("DisLikes");h.removeClass("Likes");g.text(parseInt(g.text())+1);a.removevote(c.id)}};gallery.prototype.copyLink=function(){var a=this;var b=a.posts[a.currentPost];clipboard_set(b.url)};gallery.prototype.toggleCommentsButtonText=function(b){var a=this.playground.find(".visitLink");if(a.text()==locale.View_Comments){if(!b){a.text(locale.Close_Comments)}return true}else{if(!b){a.text(locale.View_Comments)}return false}};gallery.prototype.openLink=function(){if(this.toggleCommentsButtonText()){this.playground.addClass("commentsMode");var a=this.posts[this.currentPost];var b=new redditpost(a.id,a.permalink,this.playground.find(".galleryPostComments"),this.connection,this.columnObject)}else{this.playground.find(".galleryPostComments").html("");this.playground.removeClass("commentsMode")}};gallery.prototype.loadThumbs=function(){this.playground.find(".thumbEffects img:not(.l)").each(function(){var a=$(this);getImageBlob(a.attr("data-thumb"),function(b){a.attr("src",b);a.addClass("l")})})};function uploader(){var a=this;this.files=[];this.uploadContainer=$('<div id="uploadProgressContainer"></div>').appendTo("body");this.bufferIterator=0;this.isUploading=false;this.url="http://imgur.com/";this.imgIds=[];this.callback=undefined;this.startup()}uploader.prototype.startup=function(){var a=this;$(document).on("drop",function(b){b.preventDefault();a.createUploadBuffer(b)}).on("dragover",function(b){b.preventDefault()})};uploader.prototype.createUploadBuffer=function(b,c){var a=this;a.callback=c||undefined;a.files=(typeof b.originalEvent.dataTransfer=="undefined")?b.originalEvent.srcElement.files:b.originalEvent.dataTransfer.files;a.bufferIterator=0;a.runUploader(a.bufferIterator)};uploader.prototype.fileToBase64=function(b,c){var a=new FileReader();a.onload=function(f){var d=f.target.result;var e=btoa(d);c(e)};a.readAsBinaryString(b)};uploader.prototype.uploadImage=function(b,c,e){this.fileToBase64(b,function(f){$.ajax({url:"https://api.imgur.com/3/image",type:"POST",headers:{Authorization:"Client-ID 250fe7004d4ce11",Accept:"application/json"},xhr:function(){var g=new window.XMLHttpRequest();g.addEventListener("progress",c,false);return g},data:{image:f,type:"base64"},success:function(g){try{e(null,g.data.id)}catch(h){e(h)}},error:e})});return;var a=new FormData();a.append("image",b);a.append("key","5a9cc96a4bcaacb8cd50d0e5a89886db");var d=new XMLHttpRequest();d.open("POST","https://api.imgur.com/3/image");d.onload=e;d.upload.addEventListener("progress",c,false);d.send(a)};uploader.prototype.enqueueFile=function(a){this.files.push(a);this.runUploader(this.files.length-1)};uploader.prototype.runUploader=function(d){var a=this;a.isUploading=true;var c=a.files[d];var f="upload_"+Date.now();if(!c||!c.type.match(/image.*/)){if(typeof a.callback!="undefined"){a.callback(false)}return}var b=$('<div id="'+f+'" class="upload"><div class="fileName">'+c.name+'</div><span class="uploadProgress"><span class="percentage">0</span>%</span><div class="clearBoth"></div></div>').prependTo(a.uploadContainer);var e=b.find(".percentage");a.uploadImage(c,function(h){var g=Math.round(parseInt((h.loaded/h.total*100))*0.99);e.html(g)},function(h,g){e.html(100);a.handleFinishedUpload(g);b.fadeOut(350,function(){$(this).remove()})});if(a.files.length-1==d){a.isUploading=false}else{setTimeout(function(){a.runUploader(++a.bufferIterator)},10)}};uploader.prototype.handleFinishedUpload=function(d){var a=this.imgIds;a.push(d);var b=this;if(!b.isUploading&&$("#newPostPopup").length!=0){if($("#newPostPopup #Link").val().indexOf("imgur")!=-1){$("#newPostPopup #Link").val($("#newPostPopup #Link").val()+","+a.join(","))}else{$("#newPostPopup #Link").val(b.url+a.join(","))}}else{if(!b.isUploading&&$("#settingsPopup").length==0){createPost(null,reddit(),window.tabManagerObj,function(e){e.find("#Link").val(b.url+a.join(","))})}else{if(!b.isUploading){var c=a.length==1?".png":"";if(typeof b.callback!="undefined"){b.callback(b.url+a.join(",")+c)}}}}if(!b.isUploading){b.imgIds=[];b.files=[]}};function updateTopRightUsername(a){reddit().setting("showMyUsername",function(b){var c=reddit().user.username;if(a&&b){c=a}else{if(!reddit().loggedin){c=locale.Accounts}else{if(!b||!c){c=locale.Account}}}$("#Nav #accounts .redButton").html(c)})}function changeAccountSettings(a,c,b){if(typeof window.userNotifications=="undefined"){window.userNotifications=new notificationsCenter($("#notificationCounter"),a).startup()}else{window.userNotifications.restart()}if(b){subReddits(a)}applyShortcuts(a);window.karmaTracker.restart();updateTopRightUsername();reddit().setting("fontSize",function(d){$("head #fontSetting").remove();if(d==13){return}$("head").append('<style id="fontSetting"> 							.Column #PostContainer div.Post div.Title, .infoDescription, #CommentContent, .contentPreview { 							    font-size: '+d+"px !important; 							    line-height: "+(d*1.28578)+"px !important; 							} 							#ColumnContainer .Column #PostContainer div.Post .Domain { 							    font-size: "+(d*0.8571)+"px !important; 							} 							#ColumnContainer .Column #PostContainer div.Post .InfoBottom { 							    font-size: "+(d*0.8571)+"px !important; 							} 						 </style>")});reddit().setting("scrollBarWidth",function(d){$("head").append('<style type="text/css" id="scrollBarSettings"> 							::-webkit-scrollbar { 							    width: '+d+"px !important; 							} 							</style>")});reddit().setting("background",function(d){var e=$("#stripes");if(d==-1){e.css("background","none")}else{reddit().setting("backgrounds",function(f){if(window.isChromePackaged){getImageBlob(f[d]+".png",function(g){e.css("background","url("+g+") center center")})}else{e.css("background","url("+f[d]+".png) center center")}})}});reddit().setting("backgroundStretched",function(d){var e=$("#stripes");if(d){e.css("background-size","100% 100%")}else{e.css("background-size","auto")}});if(c){reddit().setting("theme",function(d){if(typeof d=="undefined"||d==""){d="light"}if(!window.themeChangeCount){window.themeChangeCount=0}var e="css/"+d+"/"+d+"-imports.css";if($('head link[src="'+e+'"]').length==0){load_css(e,function(){$("#theme_stylesheet"+(themeChangeCount-1)).remove()},{id:"theme_stylesheet"+(++themeChangeCount)})}if(d.toLowerCase().indexOf("dark")!=-1){$("link#dark").removeAttr("disabled");$("link#light").attr("disabled","disabled");$("body").addClass("darkTheme")}else{$("link#light").removeAttr("disabled");$("link#dark").attr("disabled","disabled");$("body").removeClass("darkTheme")}});reddit().setting("visual_animations",function(d){$('link[rel=stylesheet][href*="stylesheet_blockanimations"]').remove();if(!d){load_css("css/stylesheet_blockanimations.css")}})}setTimeout(function(){window.dispatchEvent(new Event("accountSwitch"))},150)}function navLogout(a){reddit().logout(function(){updateNav("person","guest");updateTopRightUsername();changeAccountSettings(a);window.location.href=(window.location.href.replace(/reload\/(.*?)\//,"")+"/reload/"+Date.now()).replace("//reload","/reload")})}function accountsPopup(d,b,a){if($("body").find("#accountsPopup").length!=0){$("body").find("#accountsPopup").off().remove();return}var f=Date.now();setTimeout(function(){$("body").one("click",function(){$("body").find('#accountsPopup[data-id="'+f+'"]').off().remove()})},250);var e=$('<div id="accountsPopup" class="menubarDropdown" data-id="'+f+'"> 						   	  <div data-action="new" class="text node">'+locale.Add_Account+"</div> 						   </div>").appendTo("body");var c=reddit().user.username;database.fetch("users",function(k){var j=c?c.toLowerCase():undefined;var g="";for(var h in k){g+="<div data-action='reddit' data-username='"+k[h].username+"' class='node "+((j==k[h].username)?"active":"inactive")+"'> 						 	 <div class='text'>"+k[h].username+"</div> 						 	 <div data-action='remove' class='option icon remove'></div> 						 </div>"}e.append(g)});e.on("click","div[data-action]",function(i){i.stopPropagation();i.preventDefault();e.remove();var g=this.getAttribute("data-action");if(g=="reddit"){var h=this.getAttribute("data-username");updateTopRightUsername(capitalize(h));if(reddit().user&&reddit().user.username&&h.toLowerCase()==reddit().user.username.toLowerCase()){updateTopRightUsername(locale.Accounts);reddit().logout(function(k){changeAccountSettings(b);window.location.href=(window.location.href.replace(/reload\/(.*?)\//,"")+"/reload/"+Date.now()).replace("//reload","/reload");updateNav("person","guest")});return}reddit().switchUser(h,function(){changeAccountSettings(b);updateNav("person","member");if(typeof window.userNotifications=="undefined"){window.userNotifications=new notificationsCenter($("#notificationCounter"),b)}else{window.userNotifications.restart()}sync_update(b);window.location.href=(window.location.href.replace(/reload\/(.*?)\//,"")+"/reload/"+Date.now()).replace("//reload","/reload")})}else{if(g=="remove"){var j=$(this).parent().find(".text").html();$.popup({title:"Account Removal",id:"confirmDeleteUser",message:"Are you sure you want to remove the account "+j+" from Reditr?",buttons:'<button data-message="close" class="left"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.No+'</span></button><button data-message="remove" class="right green"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Yes+"</span></button>"},function(l,k){if(l=="remove"){reddit().removeUser(j,false,function(){sync_update(b)})}return"close"})}else{if(g=="new"){addNewAccountPopup(b)}}}})}function addNewAccountPopup(b,e){var a='<div class="incontainer"> 							<input id="username" data-message="add" type="text" class="noShortcuts" placeholder="Reddit Username"> 						</div> 						<div class="incontainer"> 							<input id="password" data-message="add" class="nomargins" class="noShortcuts" placeholder="Reddit Password" type="password"> 						</div>';var d='<button class="right space green" data-message="add"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Add_Account+'</span></button> 				   <button class="left" data-message="close"><i class="icon-remove"></i><span>&nbsp;&nbsp;'+locale.Cancel+"</span></button>";var c=$.popup({id:"newAccountPopup",message:a,buttons:d},function(h,g){if(h=="add"&&!g.hasClass("loading")){g.addClass("loading");var i=$(this).find("#username").val();var f=$(this).find("#password").val();reddit().login(i,f,function(j){if(j=="RATELIMIT"){alert("Reddit has given you a rate limit error.");g.removeClass("loading");return}else{if(j=="WRONG_PASSWORD"){alert("You have entered an invalid password.");g.removeClass("loading");return}else{if(j=="ERROR"){alert("Reddit has returned an unknown error. Please try again later.");g.removeClass("loading");return}}}reddit().me(function(){c.closePopup();changeAccountSettings(b);handleSubscriptionsPopup(function(){sync_update(b);updateNav("person","member");window.location.href=(window.location.href.replace(/reload\/(.*?)\//,"")+"/reload/"+Date.now()).replace("//reload","/reload");if(e){e()}})})})}return h});if(reddit().apiVersion==2){c.find(".green").click()}}function handleSubscriptionsPopup(h){var d=[];var c='<div class="subredditSelector loading"> 							<div class="header">'+locale.Downloading_List_of_your_Subreddits+'<br><br><div class="icon-spinner icon-spin"></div></div> 							<figure class="loadingcss block"></figure> 						</div>';var e='<button class="right space green" data-message="add"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Save+"</span></button>";var f=false;var g=$.popup({id:"manageSubreddits",message:c,buttons:e},function(n,k){if(!f){return}if(n=="add"){k.addClass("loading");var i=10;var j=[];var l=b.find(".selected");var m=l.length;function o(){reddit().saveColumns(j);g.closePopup();h();setTimeout(function(){storageWrapper().fetch("syncTutorialRan",function(p){if(!p){storageWrapper().save("syncTutorialRan",true);tutorial("sync")}})},2000)}if(l.length==0){o()}l.each(function(p){j.push({url:this.getAttribute("data-url"),sort:"hot",title:this.getAttribute("data-title"),order:i,flags:{SORT:"hot",SPECIAL:false}});i+=10;if(p===m-1){o()}})}});var b=g.find(".subredditSelector");b.on("click",".subredditSelectorItem",function(){$(this).toggleClass("selected")});var a="";reddit().multis(function(i){if(typeof i!="undefined"&&typeof i[0]!="undefined"&&typeof i[0].data!="undefined"){a=i.map(function(j){return'<div data-url="/me/m/'+j.data.path.split("/m/").pop()+'/" data-title="'+j.data.name+'" class="selected subredditSelectorItem">'+j.data.name+"</div>"}).join("")}if(f){b.find("#addSubreddit_results").prepend(a)}});reddit().mine(function(k){d=k;f=true;var m=["<h3>"+(window.location.href.indexOf("Home")==-1?"The following subs will be available to you in the sidebar on the left!":"The selected subs will be columns!")+"</h3><div id='addSubreddit_results'>",a];for(var j in k){m.push('<div data-url="'+k[j].data.url+'" data-title="'+k[j].data.url.replace(/\/r\/(.*?)\//,"$1")+'" class="selected subredditSelectorItem">'+k[j].data.url+"</div>")}if(k.length==0){var l=reddit().defaultSubs;for(var j in l){m.push('<div data-url="/r/'+l[j]+'/" data-title="'+l[j]+'" class="selected subredditSelectorItem">/r/'+l[j]+"/</div>")}}m.push("</div>");b.removeClass("loading").html(m.join(""))})}window.version="0.3.2.2";window.build="B";function update(a){a.fetch("version",function(b){if(typeof b=="undefined"){a.save("version",window.version)}else{if(parseInt(b.replace(/\./g,""))<parseInt(window.version.replace(/\./g,""))){a.save("version",window.version);$.get("https://reditr.com/updatenotes/"+window.version+".php",function(d){var c=$.popup({id:"updatePopup",message:d},function(e){return e});!function(h,e,i){var g,f=h.getElementsByTagName(e)[0];if(!h.getElementById(i)){g=h.createElement(e);g.id=i;g.src="http://platform.twitter.com/widgets.js";f.parentNode.insertBefore(g,f)}}(document,"script","twitter-wjs")})}}})}function tutorial(a){var c;if(a=="stream"){c=[{selector:"#toggleStreamView",text:'<div class="tinyColumns"></div>You can view each subreddit as a column using Column View.'},{selector:"#leftNav .search",text:"Change to a different subreddit here."},{selector:".redButton",text:'<div class="accounts"></div>Add or change Reddit accounts by clicking the red button.'}]}else{if(a=="sync"){c=[{selector:".redButton",text:"Got multiple devices? We can sync that!",fn:function(e){var f=$("<button class='right green space prime'>Setup Sync</button>");f.click(function(){d.click();new settingsPopup(connection,window.tabManagerObj,"sync")});var d=e.find('[data-message="skip"]');d.text("No thanks");d.before(f)}}]}else{c=[{selector:"#addColumn",text:'<div class="tinyColumns"></div>Subreddits are displayed in Reditr as columns. You can add a new column in the sidebar, open up a custom subreddit & make a new post after you login.'},{selector:"#pageSelector",text:'<div class="repositionColumns"></div>Your columns are spread out on pages, click the head on the right to re-organize columns.'},{selector:".redButton",text:'<div class="accounts"></div>You can add or change Reddit accounts by clicking the red button.'},{selector:".Sorter",text:'<div class="sortOptions"></div>Click this top right button in a column to change the sort type of a column, or click the gear to change a column\'s settings.'}]}}function b(e){var f="";if(e<c.length-1){f="<button data-message='close' class='right green space prime'>Next Tip</button><button data-message='skip' class='right red space'>Skip Tutorial</button>"}else{f="<button data-message='skip' class='right red space prime'>Start using Reditr :)</button>"}var d=new quickText({bindTo:$(c[e].selector),initialContent:'<div class="tutorialText">'+c[e].text+"</div>",buttons:f},function(h){this.close();if(h!="skip"&&++e!=c.length){b(e)}});var g=$(d.dom_popup);g.find("button.prime").focus();if(c[e].fn){c[e].fn(g)}}b(0)}(function(N){function M(f,e){var h=(f&65535)+(e&65535),g=(f>>16)+(e>>16)+(h>>16);return g<<16|h&65535}function L(d,c){return d<<c|d>>>32-c}function K(b,l,k,j,i,c){return M(L(M(M(l,b),M(j,c)),i),k)}function J(i,d,n,m,l,k,j){return K(d&n|~d&m,i,d,l,k,j)}function I(i,d,n,m,l,k,j){return K(d&m|n&~m,i,d,l,k,j)}function H(i,d,n,m,l,k,j){return K(d^n^m,i,d,l,k,j)}function G(i,d,n,m,l,k,j){return K(n^(d|~m),i,d,l,k,j)}function F(P,O){P[O>>5]|=128<<O%32,P[(O+64>>>9<<4)+14]=O;var t,s,r,q,h,g=1732584193,f=-271733879,e=-1732584194,b=271733878;for(t=0;t<P.length;t+=16){s=g,r=f,q=e,h=b,g=J(g,f,e,b,P[t],7,-680876936),b=J(b,g,f,e,P[t+1],12,-389564586),e=J(e,b,g,f,P[t+2],17,606105819),f=J(f,e,b,g,P[t+3],22,-1044525330),g=J(g,f,e,b,P[t+4],7,-176418897),b=J(b,g,f,e,P[t+5],12,1200080426),e=J(e,b,g,f,P[t+6],17,-1473231341),f=J(f,e,b,g,P[t+7],22,-45705983),g=J(g,f,e,b,P[t+8],7,1770035416),b=J(b,g,f,e,P[t+9],12,-1958414417),e=J(e,b,g,f,P[t+10],17,-42063),f=J(f,e,b,g,P[t+11],22,-1990404162),g=J(g,f,e,b,P[t+12],7,1804603682),b=J(b,g,f,e,P[t+13],12,-40341101),e=J(e,b,g,f,P[t+14],17,-1502002290),f=J(f,e,b,g,P[t+15],22,1236535329),g=I(g,f,e,b,P[t+1],5,-165796510),b=I(b,g,f,e,P[t+6],9,-1069501632),e=I(e,b,g,f,P[t+11],14,643717713),f=I(f,e,b,g,P[t],20,-373897302),g=I(g,f,e,b,P[t+5],5,-701558691),b=I(b,g,f,e,P[t+10],9,38016083),e=I(e,b,g,f,P[t+15],14,-660478335),f=I(f,e,b,g,P[t+4],20,-405537848),g=I(g,f,e,b,P[t+9],5,568446438),b=I(b,g,f,e,P[t+14],9,-1019803690),e=I(e,b,g,f,P[t+3],14,-187363961),f=I(f,e,b,g,P[t+8],20,1163531501),g=I(g,f,e,b,P[t+13],5,-1444681467),b=I(b,g,f,e,P[t+2],9,-51403784),e=I(e,b,g,f,P[t+7],14,1735328473),f=I(f,e,b,g,P[t+12],20,-1926607734),g=H(g,f,e,b,P[t+5],4,-378558),b=H(b,g,f,e,P[t+8],11,-2022574463),e=H(e,b,g,f,P[t+11],16,1839030562),f=H(f,e,b,g,P[t+14],23,-35309556),g=H(g,f,e,b,P[t+1],4,-1530992060),b=H(b,g,f,e,P[t+4],11,1272893353),e=H(e,b,g,f,P[t+7],16,-155497632),f=H(f,e,b,g,P[t+10],23,-1094730640),g=H(g,f,e,b,P[t+13],4,681279174),b=H(b,g,f,e,P[t],11,-358537222),e=H(e,b,g,f,P[t+3],16,-722521979),f=H(f,e,b,g,P[t+6],23,76029189),g=H(g,f,e,b,P[t+9],4,-640364487),b=H(b,g,f,e,P[t+12],11,-421815835),e=H(e,b,g,f,P[t+15],16,530742520),f=H(f,e,b,g,P[t+2],23,-995338651),g=G(g,f,e,b,P[t],6,-198630844),b=G(b,g,f,e,P[t+7],10,1126891415),e=G(e,b,g,f,P[t+14],15,-1416354905),f=G(f,e,b,g,P[t+5],21,-57434055),g=G(g,f,e,b,P[t+12],6,1700485571),b=G(b,g,f,e,P[t+3],10,-1894986606),e=G(e,b,g,f,P[t+10],15,-1051523),f=G(f,e,b,g,P[t+1],21,-2054922799),g=G(g,f,e,b,P[t+8],6,1873313359),b=G(b,g,f,e,P[t+15],10,-30611744),e=G(e,b,g,f,P[t+6],15,-1560198380),f=G(f,e,b,g,P[t+13],21,1309151649),g=G(g,f,e,b,P[t+4],6,-145523070),b=G(b,g,f,e,P[t+11],10,-1120210379),e=G(e,b,g,f,P[t+2],15,718787259),f=G(f,e,b,g,P[t+9],21,-343485551),g=M(g,s),f=M(f,r),e=M(e,q),b=M(b,h)}return[g,f,e,b]}function E(e){var d,f="";for(d=0;d<e.length*32;d+=8){f+=String.fromCharCode(e[d>>5]>>>d%32&255)}return f}function D(e){var d,f=[];f[(e.length>>2)-1]=undefined;for(d=0;d<f.length;d+=1){f[d]=0}for(d=0;d<e.length*8;d+=8){f[d>>5]|=(e.charCodeAt(d/8)&255)<<d%32}return f}function C(b){return E(F(D(b),b.length*8))}function B(i,h){var n,m=D(i),l=[],k=[],j;l[15]=k[15]=undefined,m.length>16&&(m=F(m,i.length*8));for(n=0;n<16;n+=1){l[n]=m[n]^909522486,k[n]=m[n]^1549556828}return j=F(l.concat(D(h)),512+h.length*8),E(F(k.concat(j),640))}function A(g){var f="0123456789abcdef",j="",i,h;for(h=0;h<g.length;h+=1){i=g.charCodeAt(h),j+=f.charAt(i>>>4&15)+f.charAt(i&15)}return j}function z(b){return unescape(encodeURIComponent(b))}function y(b){return C(z(b))}function x(b){return A(y(b))}function w(d,c){return B(z(d),z(c))}function v(d,c){return A(w(d,c))}function u(e,d,f){return d?f?w(d,e):v(d,e):f?y(e):x(e)}"use strict",typeof define=="function"&&define.amd?define(function(){return u}):N.md5=u})(this);window.noAdsUntil=0;function sync_status(a,b){a.fetch("sync_enabled",function(c){b(c?true:false)})}function sync_recovery(b,a,c){$.post("http://sync.reditr.com/",{action:"recovery",email:b},function(d){c(d)})}function sync_logout(){database.remove("sync_username");database.remove("sync_password");database.remove("sync_lastupdate");database.remove("sync_enabled")}function sync_setup(c,b,a,f){var e=a.database;var d=md5("@(&TH3f2F)"+b);$.post("http://sync.reditr.com/",{action:"login",email:c,password:d},function(g){if(g=="success"){e.save("sync_username",c,function(){e.save("sync_password",d,function(){e.save("sync_enabled",true,function(){e.save("sync_lastupdate","0",function(){if(typeof f=="function"){f(g)}})})})})}else{if(g=="empty"){if(typeof f=="function"){f(g)}return}else{$.post("http://sync.reditr.com/",{action:"register",email:c,password:d},function(h){if(h=="empty"||h=="taken"||h=="invalid_email"){f(h);return}else{if(h=="success"){e.save("sync_username",c,function(){e.save("sync_password",d,function(){e.save("sync_enabled",true);if(typeof f=="function"){f(h)}})})}}})}}})}function sync_sync(a,c){var b=a.database;b.fetch("sync_enabled",function(d){if(!d){if(typeof c=="function"){c()}return}b.fetch("sync_username",function(e){b.fetch("sync_password",function(f){b.fetch("sync_lastupdate",function(g){$.post("http://sync.reditr.com/?new",{action:"sync",email:e,password:f,lastupdate:g},function(m){var l=m.substr(0,10);m=m.substr(10);if(m==""){c("success")}else{if(m=="empty"||m=="invalid_login"){alert("Pleaase re-configure your sync settings!");if(typeof c=="function"){c("success")}}else{if(m==""){sync_update(a,c)}else{if(m.substr(0,1)=="n"){if(typeof c=="function"){c("success")}}else{var k=m.indexOf("{")>-1?true:false;var j="";for(var h=0;h<20;h++){if(!isNaN(m[h])){j+=m[h]}else{if(k){m=m.substr(h)}break}}b.save("sync_lastupdate",l);sync_applyChanges(a,m,c)}}}}})})})})})}function sync_applyChanges(a,d,e){var c=a.database;var d=JSON.parse(d);for(var b in d){c.save(b,d[b])}if(typeof e=="function"){e("success")}}function sync_update(a,c){var b=a.database;b.fetch("sync_enabled",function(e){if(!e){return}var d={};b.fetch("users",function(k){b.fetch("reddit_activeuser",function(i){d.reddit_activeuser=i});d.users=k;for(var f in k){g(f)}var j=0;function g(m){b.fetch(m,function(i){d[m]=i});var l=m+"_columns";b.fetch(l,function(i){d[l]=i});var o=m+"_tags";b.fetch(o,function(i){d[o]=i});var n=m+"_savedComments";b.fetch(n,function(i){d[n]=i});var p=m+"_subs";b.fetch(p,function(i){if(typeof p!="undefined"){d[p]=i}clearTimeout(j);j=setTimeout(h,3000)})}function h(){saveString=JSON.stringify(d);b.fetch("sync_username",function(i){b.fetch("sync_password",function(l){$.post("http://sync.reditr.com/",{action:"sync",email:i,password:l,data:saveString},function(m){if(m=="empty"||m=="invalid_login"){alert("Pleaase re-configure your sync settings!");if(typeof c=="function"){c("success")}}else{if(m.indexOf("time:")!=-1){var n=m.match(/time:(.*?):/).pop();b.save("sync_lastupdate",n);if(typeof c=="function"){c("success")}}}})})})}})})}function quickView(c,i,b,a,d){var j=this;this.connection=c;this.displayFlags=(typeof a=="undefined")?{SPECIAL:true,TEMP:true}:a;this.addColumnFlags=(typeof d=="undefined")?{SORT:"hot"}:d;this.title=i;var g='<div class="Viewport"></div>';var h='<div id="subRedditsBottomPane" class="left"> 						<div data-message="startGallery" id="galleryIcon" class="bottomIcon"><i class="icon-camera"></i> 							<div class="desc">'+locale.Gallery+'</div> 						</div> 						<div data-message="newRandom" id="randomIcon" class="bottomIcon"><i class="icon-random"></i> 							<div class="desc">'+locale.Random+'</div> 						</div> 						<div data-message="goBack" id="goBack" class="icon-circle-arrow-left bottomIcon" style="display: none"> 							<div class="desc">'+locale.Go_Back+'</div> 						</div> 						<div data-message="goForward" id="goForward" class="icon-circle-arrow-right bottomIcon" style="display: none"> 							<div class="desc">'+locale.Go_Forward+'</div> 						</div> 				   </div> 				   <div class="right"> 				   		  <button data-message="close" class="right space">[suggestedCloseText]</button> 				   		  <button data-message="addColumn" class="right green space"><i class="icon-ok"></i><span>&nbsp;&nbsp;'+locale.Add_Column+'</span></button> 				   		  <button data-message="newPost" class="right"><i class="icon-pencil"></i><span>&nbsp;&nbsp;'+locale.New_Post+"</span></button> 				   </div>";var f=null;f=this.thisPopup=$.popup({id:"subredditPopup",message:g,buttons:h,sidebar:"<div class='loadingcss icon-spin'></div>"},function(m,l){return j.eventHandler.call(j,m,l)});this.backArray=[];this.forwardArray=[];this.goForwardTimeout=null;this.goBackTimeout=null;var k=this.workingColumn=new column(b,f.find(".Viewport"),activePlayground,c,false,this.displayFlags,capitalize(i)).startup();var e=k.openPost;k.openPost=function(l){f.closePopup();e.call(k,l)};f.find(".sidebar .content").html('<div id="subStats"></div> <div id="subDesc"></div>');this.sidebar=f.find(".sidebar .content #subDesc").on("click","a",function(m){m.preventDefault();m.stopPropagation();var l=$(this).attr("href");if((l+"/").search(/\/r\/(.*?)\/$/i)!=-1&&l.search(/\/r\/(.*?)\/(.+?)/i)==-1){var n=(l+"/").match(/\/r\/(.*?)\//i).pop();j.goForward(n)}else{redditpost.prototype.clickLink(l,m,function(o){if(o){k.shutdown(function(){f.closePopup()})}})}return false});this.setPopupStats(i);this.changeSidebar(i,2)}quickView.prototype.eventHandler=function(e,c){var b=this.workingColumn;if(e=="newPost"){e="close";var a=this;setTimeout(function(){createPost(undefined,connection,window.tabManagerObj,undefined,capitalize(a.title))},250)}else{if(e=="addColumn"){var a=this;var f=tabManagerObj.insert(function(g){return new column(a.workingColumn.url,g,activePlayground,a.connection,this,a.addColumnFlags,capitalize(a.title))},"SYNC");tabManagerObj.lastPage();$().closePopup(true)}else{if(e=="goForward"){this.goForward()}else{if(e=="goBack"){this.goBack()}else{if(e=="newRandom"){var d=this.thisPopup.find("#randomIcon");if(d.hasClass("icon-refresh")){return}d.hide();this.changeSidebar(null,1);var a=this;this.connection.randomSubreddit(function(g){a.goForward(g);d.show()})}else{if(e=="startGallery"){var a=this;setTimeout(function(){a.workingColumn.openGallery()},100);e="close"}}}}}}if(e=="close"){this.workingColumn.shutdown()}return e};quickView.prototype.changeSidebar=function(d,b){var c=this.sidebar;if(typeof b=="undefined"||b==1){c.html('<div class="loadingcss">')}if(typeof b=="undefined"||b==2){if(d=="Favourites"){c.html('<div class="title">Fav. Comments</div>');var a=$("<div></div>").appendTo(c);this.pullFavourites(a)}else{this.connection.sidebar(d,function(e){c.html('<div class="title">/r/'+capitalize(d)+"</div>"+e)})}}};quickView.prototype.pullFavourites=function(a){var b=this.connection;b.favouriteComments(function(e){for(var c in e){var d=e[c];if(d==true){continue}a.append('<div class="item loading"><div class="loadingcss"></div></div>');$.getJSON(reddit.prototype.base+d.replace(".json",reddit.prototype.jsonextension),function(g){var i=g[1].data.children[0].data;var h=g[0].data.children[0].data;if(window.location.hash.indexOf("Stream")>-1){var f="#/Stream/post/~r~"+h.subreddit.toLowerCase()+"~/url/"+h.permalink.replace(/\//g,"~")+i.id+"~"}else{var f="#/Home/post/"+h.id+"/permalink/"+h.permalink.replace(/\//g,"~")+i.id+"~/column/-r-"+h.subreddit.toLowerCase()+"-/title/"+capitalize(h.subreddit)+"/url/~r~"+h.subreddit.toLowerCase()+"~/sort/hot/highlight/"+h.id}a.find(".loading").first().replaceWith('<div class="item" link="'+f+'"><div class="author">'+i.author+'</div><div class="message">'+$("<div />").html(i.body_html.replace("&lt;!-- SC_OFF --&gt;","").replace("&lt;!-- SC_ON --&gt;","")).text()+'</div><div class="delete icon-remove" id="'+i.id+'"></div></div>')})}});a.on("click",".item:not(.loading)",function(c){c.preventDefault();c.stopPropagation();window.location.href=$(this).attr("link");return false});a.on("click",".item .delete",function(d){d.preventDefault();d.stopPropagation();var c=$(this);b.unsaveComment(c.attr("id"));c.parent().remove();return false})};quickView.prototype.goForward=function(c){var a=this;var b=this.thisPopup;clearTimeout(this.goForwardTimeout);this.goForwardTimeout=setTimeout(function(){var f=a.forwardArray;var g=a.backArray;var d=b.find("#goBack");var e=b.find("#goForward");if(typeof c!="undefined"){f=[];e.hide();g.push(a.title);a.title=c}else{c=f.pop();if(!f.length){e.hide()}g.push(a.title);a.title=c}d.show();a.workingColumn.setUrl("/r/"+c+"/");a.changeSidebar(c);a.setPopupStats(c);b.find("#text").html(c)},500)};quickView.prototype.goBack=function(){var a=this;var b=this.thisPopup;clearTimeout(this.goBackTimeout);this.goBackTimeout=setTimeout(function(){var e=a.forwardArray;var g=a.backArray;var c=b.find("#goBack");var d=b.find("#goForward");var f=g.pop();if(!g.length){c.hide()}e.push(a.title);a.title=f;d.show();a.workingColumn.setUrl("/r/"+f+"/");a.changeSidebar(f);a.setPopupStats(f);b.find("#text").html(f)})};quickView.prototype.setPopupStats=function(b){if(b=="Favourites"){this.thisPopup.find("#subStats").hide().html("");return}else{this.thisPopup.find("#subStats").show()}var a=this;this.connection.subredditAbout(b,function(d){var c="<div class='item'> 					  	<div class='title'>Subscribed</div> 					  	<div class='data'>"+d.subscribers+"</div> 					  </div> 					  <div class='item'> 					  	<div class='title'>Active Users</div> 					  	<div class='data'>"+d.accounts_active+"</div> 					  </div> 					  <div class='item'> 					  	<div class='title'>Created On</div> 					  	<div class='data'>"+formatDate(d.created_utc)[0]+"</div> 					  </div>";a.thisPopup.find("#subStats").html(c)})};function karmaWatcher(b,a){this.connection=b;this.karmaContainer=a;this.started=false;this.updateInterval=null}karmaWatcher.prototype.restart=function(){if(!this.started&&this.connection.loggedin){this.start()}else{if(!this.started&&!this.connection.loggedin){return}else{if(this.started&&!this.connection.loggedin){this.kill();return}else{if(this.started&&this.connection.loggedin){this.kill();this.start()}}}}};karmaWatcher.prototype.getStats=function(b){var a=this;reddit().me(function(){a.comment_karma=a.connection.user.comment_karma;a.link_karma=a.connection.user.link_karma;a.updateUI();if(typeof b=="function"){b()}})};karmaWatcher.prototype.updateUI=function(){var a="<div class='seperator'></div> 				<div class='commentKarma'> 					<span class='stats'>"+numberWithCommas(this.comment_karma)+"</span> 					<i class='icon-comments' /> 				</div> 				<div class='seperator'></div> 				<div class='linkKarma'> 					<span class='stats'>"+numberWithCommas(this.link_karma)+"</span> 					<i class='icon-link' /> 				</div>";this.karmaContainer.html(a);this.karmaContainer.off(".karma").on("click.karma",function(){quickSearch("u:"+reddit().user.username,true,reddit(),window.tabManagerObj,undefined,function(b){b.css({right:"55px","border-bottom-right-radius":"10px"})},false)})};karmaWatcher.prototype.start=function(){var a=this;this.started=true;a.comment_karma=a.connection.user.comment_karma;a.link_karma=a.connection.user.link_karma;a.updateUI();a.updateInterval=setTimeout(function(){a.updateUI()},60000)};karmaWatcher.prototype.kill=function(){this.started=false;clearInterval(this.updateInterval)};function quickText(b,c){if(b.bindTo&&b.bindTo.context){b.bindTo=b.bindTo[0]}this.options=b;this.callback=c;this.visible=true;var a=this;this.__defineGetter__("contentHTML",function(){return a.dom_popup.innerHTML});this.__defineGetter__("el",function(){return a.dom_popup});this.__defineSetter__("contentHTML",function(d){a.dom_popup.innerHTML='<div style="padding: 5px; min-height: 40px">'+d+'</div> <div class="arrow_'+(a.popupSide=="left"?"right":"left")+'"></div>';a.positionPopup()});this.draw()}quickText.prototype.defaultOptions={bindTo:document,formattingOptions:true,letterCount:true,autoExpandHeight:true,background:true,initialContent:"",css:undefined,buttons:""};quickText.prototype.getOption=function(a){return typeof this.options[a]!="undefined"?this.options[a]:this.defaultOptions[a]};quickText.prototype.draw=function(){var a=this;var d=a.dom_popup=document.createElement("DIV");var b=this.getOption("css");if(b){var c=$.map(b,function(g,f){return f+":"+g+";"}).join("");d.setAttribute("style",d.getAttribute("style")+"; "+c)}var e=document.querySelector(".quickTextPopupContainer");if(e){e.parentNode.removeChild(e)}storageWrapper.prototype.fetch("savedText",function(f){if(!f){f=""}if(a.dom_popupContainer){a.dom_popupContainer.parentNode.removeChild(a.dom_popupContainer);delete a.dom_popupContainer;delete a.dom_popup}var h=a.dom_popupContainer=document.createElement("DIV");h.className="quickTextPopupContainer";if(a.getOption("background")){h.style.position="absolute";h.style.top="0px";h.style.bottom="0px";h.style.left="0px";h.style.right="0px"}else{d.style.zIndex="99999999999999999999999999999999999999"}d.className="popup";d.style.position="absolute";if(a.getOption("initialContent")!=""){var i=a.getOption("buttons");d.innerHTML='<div class="arrow_right"></div><div style="padding: 8px;'+(i!=""?"padding-bottom: 3px":"min-height: 40px")+'">'+a.getOption("initialContent")+"</div>"+(i!=""?'<div class="bottomControls">'+i+"</div>":"")}else{d.innerHTML='<textarea placeholder="Type your message here :)">'+f+'</textarea> 								   <div class="arrow_right"></div> 								   <div class="bottomControls"> 								   		<div class="wordCount">'+(f.length==0?"":f.length)+'</div> 								   		<button data-message="submit" class="green right space"><i class="icon-ok" data-message="submit"></i><span data-message="submit">&nbsp;Submit</span></button> 								   		<button data-message="close" class="red right space"><i class="icon-remove" data-message="close"></i><span data-message="close">&nbsp;Cancel</span></button> 								   		<div style="clear: both"></div> 								   </div>'}h.appendChild(d);document.body.appendChild(h);if(a.getOption("initialContent")==""){var g=a.textarea=d.querySelector("textarea");setTimeout(function(){g.focus()},250);a.wordCount=d.querySelector(".wordCount");if(a.getOption("formattingOptions")){$(g).reditor({brief:true})}}a.positionPopup();setTimeout(function(){a.positionPopup()},500);a.bindings(true)});this.windowResize=function(){a.positionPopup()};window.addEventListener("resize",this.windowResize)};quickText.prototype.loading=function(a){var b=this.dom_popup.querySelector('[data-message="submit"]');if(a){b.className+=" loading "}else{b.className=b.className.replace(" loading ","")}};quickText.prototype.bindings=function(a){if(!a){window.removeEventListener("resize",this.windowResize);return}var b=this;var c=this.wordCount;if(this.textarea){this.textarea.onkeyup=function(d){c.innerHTML=d.target.value.length}}this.dom_popupContainer.addEventListener("click",function(g){g.preventDefault();g.stopPropagation();var f=g.target;if(f.className=="quickTextPopupContainer"){if(b.textarea){storageWrapper.prototype.save("quickText_text",b.textarea.value)}if(b.callback){var h=b.callback.call(b,false)}}for(var d=0;d<10;d++){if(!f.parentNode||f.getAttribute("data-message")){break}f=f.parentNode}if(f.getAttribute("data-message")=="close"){if(b.callback){var h=b.callback.call(b,false)}}else{if(f.getAttribute("data-message")=="submit"&&f.className.indexOf(" loading ")==-1){storageWrapper.prototype.remove("quickText_text");if(b.callback){var h=b.callback.call(b,b.textarea.value)}}else{if(f.getAttribute("data-message")){b.callback.call(b,f.getAttribute("data-message"),f,g)}}}if(h){b.close()}return false})};quickText.prototype.close=function(){this.bindings(false);this.dom_popupContainer.parentNode.removeChild(this.dom_popupContainer)};quickText.prototype.show=function(){if(!this.visible){this.dom_popup.style.display="block";this.visible=true}};quickText.prototype.hide=function(){if(this.visible){this.dom_popup.style.display="none";this.visible=false}};quickText.prototype.positionPopup=function(o){var j=this.dom_popup;var o=o?o:this.getOption("bindTo");var b=document.body.clientWidth;var d=document.body.clientHeight;var i=o.clientWidth;var m=o.clientHeight;var e=$(o).offset();var f=e.top;var n=e.left;var k=j.clientWidth;var h=j.clientHeight;if(h+100>d&&d>200){j.style.maxHeight=(d-100)+"px";j.style.overflowY="scroll"}else{j.style.overflowY="visible";delete j.style.maxHeight}this.popupSide=n>b-n-i?"left":"right";var c=this.popupSide=="left"?n-k-15:n+i+15;if(c<0){c=0}if(c+k>b){c-=c+k-b}var l=j.querySelector(".arrow_right, .arrow_left");if(this.popupSide=="right"){l.className="arrow_left"}var a=f-(h-m)/2;if(a<5){a=5}else{if(a+h>d-5){a=d-h-5}}var g=f-a+(m/2);if(g<22){g=22}if(h-g<22){g=h-22}l.style.top=g+"px";j.style.top=a+"px";j.style.left=c+"px"};var doNotIndexLextURLChange=false;var backwardHistory=[window.location.href];var forwardHistory=[];window.addEventListener("hashchange",function(){if(!doNotIndexLextURLChange){backwardHistory.push(window.location.href)}else{doNotIndexLextURLChange=false}});window.betterHistory={back:function(){if(backwardHistory.length<1){return}forwardHistory.unshift(backwardHistory.pop());doNotIndexLextURLChange=true;var a=backwardHistory[backwardHistory.length-1];if(!a){return}window.location.href=a},forward:function(){if(forwardHistory.length<1){return}backwardHistory.push(forwardHistory.shift());doNotIndexLextURLChange=true;var a=backwardHistory[backwardHistory.length-1];if(!a){return}window.location.href=a},lastPageContaining:function(c,b){for(var a=backwardHistory.length-1;a>-1;a--){if(backwardHistory[a].search(c)>-1&&(!b||backwardHistory[a].search(b)==-1)){return backwardHistory[a]}}return false}};window.historyAPI=function(){if(window.isChromePackaged){return window.betterHistory}else{return window.history}};window.isMacgap=typeof macgap!="undefined";window.nodewebkit=(typeof window.parent.require!="undefined")?true:false;window.microsoft=(navigator.appName.indexOf("MSAppHost")!=-1)?true:false;window.isChromePackaged=typeof chrome!="undefined"&&typeof chrome.storage!="undefined";window.isChrome=typeof chrome!="undefined"&&typeof chrome.storage=="undefined"&&typeof chrome.extension!="undefined";window.isPhone=window.location.href.indexOf("android_asset/www")!=-1||navigator.userAgent.search(/(iPad|iPhone|iPod|Android)/i)!=-1?true:false;window.isMaxthon=navigator.userAgent.indexOf("Maxthon")>-1;var features={topNavigationControls:true,windowControlsTopLeft:false,windowControlsTheme:"windows"};if(window.isChromePackaged){var currentWindow=chrome.app.window.current();window.isMaximized=currentWindow.isMaximized;window.maximize=currentWindow.maximize;window.minimize=currentWindow.minimize;window.restore=currentWindow.restore;window.increaseWindowPos=function(a,c){var b=currentWindow.getBounds();b.left=b.left+a;b.top=b.top+c;currentWindow.setBounds(b)};if(navigator.appVersion.indexOf("Mac")!=-1){window.features.windowControlsTopLeft=true;if(navigator.appVersion.indexOf("Mac OS X 10_1")!=-1){window.features.windowControlsTheme="mac yosemite"}else{window.features.windowControlsTheme="mac"}}else{window.features.windowControlsTopRight=true;window.features.windowControlsTheme="windows"}reddit.prototype.crossDomain=true;window.getBackgroundPage=function(a){chrome.runtime.getBackgroundPage(a)};window.alert=function(a){$.popup({message:a},function(b){return b})};window.reloadApp=chrome.runtime.reload;analytics.prototype.preventFileInjection=true;(function(a){function c(d){this.bridge=d}c.prototype.push=function(d){this.bridge.postMessage(d,"*")};function b(){var f=document.createElement("IFRAME");f.setAttribute("seamless","seamless");f.src="chromeV2/embedded_ga_host.html";f.style.display="none";document.body.appendChild(f);var g=f.contentWindow;if(!g){console.log("Cannot find embedded_ga element.");return}var d=[];if(a._gaq!==undefined){d=a._gaq}a._gaq=new c(g);for(var e in d){a._gaq.push(d[e])}}window.addEventListener("load",b)})(window);window.history=window.betterHistory}else{if(window.isChrome){reddit.prototype.crossDomain=true;window.getBackgroundPage=function(a){a(chrome.extension.getBackgroundPage())};window.features.topNavigationControls=false}else{if(window.microsoft){reddit.prototype.crossDomain=true;window.features.topNavigationControls=true;reddit.prototype.defaultSettings.enableFlair=false;window.forceFlairOff=true;window.alert=function(a){$.popup({message:a},function(b){return b})}}else{if(window.nodewebkit){reddit.prototype.crossDomain=true;window.features.topNavigationControls=true;var gui=window.parent.require("nw.gui");var sys=window.parent.require("sys");var exec=window.parent.require("child_process").exec;window.popupBrowser=function(a){gui.Shell.openExternal(a)};window.clipboard_set=function(a){gui.Clipboard.get().set(a)};var positionFromBottom=0;window.desktopNotification=function(c,b){if(navigator.appVersion.indexOf("Win")!=-1){return}else{function a(f,d,e){sys.puts(d)}exec('notify-send -t 3000 "'+c.replace(/"/g,'"')+'" "'+b.replace(/"/g,'"')+'" -i /opt/reditr/128x128.png',a)}}}else{if(window.isMacgap){reddit.prototype.crossDomain=true;if(macgap.app.macVersion&&macgap.app.macVersion().split(".")[1]>7){$(document).ready(function(){macgap.window.hideAppLoadingScreen();window.resizeTo(window.outerWidth,window.outerHeight+1)});window.isMaximized=function(){return macgap.window.isMaximized()};window.maximize=function(){macgap.window.maximize()};window.minimize=function(){macgap.window.minimize()};window.restore=function(){macgap.window.restore()};window.increaseWindowPos=function(a,b){macgap.window.increaseWindowPos(a,b)};window.close=function(){macgap.app.terminate()};window.features.windowControlsTopLeft=true;if(navigator.appVersion.indexOf("Mac OS X 10_1")!=-1){window.features.windowControlsTheme="mac yosemite"}else{window.features.windowControlsTheme="mac"}window.features.topNavigationControls=true}if(macgap.app.downloadFile){window.downloadImage=function(a){macgap.app.downloadFile(a)}}if(!macgap.app.copy){var database=new storageWrapper();database.fetch("OSXWindowSettings",function(a){if(typeof a=="undefined"){a={width:1040,height:700,x:(window.screen.availWidth-1040)/2,y:(window.screen.height-700)/2}}setInterval(function(){if(window.screenX!=a.x||window.screenY!=a.y){a.x=window.screenX;a.y=window.screenY;database.save("OSXWindowSettings",a)}if(window.innerWidth!=a.width||a.innerHeight!=a.height){a.width=window.innerWidth;a.height=window.innerHeight;database.save("OSXWindowSettings",a)}},3000)})}window.popupBrowser=function(a){macgap.app.open(a)};window.desktopNotification=function(b,a){macgap.notice.notify({title:b,content:a})};var old_setBadge=setBadge;window.setBadge=function(a){macgap.dock.badge=String(a);old_setBadge(a)};window.clipboard_set=function(a){if(macgap.app.copy){macgap.app.copy(a)}else{var b='<textarea class="viewSource">'+a+"</textarea>";var c=$.popup({title:"Copy Your Text Below",message:b},function(d){return d});setTimeout(function(){c.find(".viewSource").select()},500)}};reddit.prototype.defaultSettings.hide=window.keyModifierAsString+"+h";reddit.prototype.defaultSettings.quit=window.keyModifierAsString+"+q";shortcuts.hide={action:function(){macgap.app.hide()},desc:"Hide Reditr"};shortcuts.quit={action:function(){macgap.app.terminate()},desc:"Quit Reditr"}}else{window.isBrowser=true;reddit.prototype.apiVersion=2;window.features.topNavigationControls=false;if(window.clipboardData&&clipboardData.setData){window.clipboard_set=function(a){clipboardData.setData("text",a)}}else{$(document).ready(function(){$("head").append('<script type="text/javascript" src="webSrc/ZeroClipboard/ZeroClipboard.min.js"><\/script>')});var clip;var skipNonFlash=false;window.clipboard_set=function(a){if(skipNonFlash){return}var b='<textarea class="viewSource">'+a+"</textarea>";var c=$.popup({title:"Copy Your Text Below",message:b},function(d){return d});setTimeout(function(){c.find(".viewSource").select()},500)};window.clipboard_set_flash=function(a){if(!clip){ZeroClipboard.setDefaults({moviePath:"webSrc/ZeroClipboard/ZeroClipboard.swf"});clip=new ZeroClipboard();clip.on("complete",function(b,c){skipNonFlash=true;$('[data-clipboard-text="'+c.text+'"]').click();setTimeout(function(){skipNonFlash=false},500)})}clip.glue(a)}}if(window.isPhone){reddit.prototype.defaultSettings.clicking_comments_slides_to_them=false;reddit.prototype.defaultSettings.postHoverOvers=false;reddit.prototype.defaultSettings.subredditBar=false;reddit.prototype.defaultSettings.show_desktop_notifications=false;reddit.prototype.defaultSettings.macros_enabled=false;reddit.prototype.defaultSettings.showColumnOnPostview=false;reddit.prototype.defaultSettings.showPagePreviews=false;tabManager.prototype.colWidth=250;tabManager.prototype.columnSpacing=0;tabManager.prototype.insertX=0;tabManager.prototype.colTop=0;tabManager.prototype.colBottom=0;$(document).ready(function(){$("body").addClass("phone")})}}}}}}var connection,database,tabManagerObj,uploadHandler,karmaTracker;var locale=window.locale={};window.langNames={bg:"Bulgarian",de:"German",en:"English",eo:"Esperanto",es:"Spanish",fr:"French",it:"Italian",nl:"Dutch",pl:"Polish",pt:"Portuguese",ru:"Russian",sv:"Swedish",tr:"Turkish",zh:"Chinese"};var DESKTOP=(typeof chrome=="undefined")?true:false;if(window.isChromePackaged){chrome.app.window.current().onBoundsChanged.addListener(function(){var a=chrome.app.window.current().getBounds();chrome.storage.local.set({last_window:{top:a.top,left:a.left,width:a.width,height:a.height}},function(){})})}function boot(){window.noAdsUntil=1975625508;analytics().init();if(window.location.href.indexOf("http://reddit6.com")>-1){_gaq.push(["_trackEvent","reddit6","launched",browserName()])}if(window.isChrome){getBackgroundPage(function(b){b.runMailCheck=false})}window.addEventListener("blur",function(){var b=document.getElementsByClassName("temp");var d=b.length;if(d>0){for(var c=0;c<d;c++){document.body.removeChild(b[c])}window.preventPreviewClose=false}});var a=$(".updateTime");updateDate(a,0,a.length);database=storageWrapper();uploadHandler=new uploader();if(navigator.appVersion.indexOf("Win")!=-1){load_css("css/windows.css")}else{if(navigator.appVersion.indexOf("Mac")!=-1){load_css("css/osx.css")}}$.ajaxSetup({cache:true});connection=reddit(database,function(d){var c=$('<div id="cancelSync"> <div id="loadingIcon"></div><div id="cancel">Skip Cancel Sync...</div> </div>').appendTo("body");var f=c.find("#cancel");c.on("click","#cancel",function(){analytics().track("Startup","Canceled Sync");e()});var b=false;var e=function(g){if(b){return}b=true;bindNavigation(d);f.html("Skip login...");f[0].className="loggingIn";c.on("click",".loggingIn",function(){d.logout(function(){database.save("skipSyncOnce",true);window.reloadApp()})});var h=setTimeout(function(){f.html('Skip login...<br><br><span style="font-size: 80%">(Reddit is not responding very fast at the moment)</span>')},5000);d.loginActiveUser(function(){clearTimeout(h);d.setting("locale",function(j){if(j.toLowerCase()=="en"||!j){window.locale=english_language[0];delete window.english_language;i()}else{f.html("Skip Setting Language...");f[0].className="settingLang";c.on("click",".settingLang",function(){$.getJSON("/locales/"+j+".json",function(k){locale=window.locale=k[0];i()})})}analytics().track("Startup","Loaded Locale: "+j);function i(){if(window.localRan){return}else{window.localRan=true}createLeftNav();createTopNav(function(){window.karmaTracker=new karmaWatcher(d,$("#Nav #karmaCounter"));d.setting("defaultColumnWidth",function(l){column.prototype.width=l});c.off().remove();changeAccountSettings(d,true,true);d.purgeLocalStorageCache();var k=(d.loggedin)?"member":"guest";updateNav("person",k);pageChange();$(window).bind("hashchange",pageChange);if(d.loggedin){if(typeof window.userNotifications=="undefined"){window.userNotifications=new notificationsCenter($("#notificationCounter"),d).startup()}else{window.userNotifications.restart()}}d.userVariable("sidebarClosed",function(l){if(typeof l!="object"){l={isClosed:false,sections:{mainNav:true,viewNav:true,settingsNav:true,subs:true}};$("#Header #Nav div").find(".leftNavArrow").removeClass("icon-chevron-right").addClass("icon-chevron-left")}else{var m=$("#leftNav");if(!l.isClosed){$("#Header #Nav div").find(".leftNavArrow").removeClass("icon-chevron-right").addClass("icon-chevron-left");$("body").addClass("leftPaneOpen");$("#createPostNavButton").hide()}else{$("#Header #Nav div").find(".leftNavArrow").removeClass("icon-chevron-left").addClass("icon-chevron-right");$("body").removeClass("leftPaneOpen");$("#createPostNavButton").show()}for(var n in l.sections){var o=m.find("#"+n);if(!l.sections[n]){o.removeClass("open");o.find(".icon-chevron-up").removeClass("icon-chevron-up").addClass("icon-chevron-down")}else{o.addClass("open");o.find(".icon-chevron-down").removeClass("icon-chevron-down").addClass("icon-chevron-up")}}}});if(window.location.hash.indexOf("reditr_external_followed")!=-1&&window.chrome){d.setting("dontShowAgain_redirectReddit",function(l){if(!l){confirmFancy("Do you want Reditr to always handle Reddit.com links (you can change this in general settings later)?",function(m){d.setting("dontShowAgain_redirectReddit",true);if(m){d.setting("redirectReddit",true)}else{d.setting("redirectReddit",false)}if(window.isChrome){getBackgroundPage(function(n){n.boot()})}})}})}update(database)})}if(j.toLowerCase()=="en"||!j){return}$.ajax({dataType:"json",url:"http://api.reditr.com/locales/"+j+".json?"+window.version+Math.random(),success:function(k){locale=window.locale=k[0];i()},error:function(){$.getJSON("/locales/"+j+".json",function(k){locale=window.locale=k[0];i()})}})})})};sync_sync(d,e)})}$(document).ready(boot);function parseUrlData(c){var e=c.split("#/").pop().split("/");var b=e.shift();var f={};var a=e.length;for(var d=0;d<a;d+=2){f[e[d]]=e[d+1]}return[b,f]}var oldurl="";var currentpage="";var checkingHash=window.location.hash;function setSilentHash(a){oldurl=window.location.hash=a}storageWrapper.prototype.fetch("mainPage",function(a){if(!a){a="Stream"}if(checkingHash=="#"||checkingHash==""||checkingHash=="#/"){window.location.hash="#/"+a}});function pageChange(){var a=window.location.hash;if(a!=oldurl){_gaq.push(["_trackPageview",location.pathname+location.search+location.hash]);oldurl=a;var c=parseUrlData(a);var b=c[0];var d=c[1];if(currentpage=="Stream"&&b=="Stream"&&window.streamVarsChanged){window.streamVarsChanged(d)}else{if(typeof d.post!="undefined"&&b!="Stream"){updateNav("page","Post");mailViewTransition(d)}else{if(currentpage=="Home"&&b=="Home"&&window.tabManagerObj.mailViewStop()){updateNav("page","Home")}else{if(currentpage=="Home"&&b=="Home"&&((typeof d.reload!="undefined")?Date.now()-d.reload:100000)>1000&&window.tabManagerObj){window.tabManagerObj.changePage(d.page?d.page:window.tabManagerObj.originalPage,true)}else{pageChangeAnimation(b,d);updateNav("page",b)}}}}}}var old_pagename="";var old_page=null;var activePlayground=null;var giveContent=function(){};function pageChangeAnimation(a,b,c){currentpage=a;if(!activePlayground){activePlayground=$("#ColumnContainer")}if(typeof window[old_pagename+"deconstructor"]=="function"){window[old_pagename+"deconstructor"](activePlayground,old_pagename,a)}old_pagename=a;activePlayground.html("");if(old_page&&old_page.deinit){old_page.deinit()}if(Object.keys(window[a].prototype).length==0){old_page=window[a](activePlayground,b,c)}else{old_page=new window[a]({parent:activePlayground,followHashtags:true,getVars:b})}}function mailViewTransition(b,d){var c=(typeof b.reload!="undefined")?Date.now()-b.reload:100000;if(currentpage!="Home"||c<1000){b.tabManagerWaitingFor=b.column.toLowerCase();pageChangeAnimation("Home",b,a)}else{a()}function a(){var g=b.post;var f=b.permalink.replace(/~/g,"/");var e=b.column.toLowerCase();tabManagerObj.mailViewStart(e,function(h){if(d){setTimeout(d,500)}return new redditpost(g,f,this,connection,h)},b)}}storageWrapper.prototype.fetch("noContext",function(a){if(a){(function(b){b.contextMenu=function(c,d,f){}})(jQuery)}else{(function(b){b.contextMenu=function(l,g,i){g.preventDefault();setTimeout(function(){b(".smartContentPopup").remove()},100);var k=b(".contextMenu");if(k.length){k.off().hide()}b("body").off(".contextMenuHide").on("mousewheel.contextMenuHide, click.contextMenuHide",function(m){b(".contextMenu").off().remove()});var f=b('<div class="contextMenu"><ul class="contextOptions">'+l+"</div></div>").css("top","-1000000px").appendTo("body");var j=f.height();var c=f.width();var h=g.pageY;if(g.pageY+j>b(document).height()){h-=j}var d=g.pageX;if(g.pageX+c>b(document).width()){d=b(document).width()-c}f.css({left:d,top:h});f.on("contextmenu",function(m){m.preventDefault();b(this).remove()});if(typeof i=="function"){f.on("click","li",function(m){var n=i.call(f,b(this).attr("data-message"),b(this),m)})}return f}})(jQuery)}});