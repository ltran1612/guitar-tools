const path = require('path');

module.exports = {
  entry: './tuner.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};