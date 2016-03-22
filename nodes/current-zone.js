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
            var itemSense = node.context().flow.get("itemsense"),
                action = config.zoneAction,
                name = getParam(action, msg),
                title = getTitle(action, name);
            node.status({fill: "red", shape: "ring", text: "Retracting " + title});
            if (action === "Update" && !name)
                node.send([null, {
                    topic: "error",
                    payload: {message: "input message does not have a zoneMapName property"}
                }]);
            else
                itemSense.currentZoneMap[action.toLowerCase()](name).then(function (object) {
                    node.status({});
                    msg.payload = object;
                    msg.topic = "CurrentZoneMap";
                    node.send([msg, {
                        topic: "success",
                        payload: title
                    }]);
                }, function (err) {
                    console.log("Itemsense error " + title, err);
                    node.send([msg, {
                        topic: "failure",
                        payload: lib.triageError(err, "Failed to " + title)
                    }]);
                }).catch(function (err) {
                    console.log("general error " + title, err);
                    node.error(err, {payload: err});
                });
        });
    }

    RED.nodes.registerType("current-zone", CurrentZoneNode);
};
