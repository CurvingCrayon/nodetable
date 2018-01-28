var gCal = require("./calendar.js");
var currentLog = "";
var fullLog = [];
var processing = false;
var lengthThreshold = 60;
var jFile = require("jsonfile");
var Horseman = require('node-horseman');
var logFileName = "log.json";
var rosterFileName = "rosters.json";
var prevRosters = {};
var rostersLoaded = false;
var count = 0;
var currentTab = 0;
var fileContents = "";
var pendingLogs = [];
var busyPend = false;
exports.init = function(){
    jFile.readFile(rosterFileName, function(err,obj){
        if(err){
            console.log(err);
        }
        else{
            rostersLoaded = false;
            prevRosters = obj;
        }
    });
}
exports.getTimetables = function(callback,res){
    processing = true;
    var timetables = [];
    horseman = new Horseman();
horseman
.on("tabCreated",function(tabNum){currentTab = tabNum;})
.on("error",function(msg,trace){console.log(msg);})
  .open('https://metime.mcdonalds.com.au/Account?ContentSuffix=MyRosters&returnUrl=%2F%23%2FMyRosters#/Login')
//.waitForSelector("input#UserName")
    .waitForNextPage()
.count("input#UserName")
.then(function(userField){
    if(userField == 1){
        horseman
            .type('input#UserName', '2820289')
            .type('input#Password', 'Hippoinajar2.0')
            .click("button:contains('Log in')")
            .waitForNextPage({timeout: 10000})
            .waitForSelector("table button:eq(0)")
            .count("table button")
            .then(function(numRosters){
                log("Number of rosters: " +numRosters);
                if(numRosters == 0){
                    log("No rosters found", "err");
                    horseman
                    .title()
                    .then(function(titleText){
                        log("Title is: " + titleText);
                        log("Ending");
                        processing = false;
                        horseman.close().catch(handle);
                    }).catch(handle);
                }
                else{ //SUCCESSFUL LOGIN TO ROSTERS PAGE
                    if(numRosters > 1){ //There are multiple rosters
                        //Recursive loop (to allow for synchronous looping)
                        var roster = 1; //0 indexed, though it is a post-test loop
                        var loop = function(){
                            dupeTab(function(){
                                var dateString = "";
                                horseman
                                .text("td:contains('-'):eq("+String(roster-1)+")")
                                .then(function(dates){
                                    dateString = dates;
                                    log("Date string: "+dateString);
                                    log("clicking "+String(roster-1));
                                    horseman
                                        .click("button:contains('VIEW'):eq("+String(roster-1)+")")
                                    //.waitForSelector("#rosterTable")
                                    .wait(2000)
                                        .html("#rosterTable")
                                    .then(function(rosterData){
                                        rosterData = "<table>"+rosterData+"</table>";
                                        timetables.push([dateString, rosterData]);
                                        horseman
                                            .closeTab(currentTab)
                                            .then(function(){
                                                currentTab--;
                                                log("Success "+String(roster-1));
                                                if(roster < numRosters){
                                                    roster++;
                                                    loop();
                                                }
                                                else{
                                                    endLoop();
                                                }
                                            }).catch(handle);
                                    }).catch(handle);
                                }).catch(handle);
                            });
                        }
                        loop();
                        var endLoop = function(){ //Code to continue after loop
                            log("Loop finished");
                            log("END");
                            horseman.closeTab(0).catch(handle);
                            setTimeout(function(){
                                currentLog = "";
                            },1000);
                            processing = false;
                            callback(timetables,res);
                        }
                    }
                    else{ //Only 1 roster (no recursive looping)
                        log("One roster");
                        dupeTab(function(){
                            var dateString = "";
                            horseman
                            .text("td:contains('-'):eq(0)")
                            .then(function(dates){
                                dateString = dates;
                                log("Date string: "+dateString);
                                log("clicking 1");
                                horseman
                                .click("button:contains('VIEW'):eq(0)")
                                .waitForSelector("#rosterTable")
                                .html("#rosterTable")
                                .then(function(rosterData){
                                    rosterData = "<table>"+rosterData+"</table>";
                                    timetables.push([dateString, rosterData]);
                                    horseman
                                        .closeTab(currentTab)
                                        .then(function(){
                                            currentTab--;
                                            log("Success single roster");
                                            log("END");
                                            horseman.closeTab(0);
                                            setTimeout(function(){
                                                currentLog = "";
                                            },1000);
                                            processing = false;
                                            callback(timetables);
                                        })
                                }).catch(handle);
                            }).catch(handle);
                            
                        });
                    }
                }

                //horseman.close();
            }).catch(handle);
    }
    else if(userField == 0){
        log("Username field not found","err");
        horseman
            .title()
            .then(function(titleText){
                console.log("Title: " +titleText);
                horseman.close();
            }).catch(handle);
    }
    else{
        console.log("UserField invalid number");
    }
}).catch(handle);
}
exports.getProgress = function(callback){
    callback(currentLog);
}
function dupeTab(callback){
    horseman
    .url()
    .then(function(urlText){
        horseman
        .openTab(urlText)
        .wait(2000)
        .then(callback);
    });
}
function openRoster(index, callback){
     horseman
    .click("button:contains('VIEW'):eq("+String(index)+")")
    .wait(2000)
    .then(callback);
}
function getTimes(){
    horseman
    .html("#rosterTable","times1.html")
}
function log(text, type){
    console.log(text);
    text = text + " (" + getDate() +")";
    if(type === undefined){
        type = "log";
    }
    createLog(text,type)
    currentLog += text.substr(0,lengthThreshold) + "<br/>";
}
exports.log = function(text,type){
    log(text,type);
}
exports.getProcessing = function(callback){
    callback(processing);
}
function getDate(){
    var d = new Date();
    var date = d.getDate() + "/" + String(Number(d.getMonth())+1) + "/" + d.getFullYear();
    var time = d.getHours() + ":" + d.getMinutes();
    var output = date + " " + time;
    return output;
}
function createLog(body, type){
    var isLong = (body.length > lengthThreshold);
    var newObj = {
        "type": type,
        "body": body,
        "time": getDate(),
        "long": isLong
    }
    fullLog.push(newObj);
    pendingLogs.push(newObj);
    appendLog();
    return newObj;
    
}
function appendLog(){
    if(busyPend === false && pendingLogs.length > 0){
        busyPend = true;
        var nextLog = pendingLogs[0];
        jFile.readFile(logFileName, function(err,obj){
            if(err){
                console.log(err);
            }
            else{
                obj.arr.push(nextLog);
                jFile.writeFile(logFileName,obj,function(err){
                    if(err){
                        console.log(err);
                    }
                    pendingLogs.shift();
                    busyPend = false;
                    appendLog();
                    
                });
            }
        });
    }
    
}
function handle(err){
    createLog("Error: " + err.stack,"err");
    log("Error: "+ err.stack);
}
exports.handleRoster = function(roster){
    //takes an array with the following format (mimics website)
    //[Day, Date*, Start*, Finish*, length, position*]
    //The following code is designed to stop duplicate google calendar events by checking a rosters file
    var prev = prevRosters.arr;
    var obj = {
        "date": roster[1]
    }
    var found = false;
    for(var rost = 0; rost < prev.length; rost++){
         if(JSON.stringify(obj) === JSON.stringify(prev[rost])){
             found = true;
         }
    }
    if(found){ //If a google calendar event is already created
        console.log("Found date record already for "+ roster[1]);
    }
    else{ //If a google calendar event has not been created
        console.log("New date record being created for " + roster[1]);
       
        var newLog = prev;
        newLog.push(obj);
        newLog = {
            "arr": newLog
        }
        jFile.writeFile(rosterFileName, newLog, function (err) {
            if(err){
                log(err);
            }
        })
        return gCal.createRoster(roster);
    }
}