/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to get an Itemsense object based on its id, or all object of a certain type
 */
module.exports = function (RED) {
    "use strict";
    const lib = require("./lib/itemsense"),
        _ = require("lodash");

    function GetObjectNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        function payloadError(msg, err) {
            lib.raiseNodeRedError("Payload Error for Reader Features", msg, node, err);
            return null;
        }

        function getParams(msg) {
            let params = {};
            if (!msg.payload || !msg.payload.readerDefinitionName)
                return payloadError(msg, "Must have a readerDefinitionName key in payload");
            if (config.task === "configureFeature" && !msg.payload.body)
                return payloadError(msg, "Must have a body object in payload");
            if (config.task === "getFeatureStatus" && (!msg.payload.body || !msg.payload.body.feature))
                return payloadError(msg, "Must have a body object in payload containing the feature");
            params.readerDefinitionName = msg.payload.readerDefinitionName;
            params.body = msg.payload.body;
            return params;
        }

        this.on("input", function (msg) {
            const params = getParams(msg),
                itemsense = lib.getItemsense(node, msg, config.task);
            if (itemsense && params)
                itemsense.readerFeatures[config.task](params.readerDefinitionName, params.body).then(function (object) {
                    msg.payload = object;
                    msg.topic = config.task;
                    node.send([msg, {
                        topic: "success",
                        payload: config.task + " succeeded"
                    }]);
                }).catch(lib.raiseNodeRedError.bind(lib, "Itemsense Error " + config.task, msg, node));
        });
    }

    RED.nodes.registerType("reader-features", GetObjectNode);
};
