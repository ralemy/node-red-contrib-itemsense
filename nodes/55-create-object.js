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

        function getAction(payload){
            if(config.objectType === "thresholdAntennaConfigurations")
                return payload.id ? "replace" : "create";
            return "update";
        }

        this.on("input", function (msg) {
            const itemsense = lib.getItemsense(node, msg,"Create or update " + config.objectType),
                object = typeof msg.payload === "object" ? msg.payload : null;
            if (itemsense && object)
                itemsense[config.objectType][getAction(object)](object,object.id).then(function (object) {
                    node.status({});
                    node.send([
                        lib.extend(msg, {payload: object, topic: config.objectType}),
                        {
                            topic: "success",
                            payload: "updated " + config.objectType + (object ? ": " + object.name || "" : ""),
                            data: object
                        }]);
                }).catch(lib.raiseNodeRedError.bind(lib,"Error Updating " + config.objectType,msg,node));
        });
    }

    RED.nodes.registerType("create-object", CreateObjectNode);
};
