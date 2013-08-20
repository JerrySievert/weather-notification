# Weather Notification

Simple glue to add weather notifications to Pushover via Dark Sky

## Configuring

Create a `config.json` file with your credentials:

```
    {
      "apiKey": "YOUR DARK SKY KEY",
      "pushoverUser": "YOUR PUSHOVER USER",
      "pushoverToken": "YOUR PUSOVER APP TOKEN",
      "lat": 45.52751668442124,
      "lon": -122.69175197601318
    }
```

## Running

```
    $ npm install
    $ node index.js
```