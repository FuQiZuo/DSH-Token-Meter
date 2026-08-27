'use strict';
/**
 * dsh-token-meter — installed (bundle) HOST half.
 *
 * This module is the cordis plugin the loader mounts when the package is
 * installed through the official CLI:
 *
 *   dsh plugin --profile web add github:FuQiZuo/DSH-Token-Meter
 *
 * The `dsh.bundle.patch` layer (cordis.patch.yml) inserts this package's row;
 * the loader requires this main entry and uses its `name` + `apply` exports.
 * The meter itself is pure client-side (browser): a floating panel over
 * `shell.overlay` and a settings page over `settings.section`, both shipped in
 * the browser half (`exports["./client"]` -> client.js). The host half is
 * intentionally a no-op.
 */
const NAME = 'dsh-token-meter';

function apply() {
  // Pure client-side UI — nothing to do in the host realm.
}

module.exports = {
  name: NAME,
  apply
};
