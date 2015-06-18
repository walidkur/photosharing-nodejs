# About

This project provides a sample application that leverages the [IBM Connections Cloud APIs](https://developer.ibm.com/social/) to create a social photo sharing experience. The application can be easily deployed to IBM Bluemix or it can be deployed on its own.

# Dependencies

A listing of the major components used in the application. Note that a number of these libraries require additional dependencies please refer to [package.json](https://github.com/ibmcnxdev/photosharing-nodejs/blob/master/package.json) and [bower.json](https://github.com/ibmcnxdev/photosharing-nodejs/blob/master/bower.json) for a more comprehensive list.

###### Server and Package Management
* [Node / npm](https://nodejs.org)
* [Bower](http://bower.io/)

###### Javascript and CSS Libraries
* [Angular](https://github.com/angular/angular.js)
* [Bootstrap](https://github.com/twbs/bootstrap)
* [Justified-Gallery](https://github.com/miromannino/Justified-Gallery)

###### Node Modules
* [Express](https://github.com/https://github.com/strongloop/express)
* [Passport](https://github.com/jaredhanson/passport)
* [Passport-IBM-Connect](https://github.com/benkroeger/passport-ibm-connections-cloud)
* [Request](https://github.com/request/request)

# Installation

*Prerequisite*: Ensure you have [Node](https://nodejs.org) and [Bower](http://bower.io/) installed on your machine.

1. In terminal clone github repository.  
`git clone https://github.com/ibmcnxdev/photosharing-nodejs.git`  

2. Move into the cloned directory.    
`cd photosharing-nodejs`  

3. Install Node modules via Node Package Manager.    
`npm install`  

4. Install Bower componenets.  
`bower install`  

5. Create new file named `server.js` for server credentials.  
`touch config/server.js` 

6. In `server.js` add the following code and pass your credentials into the appropriate fields.
```
var server = {

callback: '',
clientSecret: '',
clientID: '',
domain: '',

};

exports.server = server;`
```
*If running locally*:  

7. Start app with Node.  
`node bin/www`  

8. App is now running! Direct browser to `localhost.com:3000`.  

# License

This code is licensed under Apache License v2.0. See the License.txt file in the root directory of this repository for more details.


