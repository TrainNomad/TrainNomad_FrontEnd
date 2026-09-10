import e from "leaflet";
import { Map as h, helpers as m } from "@maptiler/sdk";
import { Language as z, MapStyle as P } from "@maptiler/sdk";
const _ = "@maptiler/leaflet-maptilersdk", c = "4.1.1", d = e.Layer.extend({
  options: {
    updateInterval: 32,
    // How much to extend the overlay view (relative to map size)
    // e.g. 0.1 would be 10% of map view in each direction
    padding: 0.1,
    // whether or not to register the mouse and keyboard
    // events on the maptiler sdk overlay
    interactive: !1,
    // set the tilepane as the default pane to draw gl tiles
    pane: "tilePane"
  },
  map: null,
  initialize: function(t) {
    e.setOptions(this, t), this._throttledUpdate = e.Util.throttle(this._update, this.options.updateInterval, this);
  },
  onAdd: function(t) {
    var o;
    this._container || this._initContainer();
    const i = this.getPaneName();
    (o = t.getPane(i)) == null || o.appendChild(this._container), this._initMaptilerSDK(), this._offset = this._map.containerPointToLayerPoint([0, 0]), t.options.zoomAnimation && e.DomEvent.on(
      // @ts-ignore
      t._proxy,
      e.DomUtil.TRANSITION_END,
      this._transitionEnd,
      this
    ), t.attributionControl.addAttribution(
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
    );
  },
  onRemove: function(t) {
    var o;
    this._map._proxy && this._map.options.zoomAnimation && e.DomEvent.off(this._map._proxy, e.DomUtil.TRANSITION_END, this._transitionEnd, this);
    const i = this.getPaneName();
    (o = t.getPane(i)) == null || o.removeChild(this._container), this._maptilerMap.remove(), this._maptilerMap = null;
  },
  getEvents: function() {
    return {
      move: this._throttledUpdate,
      // sensibly throttle updating while panning
      zoomanim: this._animateZoom,
      // applys the zoom animation to the <canvas>
      zoom: this._pinchZoom,
      // animate every zoom event for smoother pinch-zooming
      zoomstart: this._zoomStart,
      // flag starting a zoom to disable panning
      zoomend: this._zoomEnd,
      resize: this._resize
    };
  },
  getMaptilerSDKMap: function() {
    return this._maptilerMap;
  },
  getCanvas: function() {
    return this._maptilerMap.getCanvas();
  },
  getSize: function() {
    return this._map.getSize().multiplyBy(1 + this.options.padding * 2);
  },
  getBounds: function() {
    const t = this.getSize().multiplyBy(0.5), i = this._map.latLngToContainerPoint(this._map.getCenter());
    return e.latLngBounds(
      this._map.containerPointToLatLng(i.subtract(t)),
      this._map.containerPointToLatLng(i.add(t))
    );
  },
  getContainer: function() {
    return this._container;
  },
  // returns the pane name set in options if it is a valid pane, defaults to tilePane
  getPaneName: function() {
    return this._map.getPane(this.options.pane) ? this.options.pane : "tilePane";
  },
  setStyle: function(t) {
    this._maptilerMap.setStyle(t);
  },
  setLanguage: function(t) {
    this._maptilerMap.setLanguage(t);
  },
  _roundPoint: (t) => ({ x: Math.round(t.x), y: Math.round(t.y) }),
  _initContainer: function() {
    this._container = e.DomUtil.create("div", "leaflet-gl-layer");
    const t = this.getSize(), i = this._map.getSize().multiplyBy(this.options.padding);
    this._container.style.width = `${t.x}px`, this._container.style.height = `${t.y}px`;
    const o = this._map.containerPointToLayerPoint([0, 0]).subtract(i);
    e.DomUtil.setPosition(this._container, this._roundPoint(o));
  },
  _initMaptilerSDK: function() {
    const t = this._map.getCenter(), i = this.options.maxBounds ? this.options.maxBounds : [
      [Number.NEGATIVE_INFINITY, -90],
      [Number.POSITIVE_INFINITY, 90]
    ];
    this._map.setMaxBounds(
      e.latLngBounds(e.latLng(i[0][1], i[0][0]), e.latLng(i[1][1], i[1][0]))
    );
    const o = {
      maxBounds: i,
      ...this.options,
      projection: "mercator",
      container: this._container,
      center: [t.lng, t.lat],
      zoom: this._map.getZoom() - 1,
      attributionControl: !1
    };
    this.options.geolocate && (o.center = void 0, o.zoom = void 0), this._maptilerMap = new h(o), this._maptilerMap.telemetry.registerModule(_, c), this._maptilerMap.once("load", () => {
      this.fire("ready");
    }), this._maptilerMap.once("load", async () => {
      let a = { logo: null };
      try {
        const p = Object.keys(this._maptilerMap.style.sourceCaches).map((s) => this._maptilerMap.getSource(s)).filter((s) => s && "url" in s && typeof s.url == "string" && (s == null ? void 0 : s.url.includes("tiles.json"))), n = new URL(p[0].url);
        n.searchParams.has("key") || n.searchParams.append("key", o.apiKey), a = await (await fetch(n.href)).json();
      } catch {
      }
      if (a.logo || o.maptilerLogo) {
        const p = a.logo ?? "https://api.maptiler.com/resources/logo.svg", n = document.createElement("a");
        n.href = "https://www.maptiler.com", n.style.setProperty("position", "absolute"), n.style.setProperty("left", "10px"), n.style.setProperty("bottom", "2px"), n.style.setProperty("z-index", "999");
        const l = document.createElement("img");
        l.src = p, l.alt = "MapTiler logo", l.width = 100, l.height = 30, n.appendChild(l), this._map.getContainer().appendChild(n);
      }
    }), this._maptilerMap.transform.freezeElevation = !0, this.options.geolocate && this._maptilerMap.on("load", () => {
      this._map.setView(this._maptilerMap.getCenter(), this._maptilerMap.getZoom() + 1);
    }), this._transformGL(), this._maptilerMap._actualCanvas = this._maptilerMap._canvas;
    const r = this._maptilerMap._actualCanvas;
    e.DomUtil.addClass(r, "leaflet-image-layer"), e.DomUtil.addClass(r, "leaflet-zoom-animated"), this.options.interactive && e.DomUtil.addClass(r, "leaflet-interactive"), this.options.className && e.DomUtil.addClass(r, this.options.className), this.addHeatmap = (a) => m.addHeatmap(this._maptilerMap, a), this.addPolygon = (a) => m.addPolygon(this._maptilerMap, a), this.addPoint = (a) => m.addPoint(this._maptilerMap, a), this.addPolyline = (a) => m.addPolyline(this._maptilerMap, a), this.takeScreenshot = (a) => m.takeScreenshot(this._maptilerMap, a);
  },
  _update: function() {
    if (this._offset = this._map.containerPointToLayerPoint([0, 0]), this._zooming)
      return;
    const t = this.getSize(), i = this._map.getSize().multiplyBy(this.options.padding), o = this._map.containerPointToLayerPoint([0, 0]).subtract(i);
    e.DomUtil.setPosition(this._container, this._roundPoint(o)), this._transformGL(), this._maptilerMap.transform.width !== t.x || this._maptilerMap.transform.height !== t.y ? (this._container.style.width = `${t.x}px`, this._container.style.height = `${t.y}px`, this._maptilerMap._resize !== null && this._maptilerMap._resize !== void 0 ? this._maptilerMap._resize() : this._maptilerMap.resize()) : this._maptilerMap._update !== null && this._maptilerMap._update !== void 0 ? this._maptilerMap._update() : this._maptilerMap.update();
  },
  _transformGL: function() {
    this._maptilerMap.setCenter(this._map.getCenter()), this._maptilerMap.setZoom(this._map.getZoom() - 1);
  },
  // update the map constantly during a pinch zoom
  _pinchZoom: function() {
    this._maptilerMap.jumpTo({
      zoom: this._map.getZoom() - 1,
      center: this._map.getCenter()
    });
  },
  // borrowed from L.ImageOverlay
  // https://github.com/Leaflet/Leaflet/blob/master/src/layer/ImageOverlay.js#L139-L144
  _animateZoom: function(t) {
    const i = this._map.getZoomScale(t.zoom), o = this._map.getSize().multiplyBy(this.options.padding * i), r = this.getSize()._divideBy(2), a = this._map.project(t.center, t.zoom)._subtract(r)._add(this._map._getMapPanePos().add(o))._round(), p = this._map.project(this._map.getBounds().getNorthWest(), t.zoom)._subtract(a);
    e.DomUtil.setTransform(this._maptilerMap.getCanvas(), p.subtract(this._offset), i);
  },
  _zoomStart: function() {
    this._zooming = !0;
  },
  _zoomEnd: function() {
    const t = this._map.getZoomScale(this._map.getZoom());
    e.DomUtil.setTransform(
      this._maptilerMap.getCanvas(),
      // https://github.com/mapbox/mapbox-gl-leaflet/pull/130
      new e.Point(0, 0),
      t
    ), this._zooming = !1, this._update();
  },
  _transitionEnd: function() {
    e.Util.requestAnimFrame(() => {
      const t = this._map.getZoom(), i = this._map.getCenter(), o = this._map.latLngToContainerPoint(this._map.getBounds().getNorthWest());
      e.DomUtil.setTransform(this._maptilerMap._actualCanvas, o, 1), this._maptilerMap.once(
        "moveend",
        e.Util.bind(() => {
          this._zoomEnd();
        }, this)
      ), this._maptilerMap.jumpTo({
        center: i,
        zoom: t - 1
      });
    }, this);
  },
  // @ts-ignore
  _resize: function(t) {
    this._transitionEnd(t);
  }
});
function f(t) {
  return new d(t);
}
export {
  z as Language,
  P as MapStyle,
  d as MaptilerLayer,
  f as maptilerLayer
};
//# sourceMappingURL=leaflet-maptilersdk.js.map
