var request = require('request');
var push = require('pushover-notifications');
var cronJob = require('cron').CronJob;

var config = require('./config.json');

new cronJob('00 30 06 * * 1-5', getCurrentStatus, null, true, "America/Los_Angeles");
new cronJob('00 30 07 * * 6-7', getCurrentStatus, null, true, "America/Los_Angeles");



function getCurrentStatus () {
  request("https://api.forecast.io/forecast/" + config.apiKey + "/" + config.lat + "," + config.lon, function (err, response, body) {
    var forecast;
    try {
      forecast = JSON.parse(body);
    } catch (err) {
      console.log("Dark Sky Error: " + err);
    }

    var currently = forecast.currently;
    var daily = forecast.daily;

    var message = currently.temperature + "º\n";
    message += "Low: " + daily.data[0].temperatureMin + "º, High: " + daily.data[0].temperatureMax + "º\n";

    var p = new push( {
      user: config.pushoverUser,
      token: config.pushoverToken,
    });

    var msg = {
      message: message,
      title: "Currently"
    };

    p.send(msg, function(err, result) {
      if ( err ) {
        console.log("Pushover Error: " + err);
      }
    });
  });
}

getCurrentStatus();


/*
  In v2, iterate over minutely.data and hourly.data in order, 
  finding the first data point for which currently.precipIntensity !== 0
  does not equal datapoint.precipIntensity !== 0. Once that data point 
  is found, minutesUntilChange may be calculated as follows: 
  (datapoint.time - currently.time) / 60.
 */
function getNextUpdate () {
  request("https://api.forecast.io/forecast/" + config.apiKey + "/" + config.lat + "," + config.lon, function (err, response, body) {
    var forecast;
    try {
      forecast = JSON.parse(body);
    } catch (err) {
      console.log("Dark Sky Error: " + err);
    }

    // default to 10 minutes at the most to check
    var minutesUntilChange = 10,
        i, done = false;

    // minutely
    for (i = 0; i < forecast.minutely.data.length && !done; i++) {
      if (forecast.minutely.data[i].precipIntensity !== 0) {
        minutesUntilChange = (forecast.minutely.data[i].time - forecast.currently.time) / 60;
        done = true;
      }
    }

    // hourly
    for (i = 0; i < forecast.hourly.data.length && !done; i++) {
      if (forecast.hourly.data[i].precipIntensity !== 0) {
        minutesUntilChange = (forecast.hourly.data[i].time - forecast.currently.time) / 60;
        done = true;
      }
    }

    console.log(minutesUntilChange);
  });
}