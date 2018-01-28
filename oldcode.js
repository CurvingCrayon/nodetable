var http = require('http');
const request = require("request");
const options = {  
    url: 'https://metime.mcdonalds.com.au/Account?ContentSuffix=MyRosters&returnUrl=%2F%23%2FMyRosters#/Login',
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'my-reddit-client'
    }
};

//request(options, function(err, res, body) {
//   
//    console.log(body);
//    console.log("\n\n====================\n\n");
//    setTimeout(function(){
//        request(options2, function (error, response, body) {
//            if (!error && response.statusCode == 200) {
//                // Print out the response body
//                
//                console.log(response.headers);
//                console.log(body);
//            }
//        });
//    },1000);
//});
//https://metime.mcdonalds.com.au/#/MyRosters
/*Maccas code for redirect:
 var afterHash = window.location.hash.substr(1);
    var contentSuffix = afterHash ? afterHash.substr(1) : '';
    var url = '/Account?ContentSuffix='+ contentSuffix +'&returnUrl=' + encodeURIComponent( '/#' + afterHash);
    window.location.href = url;*/
var querystring = require('querystring');
var http = require('http');


var post_data = querystring.stringify({
    "environmnetDataJson": '{"EventType":"Login","Platform":"Web","OsName":"Windows","OsVersion":10,"BrowserName":"Chrome","BrowserVersion":63.03239108,"Device":"Win32","WindowSize":"lg"}',
    "loginDataJson": '{"UserName":"2820289","Password":"Hippoinajar2.0"}'
});
// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}

// Configure the request
var options2 = {
    url: 'https://metime.mcdonalds.com.au/Account?ContentSuffix=MyRosters&returnUrl=%2F%23%2FMyRosters#/Login',
    method: 'POST',
    headers: headers,
    form: post_data
}
