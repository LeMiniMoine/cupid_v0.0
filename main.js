/**
 * Created by mdauphinais on 09.04.16.
 */
'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var chokidar = require('chokidar');
var hound = require('hound');

chokidar.watch('./.git').on('change', function (event, path) {
    console.log(event, path);
});

var mainWindow = null;


var log = console.log.bind(console);

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        frame: false,
        height: 300,
        resizable: false,
        width: 300,
        show: false
    });

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    var watcher = chokidar.watch('file', {ignored: /^\./, persistent: true});

    watcher
        .on('add', function(path) {console.log('File', path, 'has been added');})
        .on('change', function(path) {console.log('File', path, 'has been changed');})
        .on('unlink', function(path) {console.log('File', path, 'has been removed');})
        .on('error', function(error) {console.error('Error happened', error);})
        .on('raw', function(event, path, details) { log('Raw event info:', event, path, details); });
});
console.log('start...');

var watcher2 = hound.watch('./.git');


watcher2.on('change', function(file, stats) {
    console.log(file + ' was changed')
});