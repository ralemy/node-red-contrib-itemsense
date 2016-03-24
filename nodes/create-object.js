/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to create or update an Itemsense object
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function CreateObjectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense"),
                object = typeof msg.payload === "object" ? msg.payload : null;
            node.status({fill: "red", shape: "ring", text: "Create or update " + config.objectType});
            itemSense[config.objectType].update(object).then(function (object) {
                node.status({});
                node.send([
                    lib.merge(msg, {payload: object, topic: config.objectType}),
                    lib.merge(msg, {
                        topic: "success",
                        payload: "updated " + config.objectType,
                        data: object
                    })]);
            }).catch(function (err) {
                console.log("Itemsense error updating " + config.objectType, err, object);
                node.error(err, lib.merge(msg, {
                    topic: "failure",
                    payload: lib.triageError(err, "Failed to update " + config.objectType),
                    data: object
                }));
            });
        });
    }

    RED.nodes.registerType("create-object", CreateObjectNode);
};
