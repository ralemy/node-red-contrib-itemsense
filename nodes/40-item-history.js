/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Item history from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        _ = require("lodash"),
        interval = null;


    function getCollection(opts,collection){
        collection = collection || [];
        return opts.itemsense.items.getHistory(opts.params).then(function (response) {
            var epcReg = opts.epcFilter ? new RegExp(opts.epcFilter) : null,
                tags = opts.epcFilter ? opts._.filter(response.history, function (tag) {
                    return tag.epc.match(epcReg);
                }) : response.history;
            collection = collection.concat(tags);
            opts.params.pageMarker = response.nextPageMarker;
            console.log("collection", collection.length, opts.config.maxTags, response.nextPageMarker);
            if(response.nextPageMarker && collection.length < parseInt(opts.config.maxTags || 1000))
                return getCollection(opts,collection);
            return {
                items: collection,
                nexPageMarker: response.nextPageMarker,
                progress: lib.getProgress(opts.config, opts.count)
            }
        });
    }
    function getTags(opts) {
        return getCollection(opts).then(function (response) {
            opts.node.send([
                lib.extend(opts.msg, {
                    topic: "getHistory",
                    payload: response
                }),
                {topic: "success", payload: "Retrieved " + response.items.length + " tags from Itemsense. " + response.progress}
            ]);
        }).catch(lib.raiseNodeRedError.bind(lib,"Error Get Item History",opts.msg,opts.node));
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
                return getTags(opts).then(function (err) {
                    if(err)
                        clearInterval(interval);
                    else if (lib.getProgress(opts.config, opts.count) === "complete")
                        stopGetItems();
                });
            stopGetItems();
        }, parseInt(config.interval) * 1000);

    }

    function terminateLoop(node,msg){
        lib.terminateLoop(node,msg,interval);
        interval=null;
    }

    function ItemHistoryNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            if (msg.topic === "TerminateLoop")
                return terminateLoop(node, msg);
            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node,msg,"Getting Item History"),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                _: _
            };

            opts.params = (msg.topic === "QueryParams") ? msg.payload : {};
            opts.params = msg.payload && msg.payload.queryParams ? msg.payload.queryParams : opts.params;


            if (opts.itemsense)
                getTags(opts).then(function (err) {
                    if(err)
                        return;
                    if (config.repeat === "None")
                        node.status({});
                    else
                        getByInterval(opts);
                });
        });
    }

    RED.nodes.registerType("item-history", ItemHistoryNode);
};
