"use strict";
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio'), cheerioTableparser = require('cheerio-tableparser');
var app     = express();
// let tournamentJSON = require("./tournaments.json")
let tournamentJSON = require("./empty.json")
let lockedScrapingMutex = false;  
let lastScrapedTime = "";

//////////////////////////////////
// SETUP DATE STUFF
//////////////////////////////////
var options = {
    timeZone: "America/Chicago",
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric'
};
var formatter = new Intl.DateTimeFormat([], options);

//////////////////////////////////
// SETUP CHILD PROCESS TO SCRAPE
//////////////////////////////////
const { fork } = require('child_process');
const forked = fork('scrapeTournaments.js');
forked.on('message', (msg) => {
    console.log('Received message from child: ', "DONE SCRAPING -- actual msg not shown");
    tournamentJSON = msg;
    lastScrapedTime = formatter.format(new Date()); // get the current time and remember
    lockedScrapingMutex = false; // reset our mutex
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

//////////////////////////////////
// START API FUNCTIONS
//////////////////////////////////

app.get('/', function(req, res, next){
    // res.send('nothing to see here')
    res.status(200).send(JSON.stringify({message: `GREETINGS PROFESSOR FALKEN.`})).end();
    //res.json({message: `GREETINGS PROFESSOR FALKEN.`});
})

// Force a refresh of the tournament data
// Scrape will get called automatically on a timer, FYI
app.get('/scrape', function(req, res, next) {
    let myResponse = "";
    if(lockedScrapingMutex === true) {
        myResponse = {"status": "rejected", "description": "scrape already running", "lastScraped": lastScrapedTime };
    } else {
        lockedScrapingMutex = true; // lock the mutex
        forked.send("Please scrape. Thank you!"); // poke the child process to scape
        myResponse = { "status": "queued", "lastScraped": lastScrapedTime };
    }
    res.send(JSON.stringify(myResponse, null, 4));
})

app.get('/tournaments', function(req, res, next){
    console.log('/tournaments called at ' + new Date().toLocaleString() );
    res.send(JSON.stringify(tournamentJSON, null, 4))    
})

// note, you can query a tournament by either urlID or ID
// an empty array is returned if no tournament is found
app.get('/tournament/:ID', function(req, res, next){
    console.log('/tournament called with urlID: ' + req.params.urlID)
    let objArray = tournamentJSON.filter(t => t.urlID === req.params.ID || t.ID === req.params.ID);
    res.send(JSON.stringify(objArray, null, 4));
})

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
  
exports = module.exports = app;
