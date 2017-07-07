/**
 * Created by ralemy on 7/6/16.
 * This is a refactor of Lib module, that will get a node and decorate it with new functionality we need all of
 * Itemsense nodes to have.
 */

"use strict";

const _ = require("lodash");

const Decorator = {
    error(node){
        node.extendMsg = ErrorDecorator.extend;
        node.setStatus = Decorator.status.bind(node);
        node.raiseError = ErrorDecorator.raiseError;
    },
    loop(node){
        node.terminateLoop = Decorator.terminateLoop.bind(node);
        node.stopLoop = Decorator.stopLoop.bind(node);
        node.retrieverFactory = Decorator.tagRetriever.bind(node);
        node.getProgress = Decorator.getProgress;
    },
    padString(value, padcount, padchar){
        var s = value.toString(),
            p = "";
        for (let i = 0; i < padcount - s.length; i++)
            p += padchar;
        return p + s;
    },
    getProgress(config, value){
        if (config.repeat == "None")
            return "complete";
        if (config.repeat === "Indefinitely")
            return "Call: " + Decorator.padString(-1 * value, 2, "0");
        value -= 1;
        if (!value)
            return "complete";
        value *= 100;
        value /= parseInt(config.count);
        value = Math.round(100 - value);
        return Decorator.padString(value, 2, "0") + "%";
    },
    tagRetriever(type){
        this.tagRetriever = retrieverFactory(this, type);
    },
    terminateLoop(msg, interval){
        if (!msg)
            return interval ? clearInterval(interval) : null;

        var copy = this.extendMsg(msg, {
            payload: {
                items: [],
                nextPageMarker: null,
                progress: "interrupted"
            }
        });
        this.status({});
        if (!interval)
            this.send([copy, {
                topic: "warning",
                payload: "No interval to terminate"
            }]);
        else {
            clearInterval(interval);
            this.send([copy, {
                topic: "success",
                payload: "Get Items repeat interrupted"
            }]);
        }
    },
    stopLoop(msg){
        if (this.tagRetriever)
            this.tagRetriever.terminateLoop(this, msg);
        this.tagRetriever = null;
        this.status({});
    },
    status(status, title){
        switch (status) {
            case "enter":
                return this.status({fill: "yellow", shape: "ring", text: title});
            case "exit":
                return this.status({});
            case "error":
                return this.status({fill: "red", shape: "ring", text: title});
        }
    },
    getItemsense(msg, title){
        const itemsense = node.context().flow.get("itemsense") || msg.itemsense;
        if (!itemsense)
            this.error("Itemsense Instance flow variable absent. use a connect node",
                this.extendMsg(msg, {
                    topic: "failure",
                    payload: "Itemsense flow variable absent",
                    statusCode: 500
                }));
        else
            this.setStatus("enter", title, node);
        return itemsense;
    },
    registerItemsense(msg, LocalItemsense){
        let itemsense = msg.itemsense || node.context().flow.get("itemsense");
        if (!itemsense)
            if (this.hasItemsenseInfo(msg))
                itemsense = this.connectToItemsense(msg.payload);
            else if (LocalItemsense)
                itemsense = LocalItemsense.itemsense;
        if (itemsense)
            this.context().flow.set("itemsense", itemsense);
        else
            this.error("Must either configure an itemsense-instance or pass info in the message object",
                this.extendMsg(msg, {
                    topic: "error",
                    payload: "Must either configure an itemsense-instance or pass info in the message object",
                    statusCode: 400
                }));
        return itemsense;
    }
};


class ItemSenseDecorator {
    static register(node) {
        node.hasItemsenseInfo = ItemSenseDecorator.hasItemsenseInfo;
        node.connectToItemsense = ItemSenseDecorator.connectToItemsense;
        node.registerItemsense = Decorator.registerItemsense.bind(node);
    }

    static connect(node) {
        node.getItemsense = Decorator.getItemsense.bind(node);
    }

    static hasItemsenseInfo(msg) {
        return msg && msg.payload && msg.payload.itemsenseUrl;
    }

    static connectToItemsense(msg) {
        const Factory = Itemsense;
        let instance = new Factory({
            itemsenseUrl: msg.itemsenseUrl,
            username: msg.username,
            password: msg.password
        });
        instance.username = msg.username;
        instance.password = msg.password;
        return instance;
    }
}

class ErrorDecorator {

    static raiseError(title, err, msg) {
        console.log(title, err);
        const payload = NodeDecorator.triageError(err, title);
        this.error(payload, NodeDecorator.extend(msg, {
            topic: "failure",
            payload: payload,
            statusCode: payload.statusCode
        }));
    }

    static extend(msg, newObj) {
        return _.extend.apply(_, [{}, msg, newObj]);
    }

    static triageError(err, title) {
        return {
            title: title || "Error",
            statusCode: err.statusCode || 500,
            message: NodeDecorator.getMessage(err)
        }
    }

    static getMessage(err) {
        if (err.response)
            if (err.response.body)
                if (err.response.body.message)
                    return err.response.body.message;
                else
                    return NodeDecorator.stringify(err.response.body);
        if (err.error)
            return NodeDecorator.stringify(err.error);
        if (err.message)
            return NodeDecorator.stringify(err.message);
        return NodeDecorator.stringify(err);
    }

    static stringify(target) {
        try {
            return typeof target === "object" ? JSON.stringify(target, null, " ") : target;
        } catch (e) {
            return target.toString();
        }
    }
}


var hookedIntoApp = false;

function registerApp(app, settings) {
    const itemSenseApiPath = settings.itemSenseApiPath || "/itemsense";
    app.use(itemSenseApiPath, function (req, res) {
        req.body.uri = req.body.url;
        delete req.body.url;
        request(req.body, function (err, response, body) {
            if (err)
                res.status(500).send(err);
            else
                res.status(response.statusCode).send(body);
        }).auth(req.body.user, req.body.password);
    });
    app.use("/vendor", serveStatic(path.join(__dirname, "..", "vendor")));
    hookedIntoApp = true;
}

function hookIntoApp(RED) {
    if (!hookedIntoApp && RED)
        registerApp(RED.httpNode || RED.httpAdmin, RED.settings);
}

module.exports = function (RED) {
    hookIntoApp(RED);
    return function (node, options) {
        if (!hookedIntoApp)
            throw new Exception("Not Hooked into App yet.");
        Decorator.error(node);
        if (options.loopTermination)
            Decorator.loop(node);
        if (options.registerItemSense)
            ItemSenseDecorator.register(node);
        else
            ItemSenseDecorator.connect(node);
        return node;
    };
};