/**
 * Created by ralemy on 2/21/16.
 * Node-Red node to stash a web call to an itemsense flow, so that it can be retrieved and responded later
 */
module.exports = function (RED) {
    "use strict";

    function StashWebCallNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            if(msg.req)
                node.context().flow.set("Itemsense_http",msg);
            return msg;
        });
    }

    RED.nodes.registerType("stash-webcall", StashWebCallNode);
};
