/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to run an Itemsense Job
 */
module.exports = function (RED) {
    "use strict";

    var lib = require("./itemsense");

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
        return {jobId: null, body: {statusCode: 500, message: err.message}};
    }

    function RunJobNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            jobObject = {
                "recipeName": config.recipe,
                "durationSeconds": config.runLength,
                "playbackLoggingEnabled": false,
                "presenceLoggingEnabled": true,
                "startDelay": config.startDelay,
                "reportToDatabaseEnabled": true,
                "reportToMessageQueueEnabled": true,
                "reportToFileEnabled": false,
                "facility": config.facility
            },
            LocalItemsense = RED.nodes.getNode(config.itemsense);

        this.on("input", function (msg) {
            var itemsense = lib.registerItemsense(node, msg, LocalItemsense);
            Object.keys(jobObject).forEach(function (key) {
                if (msg.payload && msg.payload[key])
                    jobObject[key] = msg.payload[key];
            });
            node.status({fill: "red", shape: "ring", text: "calling Itemsense"});
            if (itemsense)
                itemsense.jobs.start(jobObject).then(function (job) {
                    node.status({});
                    msg.topic = "Job";
                    msg.payload = job;
                    node.send([msg, null, {topic: "success", payload: "Job Starting: " + job.id}]);
                }).catch(function (err) {
                    var triage = triageError(err);
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
