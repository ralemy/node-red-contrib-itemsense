/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to delete an Itemsense object based on its name.
 */
module.exports = function (RED) {
    "use strict";
    const lib = require("./lib/itemsense");

    function DeleteObjectNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        function getKey(msg){
            if(!msg.payload)
                return null;
            if(["thresholdAntennaConfigurations","thresholds"].includes(config.objectType))
                return msg.payload.id;
            return msg.payload.name;
        }

        this.on("input", function (msg) {
            const key = getKey(msg),
                itemsense = lib.getItemsense(node, msg, "delete " + key + " from " + config.objectType),
                error ="No Name/id Provided in payload.name";
            if (itemsense)
                if (!key)
                    lib.raiseNodeRedError(error,msg,node,{message:error});
                else if (itemsense[config.objectType].delete)
                    itemsense[config.objectType].delete(key, msg.payload.replacementId).then(function (object) {
                        lib.status("exit","",node);
                        node.send([
                            lib.extend(msg, {payload: object || {}, topic: config.objectType}),
                            {
                                topic: "success",
                                payload: "deleted " + key + " from " + config.objectType,
                                data: object
                            }]);
                    }).catch(lib.raiseNodeRedError.bind(lib,`Error deleting ${key} form ${config.objectType}`,msg,node));
                else
                    lib.raiseNodeRedError(config.objectType + " does not support delete action",msg,node,{
                        statusCode:400,
                        message: config.objectType + " does not support delete action"
                    });
        });
    }

    RED.nodes.registerType("delete-object", DeleteObjectNode);
};
