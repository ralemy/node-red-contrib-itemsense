/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to wait for an itemsense job to get to specified status.
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense");

    function WaitStatusNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            continueChecking = true,
            timer = null,
            q = node.context().global.q;

        function checkJobStatus(opts) {
            return opts.itemSense.jobs.get(opts.jobId).then(function (job) {
                console.log("Job status", opts.jobId, config.jobStatus, job.status, config.interval);
                if (job.status === config.jobStatus)
                    opts.defer.resolve(job);
                else if (job.errors.length)
                    opts.defer.reject({message: "Job " + opts.jobId + " has errors: " + JSON.stringify(job.errors),job:job});
                else if (continueChecking)
                    setTimeout(function () {
                        checkJobStatus(opts);
                    }, parseInt(config.interval || 1) * 1000);
                else
                    opts.defer.reject({message: "Timed out waiting for Job" + opts.jobId + "to get to " + config.jobStatus,job:job});
            }, function (err) {
                opts.defer.reject(err);
            });
        }

        function setupTimer(){
            continueChecking = true;
            if(timer) clearTimeout(timer);
            timer = setTimeout(function () {
                continueChecking = false;
            }, parseInt(config.timeout || 1) * 1000);
        }

        this.on("input", function (msg) {
            var defer = q.defer(),
                jobId = msg.payload && msg.payload.id ? msg.payload.id : null;
            if (!jobId) {
                node.send([msg, {
                    topic: "error",
                    payload: "Input message payload does not contain an id property ",
                    msg: msg
                }]);
                return;
            }
            node.status({fill: "yellow", shape: "ring", text: "Waiting for Status: " + config.jobStatus});
            setupTimer();
            checkJobStatus({
                itemSense: node.context().flow.get("itemsense"),
                defer: defer,
                jobId: jobId
            });
            defer.promise.then(function (job) {
                node.status({});
                msg.topic = "Job";
                msg.payload = job;
                node.send([msg, {topic: "Success", payload: "Job " + msg.payload.id + " is now " + config.jobStatus}]);
            }, function (err) {
                console.log("rejected ", err);
                node.send([null, {
                    topic: "error",
                    payload: lib.triageError(err, "Failed waiting for " + config.jobStatus + " status. "),
                    msg: msg,
                    job:err.job
                }]);
            }).catch(function (err) {
                console.log("general error waiting for status",err,msg,config);
                node.error(err, err);
            });
        });
    }

    RED.nodes.registerType("wait-status", WaitStatusNode);
};
