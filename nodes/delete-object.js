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
            var itemsense = lib.getItemsense(node, msg),
                name = msg.payload ? msg.payload.name : null;
            node.status({fill: "red", shape: "ring", text: "delete " + name + " from " + config.objectType});
            if (itemsense)
                if (!name)
                    node.error("No name provided in payload.name",
                        lib.extend(msg, {
                            payload: "No name provided in payload.name",
                            statusCode: 400,
                            topic: "error"
                        }));
                else if (itemsense[config.objectType].delete)
                    itemsense[config.objectType].delete(name).then(function (object) {
                        node.status({});
                        node.send([
                            lib.extend(msg, {payload: object || {}, topic: config.objectType}),
                            {
                                topic: "success",
                                payload: "deleted " + name + " from " + config.objectType,
                                data: object
                            }]);
                    }).catch(function (err) {
                        var title = "Itemsense error deleting " + name + " from " + config.objectType;
                        lib.throwNodeError(err, title, msg, node);
                    });
                else
                    node.error(config.objectType + " does not support delete action",
                        lib.extend(msg, {
                            topic: "error",
                            payload: config.objectType + " does not support delete action",
                            statuCode: 400
                        }));
        });
    }

    RED.nodes.registerType("delete-object", DeleteObjectNode);
};
