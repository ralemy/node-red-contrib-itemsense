# node-red-contrib-itemsense
Node-RED contribution package that adds nodes which enable the use of Impinj ItemSense IoT Platform

## Setting up
- install node (tested with v 5.10.1) from [Nodejs Site](https://nodejs.org/en/download/)

### Just want to run it
- install node-red: `npm install -g node-red` (you may need sudo)
- install the package: `npm install -g node-red-contrib-itemsense`
- optionally, install the robot package `npm install -g node-red-contrib-icreate-upnp`
- crete a settings file. 
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


