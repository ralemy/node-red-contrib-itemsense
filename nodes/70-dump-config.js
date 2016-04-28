/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        q = require("q"),
        _ = require("lodash");

    function DumpConfigNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function dumpAllConfig(itemsense) {
            var result = {
                signature: "Dump configuration for Itemsense Instance: " + itemsense.itemsenseUrl,
                timestamp: new Date().toUTCString(),
                recipes: null,
                readerConfigurations: null,
                readerDefinitions: null,
                zoneMaps: null,
                facilities: null,
                currentZoneMaps: []
            };
            return itemsense.recipes.getAll().then(function (recipes) {
                result.recipes = recipes;
                return itemsense.readerConfigurations.getAll();
            }).then(function (readerConfigs) {
                result.readerConfigurations = readerConfigs;
                return itemsense.readerDefinitions.getAll();
            }).then(function (readerDefinitions) {
                result.readerDefinitions = readerDefinitions;
                return itemsense.zoneMaps.getAll();
            }).then(function (zoneMaps) {
                result.zoneMaps = zoneMaps;
                return itemsense.facilities.getAll();
            }).then(function (facilities) {
                result.facilities = facilities;
                return q.all(_.map(facilities, function (facility) {
                    return itemsense.currentZoneMap.get(facility.name).then(function (currentZoneMap) {
                        result.currentZoneMaps.push({facility: facility, currentZoneMap: currentZoneMap});
                    });
                }));
            }).then(function () {
                return result;
            });
        }

        function dumpJobData(itemsense, job) {
            var result = {
                    signature: "Dump configuration for job: " + job.id + " running on " + itemsense.itemsenseUrl,
                    timestamp: new Date().toUTCString(),
                    job: job,
                    currentZoneMap: [],
                    recipe: null,
                    readerConfigurations: [],
                    readerDefinitions: [],
                    zoneMaps: []
                },
                readerConfigs = {},
                readerDefinitions = {};
            return itemsense.recipes.get(job.job.recipeName).then(function (recipe) {
                result.recipe = recipe;
                if (recipe.readerConfigurationName) {
                    readerConfigs[recipe.readerConfigurationName] = true;
                    _.each(job.readerNames, function (reader) {
                        readerDefinitions[reader] = true;
                    })
                }
                _.each(recipe.readerConfigurations, function (readerConfig, name) {
                    readerConfigs[readerConfig] = true;
                    readerDefinitions[name] = true;
                });
                return result;
            }).then(function () {
                var promises = [];
                _.each(readerConfigs, function (v, configName) {
                    promises.push(itemsense.readerConfigurations.get(configName).then(function (conf) {
                        result.readerConfigurations.push(conf);
                    }));
                });
                _.each(readerDefinitions, function (v, readerName) {
                    promises.push(itemsense.readerDefinitions.get(readerName).then(function (def) {
                        result.readerDefinitions.push(def);
                    }));
                });
                return q.all(promises);
            }).then(function () {
                return q.all(_.map(job.facilities, function (facility) {
                    return itemsense.currentZoneMap.get(facility.name).then(function (zonemap) {
                        result.currentZoneMap.push({facility: facility, zoneMap: zonemap});
                    });
                }));
            }).then(function () {
                return q.all(_.map(result.currentZoneMap, function (zone) {
                    return itemsense.zoneMaps.get(zone.zoneMap.name).then(function (zoneMap) {
                        result.zoneMaps.push(zoneMap);
                    });
                }));
            }).then(function () {
                return result;
            });
        }

        function getJobById(itemsense, id) {
            return id ? itemsense.jobs.get(id)
                : q.reject({statusCode: 400, message: "No Job Id in msg.payload.id or component configuration"});

        }

        this.on("input", function (msg) {
            var itemsense = lib.getItemsense(node, msg,"Dumping Configuration"),
                jobId = msg.payload ? msg.payload.id || config.jobId : config.jobId;
            if (itemsense)
                if (config.dumpMode === "specific")
                    getJobById(itemsense, jobId).then(function (job) {
                        return dumpJobData(itemsense, job);
                    }).then(function (result) {
                        lib.status("exit","",node);
                        msg.payload = result;
                        node.send([msg, {
                            topic: "success",
                            payload: `Dumped Object related to Job ${jobId}`
                        }])
                    }).catch(lib.raiseNodeRedError.bind(lib, `Error dumping job ${jobId}`, msg, node));
                else if (config.dumpMode === "running")
                    itemsense.jobs.getAll().then((jobs) => {
                        return _.filter(jobs, (job) => job.status.startsWith("RUNNING"));
                    }).then((jobs) => {
                        return q.all(_.map(jobs, function (job, index) {
                            return dumpJobData(itemsense, job).then(function (result) {
                                result.totalJobsRunning = jobs.length;
                                result.index = index;
                                return result;
                            });
                        }));
                    }).then((jobs) => {
                        if (!jobs.length)
                            return q.reject({
                                statusCode: 404,
                                message: "No Job running on instance " + itemsense.itemsenseUrl
                            });
                        msg.payload = jobs;
                        lib.status("exit","",node);
                        if (config.outputMode === "array")
                            node.send([msg, {
                                topic: "success",
                                payload: `Dumped objects related to ${jobs.length} running jobs`
                            }]);
                        else
                            _.each(jobs,(job)=>{
                                const copy = _.extend({},msg);
                                copy.payload = job;
                                node.send([copy,{
                                    topic: "success",
                                    payload: `Dumped objects related to running job ${job.job.id}`,
                                    count: job.totalJobsRunning,
                                    index: job.index
                                }]);
                            });
                    }).catch(lib.raiseNodeRedError.bind(lib,"Error dumping running job", msg,node));
                else
                    dumpAllConfig(itemsense).then((result) => {
                        lib.status("exit","",node);
                        msg.payload = result;
                        node.send([msg, {
                            topic: "success",
                            payload: `Dumped Configuration for Itemsense Instance ${itemsense.itemsenseUrl}`
                        }]);
                    }).catch(lib.raiseNodeRedError.bind(lib, `Error dumping config for ${itemsense.itemsenseUrl}`, msg,node));
        });
    }

    RED.nodes.registerType("dump-config", DumpConfigNode);
};
