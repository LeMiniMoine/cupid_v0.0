/**
 * Created by mdauphinais on 09.04.16.
 */
'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var chokidar = require('chokidar');
var simpleGit = require('simple-git')();
var Client = require('node-rest-client').Client;
var express = require('express');
var restApp = express();


var user = 'mike';
var changeList = [];
var roomId = 'Y2lzY29zcGFyazovL3VzL1JPT00vMDA2ZTdiMjAtZmQxMS0xMWU1LTg2NDUtOWZjNGE1MmNmMGQ5';
var client = new Client();

restApp.get('/', function (req, res) {
    res.send('Hello Seattle\n');
});
restApp.listen(3001);
console.log('Listening on port 3001...');


chokidar.watch('.', {ignored: '.idea'}).on('change', function (path, event) {
    //console.log('Change in file: ' + path);
    simpleGit.diffSummary(function (error, response) {
        //console.log(response);
        var changedFiles = response.files;
        /*        changedFiles = response.files;
         response.files.forEach(function (element) {
         changedFiles[element.index] = element;
         });*/
        //console.log('Changed files: ', changedFiles);
        //console.log('Stringified response: ', JSON.stringify(response));
        //console.log('Stringified changes: ', JSON.stringify(changedFiles));

        //console.log(changedFiles);
        var changes = {
            user: user,
            files: changedFiles
        };
        //console.log(changes);
        var stringChanges = JSON.stringify(changes);
        //console.log(stringChanges);
        var args = {
            headers: {
                "Content-type": "application/json; charset=utf-8",
                "Authorization": "Bearer N2I5YzMxMDMtMTQ5NS00N2MwLThkYzItZjU4OWQ3YmFhZjMwNzVmNDljMzYtYzc3"
            },
            data: {
                "roomId": "Y2lzY29zcGFyazovL3VzL1JPT00vMDA2ZTdiMjAtZmQxMS0xMWU1LTg2NDUtOWZjNGE1MmNmMGQ5",
                "text": stringChanges
            }

        };
        client.post('https://api.ciscospark.com/v1/messages', args, function (data, response) {
            // parsed response body as js object
            console.log(data);
            // raw response
            //console.log(response);
        });
    });


    //changeList.push(change);
    //console.log(changeList);



    /*    client.get("https://api.ciscospark.com/v1/rooms", args, function (data, response) {
     // parsed response body as js object
     console.log(data);


     // raw response
     //console.log(response);
     });*/

    /*    client.post('https://api.ciscospark.com/v1/messages', args, function (data, response) {
     // parsed response body as js object
     console.log(data);
     // raw response
     //console.log(response);
     });*/

    //console.log(event);
    simpleGit.diffSummary(function (error, response) {
        //console.log(error);
        //console.log(response);
    });

    //console.log('Chosen output: ', gitDiff);
    //console.log('Full output: ', simpleGit.diff());
});


/*chokidar.watch('./.git').on('change', function (path, event) {
 console.log('Change in git: ', event);
 });*/

var mainWindow = null;


//var log = console.log.bind(console);

app.on('ready', function () {
    mainWindow = new BrowserWindow({
        frame: false,
        height: 300,
        resizable: false,
        width: 300,
        show: false
    });

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
});