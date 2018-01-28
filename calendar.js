//Credit to:
//http://isd-soft.com/tech_blog/accessing-google-apis-using-service-account-node-js/
var google = require("googleapis");
var privatekey = require("./projectKey.json");
var calendarId = "4c9j3too7moc1p1q6f9fj0rha8@group.calendar.google.com";
var calendar = google.calendar("v3");
// configure a JWT auth client
var jwtClient = new google.auth.JWT(
       privatekey.client_email,
       null,
       privatekey.private_key,
       ["https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/calendar"]);
//authenticate request
jwtClient.authorize(function (err, tokens) {
 if (err) {
   console.log(err);
   return;
 } else {
   console.log("Successfully connected Google Calendar API");
     initCalendar();
 }
});
function initCalendar(){
//    calendar.events.quickAdd({
//       auth: jwtClient,
//       calendarId: "primary",
//        text: "Work at Maccas on January 3rd 10am-10:30am"
//    },function(err,response){
//        if (err) {
//           console.log("The API returned an error: " + err);
//           return;
//       }
//        response
//        
//    });
}
exports.createRoster = function(rosterData){
    //takes an array with the following format (mimics website)
    //[Day, Date*, Start*, Finish*, length, position*]
    //* actually used in this function
    console.log("Creating roster with the following data:");
    console.log(rosterData);
    var role = rosterData[5];
    var date = formatDate(rosterData[1]);
    var start = date + "T" + formatTime(rosterData[2]);
    var end = date + "T" + formatTime(rosterData[3]);
    var eventProperties = {
        "summary": "Maccas: " + role,
      "location": "McDonald's, Waterworth Dr, Mount Annan NSW 2567, Australia",
      "description": "Work shift at Maccas as a " + role,
      "start": {
        "dateTime": start,
        "timeZone": "Australia/Sydney",
      },
      "end": {
          //previous value : "2018-05-28T17:00:00"
        "dateTime": end,
        "timeZone": "Australia/Sydney",
      },
      /*"attendees": [ This essentially causes a duplicate event
        {
            "displayName": "Hayden Keers",
            "email": "hayden.keers@gmail.com"
        }
      ],*/
      "reminders": {
        "useDefault": true
      }
    }
    calendar.events.insert({
        "auth": jwtClient,
        "calendarId": calendarId,
        "resource": eventProperties
    },function(err,response){
        if (err) {
            console.log("The API returned an error: " + err);
            return;
        }
    });
        
}
function formatDate(dateString){
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    //Date string is in the following format
    //11 Jan 2018
    var arrDate = dateString.split(" ");
    var day = arrDate[0];
    if(day.length == 1){
        day = "0" + day;
    }
    var year = arrDate[2];
    var month = false;
    for(var m = 0; m < months.length; m++){
        if(months[m].search(arrDate[1]) !== -1){ //Uses search as month strings are not confirmed
            month = String(m+1);
        }
    }
    if(month === false){
        console.log("Error finding month of dateString in formateDate()");
        month = "01";
        year = "2017"; //So it does not create a valid event
    }
    if(month.length === 1){
        month = "0" + month;
    }
    //Date must be in formate YYYY-MM-DD
    var newDate = year + "-" + month + "-" + day;
    return newDate;
}
function formatTime(timeString){
    //timeString is in the following format
    //4:00 PM
    var arrTime = timeString.split(":");
    var hours = arrTime[0];
    var mins = arrTime[1].split(" ")[0]; //Remove AM/PM component
    //Mins should already have 2 digits no matter what
    var ampm = arrTime[1].split(" ")[1];
    if(ampm === "PM" && hours !== "12"){
        hours = String(Number(hours) + 12);
    }
    else if(hours.length === 1){ //PM hours always have 2 digits in 24 hr format
        hours = "0" + hours;
    }
    //Time needs to be in the following formate
    //HH:MM:SS
    var newTime = hours + ":" + mins + ":00";
    return newTime;
}