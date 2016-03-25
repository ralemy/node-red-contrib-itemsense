/**
 * Created by ralemy on 3/20/16.
 * common functions for itemsense nodes
 */

var _ = require("lodash"),
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

function extend(msg,newObj){
    return _.extend({},msg,newObj);
}

function throwNodeError(err,title, msg,node){
    console.log(title, err);
    var payload = triageError(err, title);
    node.error(payload,
        extend(msg, {
            topic: "failure",
            payload: payload,
            statusCode: payload.statusCode
        }));
}

function getItemSense(node,msg){
    var itemSense = node.context().flow.get("itemsense");
    if(!itemSense)
        node.error("Itemsense Instance flow variable absent. use a connect node",
            extend(msg, {
                topic: "failure",
                payload: "Itemsense flow variable absent",
                statusCode: 500
            }));
    return itemSense;
}

function terminateLoop(node, msg, interval) {
    var copy = extend(msg,{
        payload:{
            items:[],
            nextPageMarker:null,
            progress:"interrupted"
        }
    })
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

module.exports = {
    stringify: stringify,
    triageError: triageError,
    padString: padString,
    getProgress: getProgress,
    extend: extend,
    throwNodeError:throwNodeError,
    getItemSense:getItemSense,
    terminateLoop:terminateLoop
};