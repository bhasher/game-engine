const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/app/game.ts',
  externals: {
    fs: 'require("fs")',
    path: "require('path')"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'game.js',
    path: path.resolve(__dirname, 'dist/web')
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: './src/index.html',
      filename: './index.html'
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "./src/assets",
          to: "./assets",
          globOptions: {
            ignore: "**/obj/**"
          }
        },
        {
          from: './src/login.html'
        }
      ]
    })
  ],
  target: 'web'
}