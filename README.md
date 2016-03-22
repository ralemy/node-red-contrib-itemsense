# node-red-contrib-itemsense
Node-RED contribution package that adds nodes which enable the use of Impinj ItemSense IoT Platform

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


