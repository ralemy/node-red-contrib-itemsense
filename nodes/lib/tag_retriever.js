/**
 * Created by ralemy on 4/30/16.
 * Reused by getItems and getItemHistory, collects tags by restful call
 */


"use strict";
const _ = require("lodash");

class TagRetriever {
    constructor(lib, type) {
        const types = {
            items: {
                action: "get",
                error: "Error in GetItems",
                topic: "getItems",
                reponseKey:"items"
            },
            history: {
                action: "getHistory",
                error: "Error In Get Item History",
                topic: "getHistory",
                responseKey:"history"
            }
        };
        this.lib = lib;
        this.type = types[type || "history"];
    }
    static queryParams(payload, topic, config){
        return _.extend({
                pageSize: config.fetchMode === "all" ? 1000 : Math.min(config.pageSize || 100, 1000)
            },
            payload.queryParams || (topic === "QueryParams" ? payload : {}));
    }
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
        return this.opts.itemsense.items[this.type.action](this.opts.params)
            .then((response) => {
                tags = tags.concat(this.filterTags(response[this.type.responseKey]));
                return this.createResponse(tags, response.nextPageMarker);
            });
    }

    getTags() {
        return this.collectTags().then(this.emitResponse)
            .catch(err => this.emitError(err));
    }

    emitError(err) {
        console.log("error", err, this, this.lib);
        this.lib.raiseNodeRedError(this.type.error, this.opts.msg, this.opts.node, err);
        return "error";
    }

    fetchMore(tags){
        this.opts.node.status({text:`Retrieved ${tags.length} entries`});
        this.opts.node.send([null,{
            topic:"progress",
            payload:`Retrieved ${tags.length} items so far`
        }]);
        return this.collectTags(tags)
    }
    createResponse(tags, next) {
        const config = this.opts.config,
            shouldFetch = config.fetchMode === "all" ? !!next : next && tags.length < (config.pageSize || 100);
        if (next)
            this.opts.params.pageMarker = next;
        else
            delete this.opts.params.pageMarker;
        return shouldFetch ?
            this.fetchMore(tags) :
        {
            items: tags,
            nexPageMarker: next,
            progress: this.lib.getProgress(config, this.opts.count)
        };
    }

    filterTags(items) {
        const epcReg = this.opts.epcFilter ? new RegExp(this.opts.epcFilter) : null;
        return this.opts.epcFilter ? _.filter(items, tag=> tag.epc.match(epcReg)) : items;
    }

    sendResponse(response) {
        this.opts.node.send([
            this.lib.extend(this.opts.msg, {
                topic: this.topic,
                payload: response
            }),
            {
                topic: "success",
                payload: `Retrieved ${response.items.length} tags from Itemsense. ${response.progress}`
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
                    else if (this.lib.getProgress(this.opts.config, this.opts.count) === "complete")
                        this.stopGetItems();
                });
            this.stopGetItems();
        }, parseInt(this.opts.config.interval) * 1000);

    }

    terminateLoop(node, msg) {
        this.lib.terminateLoop(node, msg, this.interval);
        this.interval = null;
    }
}

module.exports = function (lib,type) {
    return new TagRetriever(lib, type);
};