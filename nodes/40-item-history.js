/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Item history from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    const lib = require("./lib/itemsense");

    function ItemHistoryNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        this.on("input", function (msg) {
            lib.terminateGetLoop(node, msg);

            if (msg.topic === "TerminateLoop")
                return;

            node.tagRetriever = lib.tagRetriever("history");

            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node, msg, "Getting Item History"),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                params: node.tagRetriever.constructor.queryParams(msg.payload || {}, msg.topic, config)
            };

            msg.payload = msg.payload || {};
            if (opts.itemsense)
                node.tagRetriever.setOpts(opts).getTags().then((err) => {
                    if (err)
                        return;
                    if (config.repeat === "None")
                        node.status({});
                    else
                        node.tagRetriever.getByInterval();
                }).catch(lib.raiseNodeRedError.bind(lib, "Error getting tag history", msg, node))
                    .finally(() => {
                        if (config.repeat === "None")
                            node.tagRetriever = null;
                    });
        });
        node.on("close", function () {
            lib.terminateGetLoop(node);
        });
    }

    RED.nodes.registerType("item-history", ItemHistoryNode);
};
