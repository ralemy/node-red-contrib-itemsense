/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Items from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        _ = require("lodash"),
        interval = null;


    function getTags(opts) {
        return opts.itemsense.items.get(opts.params).then(function (response) {
            var epcReg = opts.epcFilter ? new RegExp(opts.epcFilter) : null,
                tags = opts.epcFilter ? opts._.filter(response.items, function (tag) {
                    return tag.epc.match(epcReg);
                }) : response.items;
            return {
                items: tags,
                nexPageMarker: response.nextPageMarker,
                progress: lib.getProgress(opts.config, opts.count)
            }
        }).then(function (response) {
            opts.node.send([
                lib.extend(opts.msg, {
                    topic: "getItems",
                    payload: response
                }),
                {topic: "success", payload: "Retrieved " + response.items.length + " tags from Itemsense. " + response.progress}
            ]);
            return response;
        }).catch(function (err) {
            lib.throwNodeError(err,"Error in getItems ",opts.msg,opts.node);
        });
    }


    function getByInterval(opts) {
        var node = opts.node,
            config = opts.config;

        function stopGetItems() {
            clearInterval(interval);
            interval = null;
            node.status({});
        }

        interval = setInterval(function () {
            opts.count -= 1;
            if (config.repeat === "Indefinitely" || opts.count > 0)
                return getTags(opts).then(function (response) {
                    if (lib.getProgress(opts.config, opts.count) === "complete")
                        stopGetItems();
                    return response;
                });
            stopGetItems();
        }, parseInt(config.interval) * 1000);

    }

    function terminateLoop(node,msg){
        lib.terminateLoop(node,msg,interval);
        interval=null;
    }

    function GetItemsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            if (msg.topic === "TerminateLoop")
                return terminateLoop(node, msg);
            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node,msg),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                _: _
            };

            opts.params = (msg.topic === "QueryParams") ? msg.payload : {};

            node.status({fill: "green", shape: "ring", text: "getting tag Items"});

            if (opts.itemsense)
                getTags(opts).then(function (response) {
                    if (config.repeat === "None")
                        node.status({});
                    else
                        getByInterval(opts);
                });
        });
    }

    RED.nodes.registerType("get-items", GetItemsNode);
};
