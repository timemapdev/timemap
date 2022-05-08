module.exports = {
  title: 'example',
  display_title: 'example',
  SERVER_ROOT: 'http://localhost:4040',
  EVENTS_EXT: '/api/timemap_data/export_events/deeprows',
  ASSOCIATIONS_EXT: '/api/timemap_data/export_associations/deeprows',
  SOURCES_EXT: '/api/timemap_data/export_sources/deepids',
  SITES_EXT: '',
  SHAPES_EXT: '',
  DATE_FMT: 'DD/MM/YYYY',
  TIME_FMT: 'hh:mm',
  MAPBOX_TOKEN: 'pk.eyJ1IjoiZG1pdHJpZyIsImEiOiJjbDJ4cjFtN2wwODdlM2pxeXdlZGxuejg2In0.bNh4GHrz5sbeNLERSyDvkA',
  store: {
    app: {
      map: {
        anchor: [46.444431, 32.059769],
        startZoom: 6
      },
      timeline: {
        range: [new Date(2022, 1, 23, 12), new Date(2022, 4, 23, 12)],
        rangeLimits: [new Date(2022, 1, 1, 1), new Date()]
      }
    },
    ui: {
      card: {
        layout: {
          template: 'sourced'
        }
      }
    },
    features: {
      COLOR_BY_ASSOCIATION: true,
      USE_ASSOCIATIONS: true,
      USE_FULLSCREEN: true,
      USE_SOURCES: true,
      USE_COVER: false,
      GRAPH_NONLOCATED: false,
      HIGHLIGHT_GROUPS: false
    }
  }
}
