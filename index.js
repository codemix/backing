try {
  module.exports = require('./lib').Backing;
}
catch (e) {
  console.log(e);
  module.exports = require('./lib-legacy').Backing;
}