/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense");

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
            var action = config.zoneAction,
                name = getParam(action, msg),
                title = getTitle(action, name),
                error = "input message does not have a zoneMapName property",
                itemsense = lib.getItemsense(node, msg, title);
            if (itemsense)
                if (action === "Update" && !name)
                    lib.raiseNodeRedError(error, msg, node, {message: error});
                else
                    itemsense.currentZoneMap[action.toLowerCase()](name).then(function (object) {
                        lib.status("exit", "", node);
                        node.send([
                            lib.extend(msg, {payload: object || {}, topic: "CurrentZoneMap"}),
                            {
                                topic: "success",
                                payload: title
                            }]);
                    }).catch(lib.raiseNodeRedError.bind(lib, "Error " + title, msg, node));
        });
    }

    RED.nodes.registerType("current-zone", CurrentZoneNode);
};
