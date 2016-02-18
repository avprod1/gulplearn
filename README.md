# pluralsight-gulp
You've built your JavaScript application but how do you automate testing, code analysis, running it locally or deploying it? These redundant tasks can consume valuable time and resources. Stop working so hard and take advantage of JavaScript task automation using Gulp to streamline these tasks and give you back more time in the day. Studying this repo can help clarify how Gulp works, jump-start task automation with Gulp, find and resolve issues faster, and be a more productive.

## Requirements

- Install Node
	- on OSX install [home brew](http://brew.sh/) and type `brew install node`
	- on Windows install [chocolatey](https://chocolatey.org/) 
    - Read here for some [tips on Windows](http://jpapa.me/winnode)
    - open command prompt as administrator
        - type `choco install nodejs`
        - type `choco install nodejs.install`
- On OSX you can alleviate the need to run as sudo by [following these instructions](http://jpapa.me/nomoresudo). I highly recommend this step on OSX
- Open terminal
- Type `npm install -g node-inspector bower gulp`

## Quick Start
Prior to taking the course, clone this repo and run the content locally
```bash
$ npm install
$ bower install
$ npm start
```
Scott Notes:

Nodejs ver 4.2.5.0

Global packages installed
$ npm list -g -depth=0
C:\Users\u276000\AppData\Roaming\npm
├── bower@1.7.7
├── gulp@3.9.0
├── jscs@2.10.1
├── jshint@2.9.1
├── jsonlint@1.6.2
├── nodemon@1.8.1
└── npm@3.5.3

other dependencies installed that I couldn't find in the training: 
express 4.13.4, body-parser 1.14.2, compression 1.6.1, cors 2.7.1, serve-favicon 2.3.1, morgan 1.6.1
python 0.0.4

See screenshots in root folder: 
appStopsHere.jpg
jsErrorPointsToAngular.jpg


