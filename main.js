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

var user = 'bob';
var auth = 'Bearer M2NiOTU3NTAtY2YzMi00MWU4LTk4NjItNWFiOTNlZWJiMWFiMjhlYjQ1Y2QtY2Fj';
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

            restApp.use(bodyParser.json());
            restApp.post('/', function (req, res) {
              console.log('Message received from Spark')
                getMessageFromCisco(req.body.data.id);
            });
            restApp.listen(3033);
            console.log('Listening on port 3033...');
        });
    });

chokidar.watch('.', {ignored: /^\.idea|^\.git/gm}).on('change', function (path, event) {
    simpleGit.diffSummary(function (error, response) {
        var files = response.files.map(function (file) {
            return file.file
        });

        var changes = {
            user: user,
            files: files
        };

        if (shouldSendNewChanges(changes)) {
            console.log('Sending new changes...');
            args.data = {
                'roomId': roomId,
                'text': JSON.stringify(changes)
            };

            client.post('https://api.ciscospark.com/v1/messages', args, function (data, response) {
                console.log('Message sent: ', response.statusCode);
            });
        }
    });
});

var mainWindow = null;
var alertWindow = null;

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
    client.get('https://api.ciscospark.com/v1/messages/'.concat(messageId), args, function (data, response) {
        var receivedChanges = JSON.parse(data.text);
        updateTeamChangeList(receivedChanges);
    })
};

var shouldSendNewChanges = function (changes) {
    console.log('-------LOCAL CHANGE MADE----------');
    var myPreviousChangeList = teamChanges.filter(function (change) {
        return change.user == user;
    }).map(function (change) {
        return change.file
    });
    console.log('previous local change list: ', myPreviousChangeList);

    var myCurrentChangeList = changes.files;
    console.log('current local list: ', myCurrentChangeList);

    var fileChangesToAdd = getObjectsPresentInArray1NotInArray2(myCurrentChangeList, myPreviousChangeList);
    console.log('files to add: ', fileChangesToAdd);

    fileChangesToAdd.forEach(function (file) {
        teamChanges.push({user: user, file: file});
    });

    var fileChangesToRemove = getObjectsPresentInArray1NotInArray2(myPreviousChangeList, myCurrentChangeList);
    console.log('files to remove: ', fileChangesToRemove);

    var changesToRemove = fileChangesToRemove.map(function (fileChange) {
        return {user: user, file: fileChange}
    });

    lodash.pull(teamChanges, changesToRemove);

    console.log('Local team change list updated: ', (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove)));
    console.log('Team change list: ', teamChanges);
    console.log('Should send changes: ', (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove)));

    /*    var mergeConflictChange = checkForMergeConflict(teamChanges);
     if (true) {
     testSendSms();
     //mainWindow.show();
     }*/

    return (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove));
};

var getObjectsPresentInArray1NotInArray2 = function (array1, array2) {
    return array1.filter(function (element) {
        return !array2.includes(element);
    });
};

var updateTeamChangeList = function (message) {
    var remoteUser = message.user;
    console.log('-------REMOTE CHANGE MADE FROM USER '.concat(remoteUser).concat('----------'));
    var previousChangeListFromUser = teamChanges.filter(function (change) {
        return change.user == remoteUser;
    }).map(function (change) {
        return change.file
    });
    console.log('previous change list from user: ', previousChangeListFromUser);
    console.log('message changes: ', message);

    var currentChangeListForUser = message.files;
    console.log('current change list from user: ', currentChangeListForUser);

    var fileChangesToAdd = getObjectsPresentInArray1NotInArray2(currentChangeListForUser, previousChangeListFromUser);
    console.log('files to add from user: ', fileChangesToAdd);

    fileChangesToAdd.forEach(function (file) {
        teamChanges.push({user: remoteUser, file: file});
    });

    var fileChangesToRemove = getObjectsPresentInArray1NotInArray2(previousChangeListFromUser, currentChangeListForUser);
    console.log('files to remove from user: ', fileChangesToRemove);

    var changesToRemove = fileChangesToRemove.map(function (fileChange) {
        return {user: remoteUser, file: fileChange}
    });

    lodash.pull(teamChanges, changesToRemove);

    console.log('Local team change list updated: ', (!lodash.isEmpty(fileChangesToAdd) || !lodash.isEmpty(fileChangesToRemove)));
    console.log('Team change list: ', teamChanges);
};

var checkForMergeConflict = function (teamChangeList) {
    var filesList = teamChangeList.map(function (obj) {
        return obj.file
    });
    filesList.forEach(function (element) {
        if (filesList.filter(function (file) {
            return file == element
        }).size > 1) {
            return teamChangeList.filter(function (change) {
                return change.user != user;
            });
        }
    });
};

var testSendSms = function () {
    var args = {
        headers: {'Content-type': 'application/x-www-form-urlencoded'}, data: 'api_secret=d82051cedc9ad50e6348705c51125be0&number=0032472260967&subject=Test&body=test'};
    client.post('https://api4.apidaze.io/7b9bc7b4/sms/send', args, function (data, response) {
        console.log(data);
    });
};
