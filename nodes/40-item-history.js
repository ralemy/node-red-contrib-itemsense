/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Item history from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        _ = require("lodash");

    function ItemHistoryNode(config) {
        RED.nodes.createNode(this, config);
        const node = this,
            tagRetriever = lib.tagRetriever("items");

        this.on("input", function (msg) {
            if (msg.topic === "TerminateLoop")
                return tagRetriever.terminateLoop(node, msg);

            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node, msg, "Getting Item History"),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                params: tagRetriever.queryParams(msg.payload || {}, msg.topic, config)
            };

            if (opts.itemsense)
                tagRetriever.setOpts(opts).getTags().then((err) => {
                    if (err)
                        return;
                    if (config.repeat === "None")
                        node.status({});
                    else
                        tagRetriever.getByInterval();
                }).catch(lib.raiseNodeRedError.bind(lib, "Error getting tag history", msg, node));
        });
    }

    RED.nodes.registerType("item-history", ItemHistoryNode);
};
