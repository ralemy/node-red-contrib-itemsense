/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to stop an ItemSense Job
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");
    function RunJobNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense"),
                jobId = msg.payload && msg.payload.id ? msg.payload.id : null;
            if (!jobId) {
                node.send([msg, {
                    topic: "error",
                    payload: "Input message payload does not contain an id property ",
                    msg: msg
                }]);
                return;
            }
            node.status({fill: "red", shape: "ring", text: "stopping Job:" + jobId});
            itemSense.jobs.stop(jobId).then(function () {
                node.status({});
                node.send([msg, {topic: "success", payload: "Attempting to Stop Job: " + jobId}]);
            }, function (err) {
                console.log("general error stop job", err);
                node.send([msg, {
                    topic: "failure",
                    payload: lib.triageError(err,"Failed to stop job. ")
                }]);
            }).catch(function (err) {
                console.log("general error stop job", err,msg,config);
                node.error(err, {payload: err});
            });
        });
    }

    RED.nodes.registerType("stop-job", RunJobNode);
};
