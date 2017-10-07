[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Description

This app allows a user to add/remove map locations as needed, with a marker location that will keep track of the site.  It uses Node, 
Electron, sqlite, KnockoutJS, Google maps, and foursquare to store data endpoints about a location.

## Setup

This app requires [Node](https://nodejs.org/en/).  Go to the website and install it.

You will also need to have the developer dependencies necessary to build sqlite with node-gyp.  
To make sure that you do [Go to the website](https://github.com/nodejs/node-gyp#installation), search for your operating system,
and follow the instructions.

After that, download this application or clone it by clicking the `clone or download` button.  Then, `cd` into the directory that contains the downloaded folder.  
Then run `npm install --production`. 
If you do not use the `--production` flag, it will install all of the dev dependencies as well.  Once the install and postinstall processes 
have run, type `npm start`.  