// This is a file for code that will be forked with a 
// child_process.fork() call
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio'), cheerioTableparser = require('cheerio-tableparser');
var app     = express();
let tournamentJSON = require("./testData.json")
let scrapeInterval = 1000 * 3600 * 2; // scrapes every two hours

//////////////////////////////////
// SETUP DEBUG STUFF
//////////////////////////////////
var debug = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));
if(debug) {
    tournamentJSON = require("./testData.json")
}

//////////////////////////////////
// SETUP DATE STUFF
//////////////////////////////////
var options = {
    timeZone: "America/Chicago",
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric'
};
var formatter = new Intl.DateTimeFormat([], options);
let currentTime = formatter.format(new Date());
  
// Just in case the parent wants to send us a message
// to force a scrape
process.on('message', (msg) => {
    console.log('Message from parent:', msg);
    scrapeTournaments();
});

// Call one time to invoke on startup, otherwise it fires on a timer
scrapeTournaments();
let future = Date.now() + scrapeInterval;
future = formatter.format(future);
console.log("CHILD_PROCESS: Next scape will occur @ " + future)

setInterval(() => {
    let currentTime = formatter.format(new Date()); 
    console.log("CHILD_PROCESS: Calling scrape on timer :: " + currentTime);
    scrapeTournaments();
    future = Date.now() + scrapeInterval;
    future = formatter.format(future);
    console.log("CHILD_PROCESS: Next scape will occur @ " + future)
}, scrapeInterval); 

