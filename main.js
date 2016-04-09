/**
 * Created by mdauphinais on 09.04.16.
 */
'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var chokidar = require('chokidar');
var hound = require('hound');
var simpleGit = require('simple-git')();

chokidar.watch('.'/*, {ignored: /[\/\\]\./}*/).on('change', function (path, event) {
    console.log('Change on path: ' + path);
    console.log(event);
    simpleGit.diff(['--stat'], function() {});
    //console.log('Chosen output: ', gitDiff);
    //console.log('Full output: ', simpleGit.diff());
});

chokidar.watch('./.git').on('change', function (path, event) {
    console.log('Change in git: ', event);
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
});