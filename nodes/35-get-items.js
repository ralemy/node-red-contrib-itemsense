/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Items from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    const lib = require("./lib/itemsense");


    function GetItemsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this,
            tagRetriever = lib.tagRetriever("items");

        this.on("input", function (msg) {

            if (msg.topic === "TerminateLoop")
                return tagRetriever.terminateLoop(node, msg);

            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node, msg, "Getting Tags"),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                params: tagRetriever.constructor.queryParams(msg.payload || {},msg.topic,config)
            };

            msg.payload = msg.payload || {};
            if (opts.itemsense)
                tagRetriever.setOpts(opts).getTags().then((err)=> {
                    if (err)
                        return;
                    if (config.repeat === "None")
                        node.status({});
                    else
                        tagRetriever.getByInterval();
                }).catch(lib.raiseNodeRedError.bind(lib, "Error Getting Tags", msg, node));
        });
    }

    RED.nodes.registerType("get-items", GetItemsNode);
};
