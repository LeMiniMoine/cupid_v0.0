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
var ngrok = require('ngrok');
var bodyParser = require('body-parser');
var lodash = require('lodash');

var user = 'mike';
var auth = 'Bearer N2I5YzMxMDMtMTQ5NS00N2MwLThkYzItZjU4OWQ3YmFhZjMwNzVmNDljMzYtYzc3';
var roomId = 'Y2lzY29zcGFyazovL3VzL1JPT00vMDA2ZTdiMjAtZmQxMS0xMWU1LTg2NDUtOWZjNGE1MmNmMGQ5';
var client = new Client();

var teamChanges = [];



var args = {
    headers: {
        'Content-type': 'application/json; charset=utf-8',
        'Authorization': auth
    }
};

ngrok.connect(
    {
        proto: 'http',
        addr: 3033
    },
    function (err, url) {
        args.data = {
            name: 'mikeWebHook',
            targetUrl: url,
            resource: 'messages',
            event: 'created',
            filter: 'roomId='.concat(roomId)
        };
        client.post('https://api.ciscospark.com/v1/webhooks', args, function (data, response) {
            console.log('Webhook created');

            restApp.use( bodyParser.json() );
            restApp.post('/', function (req, res) {
                getMessageFromCisco(req.body.data.id);
            });
            restApp.listen(3033);
            console.log('Listening on port 3033...');
        });
    });

chokidar.watch('.', {ignored: '.idea'}).on('change', function (path, event) {
    simpleGit.diffSummary(function (error, response) {

        var changes = {
            user: user,
            files: response.files
        };

        if(shouldSendNewChanges(changes)) {
            console.log('Sending new changes...');
            args.data = {
                'roomId': roomId,
                'text': JSON.stringify(changes)
            };

            client.post('https://api.ciscospark.com/v1/messages', args, function (data, response) {

            });
        }
    });
});

var mainWindow = null;

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

var getMessageFromCisco = function (messageId) {
    client.get('https://api.ciscospark.com/v1/messages/'.concat(messageId), args, function(data, response) {
        var receivedChanges = JSON.parse(data.text);
        console.log(receivedChanges);
        updateTeamChangeList(receivedChanges);
    })
};

var shouldSendNewChanges = function(changes) {
    var myPreviousChangeList = teamChanges.filter(function (change) {
        return change.user == user;
    }).map(function (change) {return change.file});

    var myCurrentChangeList = changes.files.map(function(element) {return {file:element.file}});

    var fileChangesToAdd = getObjectsPresentInArray1NotInArray2(myCurrentChangeList, myPreviousChangeList);

    fileChangesToAdd.forEach(function(file) {
        teamChanges.push({user: user, file: file.file});
    });

    var fileChangesToRemove = getObjectsPresentInArray1NotInArray2(myPreviousChangeList, myCurrentChangeList);

    fileChangesToRemove.forEach(function(file) {
        teamChanges.slice(teamChanges.indexOf({user: user, file: file.file}));
    });

    console.log('Should send changes: ', (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove)));

    var mergeConflict = checkForMergeConflict(teamChanges);

    return (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove));
};

var getObjectsPresentInArray1NotInArray2 = function(array1, array2) {
    var bIds = {};
    array2.forEach(function(obj){
        bIds[obj.id] = obj;
    });
    return array1.filter(function(obj){
        return !(obj.id in bIds);
    });
};



var updateTeamChangeList = function (message) {
    var remoteUser = message.user;
    var previousChangeListFromUser = teamChanges.filter(function (change) {
        return change.user == remoteUser;
    }).map(function (change) {return change.file});

    var currentChangeListForUser = message.files.map(function(element) {return {file:element.file}});

    var fileChangesToAdd = getObjectsPresentInArray1NotInArray2(currentChangeListForUser, previousChangeListFromUser);

    fileChangesToAdd.forEach(function(file) {
        teamChanges.push({user: remoteUser, file: file.file});
    });

    var fileChangesToRemove = getObjectsPresentInArray1NotInArray2(previousChangeListFromUser, currentChangeListForUser);

    fileChangesToRemove.forEach(function(file) {
        teamChanges.slice(teamChanges.indexOf({user: remoteUser, file: file.file}));
    });

    console.log('Team change list updated: ', (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove)));
    console.log('Team change list: ', teamChanges);
};

var checkForMergeConflict = function (teamChangeList) {
    return false;
};

