// https://github.com/vuejs/vue-cli/blob/master/docs/build.md#configuration-files
var path = require('path')
var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var BabelEnginePlugin = require('babel-engine-plugin')
var dist = path.join(__dirname, '../examples/dist')

module.exports = {
  entry: path.join(__dirname, '../examples/src/app.js'),
  html: {
    template: path.join(__dirname, '../examples/src/index.html')
  },
  webpack: {
    devtool: false,
    output: {
      path: dist,
      publicPath: ''
    },
    plugins: (function () {
      var plugins = [
        // https://webpack.js.org/plugins/ignore-plugin/
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/, /vue-tippy$/),
        new BabelEnginePlugin({
          presets: ['env']
        })
      ]
      if (process.env.NODE_ENV === 'production') {
        plugins.push(
          new CleanWebpackPlugin([dist], {
            root: path.join(__dirname, '../examples')
          })
        )
      }
      return plugins
    })()
  }
}
