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

        function sendOutput(config,msg){
            var copy = _.merge({},msg),
                mode = config.outputMode;
            if(mode === "array")
                node.send([msg, {
                    topic: "success",
                    payload: "Extracted " + msg.payload.length + " jobs with status " + config.jobStatus,
                    jobStatus: config.jobStatus,
                    count: msg.payload.length
                }]);
            else
                _.each(msg.payload, function (object, index) {
                    copy.payload = object;
                    node.send([copy, {
                        topic: "success",
                        payload: "Retracted Job with status " + config.jobStatus,
                        count: msg.payload.length,
                        index: index + 1
                    }]);
                });
            if (mode === "single" && msg.payload.length === 0)
                node.send([null, {
                    topic: "success",
                    payload: "No Jobs found with status " + config.jobStatus,
                    count: 0,
                    index: 0
                }]);

        }

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense");
            node.status({fill: "yellow", shape: "ring", text: "getting running jobs"});
            itemSense.jobs.getAll().then(function (jobs) {
                node.status({});
                msg.topic = "Jobs";
                msg.payload = config.jobStatus === "ANY" ? jobs : _.filter(jobs, function (job) {
                    return job.status === config.jobStatus;
                });
                sendOutput(config,msg);
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
