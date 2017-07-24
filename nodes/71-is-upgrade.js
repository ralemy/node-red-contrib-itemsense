/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    var lib = require("./lib/itemsense"),
        _ = require("lodash");

    function GetObjectNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        this.on("input", function (msg) {
            const itemsense = lib.getItemsense(node, msg, config.task),
                payload = msg.payload || {};
            let upgradeId = "";
            if (itemsense)
                switch (config.task) {
                    case "image":
                        const imageType = payload.imageType || "FIRMWARE_SPEEDWAY";
                        itemsense.upgrade.image(imageType, payload.version).then(response => {
                            lib.status("exit","",node);
                            msg.topic = payload.version ? `Show ${imageType} version ${payload.version}` : `Show ${imageType}`;
                            msg.payload = response;
                            node.send([msg, {
                                topic: "success",
                                payload: msg.topic
                            }]);
                        }).catch(lib.raiseNodeRedError.bind(lib, "Itemsense show Image error " + imageType, msg, node));
                        break;
                    case "show":
                        upgradeId = payload.upgradeInstanceId || payload.id;
                        itemsense.upgrade.show(upgradeId).then(response => {
                            lib.status("exit","",node);
                            msg.topic = upgradeId ? `Show Upgrade ${upgradeId}` : `Show Upgrades`;
                            msg.payload = response;
                            node.send([msg, {
                                topic: "success",
                                payload: msg.topic
                            }]);
                        }).catch(lib.raiseNodeRedError.bind(lib, "Itemsense show Upgrade error ", msg, node));
                        break;
                    case "start":
                        itemsense.upgrade.start(payload).then(response=>{
                            lib.status("exit","",node);
                            msg.topic = "Start Upgrade";
                            msg.payload = response;
                            node.send([msg, {
                                topic: "success",
                                payload: msg.topic
                            }]);
                        }).catch(lib.raiseNodeRedError.bind(lib, "Itemsense start Upgrade error ", msg, node));
                        break;
                    case "stop":
                        upgradeId = payload.upgradeInstanceId || payload.id;
                        if(upgradeId)
                            itemsense.upgrade.stop(upgradeId).then(response=>{
                                lib.status("exit","",node);
                                msg.topic = "Stop Upgrade";
                                msg.payload = response;
                                node.send([msg, {
                                    topic: "success",
                                    payload: msg.topic
                                }]);
                            }).catch(lib.raiseNodeRedError.bind(lib, "Itemsense stop Upgrade error ", msg, node));
                        break;
                }
        });
    }

    RED.nodes.registerType("is-upgrade", GetObjectNode);
};
