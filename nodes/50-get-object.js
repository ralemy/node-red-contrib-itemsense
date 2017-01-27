/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        _ = require("lodash");

    function GetObjectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function sendOutput(mode, msg, title, name) {
            var copy = _.extend({}, msg);
            if (mode === "array")
                node.send([msg, {
                    topic: "success",
                    payload: "Retracted " + title + (name ? "" : " (total: " + msg.payload.length + ")"),
                    count: msg.payload.length
                }]);
            else if (msg.payload.length)
                _.each(msg.payload, function (object, index) {
                    copy.payload = {
                        target: object || {},
                        index: index + 1,
                        count: msg.payload.length
                    };
                    node.send([copy, {
                        topic: "success",
                        payload: "Retracted " + title,
                        count: msg.payload.length,
                        index: index + 1
                    }]);
                });
            else {
                copy.payload = {
                    target: null,
                    count: 0,
                    index: 0
                };
                node.send([copy, {
                    topic: "success",
                    payload: "No Object Found " + title,
                    count: 0,
                    index: 0
                }]);
            }
        }

        this.on("input", function (msg) {
            var name = msg.payload ? msg.payload.name : null,
                action = name ? "get" : "getAll",
                title = (name ? name + " from" : "all") + " " + config.objectType,
                itemsense = lib.getItemsense(node, msg, "Retracting " + title);
            if (itemsense)
                itemsense[config.objectType][action](name).then(function (object) {
                    lib.status("exit", "", node);
                    msg.payload = name ? [object] : object;
                    msg.topic = config.objectType;
                    sendOutput(config.outputMode, msg, title, name);
                }).catch(lib.raiseNodeRedError.bind(lib, "Itemsense Error get " + title, msg, node));
        });
        node.on("close",function(msg){

        });
    }

    RED.nodes.registerType("get-object", GetObjectNode);
};
