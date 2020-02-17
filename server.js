'use strict';
var express = require('express');
const fs = require('fs');
var request = require('request');
var cheerio = require('cheerio'),
  cheerioTableparser = require('cheerio-tableparser');
var app = express();
let tournamentJSON = require('./tournaments.json');
// let tournamentJSON = require('./empty.json');
let lockedScrapingMutex = false;
let lastScrapedTime = '';

const scraper = require('./scrapers/tScraper.js');
const TScraperConfig = require('./scrapers/TScraperConfig.js');

//////////////////////////////////
// SETUP DATE STUFF
//////////////////////////////////
var options = {
  timeZone: 'America/Chicago',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};
var formatter = new Intl.DateTimeFormat([], options);

//////////////////////////////////
// EXISTING TOURNAMENT DATA?
/////////////////////////////////
// Check that the file exists locally
if (!fs.existsSync('/tmp/tournaments.json')) {
  console.log('WARNING: File not found ->  /tmp/tournaments.json');
} else {
  console.log('READING /tmp/tournaments.json ...');
  let rawdata = fs.readFileSync('/tmp/tournaments.json');
  let rawdataAsJSON = JSON.parse(rawdata);
  if (rawdataAsJSON.length > 0) {
    tournamentJSON = JSON.parse(JSON.stringify(rawdataAsJSON));
  }
  console.log('DONE! read /tmp/tournaments.json');
}

//////////////////////////////////
// SETUP CHILD PROCESS TO SCRAPE
//////////////////////////////////
const { fork } = require('child_process');
// let debug = typeof v8debug === 'object';
// if (debug) {
//     //Set an unused port number.
//     process.execArgv.push('--debug=' + (40894));
// }

// Uncomment the lines below to make scraping work again
const forked = fork('scrapeTournaments.js');
forked.on('message', msg => {
  console.log(
    'Received message from child: ',
    'DONE SCRAPING -- actual msg not shown'
  );
  tournamentJSON = msg;
  lastScrapedTime = formatter.format(new Date()); // get the current time and remember

  // If returned tournaments is > 0, write to file for quick loading later
  if (tournamentJSON.length > 0) {
    console.log('Writing tournament data to /tmp/tournaments.json');
    fs.writeFile(
      '/tmp/tournaments.json',
      JSON.stringify(tournamentJSON, null, 2), // pretty print json
      err => {
        // In case of a error throw err.
        if (err) {
          console.log("ERROR: Couldn't write tournament data to file system");
          throw err;
        }
      }
    );
  }

  lockedScrapingMutex = false; // reset our mutex
});

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

//////////////////////////////////
// START API FUNCTIONS
//////////////////////////////////

app.get('/', function(req, res, next) {
  // res.send('nothing to see here')
  res
    .status(200)
    .send(JSON.stringify({ message: `GREETINGS PROFESSOR FALKEN.` }))
    .end();
  //res.json({message: `GREETINGS PROFESSOR FALKEN.`});
});

// Force a refresh of the tournament data
// Scrape will get called automatically on a timer, FYI
app.get('/scrape', function(req, res, next) {
  let myResponse = '';
  if (lockedScrapingMutex === true) {
    myResponse = {
      status: 'rejected',
      description: 'scrape already running',
      lastScraped: lastScrapedTime,
    };
  } else {
    lockedScrapingMutex = true; // lock the mutex
    forked.send('Please scrape. Thank you!'); // poke the child process to scape
    myResponse = { status: 'queued', lastScraped: lastScrapedTime };
  }
  res.send(JSON.stringify(myResponse, null, 4));
});

app.get('/test', function(req, res, next) {
  console.log('/test called at ' + new Date().toLocaleString());

  // let config1 = new TScraperConfig('1', '2019');
  // let config2 = new TScraperConfig('2', '2019');
  // let tournaments = {};
  // tournaments = scraper.fetchTournaments(config1);

  let today = new Date();
  const config = new TScraperConfig('6', '2019');
  let tournaments = [];

  config.year = today.getFullYear().toString();
  for (let i = 1; i <= 2; i++) {
    config.month = i.toString();
    tournaments = tournaments.concat(scraper.fetchTournaments(config));
  }

  config.year = (today.getFullYear() + 1).toString();
  for (let i = 1; i <= 2; i++) {
    config.month = i.toString();
    tournaments = tournaments.concat(scraper.fetchTournaments(config));
  }

  res.send(JSON.stringify(tournaments, null, 4));
});

app.get('/tournaments', function(req, res, next) {
  console.log('/tournaments called at ' + new Date().toLocaleString());
  res.send(JSON.stringify(tournamentJSON, null, 4));
});

// note, you can query a tournament by either urlID or ID
// an empty array is returned if no tournament is found
app.get('/tournament/:ID', function(req, res, next) {
  console.log('/tournament called with urlID: ' + req.params.urlID);
  let objArray = tournamentJSON.filter(
    t => t.urlID === req.params.ID || t.ID === req.params.ID
  );
  res.send(JSON.stringify(objArray, null, 4));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

exports = module.exports = app;
