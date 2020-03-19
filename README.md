# Gandalf

sql client built with node-webkit

## Installation Instructions:

* install node-webkit and make executable (http://nwjs.io/)
* npm install
* npm install -g babel nw-gyp
* bower install
* if using Linux or Windows, comment out line 9 in main.js
* npm run build
* cd node_modules/node-jt400/node_modules/java
* nw-gyp configure —target=0.11.6
* nw-gyp build
* cd back to root dir
* nw .
