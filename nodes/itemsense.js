/**
 * Created by ralemy on 3/20/16.
 * common functions for itemsense nodes
 */
function stringify(target) {
    try {
        return typeof target === "object" ? JSON.stringify(target, null, " ") : target;
    } catch (e) {
        return target.toString();
    }
}

function getMessage(err){
    if (err.response)
        if (err.response.body)
            if (err.response.body.message)
                return  err.response.body.message;
            else
                return stringify(err.response.body);
    if (err.error)
        return stringify(err.error);
    if (err.message)
        return stringify(err.message);
    return stringify(err);
}
function triageError(err, title) {
    var payload = {};
    payload.title = title || "Error";
    if (err.statusCode)
        payload.statusCode = err.statusCode;
    payload.message = getMessage(err);
    return payload;
}

function padString(value, padcount, padchar) {
    var s = value.toString(),
        p = "";
    for (i = 0; i < padcount - s.length; i++)
        p += padchar;
    return p + s;
}

module.exports = {
    stringify: stringify,
    triageError: triageError,
    padString: padString
};