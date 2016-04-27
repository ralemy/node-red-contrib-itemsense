/**
 * Created by ralemy on 2/21/16.
 * Node-Red node show a json object in pretty format and with folding
 */
module.exports = function (RED) {
    "use strict";

    function JsonOutputNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;


        this.on("input", function (msg) {
            putJSON(msg,this);
        });

        function putJSON(msg,n){
            const seen=[],
                pickled = JSON.parse(JSON.stringify(msg,function(key,value){
                if(typeof value === "object" && value !== null)
                    if(seen.indexOf(value) !== -1)
                        return "[circular]";
                    else
                        seen.push(value);
                return value;
            }," "));
            RED.comms.publish("jsonOutput",{id:n.id,msg:pickled});
        }
    }
    RED.nodes.registerType("json-output", JsonOutputNode);
};
