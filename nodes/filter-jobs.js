/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get jobs with a specific status
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function RunningJobNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            _ = node.context().global.lodash;

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense");
            node.status({fill: "yellow", shape: "ring", text: "getting running jobs"});
            itemSense.jobs.getAll().then(function (jobs) {
                node.status({});
                msg.topic = "Jobs";
                msg.payload = config.jobStatus === "ANY" ? jobs : _.filter(jobs, function (job) {
                    return job.status === config.jobStatus;
                });
                node.send([msg, {
                    topic: "success",
                    payload: "Extracted " + msg.payload.length + " jobs with status " + config.jobStatus
                }]);
            }, function (err) {
                console.log("general error getting jobs of status " + config.jobStatus, err);
                node.send([null, {
                    topic: "failure",
                    error: err,
                    payload: lib.triageError(err, "Failed to get jobs with status " + config.jobStatus + ". ")
                }]);
            }).catch(function (err) {
                console.log("general error get jobs with status " + config.jobStatus, err, msg, config);
                node.error(err, {payload: err});
            });
        });
    }

    RED.nodes.registerType("filter-jobs", RunningJobNode);
};
