/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function GetObjectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            _ = node.context().global.lodash;

        function sendOutput(mode, msg, title, name) {
            var copy = _.merge({}, msg);
            if (mode === "array")
                node.send([msg, {
                    topic: "success",
                    payload: "Retracted " + title + (name ? "" : " (total: " + msg.payload.length + ")"),
                    count: msg.payload.length
                }]);
            else
                _.each(msg.payload, function (object, index) {
                    copy.payload = object;
                    node.send([copy, {
                        topic: "success",
                        payload: "Retracted " + title,
                        count: msg.payload.length,
                        index: index + 1
                    }]);
                });
            if (mode === "single" && msg.payload.length === 0)
                node.send([null, {
                    topic: "success",
                    payload: "No Object Found " + title,
                    count: 0,
                    index: 0
                }]);
        }

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense"),
                name = msg.payload ? msg.payload.name : null,
                action = name ? "get" : "getAll",
                title = (name ? name + " from" : "all") + " " + config.objectType;
            node.status({fill: "red", shape: "ring", text: "Retracting " + title});
            itemSense[config.objectType][action](name).then(function (object) {
                node.status({});
                msg.payload = name ? [object] : object;
                msg.topic = config.objectType;
                sendOutput(config.outputMode, msg, title, name);
            }, function (err) {
                console.log("Itemsense error get " + title, err);
                node.send([msg, {
                    topic: "failure",
                    payload: lib.triageError(err, "Failed to get " + title)
                }]);
            }).catch(function (err) {
                console.log("general error get " + title, err);
                node.error(err, {payload: err});
            });
        });
    }

    RED.nodes.registerType("get-object", GetObjectNode);
};
