/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to connect to an itemsense instance
 */
module.exports = function (RED) {
    "use strict";

    function ConnectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            LocalItemsense = RED.nodes.getNode(config.itemsense);

        function hasItemsenseInfo(msg) {
            return msg && msg.payload && msg.payload.itemsenseUrl;
        }

        function getItemsense(msg) {
            var Factory = node.context().global.ItemSense,
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
            if (hasItemsenseInfo(msg))
                itemsense = getItemsense(msg);
            else if (LocalItemsense)
                itemsense = LocalItemsense.itemsense;
            else
                node.send([null, {
                    topic: "error",
                    payload: "Must either configure an itemsense-instance or pass info in the message object"
                }]);
            msg.topic= "itemsense";
            node.context().flow.set("itemsense",itemsense);
            if (itemsense)
                node.send([msg,
                    {
                        topic: "success",
                        payload: "Connected to " + itemsense.itemsenseUrl
                    }]);
        });
    }

    RED.nodes.registerType("connect", ConnectNode);
};
