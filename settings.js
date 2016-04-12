/**
 * Created by ralemy on 3/12/16.
 * provides settings for initialization of node-red
 */

var path = require("path");
module.exports = {
//    httpAdminRoot: "/red",
    httpNodeRoot: "/api",
//    flowFile: "flows.json",
    userDir: path.resolve(__dirname, "node_modules"),
    nodesDir: path.resolve(__dirname, "nodes"),
    verbose: true,
//    storageModule: require("./flow_file_system"),
    functionGlobalContext: {
    },
    editorTheme: {
        page: {
            title: "ItemSense SVL Flows",
            css: path.resolve(__dirname, "impinj", "node-red.css"),
            favicon:path.resolve(__dirname,"impinj","favicon.ico")
        },
        header: {
            title: "ItemSense SVL Flow Editor",
            image: path.resolve(__dirname, "impinj", "logo.png")
        },
        deployButton: {
            type: "simple",
            label: "Update",
            icon: path.resolve(__dirname, "impinj", "icon.png")
        }
    }
};
