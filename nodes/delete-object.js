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
            node.status({fill: "red", shape: "ring", text: "delete " + name + " from " + config.objectType});
            if (!name)
                node.error("No name provided in payload.name",
                    lib.merge(msg, {
                        payload: {statusCode: 400, message: "No name provided in payload.name"},
                        topic: "error"
                    }));
            else if (itemSense[config.objectType].delete)
                itemSense[config.objectType].delete(name).then(function (object) {
                    node.status({});
                    node.send([
                        lib.merge(msg, {payload: object || {}, topic: config.objectType}),
                        lib.merge(msg, {
                            topic: "success",
                            payload: "deleted " + name + " from " + config.objectType,
                            data: object
                        })]);
                }).catch(function (err) {
                    console.log("Itemsense error deleting " + name + " from " + config.objectType, err);
                    var payload = lib.triageError(err, "Failed to delete " + name + " from " + config.objectType);
                    node.error(payload,
                        lib.merge(msg, {
                            topic: "failure",
                            payload: payload,
                            data: object
                        }));
                });
            else
                node.error(config.objectType + " does not support delete action",
                    lib.merge(msg, {
                        topic: "error",
                        payload: {message: config.objectType + " does not support delete action", statusCode: 400}
                    }));
        });
    }

    RED.nodes.registerType("delete-object", DeleteObjectNode);
};
