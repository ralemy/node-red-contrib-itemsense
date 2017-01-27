// name: ReaderDef-xArray
// outputs: 1
//Sample Reader Definition Object for an xArray
//fill in the blanks
function move_the_body_to_a_function_node(){
    msg.payload = {
        "name": "<...>",
        "address": "xarray-<XX-XX-XX>.impinj.com",
        "type": "XARRAY",
        "placement": {
            "x": -20.62,
            "y": -7.67,
            "z": 1.5,
            "yaw": 180,
            "pitch": 0,
            "roll": 0,
            "floor": "<...>"
        },
        "facility": "DEFAULT",
//    "labels": null,
//    "antennaZones": null,
//    "connectionType": "LLRP",
        "readerZone": "<...>"
    };

    return msg;
}
