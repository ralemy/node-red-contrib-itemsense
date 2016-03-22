/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Items from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense"),
        interval = null;

    function getProgress(config, value) {
        if (config.repeat == "None")
            return "complete";
        if (config.repeat === "Indefinitely")
            return "Call: " + lib.padString(-1 * value, 2, "0");
        value -=1;
        if (!value)
            return "complete";
        value *= 100;
        value /= parseInt(config.count);
        value = Math.round(100 - value);
        return lib.padString(value, 2, "0") + "%";
    }

    function getTags(opts) {
        return opts.itemSense.items.get(opts.params).then(function (response) {
            var epcReg = opts.epcFilter ? new RegExp(opts.epcFilter) : null,
                tags = opts.epcFilter ? opts._.filter(response.items, function (tag) {
                    return tag.epc.match(epcReg);
                }) : response.items;
            return {items: tags, nexPageMarker: response.nextPageMarker}
        }).then(function (response) {
            opts.msg.payload = response;
            opts.msg.topic = "getItems";
            opts.node.send([
                opts.msg,
                {topic: "progress", payload: getProgress(opts.config, opts.count)},
                {topic: "success", payload: "Retrieved " + opts.msg.payload.items.length + " tags from Itemsense"}
            ]);
            return response;
        }).catch(function (err) {
            console.log(err);
            opts.node.error(err, err);
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
                    if (getProgress(opts.config, opts.count) === "complete")
                        stopGetItems();
                    return response;
                });
            stopGetItems();
        }, parseInt(config.interval) * 1000);

    }

    function terminateLoop(node) {
        if (!interval)
            node.send([null, {topic: "progress", payload: "complete"}, {
                topic: "warning",
                payload: "No interval to terminate"
            }]);
        else {
            clearInterval(interval);
            interval = null;
            node.status({});
            node.send([null, {topic: "progress", payload: "complete"}, {
                topic: "success",
                payload: "Get Items repeat interrupted"
            }]);
        }

    }

    function GetItemsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            _ = node.context().global.lodash;

        this.on("input", function (msg) {
            if (msg.topic === "TerminateLoop")
                return terminateLoop(node);
            var opts = {
                epcFilter: config.epcFilter,
                itemSense: node.context().flow.get("itemsense"),
                msg: msg,
                count : config.repeat==="Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                _: _
            };

            opts.params = (msg.topic === "QueryParams") ? msg.payload : {};

            node.status({fill: "green", shape: "ring", text: "getting tag Items"});
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
