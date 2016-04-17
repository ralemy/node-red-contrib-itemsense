/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to register and consume an Itemsense AMQP message queue
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        q = require("q"),
        amqp = require("amqp"),
        _ = require("lodash"),
        Decoder = require("string_decoder").StringDecoder,
        decoder = new Decoder("utf8");

    function QueueClientNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            connection = null,
            errorListener = null,
            nodeClosing = false;

        function getQueueParameters(payload) {
            return _.reduce(["toZone", "fromZone", "epc"], function (r, k) {
                if (config[k])
                    r[k] = config[k];
                if (payload[k])
                    r[k] = payload[k];
                return r;
            }, {});
        }

        function consumeMessage(AMQPmsg) {
            try {
                return {
                    type: "message",
                    body: {topic: "AMQP Message", payload: JSON.parse(decoder.write(AMQPmsg.data))}
                };
            } catch (e) {
                return {
                    type: "log",
                    body: {
                        topic: "error",
                        payload: "Exception converting AMQP message to JSON: " + e.name + ":" + e.message,
                        amqpMessage: AMQPmsg.data
                    }
                };
            }
        }

        function consumeQueue(newConnection, queue) {
            var defer = q.defer();
            closeConnection(newConnection);

            connection.once("ready", function () {
                defer.notify({
                    type: "log",
                    body: {topic: "success", payload: "Connection Ready, Starting Queue Listener"}
                });
                connection.queue(queue, {
                    durable: true,
                    noDeclare: true,
                    arguments: {"x-expires": 3600000, "x-message-ttl": 3600000, "x-max-length-bytes": 1073741824}
                }, function (store) {
                    defer.notify({
                        type: "ready",
                        body: {topic: "message ready", payload: "Queue Ready, listening for messages", queue: queue}
                    });
                    store.subscribe(function (msg) {
                        defer.notify(consumeMessage(msg));
                    }).addCallback(function (ok) {
                        connection.on("close", function () {
                            store.unsubscribe(ok.consumerTag);
                        });
                    });
                });
            });
            errorListener = function (err) {
                console.log("Error in AMQP Listener", err);
                defer.notify({
                    type: "log",
                    body: {topic: "error", payload: "Error in AMQP connection", error: err}
                });
            };
            connection.on("error", errorListener);
            connection.on("close", function () {
                defer.resolve();
            });
            return defer.promise;
        }

        function closeConnection(newConnection) {
            if (connection) {
                connection.removeListener("error", errorListener);
                connection.disconnect();
            }
            connection = newConnection;
        }

        function waitForMessages(channel) {
            node.status({fill: "green", shape: "ring", text: "waiting for messages"});
            node.send([null, null, {topic: "success", payload: "AMQP Queue Opened.", queue: channel}]);
            return consumeQueue(amqp.createConnection({
                url: channel.serverUrl,
                login: itemsense.username,
                password: itemsense.password
            }, {reconnect: false}), channel.queue);
        }

        function notify(msg, message) {
            switch (message.type) {
                case "log":
                    return node.send([null, null, message.body]);
                case "ready":
                    return node.send([lib.extend(msg, message.body), null, message.body]);
                default:
                    node.send([null, lib.extend(msg, message.body), {
                        topic: "message",
                        payload: "AMQP Message Received",
                        AMQPmessage: message.body
                    }]);
            }
        }
        function clearStatus(){
            node.status({});
        }
        this.on("input", function (msg) {
            node.status({fill: "yellow", shape: "ring", text: "Registering Queue"});
            var itemsense = lib.getItemsense(node, msg),
                channelQP = getQueueParameters(msg.payload || {}),
                announceMsg = notify.bind(node, msg),
                reportError = lib.throwNodeError.bind(lib,"Error in AMQP", msg,node);
            if (msg.topic === "CloseConnection") {
                closeConnection();
                msg.payload = "connection closed";
                node.send([msg, null, {topic: "success", payload: "connection closed"}]);
            }
            else if (itemsense)
                itemsense.messageQueue.configure(channelQP)
                    .then(waitForMessages)
                    .then(clearStatus,reportError,announceMsg)
                    .catch(reportError);
        });
        node.on("close", function () {
            nodeClosing = true;
            closeConnection();
        });
    }

    RED.nodes.registerType("queue-client", QueueClientNode);
};
