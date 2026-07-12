// Jest mock for mixpanel-react-native — the real module ships untranspiled ESM
// (nested uuid dep) that Jest can't parse. Tests never assert on Mixpanel.
class Mixpanel {
  constructor() {}
  init() { return Promise.resolve(); }
  track() {}
  identify() {}
  reset() {}
  optInTracking() {}
  optOutTracking() {}
  getPeople() { return { set: () => {} }; }
  registerSuperProperties() {}
}

module.exports = { Mixpanel };
