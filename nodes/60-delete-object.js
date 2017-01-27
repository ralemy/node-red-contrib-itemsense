/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to delete an Itemsense object based on its name.
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense");

    function DeleteObjectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var itemsense = lib.getItemsense(node, msg, "delete " + name + " from " + config.objectType),
                error ="No Name Provided in payload.name",
                name = msg.payload ? msg.payload.name : null;
            if (itemsense)
                if (!name)
                    lib.raiseNodeRedError(error,msg,node,{message:error});
                else if (itemsense[config.objectType].delete)
                    itemsense[config.objectType].delete(name).then(function (object) {
                        lib.status("exit","",node);
                        node.send([
                            lib.extend(msg, {payload: object || {}, topic: config.objectType}),
                            {
                                topic: "success",
                                payload: "deleted " + name + " from " + config.objectType,
                                data: object
                            }]);
                    }).catch(lib.raiseNodeRedError.bind(lib,`Error deleting ${name} form ${config.objectType}`,msg,node));
                else
                    lib.raiseNodeRedError(config.objectType + " does not support delete action",msg,node,{
                        statusCode:400,
                        message: config.objectType + " does not support delete action"
                    });
        });
    }

    RED.nodes.registerType("delete-object", DeleteObjectNode);
};
