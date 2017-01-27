/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to connect to an itemsense instance
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        Itemsense = require("itemsense-node");

    function ConnectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            LocalItemsense = RED.nodes.getNode(config.itemsense);

        function hasItemsenseInfo(msg) {
            return msg && msg.payload && msg.payload.itemsenseUrl;
        }

        function getItemsense(msg) {
            var Factory = Itemsense,
                instance = new Factory({
                    itemsenseUrl: msg.itemsenseUrl,
                    username: msg.username,
                    password: msg.password
                });
            instance.username = msg.username;
            instance.password = msg.password;
            return instance;
        }

        this.on("input", function (msg) {
            var itemsense = null;
            lib.status("enter","Connecting to ItemSense",node);
            if (lib.hasItemsenseInfo(msg))
                itemsense = lib.connectToItemsense(msg.payload);
            else if (LocalItemsense)
                itemsense = LocalItemsense.itemsense;
            else {
                const error = "Must either configure an itemsense-instance or pass info in the message object";
                node.error(error,
                    lib.extend(msg, {
                        topic: "error",
                        payload: "Must either configure an itemsense-instance or pass info in the message object",
                        statusCode: 400
                    }));
                lib.status("error",error,node);
                return;
            }
            node.context().flow.set("itemsense", itemsense);
            msg.itemsense = itemsense;
            if (itemsense)
                node.send([msg,
                    {
                        topic: "success",
                        payload: "Connected to " + itemsense.itemsenseUrl
                    }]);
            lib.status("exit","",node);
        });
    }
    RED.nodes.registerType("connect", ConnectNode);
};
