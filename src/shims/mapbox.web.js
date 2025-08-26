// Web shim for @rnmapbox/maps to avoid importing mapbox-gl CSS or web bundle
module.exports = {
  MapView: () => null,
  Camera: () => null,
  PointAnnotation: () => null,
  StyleURL: { Street: '' },
  setAccessToken: () => {},
};