// This is the spreadsheet that contains the Tournament data we want.
// https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586
// This is how you have to query that spreadsheet to actually get the data
// curl 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586' -H 'authority: docs.google.com' -H 'cache-control: max-age=0' -H 'upgrade-insecure-requests: 1' -H 'dnt: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'x-client-data: CIq2yQEIo7bJAQjBtskBCKmdygEIqKPKAQ==' -H 'x-chrome-connected: id=117602618126914006031,mode=0,enable_account_consistency=false' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'cookie: S=apps-spreadsheets=QC7KTnSKjWJ9n3dNktzjyaQGM0AYoeqe; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3; OGPC=19005936-1:19006326-1:19006818-1:19006965-1:19007018-1:; OGP=-19005936:-19006965:-19007018:; SID=MQac4__zVRJQCaE01W3bTqkDoxq4QVNIycc2W2NtnO-mO9dM8OX0smfk3nQlz_9zDMY16A.; HSID=A03BY5GeUi7Zac1PY; SSID=A3X-dLXTIUa2rByrK; APISID=p8obGQVNd2kf5JL1/AJkRZO-gAKnNDbUJM; SAPISID=0NdIcLt9qhb18m7l/ATLPtHqMxFBDGm2dN; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3:explorer=AMbLQ14eRLykVAU5vEK2qeLp0cgo7ECC; NID=134=rG82b7SoaRalxIPiDEoGZnGJyH78XXfwIYoD17yCPZ9PdRcZoJam4EEFjf3JA7V02wgPBaVm-TLWrhFDExF8KwiOzSfP_5lfwTuFL__UWAknVdDqyFeT-JH6EWh5SQEZtHZR5efdwzs9DrtjWMFp_nPooslM6YzoEXcjHi1gRpUiL5BmqhLcUXcsab988HeerCvIZR_F_a6rvnBwp_xBtyzVLu1n9sZA5nPLU6o-vtOxb4bvZkbEN86r7EPq9pDqe2lDNYm3T_x_b_MIqppkxpilXGDpijIgDk5vtLhROzVkgnICnGi3FYO7SQ; 1P_JAR=2018-07-09-02; SIDCC=AEfoLeY40XTBMJfssVYYWXr3D_JMZBSlY8snLsUWPwuBlYbjC4USYW3VK0qpNSkd2dUMFcU77Jcg' --compressed
function scrapeTournaments() {
    //All the web scraping magic will happen here
    console.log('CHILD_PROCESS: executing scrape...')
    //url = 'http://www.imdb.com/title/tt1229340/';
    // url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586'

    // Let's grab the tournament data with a curl
    var c = require('child_process');
    var html = c.execSync(`curl 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586' -H 'authority: docs.google.com' -H 'cache-control: max-age=0' -H 'upgrade-insecure-requests: 1' -H 'dnt: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'x-client-data: CIq2yQEIo7bJAQjBtskBCKmdygEIqKPKAQ==' -H 'x-chrome-connected: id=117602618126914006031,mode=0,enable_account_consistency=false' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'cookie: S=apps-spreadsheets=QC7KTnSKjWJ9n3dNktzjyaQGM0AYoeqe; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3; OGPC=19005936-1:19006326-1:19006818-1:19006965-1:19007018-1:; OGP=-19005936:-19006965:-19007018:; SID=MQac4__zVRJQCaE01W3bTqkDoxq4QVNIycc2W2NtnO-mO9dM8OX0smfk3nQlz_9zDMY16A.; HSID=A03BY5GeUi7Zac1PY; SSID=A3X-dLXTIUa2rByrK; APISID=p8obGQVNd2kf5JL1/AJkRZO-gAKnNDbUJM; SAPISID=0NdIcLt9qhb18m7l/ATLPtHqMxFBDGm2dN; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3:explorer=AMbLQ14eRLykVAU5vEK2qeLp0cgo7ECC; NID=134=rG82b7SoaRalxIPiDEoGZnGJyH78XXfwIYoD17yCPZ9PdRcZoJam4EEFjf3JA7V02wgPBaVm-TLWrhFDExF8KwiOzSfP_5lfwTuFL__UWAknVdDqyFeT-JH6EWh5SQEZtHZR5efdwzs9DrtjWMFp_nPooslM6YzoEXcjHi1gRpUiL5BmqhLcUXcsab988HeerCvIZR_F_a6rvnBwp_xBtyzVLu1n9sZA5nPLU6o-vtOxb4bvZkbEN86r7EPq9pDqe2lDNYm3T_x_b_MIqppkxpilXGDpijIgDk5vtLhROzVkgnICnGi3FYO7SQ; 1P_JAR=2018-07-09-02; SIDCC=AEfoLeY40XTBMJfssVYYWXr3D_JMZBSlY8snLsUWPwuBlYbjC4USYW3VK0qpNSkd2dUMFcU77Jcg' --compressed`).toString(); //returns stdout

    var $ = cheerio.load(html);
    cheerioTableparser($);

    tableData = $("table").parsetable(true, true, true);
    flippedTableData = tableData[0].map((col, i) => tableData.map(row => row[i]));

    var json = [];

    for(var i = 0; i < flippedTableData.length; i++) {
        if (i === 0) { continue; }
        if (i === 1) { continue; }

        var item = flippedTableData[i];

        var obj = { date : "", name : "", city : "", ID : ""};
        obj.date = item[1].toString();
        obj.name = item[2].toString();
        obj.city = item[3].toString();
        obj.ID = item[4].toString();

        json.push(obj);
    }

    // Now go back and get the data as HTML so we can parse out the tournament link
    tableData = $("table").parsetable(true, true, false);
    flippedTableData = tableData[0].map((col, i) => tableData.map(row => row[i]));
    for(var i = 0; i < flippedTableData.length; i++) {
        if (i === 0) { continue; }
        if (i === 1) { continue; }

        var item = flippedTableData[i];

        var obj = { date : "", name : "", city : "", ID : "", urlID: "", url: "", points: "", deadline: ""};
        obj.date = json[(i-2)].date.toString();
        obj.name = json[i-2].name.toString();
        obj.city = json[i-2].city.toString();
        obj.ID = json[i-2].ID.toString();

        var index = item[4].search("%3D");
        var urlID = item[4].substring(index+3, index+3+6); 
        obj.urlID = urlID;
        obj.url = "https://tennislink.usta.com/tournaments/TournamentHome/Tournament.aspx?T=" + urlID;
       
        // The call to get points takes too long. DON'T DO IT HERE.
        //var points = getPoints(urlID);
        //obj.points = points;
        parser = getTournamentParser(urlID);
        obj.points = getPoints(urlID, parser);
        obj.deadline = getDeadline(urlID, parser);

        json[i-2] = obj;
        //json.push(obj);
    }

    // Hack to remove bad listing currently in the tournament spreadsheet
    let indexToRemove = -1;
    for (var i = 0; i < json.length; i++) {
        if (json[i].name === "Howdy Honda/Polo Tennis & Fitness Club Category III Nationals (Ad, Sr, SS)") {
            indexToRemove = i;
            break;
        }
    }
    if (indexToRemove > -1) {
        json.splice(indexToRemove, 1);
    }

    // remember the data for use later
    tournamentJSON = json;

    // send back the tournament info to the parent
    process.send(tournamentJSON); // send parent process the new data
}

function getTournamentParser(urlID) {
    var c = require('child_process');
    url = 'https://tennislink.usta.com/tournaments/TournamentHome/Tournament.aspx?T=' + urlID;
    cmd = "curl '" + url.toString() + "' --compressed";
    var html = c.execSync(cmd).toString(); //returns stdout
    //console.log(html.toString());
    const $ = cheerio.load(html);
    return $;
}

function getPoints(urlID, $) {
    var txt = $('body').text();
    var n = txt.search("Adult-");
    if (n === -1) {
        return "?";
    }
    var points = txt.substring(n+6, n+9);
    return points;
}

function getDeadline(urlID, $) {
    cheerioTableparser($);
    tableData = $("#entry_info").parsetable(true, true, true);
    return tableData[1][1].toString();
}
