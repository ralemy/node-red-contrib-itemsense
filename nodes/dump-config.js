/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./itemsense"),
        q = require("q"),
        _ = require("lodash");

    function DumpConfigNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function dumpAllConfig(itemsense, msg) {
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

        function dumpJobData(itemsense, job, msg, count, index) {
            var result = {
                    signature: "Dump configuration for job: " + job.id + " running on " + itemsense.itemsenseUrl,
                    timestamp: new Date().toUTCString(),
                    totalJobsRunning: count,
                    index: index,
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

        function getJobById(itemsense, msg) {
            var id = msg.payload ? msg.payload.id || config.jobId : config.jobId;
            return id ? itemsense.jobs.get(msg.payload.id)
                : q.reject({statusCode: 400, message: "No Job Id in msg.payload.id or component configuration"});

        }

        this.on("input", function (msg) {
            var itemSense = lib.getItemSense(node, msg);
            node.status({fill: "red", shape: "ring", text: "Dumping Configuration"});
            if (itemSense)
                if (config.dumpMode === "specific")
                    getJobById(itemSense, msg).then(function (job) {
                        return dumpJobData(itemSense, job, msg, 1, 0);
                    }).then(function (result) {
                        msg.payload = result;
                        node.send([msg, {
                            topic: "success",
                            payload: "Dumped Object related to Job " + msg.payload.id
                        }])
                    }).catch(function (err) {
                        var jobId = msg.payload ? msg.payload.id : "no job id",
                            title = "Error dumping job " + jobId;
                        lib.throwNodeError(err, title, msg, node);
                    });
                else if (config.dumpMode === "running")
                    itemSense.jobs.getAll().then(function (jobs) {
                        return _.filter(jobs, function (job) {
                            return job.status === "RUNNING";
                        });
                    }).then(function (jobs) {
                        return q.all(_.map(jobs, function (job, index) {
                            var copy = _.extend({}, msg);
                            return dumpJobData(itemSense, job, msg, jobs.length, index).then(function (result) {
                                copy.payload = result;
                                node.send([copy, {
                                    topic: "success",
                                    payload: "Dumped objects related to running job " + job.id,
                                    count: jobs.length,
                                    index: index
                                }]);
                            });
                        }));
                    }).then(function (jobs) {
                        node.status({});
                        return jobs.length ? jobs :
                            q.reject({
                                statusCode: 404,
                                message: "No Job running on instance " + itemSense.itemsenseUrl
                            });
                    }).catch(function (err) {
                        var title = "Error dumping running job";
                        lib.throwNodeError(err, title, msg, node);
                    });
                else
                    dumpAllConfig(itemSense, msg).then(function (result) {
                        node.status({});
                        msg.payload = result;
                        node.send([msg, {
                            topic: "success",
                            payload: "Dumped Configuration for Itemsense Instance " + itemSense.itemsenseUrl
                        }]);
                    }).catch(function (err) {
                        var title = "Error dumping config for Itemsense Instance " + itemSense.itemsenseUrl;
                        lib.throwNodeError(err, title, msg, node);
                    });
        });
    }

    RED.nodes.registerType("dump-config", DumpConfigNode);
};
