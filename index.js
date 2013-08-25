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
      token: config.pushoverToken
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

var precipIntensity;
var precipType;

/*
  Precipitation Breakdown:

  0 - no precipitation
  0.002 - very light
  0.017 - light
  0.1 - moderate
  0.4 - heavy
*/

var very_light = 0.002,
    light      = 0.017,
    moderate   = 0.1,
    heavy      = 0.4;

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

    if (precipIntensity === undefined) {
      precipIntensity = forecast.currently.precipIntensity;
    }

    // changes often
    precipType = forecast.currently.precipType;

    // default to 10 minutes at the most to check
    var minutesUntilChange = 10,
        i, done = false;

    // minutely
    for (i = 0; i < forecast.minutely.data.length && !done; i++) {
      if ((forecast.minutely.data[i].precipIntensity !== 0) !== (forecast.currently.precipIntensity !== 0)) {
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

    setTimeout(getNextUpdate, minutesUntilChange * 60000);
    console.log(minutesUntilChange);
  });
}

getNextUpdate();