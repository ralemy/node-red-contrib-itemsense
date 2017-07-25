/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to run an Itemsense Job
 */
module.exports = function (RED) {
    "use strict";

    var lib = require("./lib/itemsense");
    lib.hookIntoApp(RED);

    function triageError(err) {
        if (err.response)
            if (err.response.body)
                if (err.response.body.message.indexOf("JobId=") !== -1)
                    return {jobId: err.response.body.message.match(/JobId=([^,]+)/)[1]};
                else
                    return {
                        jobId: null,
                        body: {message: err.response.body, statusCode: err.response.statusCode},
                        message: "Job Start Failed:" + err.response.statusCode + " " + JSON.stringify(err.response.body, null, " ")
                    };
            else
                return {
                    jobId: null,
                    body: {statusCode: err.response.statusCode},
                    message: "Job Start Failed: " + err.response.statusCode
                };
        return {jobId: null, body: {statusCode: 500, message: err.message}, message: err.message};
    }
    function getReaderGroups(g){
        if(!g) return null;
        return g.split(",");
    }
    function RunJobNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            LocalItemsense = RED.nodes.getNode(config.itemsense);
        this.on("input", function (msg) {
            var itemsense = lib.registerItemsense(node, msg, LocalItemsense),
                jobObject = {
                    "readerGroups":getReaderGroups(config.readerGroups),
                    "recipeName": config.recipe,
                    "durationSeconds": config.runLength,
                    "startDelay": config.startDelay,
                    "reportToDatabaseEnabled": true,
                    "reportToHistoryEnabled": true,
                    "reportToMessageQueueEnabled": true,
                    "reportToFileEnabled": false,
                    "facility": config.facility
                };
            Object.keys(jobObject).forEach(function (key) {
                if (msg.payload && msg.payload[key] !== undefined){
                    jobObject[key] = msg.payload[key];
                  }
            });
            lib.status("enter", "Running Job", node);
            if (itemsense)
                itemsense.jobs.start(jobObject).then(function (job) {
                    msg.topic = "Job";
                    msg.payload = job;
                    node.send([msg, null, {topic: "success", payload: "Job Starting: " + job.id}]);
                    lib.status("exit", "", node);
                }).catch(function (err) {
                    var triage = triageError(err);
                    console.log("error", triage);
                    lib.status("error", "Failed Running Job", node);
                    if (triage.jobId)
                        node.send([null,
                            lib.extend(msg, {topic: "jobId", payload: {id: triage.jobId}}),
                            {
                                topic: "failure",
                                payload: {statusCode: 400, message: "Another Job is Running " + triage.jobId}
                            }
                        ]);
                    else if (triage.body)
                        node.error(triage.message, lib.extend(msg, {
                            topic: "failure",
                            payload: triage.body,
                            statusCode: triage.body.statusCode
                        }));
                });
        });
    }

    RED.nodes.registerType("run-job", RunJobNode);
};
