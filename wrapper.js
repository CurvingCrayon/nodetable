var connect = require('connect');
var serveStatic = require('serve-static');
var horse = require("./main.js");
var heldTableData = []; //Array of records
var $ = require("cheerio");
horse.init();
connect()
    .use(serveStatic(__dirname))
    .use("/timetable", function(req,res,next){  
        horse.log("Received timetable request.");
        res.setHeader('Content-Type', 'text/plain');
        horse.getProcessing(function(processing){
           if(!processing){
                horse.getTimetables(handleData,res);
            }
            else{
                res.write("Currently processing");
                res.end();
            } 
        });
    })
    .use("/progress",function(req,res,next){
        res.setHeader("Content-Type","text/plain");
        horse.getProgress(function(currentLog){
            if(currentLog === ""){
                res.write("EMPTY");
                res.end("EMPTY");
            }
            else{
                horse.getProgress(function(prog){
                    res.write(prog);
                    res.end();
                });
            }
        });
        
    })
    .listen(8080, function(){
    console.log('Server running on 8080...');
});
function handleData(tableData,res){
    //Return data to front end
    var newTableData = "";
    for(var tab = 0; tab < tableData.length; tab++){
        newTableData += tableData[tab].join("<br/>")+"<br/>";
    }
    res.write(tableData.join(","));
    res.end();
    var numTables = tableData.length;
    //Process data for gmail and calendars
    for(var t = 0; t < numTables; t++){ //Each table
        var tableBody = $(tableData[t][1]).children().eq(1);
        columns = tableBody.children();
        numCols = columns.length;
        var newTable = [];
        for(col = 0; col < numCols; col++){ //Each column
            rows = columns.eq(col).children();
            //The 3rd and 4th rows are conjoined, and the 6th row is underneath them
            //The follow code changes this so its a linear column
            var miniTable = rows.eq(2);
            var time1 = miniTable.children().eq(0).children().eq(0).children().eq(0).children().eq(0).text();
            var time2 = miniTable.children().eq(0).children().eq(0).children().eq(0).children().eq(1).text();
            var position = miniTable.children().eq(0).children().eq(0).children().eq(1).children().eq(0).text();
            position = fixPos(position);
            newCol = [rows.eq(0).text(),rows.eq(1).text(),time1,time2,rows.eq(3).text(),position];
            newTable.push(newCol);
            //CREATE TIMETABLE (GOTO calendar.js)
            horse.handleRoster(newCol);
        }
        updateData(newTable);
    }
}
function updateData(tableData){//Check heldTableData for duplicates and add new data
    //New table is a 2d array, the desired structure is an object
    //[Day, date, start, end, hours, position]
    var newObj = {
        "day": tableData[0],
        "date": tableData[1],
        "start": tableData[2],
        "end": tableData[3],
        "hours": tableData[4],
        "position": tableData[5]
    }
    
}
function fixPos(pos){
    //Position often has an acronym such as the following
    // TDH: Table Delivery Host
    //Sometimes there is whitespace, sometimes not
    var arrPos = pos.split(":");
    pos = arrPos[arrPos.length-1]; 
    pos = pos.trim();
    return pos;
}