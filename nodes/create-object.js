/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to create or update an Itemsense object
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense");

    function CreateObjectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var itemsense = lib.getItemsense(node, msg),
                object = typeof msg.payload === "object" ? msg.payload : null;
            node.status({fill: "red", shape: "ring", text: "Create or update " + config.objectType});
            if (itemsense)
                itemsense[config.objectType].update(object).then(function (object) {
                    node.status({});
                    node.send([
                        lib.extend(msg, {payload: object, topic: config.objectType}),
                        {
                            topic: "success",
                            payload: "updated " + config.objectType + (object ? ": " + object.name || "" : ""),
                            data: object
                        }]);
                }).catch(function (err) {
                    var title = "Itemsense error updating " + config.objectType;
                    lib.throwNodeError(err, title, msg, node);
                    console.log("Itemsense error updating " + config.objectType, object);
                });
        });
    }

    RED.nodes.registerType("create-object", CreateObjectNode);
};
