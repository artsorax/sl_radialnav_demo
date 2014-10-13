iconsPath = 'icons.svg'

# ====================================
# Util
# ====================================

Snap.plugin (Snap, Element) ->
  Element::hover = (f_in, f_out, s_in, s_out) ->
    @mouseover f_in, s_in
      .mouseout f_out or f_in, s_out or s_in

polarToCartesian = (cx, cy, r, angle) ->
  angle = (angle - 90) * Math.PI / 180 # Degrees to radians
  x: cx + r * Math.cos angle
  y: cy + r * Math.sin angle

describeArc = (x, y, r, startAngle, endAngle, continueLine, alter) ->
  start = polarToCartesian x, y, r, startAngle %= 360
  end = polarToCartesian x, y, r, endAngle %= 360
  "#{if continueLine then 'L' else 'M'}#{start.x} #{start.y}
  A#{r} #{r}, 0,
  #{if endAngle - startAngle >= 180 then 1 else 0},
  #{if alter then 0 else 1}, #{end.x} #{end.y}"

describeSector = (x, y, r, r2, startAngle, endAngle) ->
  "#{describeArc x, y, r, startAngle, endAngle}
  #{describeArc x, y, r2, endAngle, startAngle, on, on}Z"

random = (min, max) -> Math.random() * (max - min) + min

animate = (obj, index, start, end, duration, easing, fn, cb) ->
  do (obj.animation ?= [])[index]?.stop
  obj.animation[index] = Snap.animate start, end, fn, duration, easing, cb

toggleContext = -> document.body.classList.toggle 'context'

# ====================================
# GUI
# ====================================

class GUI
  constructor: (buttons) ->
    @paper = Snap window.innerWidth, window.innerHeight
    Snap.load iconsPath, (icons) =>
      @nav = new RadialNav @paper, buttons, icons

      do @_bindEvents

  # ==================
  # Private
  # ==================

  _bindEvents: ->
    window.addEventListener 'resize', =>
      @paper.attr
        width: window.innerWidth
        height: window.innerHeight

    @paper.node.addEventListener 'mousedown', @nav.show.bind @nav
    @paper.node.addEventListener 'mouseup', @nav.hide.bind @nav

# ====================================
# Radial Nav
# ====================================

class RadialNav
  constructor: (paper, buttons, icons) ->
    @area = paper
      .svg 0, 0, @size = 500, @size
      .addClass 'radialnav'
    @c = @size / 2 # Center
    @r = @size * .25 # Outer radius
    @r2 = @r * .35 # Inner radius
    @animDuration = 300
    @angle = 360 / buttons.length

    @container = do @area.g
    @container.transform "s0"

    @updateButtons buttons, icons

  # ==================
  # Private
  # ==================

  _animateContainer: (start, end, duration, easing) ->
    animate @, 0, start, end, duration, easing, (val) =>
      @container.transform "r#{90 - 90 * val},#{@c},#{@c}s#{val},#{val},#{@c},#{@c}"

  _animateButtons: (start, end, min, max, easing) ->
    anim = (i, el) =>
      animate el, 0, start, end, random(min, max), easing, (val) =>
        el.transform "r#{@angle * i},#{@c},#{@c}s#{val},#{val},#{@c},#{@c}"
    anim i, el for i, el of @container when not Number.isNaN +i

  _animateButtonHover: (button, start, end, duration, easing, cb) ->
    animate button, 1, start, end, duration, easing, ((val) =>
      button[0].attr d: describeSector @c, @c, @r - val * 10, @r2, 0, @angle
      button[2].transform "s#{1.1 - val * .1},#{1.1 - val * .1},#{@c},#{@c}"), cb

  _sector: ->
    @area
      .path describeSector @c, @c, @r, @r2, 0, @angle
      .addClass 'radialnav-sector'

  _icon: (btn, icons) ->
    icon = icons
      .select "##{btn.icon}"
      .addClass 'radialnav-icon'
    icon.transform "
      T#{@c - (bbox = do icon.getBBox).x - bbox.width / 2},
      #{@c - bbox.y - @r + @r2 - bbox.height / 2 - 5}
      R#{@angle / 2},#{@c},#{@c}S.7"
    icon

  _hint: (btn) ->
    hint = @area
      .text 0, 0, btn.icon
      .addClass 'radialnav-hint hide'
      .attr textpath: describeArc @c, @c, @r, 0, @angle
    hint.select('*').attr startOffset: '50%'
    hint

  _button: (btn, sector, icon, hint) ->
    @area
      .g sector, icon, hint
      .data 'cb', btn.action
      .mouseup -> @data('cb')?()
      .hover -> el.toggleClass 'active' for el in [@[0], @[1], @[2]]
      .hover @_buttonOver(@), @_buttonOut(@)

  _buttonOver: (nav) -> ->
    nav._animateButtonHover @, 0, 1, 200, mina.easeinout
    @[2].removeClass 'hide'

  _buttonOut: (nav) -> ->
    nav._animateButtonHover @, 1, 0, 2000, mina.elastic, (->
      @addClass 'hide').bind @[2]

  # ==================
  # Public
  # ==================

  updateButtons: (buttons, icons) ->
    do @container.clear
    for btn in buttons
      @container.add @_button btn, @_sector(), @_icon(btn, icons), @_hint(btn)

  show: (e) ->
    @area.attr x: e.clientX - @c, y: e.clientY - @c
    do toggleContext
    @_animateContainer 0, 1, @animDuration * 8, mina.elastic
    @_animateButtons 0, 1, @animDuration, @animDuration * 8, mina.elastic

  hide: ->
    do toggleContext
    @_animateContainer 1, 0, @animDuration, mina.easeinout
    @_animateButtons 1, 0, @animDuration, @animDuration, mina.easeinout

# ====================================
# Test
# ====================================

gui = new GUI [
  {
    icon: 'pin'
    action: -> humane.log 'Pinning...'
  }
  {
    icon: 'search'
    action: -> humane.log 'Opening Search...'
  }
  {
    icon: 'cloud'
    action: -> humane.log 'Connecting to Cloud...'
  }
  {
    icon: 'settings'
    action: -> humane.log 'Opening Settings...'
  }
  {
    icon: 'rewind'
    action: -> humane.log 'Rewinding...'
  }
  {
    icon: 'preview'
    action: -> humane.log 'Preview Activated'
  }
  {
    icon: 'delete'
    action: -> humane.log 'Deleting...'
  }
]

humane.timeout = 1000