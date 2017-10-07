const BabiliPlugin = require('babili-webpack-plugin')

module.exports = [
  {
    entry: `${__dirname}/app/electron.js`,
    target: 'electron-main',
    node: {
      __dirname: false,
      __filename: false
    },
    output: {
      filename: `electron.min.js`,
      path: `${__dirname}/app`
    },
    plugins: [
      new BabiliPlugin()
    ]
  },
  {
    entry: `${__dirname}/app/electron.js`,
    target: 'electron-renderer',
    output: {
      filename: `electron.min.js`,
      path: `${__dirname}/app`
    },
    plugins: [
      new BabiliPlugin()
    ]
  }
]
