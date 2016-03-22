/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to run an ItemSense Job
 */
module.exports = function (RED) {
    "use strict";

    function triageError(err) {
        if (err.response)
            if (err.response.body)
                if (err.response.body.message.indexOf("JobId=") !== -1)
                    return {jobId: err.response.body.message.match(/JobId=([^,]+)/)[1]};
                else
                    return {
                        jobId: null,
                        body: {payload: err.response.body},
                        message: "Job Start Failed:" + err.response.statusCode + " " + JSON.stringify(err.response.body, null, " ")
                    };
            else
                return {
                    jobId: null,
                    body: {payload: err.response.statusCode},
                    message: "Job Start Failed:" + err.response.statusCode
                };
        return {jobId: null, message: err.message};
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
            };

        this.on("input", function (msg) {
            var itemSense = node.context().flow.get("itemsense");
            if (msg.jobConfig)
                Object.keys(msg.jobConfig).forEach(function (key) {
                    jobObject[key] = msg.jobConfig[key];
                });
            node.status({fill: "red", shape: "ring", text: "calling ItemSense"});
            itemSense.jobs.start(jobObject).then(function (job) {
                node.status({});
                msg.topic = "Job";
                msg.payload = job;
                node.send([msg, null, {topic: "success", payload: "Job Starting: " + job.id}]);
            }, function (err) {
                var triage = triageError(err);
                if (triage.jobId)
                    node.send([null,
                        {topic: "jobId", payload: {id: triage.jobId}},
                        {topic: "failure", payload: "Another Job is Running " + triage.jobId}
                    ]);
                else if (triage.body)
                    node.error(triage.message, {payload: triage.body});
                else
                    node.error(triage.message, {payload: triage.message})
            }).catch(function (err) {
                console.log("general error", err);
                node.error(err, {payload: err});
            });
        });
    }

    RED.nodes.registerType("run-job", RunJobNode);
};
/*
 var itemSense = msg.itemsense;
 if (msg.jobConfig)
 Object.keys(msg.jobConfig).forEach(function (key) {
 jobObject[key] = msg.jobConfig[key];
 });
 node.status({fill: "red", shape: "ring", text: "calling ItemSense"});
 console.log("---->",msg,jobObject);
 itemSense.jobs.start(jobObject).then(function (job) {
 node.status({});
 msg.topic = "Job";
 msg.payload = job;
 node.send([msg, null, {topic: "success", payload: "Job Starting: " + job.id}]);
 }, function (err) {
 var triage = triageError(err);
 if (triage.jobId)
 node.send([null,
 {topic: "jobId", payload: {id: triage.jobId}},
 {topic: "failure", payload: "Another Job is Running " + triage.jobId}
 ]);
 else if (triage.body)
 node.error(triage.message, {payload: triage.body});
 else
 node.error(triage.message, {payload: triage.message})
 }).catch(function (err) {
 console.log("general error", err);
 node.error(err, {payload: err});
 });
 */