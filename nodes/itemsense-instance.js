/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to specify and connect to an Itemsense instance
 */
module.exports = function (RED) {
    "use strict";
    var ItemSense = require("itemsense-node");

    function ItemsenseInstanceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
            
        node.itemsense = new ItemSense({
            itemsenseUrl:config.url,
            username: config.user,
            password: config.password
        });
        node.itemsense.username = config.user;
        node.itemsense.password = config.password;
    }

    RED.nodes.registerType("itemsense-instance", ItemsenseInstanceNode);
};
