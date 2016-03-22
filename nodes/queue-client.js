/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to register and consume an Itemsense AMQP message queue
 */
module.exports = function (RED) {
    "use strict";

    function QueueClientNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            _ = node.context().global.lodash,
            amqp = node.context().global.amqp,
            q = node.context().global.q,
            decoder = new (node.context().global.StringDecoder)("utf8"),
            connection = null,
            errorListener = null,
            nodeClosing = false,
            lib = require("./itemsense.js");

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
                        type: "log",
                        body: {topic: "success", payload: "Queue Ready, listening for messages", queue: queue}
                    });
                    store.subscribe(function (msg) {
                        defer.notify(consumeMessage(msg));
                    }).addCallback(function(ok){
                        connection.on("close",function(){
                            store.unsubscribe(ok.consumerTag);
                        });
                    });
                });
            });
            errorListener =function (err) {
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
            if (connection){
                connection.removeListener("error",errorListener);
                connection.disconnect();
            }
            connection = newConnection;
        }

        this.on("input", function (msg) {
            node.status({fill: "yellow", shape: "ring", text: "Registering Queue"});
            var itemSense = node.context().flow.get("itemsense"),
                channelQP = getQueueParameters(msg.payload || {});
            if (msg.topic === "CloseConnection"){
                closeConnection();
            }
            else
                itemSense.messageQueue.configure(channelQP).then(function (channel) {
                    node.status({fill:"green",shape:"ring",text:"waiting for messages"});
                    msg.payload = channel;
                    msg.topic = "AMQPQueue";
                    node.send([msg, null, {topic: "success", payload: "AMQP Queue Opened.", queue: channel}]);
                    return consumeQueue(amqp.createConnection({
                        url: channel.serverUrl,
                        login: itemSense.username,
                        password: itemSense.password
                    }), channel.queue);
                }, function (err) {
                    node.send([null, null, {
                        topic: "error",
                        payload: lib.triageError(err, "Failed registering to AMQP")
                    }]);
                }).then(function () {
                    if(!nodeClosing)
                        node.send([null, null, {topic: "success", payload: "connection closed"}]);
                }, null, function (message) {
                    if (message.type === "log")
                        node.send([null, null, message.body]);
                    else
                        node.send([null, message.body, {
                            topic: "message",
                            payload: "AMQP Message Received",
                            AMQPmessage: message.body
                        }]);
                }).catch(function (err) {
                    console.log("general error in AMQP ",err,node);
                    node.error(err, err);
                }).finally(function () {
                    node.status({});
                });
        });
        node.on("close", function(){
            nodeClosing = true;
            closeConnection();
        });
    }

    RED.nodes.registerType("queue-client", QueueClientNode);
};
