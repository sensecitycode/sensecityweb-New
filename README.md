# SenseCity Web Frontend

The project contains SenseCity's platform web interface for non authorized users.
Consists of main page with all available cities' list (url: sense.city) and single page apps for each city (url: {city}.sense.city)
A city's subdomain offers issues overview, report, search and general info.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them
* [NodeJS](https://nodejs.org/en/) - JavaScript runtime environment
* [npm](https://docs.npmjs.com/getting-started/installing-node) - (installed with NodeJS)
* [@angular/cli](https://cli.angular.io/) - Environment to test and build the Angular application
* create a global application configuration file as 'config.json'
```
**config.json**
{
    "API": "https://{api_URL}/api/1.0",
    "API_HOST":"https://{api_URL}",
    "TEMP_STATISTICS":"/admin/statistics/statistics.html?user=1",
    "GOOGLE_KEY":"{google_API_key}",
    "TWITTER_WIDGET_IDS":{
        "{city_name_1}":"{Twitter_Widget_ID_1}",
        "{city_name_2}":"{Twitter_Widget_ID_2}"
    },
    "CITY_CENTERS":{
        "{city_name_1}":{"lat": {latitude}, "lng": {longitude}, "zoom": {integer ~ [11 , 14]}},
        "{city_name_2}":{"lat": {city_2_latitude}, "lng": {city_2_longitude}, "zoom": {integer ~ [11 , 14]}},
    }
}
```
* **(optional)** create city's fixed points (ex. garbage bins, municipality lighting) configuration file as '{city_name}.json'
```
**{city_name}.json**
[
  {
    "type": "fotistiko",
    "notes": [
      null
    ],
    "loc": {
      "coordinates": [
        {longitude},
        {latitude}
      ]
    }
  },
  {
    "type": "garbage",
    "notes": [
      {
        "ANAKIKLOSI": "0" *OR* "1"
      }
    ],
    "loc": {
      "coordinates": [
          {longitude},
          {latitude}
      ]
    }
  },
```

### Installing

A step by step series of actions that tell you how to get a development env running
* clone this repository
* cd ./repository
* npm install - (Install dependency packages from package.json)
* provide the configurations files at src/assets/env-specific/
* ng serve - (Deploy test server)

## Deployment

A step by step series of actions that tell you how to get a production application running
* clone this repository
* cd ./repository
* npm install - (Install dependency packages from package.json)
* provide the configurations files at src/assets/env-specific/
* ng build --prod - (Build dist application files to upload in your server setup)
* copy generated "dist" folder in server's root
* application is **live**

## Built With
* [Angular CLI](https://cli.angular.io/) - A command line interface for Angular
* [Angular 5](https://angular.io/) - Frontend MVC framework

## Contributing

Please contact us - [NAM group](http://nam.ece.upatras.gr/) - to get informed for the development process and workflow.

## Authors
* *Kostis Trantzas* - Initial work - [kostistr](https://github.com/kostistr)

See also the list of [contributors](https://github.com/sensecitycode/sensecityweb-New/graphs/contributors) who participated in this project.

## License

This project is licensed under the Apache2 License
