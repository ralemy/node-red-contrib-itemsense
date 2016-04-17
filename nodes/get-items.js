/**
 * Created by ralemy on 2/22/16.
 * Node-Red node to get Items from Itemsense
 */

module.exports = function (RED) {
    "use strict";
    const lib = require("./lib/itemsense"),
        _ = require("lodash");

    class TagRetriever {
        setOpts(opts) {
            this.opts = opts;
            this.emitResponse = this.sendResponse.bind(this);
            this.emitError = lib.raiseNodeRedError.bind("Error in GetItems", opts.msg, opts.node);
            if(this.interval)
                clearInterval(this.interval);
            this.interval = null;
            return this;
        }

        getTags() {
            return this.opts.itemsense.items.get(this.opts.params)
                .then((response) => {
                    const tags = this.filterTags(response.items);
                    return this.createResponse(tags, response.nextPageMarker);
                })
                .then(this.emitResponse)
                .catch(this.emitError);
        }

        createResponse(tags, nextPageMarker) {
            return {
                items: tags,
                nexPageMarker: nextPageMarker,
                progress: lib.getProgress(this.opts.config, this.opts.count)
            };
        }

        filterTags(items) {
            const epcReg = opts.epcFilter ? new RegExp(opts.epcFilter) : null;
            return this.opts.epcFilter ? _.filter(items, tag=> t.epc.match(epcReg)) : items;
        }

        sendResponse(response) {
            this.opts.node.send([
                lib.extend(this.opts.msg, {
                    topic: "getItems",
                    payload: response
                }),
                {
                    topic: "success",
                    payload: "Retrieved " + response.items.length + " tags from Itemsense. " + response.progress
                }
            ]);
            return response;
        }

        stopGetItems() {
            if(this.interval)   clearInterval(this.interval);
            this.interval = null;
            this.opts.node.status({});
        }

        getByInterval(opts) {

            this.interval = setInterval(() => {
                this.opts.count -= 1;
                if (this.config.repeat === "Indefinitely" || this.opts.count > 0)
                    return this.getTags().then((response) => {
                        if (lib.getProgress(this.opts.config, this.opts.count) === "complete")
                            this.stopGetItems();
                        return response;
                    });
                this.stopGetItems();
            }, parseInt(this.config.interval) * 1000);

        }

        terminateLoop(node, msg) {
            lib.terminateLoop(node, msg, this.interval);
            this.interval = null;
        }
    }

    const tagRetriever = new TagRetriever();

    function GetItemsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            if (msg.topic === "TerminateLoop")
                return tagRetriever.terminateLoop(node, msg);
            var opts = {
                epcFilter: config.epcFilter,
                itemsense: lib.getItemsense(node, msg),
                msg: msg,
                count: config.repeat === "Indefinitely" ? -1 : (parseInt(config.count) || 1),
                node: node,
                config: config,
                _: _
            };

            opts.params = (msg.topic === "QueryParams") ? msg.payload : {};

            node.status({fill: "green", shape: "ring", text: "getting tag Items"});

            if (opts.itemsense)
                tagRetriever.setOpts(opts).getTags().then(()=>{
                    if(config.repeat === "None")
                        node.status({});
                    else
                        tagRetriever.getByInterval();
                });
        });
    }

    RED.nodes.registerType("get-items", GetItemsNode);
};
