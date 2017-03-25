/**
 * Created by ghill on 1/2/16.
 * Node-Red node to create or update an Itemsense object
 */
module.exports = function (RED) {
  "use strict";
  var helperLib = require("./lib/itemsense");
  var isToolLib = require("is-tool");
  function LoadConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on("input", function (msg) {
      var itemsense = helperLib.getItemsense(node, msg,"Load config "),
        object = typeof msg.payload === "object" ? msg.payload : null;
      if (itemsense){
        isToolLib.load(itemsense, object).then(function (object) {
          node.status({});
          node.send([
            helperLib.extend(msg,{payload: object, topic: config.objectType}),
            {
              topic: "Success",
              payload: "Updated Itemsense",
              data: object
            }
          ]);
        }).catch(helperLib.raiseNodeRedError.bind(helperLib,"Error Updating ItemSense - ",msg,node));
      }
    });
  }
  RED.nodes.registerType("load-config", LoadConfigNode);
};
