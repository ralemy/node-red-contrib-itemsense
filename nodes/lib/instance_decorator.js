/**
 * Created by ralemy on 7/23/17.
 * decorates instance for functionality not yet implemented.
 */

const request = require("request");
const q = require("q");
const fs = require("fs");

function addReaderGroups(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.readerGroups = {
        getAll: () => makeRequest(
            {getRequestUrl: () => instance.readerDefinitions.model.path + "/groups"},
            {method: "GET", endPoint: "groups"})
    };
    instance.readerGroups.get = instance.readerGroups.getAll.bind(instance.readerGroups);
}

function addReaderFeatures(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.readerFeatures = {
        configureFeature: (readerDefinitionName, body) => makeRequest(
            {getRequestUrl: () => instance.readerDefinitions.model.path + "/" + readerDefinitionName + "/featureChanges"},
            {method: "POST"},
            body
        ),
        getFeatureStatus: (readerDefinitionName, body) => makeRequest(
            {getRequestUrl: () => instance.readerDefinitions.model.path + "/" + readerDefinitionName + "/featureChanges/" + body.feature},
            {method: "GET"}
        ),
        getActiveFeatureRequestStatus: (readerDefinitionName) => makeRequest(
            {getRequestUrl: () => instance.readerDefinitions.model.path + "/" + readerDefinitionName + "/featureChanges"},
            {method: "GET"}
        )
    }
}

function addThresholdAntennaConfigurations(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    const urlPath = "/configuration/v1/thresholds/antennaConfigurations";

    function makeReplacement(replacement) {
        return (replacement) ? `?replacementId=${replacement}` : "";
    }

    instance.thresholdAntennaConfigurations = {
        get: (id) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}`},
            {method: "GET"}
        ),
        getAll: () => makeRequest(
            {getRequestUrl: () => urlPath},
            {method: "GET"}
        ),
        create: (body) => makeRequest(
            {getRequestUrl: () => urlPath},
            {method: "POST"},
            body
        ),
        replace: (body, id) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}`},
            {method: "PUT"},
            body
        ),
        delete: (id, replacement) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}` + makeReplacement(replacement)},
            {method: "DELETE"}
        )
    }
}

function addThresholdConfigurations(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    const urlPath = "/configuration/v1/thresholds";
    instance.thresholds = {
        get: (id) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}`},
            {method: "GET"}
        ),
        getAll: () => makeRequest(
            {getRequestUrl: () => urlPath},
            {method: "GET"}
        ),
        create: (body) => makeRequest(
            {getRequestUrl: () => urlPath},
            {method: "POST"},
            body
        ),
        replace: (body, id) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}`},
            {method: "PUT"},
            body
        ),
        delete: (id) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}`},
            {method: "DELETE"}
        )
    }
}

function addMessageQueues(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.queueTypes = {
        items: payload => makeRequest(
            {getRequestUrl: () => "/data/v1/items/queues"},
            {method: "PUT"},
            payload
        ),
        transitions: payload => makeRequest(
            {getRequestUrl: () => "/data/v1/items/queues/threshold"},
            {method: "PUT"},
            payload
        ),
        health: payload => makeRequest(
            {getRequestUrl: () => "/health/v1/events/queues"},
            {method: "PUT"},
            payload
        )
    }
}

function makeQueryString(obj) {
    let s = "";
    if (typeof obj !== "object") return s;
    for (let i in obj)
        if (obj.hasOwnProperty(i))
            s += `&${encodeURIComponent(i)}=${encodeURIComponent(obj[i])}`;
    return s.length ? `?${s.substr(1)}` : "";
}

function addTransitionItems(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.items.getTransitions = (body) => makeRequest(
        {getRequestUrl: () => "/data/v1/items/show/transitions" + makeQueryString(body)},
        {method: "GET"}
    )
}

function dumpToFile(instance, url, fn) {
    const defer = q.defer();
    fn = fn.endsWith(".tar.gz") ? fn : fn + ".tar.gz";
    request(url)
        .on("end", () => defer.resolve(fn))
        .auth(instance._itemsenseConfig.username, instance._itemsenseConfig.password)
        .pipe(fs.createWriteStream(fn));
    return defer.promise;
}

function addSupport(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.support = {
        logs: (fn, opts) => dumpToFile(instance,
            instance.itemsenseUrl + "/support/v1/logs" + makeQueryString(opts),
            fn),
        configuration: (fn) => dumpToFile(instance,
            instance.itemsenseUrl + "/support/v1/configuration",
            fn
        )
    }
}

function addSNMP(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    const urlPath = "/configuration/v1/settings/SNMP";
    instance.SNMP = {
        get: () => makeRequest(
            {getRequestUrl: () => `${urlPath}`},
            {method: "GET"}
        ),
        getAll: () => makeRequest(
            {getRequestUrl: () => urlPath},
            {method: "GET"}
        ),
        update: (body) => makeRequest(
            {getRequestUrl: () => `${urlPath}`},
            {method: "PUT"},
            body
        ),
        delete: () => makeRequest(
            {getRequestUrl: () => `${urlPath}`},
            {method: "DELETE"}
        )
    }
}

function addHealth(instance){
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    const urlPath = "/health/v1/readers";
    instance.readerHealth = {
        get: (id) => makeRequest(
            {getRequestUrl: () => `${urlPath}/${id}`},
            {method: "GET"}
        ),
        getAll: () => makeRequest(
            {getRequestUrl: () => urlPath},
            {method: "GET"}
        )
    };
    instance.healthEvents = {
        get: (id,body) => makeRequest(
            {getRequestUrl: () => `/health/v1/events`},
            {method: "POST"},
            body
        ),
        getAll: (id,body) => makeRequest(
            {getRequestUrl: () => "/health/v1/events"},
            {method: "POST"},
            body
        )
    };

}
function decorateInstance(instance) {
    addReaderGroups(instance);
    addReaderFeatures(instance);
    addThresholdConfigurations(instance);
    addThresholdAntennaConfigurations(instance);
    addMessageQueues(instance);
    addTransitionItems(instance);
    addSupport(instance);
    addSNMP(instance);
    addHealth(instance);
    return instance;
}

module.exports = function (instance) {
    return decorateInstance(instance);
};