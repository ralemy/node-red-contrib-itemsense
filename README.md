# node-red-contrib-itemsense
Node-RED contribution package that adds nodes which enable the use of Impinj ItemSense IoT Platform

## Setting up
- install node (tested with v 5.10.1) from [Nodejs Site](https://nodejs.org/en/download/)

### Just want to run it
- install node-red: `npm install -g node-red` (you may need sudo)
- install the package: `npm install -g node-red-contrib-itemsense`
- optionally, install the robot package `npm install -g node-red-contrib-icreate-upnp`
- optionally, crete a settings file, and use the settings.js file in this repository to change the look and feel of your installation (you need to copy the impinj directory to where your settings file is)
    - For Mac and Linux:
        - `cp -fr /usr/local/lib/node_modules/node-red-contrib-itemsense/impinj ~/.node-red`
        - `cp -fr /usr/local/lib/node_modules/node-red-contrib-itemsense/settings.js ~/.node-red`
    - For Windows:
        - `mkdir <root>:\Users\<yourname>\.node-red\impinj`
        - `copy <root>:\Users\<yourname>\AppData\Roaming\npm\node-modules\node-red-contrib-itemsense\impinj <root>:\Users\<yourname>\.node-red\impinj`
        - `copy <root>:\Users\<yourname>\AppData\Roaming\npm\node-modules\node-red-contrib-itemsense\settings.js <root>:\Users\<yourname>\.node-red`
- Afterwards, all you have to do is run it with `node-red` command

## Sample flows included in the samples directory
- In the github repo, samples directory contains a README.md file that explains how to use samples
- There are also other samples, for example instructions on how to run the collection as a service on OSX or Ubuntu Xenial.
    
## Setting up for development
- clone this repository and go to its directory `cd node-red-contrib-itemsense`
- install Node-RED (locally so you can edit sources) `npm install node-red`
- optionally, to use iCreate2 robot in your tests you can install nodes from it. `npm install node-red-contrib-icreate-upnp` 
- run node-red locally using the settings file provided `node node_modules/node-red/red.js --settings settings.js`


To learn about using Impinj Itemsense API with Node, see the [Itemsense-node](https://www.npmjs.com/package/itemsense-node) package.

**Nodes depend on _"itemsense"_ flow variable. start the flow with a _connect_ node to create the needed
variable.** The connect node has a config tab to indicate the Itemsense instance. Alternatively, the `msg.payload` of the incoming message to the connect node can be an object:
```javascript
msg.payload = {
    itemsenseUrl: "http://<your Itemsense Instance>[:port]/itemsense",
    username: "<your username>",
    password: "<your password>"
};
```
in this case the `msg.payload` properties will override the configuration properties. 


This can be used to specify the Itemsense instance during runtime by passing the properties in an
Http or websocket call.


