/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to specify and connect to an Itemsense instance
 */
const lib = require("./lib/itemsense");

module.exports = function (RED) {
    "use strict";

    function ItemsenseInstanceNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
            
        node.itemsense = lib.connectToItemsense({
            itemsenseUrl:config.url,
            username: config.user,
            password: config.password
        });
        node.itemsense.username = config.user;
        node.itemsense.password = config.password;
    }

    RED.nodes.registerType("itemsense-instance", ItemsenseInstanceNode);
};
