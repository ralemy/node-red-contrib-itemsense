/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to create a response for a web call to an itemsense flow from an error output.
 */
module.exports = function (RED) {
    "use strict";

    function WebResponseNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var http = node.context().flow.get("Itemsense_http");
            if (http && msg.topic === "failure") {
                http.payload = msg.payload;
                http.statusCode = msg.statusCode;
                return http;
            }
        });
    }

    RED.nodes.registerType("web-response", WebResponseNode);
};
