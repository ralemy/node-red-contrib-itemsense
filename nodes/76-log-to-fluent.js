/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to stop an Itemsense Job
 */
module.exports = function (RED) {
    "use strict";
    var logger = require("fluent-logger");

    function LogToFluent(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        logger.configure(config.tag, {
            host: config.host,
            port: config.port
        });

        this.on("input", function (msg) {
            logger.emit(((msg.topic || "").toString()), msg.payload)
        });
    }

    RED.nodes.registerType("log-to-fluent", LogToFluent);
};
