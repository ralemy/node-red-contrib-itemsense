/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to delete an Itemsense object based on its name.
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function DeleteObjectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense"),
                name = msg.payload ? msg.payload.name : null;
            if (!name) {
                node.send([null, {topic: "error", payload: {message: "No name provided in payload.name"}}]);
                return;
            }
            node.status({fill: "red", shape: "ring", text: "delete " + name + " from " + config.objectType});
            if (itemSense[config.objectType].delete)
                itemSense[config.objectType].delete(name).then(function (object) {
                    node.status({});
                    msg.payload = object;
                    msg.topic = config.objectType;
                    node.send([msg, {
                        topic: "success",
                        payload: "deleted " + name + " from " + config.objectType,
                        data: object
                    }]);
                }, function (err) {
                    console.log("Itemsense error deleting " + name + " from " + config.objectType, err);
                    node.send([msg, {
                        topic: "failure",
                        payload: lib.triageError(err, "Failed to delete " + name + " from " + config.objectType),
                        data: object
                    }]);
                }).catch(function (err) {
                    console.log("general error deleting " + name + " from " + title, err);
                    node.error(err, {payload: err});
                });
            else
                node.send([null, {
                    topic: "error",
                    payload: {message: config.objectType + " does not support delete action"}
                }]);
        });
    }

    RED.nodes.registerType("delete-object", DeleteObjectNode);
};
