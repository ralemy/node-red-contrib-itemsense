/**
 * Created by ralemy on 3/20/16.
 * common functions for itemsense nodes
 */

var _ = require("lodash"),
    Itemsense = require("itemsense-node"),
    request = require("request"),
    serveStatic = require("serve-static"),
    path = require("path"),
    tagRetriever = require("./tag_retriever"),
    decorator = require("./instance_decorator"),
    q = require("q");

function stringify(target) {
    try {
        return typeof target === "object" ? JSON.stringify(target, null, " ") : target;
    } catch (e) {
        return target.toString();
    }
}

function getMessage(err) {
    if (err.response)
        if (err.response.body)
            if (err.response.body.message)
                return err.response.body.message;
            else
                return stringify(err.response.body);
    if (err.error)
        return stringify(err.error);
    if (err.message)
        return stringify(err.message);
    return stringify(err);
}
function triageError(err, title) {
    var payload = {};
    payload.title = title || "Error";
    payload.statusCode = err.statusCode || 500;
    payload.message = getMessage(err);
    return payload;
}

function padString(value, padcount, padchar) {
    var s = value.toString(),
        p = "";
    for (i = 0; i < padcount - s.length; i++)
        p += padchar;
    return p + s;
}

function getProgress(config, value) {
    if (config.repeat == "None")
        return "complete";
    if (config.repeat === "Indefinitely")
        return "Call: " + padString(-1 * value, 2, "0");
    value -= 1;
    if (!value)
        return "complete";
    value *= 100;
    value /= parseInt(config.count);
    value = Math.round(100 - value);
    return padString(value, 2, "0") + "%";
}

function extend(msg, newObj) {
    return _.extend({}, msg, newObj);
}

function throwNodeError(err, title, msg, node) {
    console.log(title, err);
    var payload = triageError(err, title);
    node.error(payload,
        extend(msg, {
            topic: "failure",
            payload: payload,
            statusCode: payload.statusCode
        }));
}


function connectToItemsense(msg) {
    var Factory = Itemsense,
        instance = new Factory({
            itemsenseUrl: msg.itemsenseUrl,
            username: msg.username,
            password: msg.password
        });
    instance.username = msg.username;
    instance.password = msg.password;
    return decorator(instance);
}

function hasItemsenseInfo(msg) {
    return msg && msg.payload && msg.payload.itemsenseUrl;
}

function registerItemsense(node, msg, LocalItemsense) {
    var itemsense = msg.itemsense || node.context().flow.get("itemsense");
    if (!itemsense)
        if (hasItemsenseInfo(msg))
            itemsense = connectToItemsense(msg.payload);
        else if (LocalItemsense)
            itemsense = LocalItemsense.itemsense;
    if (itemsense)
        node.context().flow.set("itemsense", itemsense);
    else
        node.error("Must either configure an itemsense-instance or pass info in the message object",
            lib.extend(msg, {
                topic: "error",
                payload: "Must either configure an itemsense-instance or pass info in the message object",
                statusCode: 400
            }));
    return itemsense;
}
function status(status, title, node) {
    switch (status) {
        case "enter":
            return node.status({fill: "yellow", shape: "ring", text: title});
        case "exit":
            return node.status({});
        case "error":
            return node.status({fill: "red", shape: "ring", text: title});
    }
}
function getItemsense(node, msg, title) {
    var itemsense = node.context().flow.get("itemsense") || msg.itemsense;
    if (!itemsense)
        node.error("Itemsense Instance flow variable absent. use a connect node",
            extend(msg, {
                topic: "failure",
                payload: "Itemsense flow variable absent",
                statusCode: 500
            }));
    else
        status("enter", title, node);
    return itemsense;
}


function terminateLoop(node, msg, interval) {
    if (!msg)
        return interval ? clearInterval(interval) : null;

    var copy = extend(msg, {
        payload: {
            items: [],
            nextPageMarker: null,
            progress: "interrupted"
        }
    });
    node.status({});
    if (!interval)
        node.send([copy, {
            topic: "warning",
            payload: "No interval to terminate"
        }]);
    else {
        clearInterval(interval);
        node.send([copy, {
            topic: "success",
            payload: "Get Items repeat interrupted"
        }]);
    }
}

var hookedIntoApp = false;

function registerApp(app,settings) {
    const itemSenseApiPath =  "/itmsns";
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
    app.use("/vendor",serveStatic(path.join(__dirname,"..","vendor")));
}


const md = {
    stringify: stringify,
    triageError: triageError,
    padString: padString,
    getProgress: getProgress,
    extend: extend,
    throwNodeError: throwNodeError,
    raiseNodeRedError: function (title, msg, node, err) {
        throwNodeError(err, title, msg, node);
        this.status("error", title, node);
        return err;
    },
    getItemsense: getItemsense,
    terminateLoop: terminateLoop,
    hasItemsenseInfo: hasItemsenseInfo,
    connectToItemsense: connectToItemsense,
    registerItemsense: registerItemsense,
    hookIntoApp: function (RED) {
        if (!hookedIntoApp)
            registerApp(RED.httpNode || RED.httpAdmin, RED.settings);
        hookedIntoApp = true;
    },
    status: status,
    tagRetriever: (type) => tagRetriever(md, type),
    terminateGetLoop: (node, msg) => {
        if (node.tagRetriever)
            node.tagRetriever.terminateLoop(node, msg);
        node.tagRetriever = null;
        node.status({});
    }
};

module.exports = md;