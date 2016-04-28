/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to stop an Itemsense Job
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense");

    function StopJobNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var jobId = msg.payload && msg.payload.id ? msg.payload.id : null,
                title = "Stopping Job " + jobId,
                error = "Input message payload does not contain an id property ",
                itemsense = lib.getItemsense(node, msg, title);
            if (!jobId)
                lib.raiseNodeRedError(error,msg,node,{
                    message: error
                });
            else if (itemsense)
                itemsense.jobs.stop(jobId).then(function () {
                    lib.status("exit","",node);
                    node.send([msg, {topic: "success", payload: "Attempting to Stop Job: " + jobId}]);
                }).catch(lib.raiseNodeRedError.bind(lib,"Failed to Stop job "+jobId,msg,node));
        });
    }

    RED.nodes.registerType("stop-job", StopJobNode);
};
