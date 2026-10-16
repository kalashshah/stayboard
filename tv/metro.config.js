const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = {
  // shared/design.ts sits outside this package: Metro only bundles files under watched folders, and bare imports
  // (babel runtime helpers) from there must resolve against this package's node_modules.
  watchFolders: [path.resolve(__dirname, '..', 'shared')],
  resolver: {nodeModulesPaths: [path.resolve(__dirname, 'node_modules')]},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
