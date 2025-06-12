const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Basic web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 