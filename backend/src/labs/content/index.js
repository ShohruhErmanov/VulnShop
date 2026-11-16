'use strict';
/** Learning-module content for every lab, keyed by lab id (see ../registry.js). */
module.exports = {
  sqli: require('./sqli'),
  xss: require('./xss'),
  bac: require('./bac'),
  idor: require('./idor'),
  'broken-auth': require('./broken-auth'),
  'weak-password': require('./weak-password'),
  misconfig: require('./misconfig'),
  'sensitive-data': require('./sensitive-data'),
  csrf: require('./csrf'),
  'path-traversal': require('./path-traversal'),
};
