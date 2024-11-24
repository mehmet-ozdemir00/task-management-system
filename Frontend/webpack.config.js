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
    indexPage: path.resolve(__dirname, 'src', 'pages', 'indexPage.js'),
    viewCompletedTasksPage: path.resolve(__dirname, 'src', 'pages', 'viewCompletedTasksPage.js'),
    viewIncompleteTasksPage: path.resolve(__dirname, 'src', 'pages', 'viewIncompleteTasksPage.js'),
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
      template: './src/index.html',
      filename: 'index.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/viewCompletedTasks.html',
      filename: 'viewCompletedTasks.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/viewIncompleteTasks.html',
      filename: 'viewIncompleteTasks.html',
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
          from: path.resolve('src/images'),
          to: path.resolve("dist/images")
        }
      ]
    }),
    new CleanWebpackPlugin()
  ]
}