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
    addNewTaskPage: path.resolve(__dirname, 'src', 'pages', 'addNewTaskPage.js'),
    updateTaskPage: path.resolve(__dirname, 'src', 'pages', 'updateTaskPage.js'),
    deleteTaskPage: path.resolve(__dirname, 'src', 'pages', 'deleteTaskPage.js'),
    viewTaskPage: path.resolve(__dirname, 'src', 'pages', 'viewTaskPage.js'),
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
      template: './src/addNewTaskPage.html',
      filename: 'addNewTaskPage.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/updateTaskPage.html',
      filename: 'updateTaskPage.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/deleteTaskPage.html',
      filename: 'deleteTaskPage.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: './src/viewTaskPage.html',
      filename: 'viewTaskPage.html',
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