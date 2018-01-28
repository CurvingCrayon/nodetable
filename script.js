//$("button").click(function(){
//    $.ajax({url: "/table", success: function(result){
//        $("#div1").html(result);
//    }});
//});
var currentLooper = false;
function shrek(){
    console.log("shrek");
}
function loadDoc() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            processTables(this.responseText);
       }
    };
    xhttp.open("POST", "/timetable", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data=timetable"); 
}
function prog(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("console").innerHTML = this.responseText;
            if(this.responseText.search("END") !== -1){
                clearInterval(currentLooper);
            }
       }
    };
    xhttp.open("GET", "/progress", true);
    xhttp.send(); 
}
function loopProg(ms){
    var currentLooper = setInterval(prog,ms);
}
function processTables(tables){
    tglob = tables;
    var dateTable = tables.split(",");
    var dates = [];
    tables = "";
    for(var elem = 0; elem < dateTable.length; elem++){
        if(elem % 2 === 0){
            dates.push(dateTable[elem]);
        }
        else{
            tables += dateTable[elem]
        }
    }
    var numRows = 4; //Constant
    tables = $.parseHTML(tables);
    var numTables = tables.length;
    var newTables = "";
    for(var t = 0; t < numTables; t++){ //Each table
        tableBody = tables[t].children[1];
        columns = tableBody.children;
        numCols = columns.length;
        var newTable = [];
        for(col = 0; col < numCols; col++){ //Each column
            rows = columns[col].children;
            //The 3rd and 4th rows are conjoined, and the 6th row is underneath them
            //The follow code changes this so its a linear column
            var miniTable = rows[2];
            var time1 = miniTable.children[0].children[0].children[0]
    .children[0];
            var time2 = miniTable.children[0].children[0].children[0].children[1];
            var position = miniTable.children[0].children[0].children[1].children[0];
            newCol = [rows[0],rows[1],time1,time2,rows[3],position];
            newTable.push(newCol);
        }
        //console.log(newTable)
        var builtTable = document.createElement("table");
        var tHead = document.createElement("thead");
        var titles = ["Day", "Date", "Start", "End", "Hours", "Position"];
        for(var title = 0; title < titles.length; title++){
            var titleElem = document.createElement("td");
            titleElem.innerHTML = titles[title];
            tHead.appendChild(titleElem);
        }
        builtTable.appendChild(tHead);
        for(var x = 0 ; x < newTable.length; x++){
            var c = document.createElement("tr");
            for(var y = 0; y < newTable[x].length; y++){
                var r = document.createElement("td");
                r.innerHTML = newTable[x][y].innerHTML;
                c.appendChild(r);
            }
            builtTable.appendChild(c);
        }
        builtTable.className = "timetable";
        newTables += builtTable.outerHTML;
        console.log(builtTable);
    }
    
    document.getElementById("output").innerHTML = newTables;
}