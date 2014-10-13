(function() {
  var GUI, RadialNav, animate, describeArc, describeSector, gui, iconsPath, polarToCartesian, random, toggleContext;

  iconsPath = 'icons.svg';

  Snap.plugin(function(Snap, Element) {
    return Element.prototype.hover = function(f_in, f_out, s_in, s_out) {
      return this.mouseover(f_in, s_in).mouseout(f_out || f_in, s_out || s_in);
    };
  });

  polarToCartesian = function(cx, cy, r, angle) {
    angle = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  describeArc = function(x, y, r, startAngle, endAngle, continueLine, alter) {
    var end, start;
    start = polarToCartesian(x, y, r, startAngle %= 360);
    end = polarToCartesian(x, y, r, endAngle %= 360);
    return "" + (continueLine ? 'L' : 'M') + start.x + " " + start.y + " A" + r + " " + r + ", 0, " + (endAngle - startAngle >= 180 ? 1 : 0) + ", " + (alter ? 0 : 1) + ", " + end.x + " " + end.y;
  };

  describeSector = function(x, y, r, r2, startAngle, endAngle) {
    return "" + (describeArc(x, y, r, startAngle, endAngle)) + " " + (describeArc(x, y, r2, endAngle, startAngle, true, true)) + "Z";
  };

  random = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  animate = function(obj, index, start, end, duration, easing, fn, cb) {
    var _ref;
    if ((_ref = (obj.animation != null ? obj.animation : obj.animation = [])[index]) != null) {
      _ref.stop();
    }
    return obj.animation[index] = Snap.animate(start, end, fn, duration, easing, cb);
  };

  toggleContext = function() {
    return document.body.classList.toggle('context');
  };

  GUI = (function() {
    function GUI(buttons) {
      this.paper = Snap(window.innerWidth, window.innerHeight);
      Snap.load(iconsPath, (function(_this) {
        return function(icons) {
          _this.nav = new RadialNav(_this.paper, buttons, icons);
          return _this._bindEvents();
        };
      })(this));
    }

    GUI.prototype._bindEvents = function() {
      window.addEventListener('resize', (function(_this) {
        return function() {
          return _this.paper.attr({
            width: window.innerWidth,
            height: window.innerHeight
          });
        };
      })(this));
      this.paper.node.addEventListener('mousedown', this.nav.show.bind(this.nav));
      return this.paper.node.addEventListener('mouseup', this.nav.hide.bind(this.nav));
    };

    return GUI;

  })();

  RadialNav = (function() {
    function RadialNav(paper, buttons, icons) {
      this.area = paper.svg(0, 0, this.size = 500, this.size).addClass('radialnav');
      this.c = this.size / 2;
      this.r = this.size * .25;
      this.r2 = this.r * .35;
      this.animDuration = 300;
      this.angle = 360 / buttons.length;
      this.container = this.area.g();
      this.container.transform("s0");
      this.updateButtons(buttons, icons);
    }

    RadialNav.prototype._animateContainer = function(start, end, duration, easing) {
      return animate(this, 0, start, end, duration, easing, (function(_this) {
        return function(val) {
          return _this.container.transform("r" + (90 - 90 * val) + "," + _this.c + "," + _this.c + "s" + val + "," + val + "," + _this.c + "," + _this.c);
        };
      })(this));
    };

    RadialNav.prototype._animateButtons = function(start, end, min, max, easing) {
      var anim, el, i, _ref, _results;
      anim = (function(_this) {
        return function(i, el) {
          return animate(el, 0, start, end, random(min, max), easing, function(val) {
            return el.transform("r" + (_this.angle * i) + "," + _this.c + "," + _this.c + "s" + val + "," + val + "," + _this.c + "," + _this.c);
          });
        };
      })(this);
      _ref = this.container;
      _results = [];
      for (i in _ref) {
        el = _ref[i];
        if (!Number.isNaN(+i)) {
          _results.push(anim(i, el));
        }
      }
      return _results;
    };

    RadialNav.prototype._animateButtonHover = function(button, start, end, duration, easing, cb) {
      return animate(button, 1, start, end, duration, easing, ((function(_this) {
        return function(val) {
          button[0].attr({
            d: describeSector(_this.c, _this.c, _this.r - val * 10, _this.r2, 0, _this.angle)
          });
          return button[2].transform("s" + (1.1 - val * .1) + "," + (1.1 - val * .1) + "," + _this.c + "," + _this.c);
        };
      })(this)), cb);
    };

    RadialNav.prototype._sector = function() {
      return this.area.path(describeSector(this.c, this.c, this.r, this.r2, 0, this.angle)).addClass('radialnav-sector');
    };

    RadialNav.prototype._icon = function(btn, icons) {
      var bbox, icon;
      icon = icons.select("#" + btn.icon).addClass('radialnav-icon');
      icon.transform("T" + (this.c - (bbox = icon.getBBox()).x - bbox.width / 2) + ", " + (this.c - bbox.y - this.r + this.r2 - bbox.height / 2 - 5) + " R" + (this.angle / 2) + "," + this.c + "," + this.c + "S.7");
      return icon;
    };

    RadialNav.prototype._hint = function(btn) {
      var hint;
      hint = this.area.text(0, 0, btn.icon).addClass('radialnav-hint hide').attr({
        textpath: describeArc(this.c, this.c, this.r, 0, this.angle)
      });
      hint.select('*').attr({
        startOffset: '50%'
      });
      return hint;
    };

    RadialNav.prototype._button = function(btn, sector, icon, hint) {
      return this.area.g(sector, icon, hint).data('cb', btn.action).mouseup(function() {
        var _base;
        return typeof (_base = this.data('cb')) === "function" ? _base() : void 0;
      }).hover(function() {
        var el, _i, _len, _ref, _results;
        _ref = [this[0], this[1], this[2]];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          el = _ref[_i];
          _results.push(el.toggleClass('active'));
        }
        return _results;
      }).hover(this._buttonOver(this), this._buttonOut(this));
    };

    RadialNav.prototype._buttonOver = function(nav) {
      return function() {
        nav._animateButtonHover(this, 0, 1, 200, mina.easeinout);
        return this[2].removeClass('hide');
      };
    };

    RadialNav.prototype._buttonOut = function(nav) {
      return function() {
        return nav._animateButtonHover(this, 1, 0, 2000, mina.elastic, (function() {
          return this.addClass('hide');
        }).bind(this[2]));
      };
    };

    RadialNav.prototype.updateButtons = function(buttons, icons) {
      var btn, _i, _len, _results;
      this.container.clear();
      _results = [];
      for (_i = 0, _len = buttons.length; _i < _len; _i++) {
        btn = buttons[_i];
        _results.push(this.container.add(this._button(btn, this._sector(), this._icon(btn, icons), this._hint(btn))));
      }
      return _results;
    };

    RadialNav.prototype.show = function(e) {
      this.area.attr({
        x: e.clientX - this.c,
        y: e.clientY - this.c
      });
      toggleContext();
      this._animateContainer(0, 1, this.animDuration * 8, mina.elastic);
      return this._animateButtons(0, 1, this.animDuration, this.animDuration * 8, mina.elastic);
    };

    RadialNav.prototype.hide = function() {
      toggleContext();
      this._animateContainer(1, 0, this.animDuration, mina.easeinout);
      return this._animateButtons(1, 0, this.animDuration, this.animDuration, mina.easeinout);
    };

    return RadialNav;

  })();

  gui = new GUI([
    {
      icon: 'pin',
      action: function() {
        return humane.log('Pinning...');
      }
    }, {
      icon: 'search',
      action: function() {
        return humane.log('Opening Search...');
      }
    }, {
      icon: 'cloud',
      action: function() {
        return humane.log('Connecting to Cloud...');
      }
    }, {
      icon: 'settings',
      action: function() {
        return humane.log('Opening Settings...');
      }
    }, {
      icon: 'rewind',
      action: function() {
        return humane.log('Rewinding...');
      }
    }, {
      icon: 'preview',
      action: function() {
        return humane.log('Preview Activated');
      }
    }, {
      icon: 'delete',
      action: function() {
        return humane.log('Deleting...');
      }
    }
  ]);

  humane.timeout = 1000;

}).call(this);
