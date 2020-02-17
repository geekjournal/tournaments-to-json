// This is a file for code that will be forked with a
// child_process.fork() call
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio'),
  cheerioTableparser = require('cheerio-tableparser');
var app = express();
let tournamentJSON = require('./testData.json');
let scrapeInterval = 1000 * 3600 * 2; // scrapes every two hours

const scraper = require('./scrapers/tScraper.js');
const TScraperConfig = require('./scrapers/TScraperConfig.js');

//////////////////////////////////
// SETUP DEBUG STUFF
//////////////////////////////////
var debug =
  typeof v8debug === 'object' ||
  /--debug|--inspect/.test(process.execArgv.join(' '));
if (debug) {
  tournamentJSON = require('./testData.json');
}

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
let currentTime = formatter.format(new Date());

// Just in case the parent wants to send us a message
// to force a scrape
process.on('message', msg => {
  console.log('Message from parent:', msg);
  scrapeTournaments();
});

// Call one time to invoke on startup, otherwise it fires on a timer
scrapeTournaments();
let future = Date.now() + scrapeInterval;
future = formatter.format(future);
console.log('CHILD_PROCESS: Next scape will occur @ ' + future);

setInterval(() => {
  let currentTime = formatter.format(new Date());
  console.log('CHILD_PROCESS: Calling scrape on timer :: ' + currentTime);
  scrapeTournaments();
  future = Date.now() + scrapeInterval;
  future = formatter.format(future);
  console.log('CHILD_PROCESS: Next scape will occur @ ' + future);
}, scrapeInterval);

function scrapeTournaments() {
  //All the web scraping magic will happen here
  console.log('CHILD_PROCESS: executing scrape...');

  let today = new Date();
  const config = new TScraperConfig('6', '2019');
  let tournaments = [];

  // get this year's tournaments
  console.log('CHILD_PROCESS: getting this years tournaments...');
  config.year = today.getFullYear().toString();
  for (let i = 1; i <= 12; i++) {
    config.month = i.toString();
    tournaments = tournaments.concat(scraper.fetchTournaments(config));
  }

  // get next year's tournaments
  console.log('CHILD_PROCESS: getting next years tournaments...');
  config.year = (today.getFullYear() + 1).toString();
  for (let i = 1; i <= 12; i++) {
    config.month = i.toString();
    tournaments = tournaments.concat(scraper.fetchTournaments(config));
  }

  // get last year's tournaments
  console.log('CHILD_PROCESS: getting last years tournaments...');
  config.year = (today.getFullYear() - 1).toString();
  for (let i = 1; i <= 12; i++) {
    config.month = i.toString();
    tournaments = tournaments.concat(scraper.fetchTournaments(config));
  }

  console.log('CHILD_PROCESS: sorting tournaments...');
  tournaments.sort(function(a, b) {
    // return negative, a before b
    // return positive, b sorts before a
    // return 0 if nothing to be done
    let dateA = new Date(a.date),
      dateB = new Date(b.date);
    return dateA - dateB;
  });

  // remember the data for use later
  tournamentJSON = tournaments;

  // send back the tournament info to the parent
  process.send(tournamentJSON); // send parent process the new data
}
