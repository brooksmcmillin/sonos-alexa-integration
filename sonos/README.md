Sonos Javascript Control API Sample App
=======================================

The Sonos Javascript Control API sample app is an application written in the Electron application framework.
This sample application searches and finds Sonos players and groups on the local network, allows users to
connect and control a groups playback and volume while displaying album art and metadata.

## Supported Platforms

Currently working on Apple Mac OSX and Microsoft Windows.

## Prerequisites

- NodeJS runtime environment
- NPM, Node Package Manager

## Install the app

Download and copy the tar.gz package into a directory and then run the following:

On Mac copy the file to a directory and unpack the tar.gz file.

```sh
tar xzvf sonos-js-control-api-sample-app-<VERSION>.tar.gz
```

On Windows use a reliable tool such as 7-zip to unpack the tar.gz file into a directory.

After you unpack the compressed archive file run `npm install` on the command line in the directory that contains
the package.json file.  This will install NodeJS extensions that are required by the sample app.

```sh
npm install
```

# Run the sample app

To run the Sonos Javascript Sample App, execute the following command in the directory where it is installed.

```sh
npm start
```
To stop the app, type CTRL-C or close your console window.
On mac command-Q also works to quit the application.

The app outputs messages to the console.

# Connect your app to players


# Known Issues

* Group discovery is not working well on the Microsoft Windows platform so it may not display any groups.

# Read More

For more information and examples on how to discover, connect to and control a Sonos player using the Sonos Control API, 
see https://developer.sonos.com/control-api/getting-started.

# Revision History

* Version 0.1: Early Release

