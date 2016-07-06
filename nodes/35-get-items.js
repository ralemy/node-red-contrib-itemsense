/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Items from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    const lib = require("./lib/itemsense");

    function GetItemsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on("input", function (msg) {
            lib.terminateGetLoop(node,msg);

            if (msg.topic === "TerminateLoop")
                return;

            node.tagRetriever = lib.tagRetriever("items");

            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node, msg, "Getting Tags"),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                params: node.tagRetriever.constructor.queryParams(msg.payload || {},msg.topic,config)
            };

            msg.payload = msg.payload || {};
            if (opts.itemsense)
                node.tagRetriever.setOpts(opts).getTags().then((err)=> {
                    if (err)
                        return;
                    if (config.repeat === "None")
                        node.status({});
                    else
                        node.tagRetriever.getByInterval();
                }).catch(lib.raiseNodeRedError.bind(lib, "Error Getting Tags", msg, node));
        });
        node.on("close", function () {
            lib.terminateGetLoop(node);
        });
    }

    RED.nodes.registerType("get-items", GetItemsNode);
};