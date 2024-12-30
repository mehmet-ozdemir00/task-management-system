const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  optimization: {
    usedExports: true
  },
  entry: {
    mainPage: path.resolve(__dirname, 'src', 'pages', 'mainPage.js'),
    projectPage: path.resolve(__dirname, 'src', 'pages', 'projectPage.js'),
    reportPage: path.resolve(__dirname, 'src', 'pages', 'reportPage.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  devServer: {
    https: false,
    port: 8080,
    open: true,
    hot: true,
    proxy: [
      {
        context: [
          '/tasks',
        ],
        target: 'http://localhost:5001'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/main.html',
      filename: 'index.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/project.html',
      filename: 'project.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/report.html',
      filename: 'report.html',
      inject: false
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/css'),
          to: path.resolve("dist/css")
        }
      ]
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/image'),
          to: path.resolve("dist/image")
        }
      ]
    }),
    new CleanWebpackPlugin()
  ]
}