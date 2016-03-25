/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function CurrentZoneNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function getParam(action, msg) {
            if (!msg.payload) return null;
            return action === "Update" ? msg.payload.zoneMapName : msg.payload.facility;
        }

        function getTitle(action, name) {
            return action + " Current Zone Map" + (name ? action === "Update" ? " to " + name : " for facility " + name : "");
        }

        this.on("input", function (msg) {
            var itemSense = lib.getItemSense(node,msg),
                action = config.zoneAction,
                name = getParam(action, msg),
                title = getTitle(action, name);
            node.status({fill: "red", shape: "ring", text: title});
            if(!itemSense)
                return;
            if (action === "Update" && !name)
                node.error("input message does not have a zoneMapName property",
                    lib.extend(msg, {
                        topic: "error",
                        payload: "input message does not have a zoneMapName property",
                        statusCode: 400
                    }));
            else
                itemSense.currentZoneMap[action.toLowerCase()](name).then(function (object) {
                    node.status({});
                    node.send([
                        lib.extend(msg, {payload: object || {}, topic: "CurrentZoneMap"}),
                        {
                            topic: "success",
                            payload: title
                        }]);
                }).catch(function (err) {
                    var prompt ="Itemsense error " + title;
                    lib.throwNodeError(err,prompt,msg,node);
                });
        });
    }

    RED.nodes.registerType("current-zone", CurrentZoneNode);
};
