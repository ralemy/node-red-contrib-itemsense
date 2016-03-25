/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to stop an ItemSense Job
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function StopJobNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var itemSense = lib.getItemSense(node,msg),
                jobId = msg.payload && msg.payload.id ? msg.payload.id : null;
            node.status({fill: "red", shape: "ring", text: "stopping Job:" + jobId});
            if (!jobId)
                node.error("Input message payload does not contain an id property ",
                    lib.extend(msg, {
                        topic: "failure",
                        payload: "Input message payload does not contain an id property ",
                        statusCode: 500
                    }));
            else if(itemSense)
                itemSense.jobs.stop(jobId).then(function () {
                    node.status({});
                    node.send([msg, {topic: "success", payload: "Attempting to Stop Job: " + jobId}]);
                }).catch(function (err) {
                    lib.throwNodeError(err,"Failed to Stop job. ",msg,node);
                });
        });
    }

    RED.nodes.registerType("stop-job", StopJobNode);
};
