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
            if (this.interval)
                clearInterval(this.interval);
            this.interval = null;
            return this;
        }

        collectTags(tags) {
            tags = tags || [];
            return this.opts.itemsense.items.get(this.opts.params)
                .then((response) => {
                    tags = tags.concat(this.filterTags(response.items));
                    return this.createResponse(tags, response.nextPageMarker);
                });
        }

        getTags() {
            return this.collectTags().then(this.emitResponse)
                .catch(err => this.emitError(err));
        }

        emitError(err) {
            lib.raiseNodeRedError("Error in GetItems", this.opts.msg, this.opts.node, err);
            return "error";
        }

        createResponse(tags, nextPageMarker) {
            this.opts.params.pageMarker = nextPageMarker;
            if (nextPageMarker && tags.length < parseInt(this.opts.config.maxTags || 1000))
                return this.collectTags(tags);
            return {
                items: tags,
                nexPageMarker: nextPageMarker,
                progress: lib.getProgress(this.opts.config, this.opts.count)
            };
        }

        filterTags(items) {
            const epcReg = this.opts.epcFilter ? new RegExp(this.opts.epcFilter) : null;
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
        }

        stopGetItems() {
            if (this.interval)   clearInterval(this.interval);
            this.interval = null;
            this.opts.node.status({});
        }

        getByInterval() {

            this.interval = setInterval(() => {
                this.opts.count -= 1;
                if (this.opts.config.repeat === "Indefinitely" || this.opts.count > 0)
                    return this.getTags().then((err) => {
                        if (err)
                            clearInterval(this.interval);
                        else if (lib.getProgress(this.opts.config, this.opts.count) === "complete")
                            this.stopGetItems();
                    });
                this.stopGetItems();
            }, parseInt(this.opts.config.interval) * 1000);

        }

        terminateLoop(node, msg) {
            lib.terminateLoop(node, msg, this.interval);
            this.interval = null;
        }
    }


    function GetItemsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const tagRetriever = new TagRetriever();

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
                _: _
            };

            opts.params = (msg.topic === "QueryParams") ? msg.payload : {};

            opts.params = msg.payload && msg.payload.queryParams ? msg.payload.queryParams : opts.params;

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
