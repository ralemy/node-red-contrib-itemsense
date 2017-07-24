/**
 * Created by ralemy on 7/23/17.
 * decorates instance for functionality not yet implemented.
 */

function addReaderGroups(instance) {
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.readerGroups = {
        getAll: () => makeRequest(
            {getRequestUrl: () => instance.readerDefinitions.model.path + "/groups"},
            {method: "GET", endPoint: "groups"})
    };
    instance.readerGroups.get = instance.readerGroups.getAll.bind(instance.readerGroups);
}

function decorateInstance(instance) {
    addReaderGroups(instance);
    return instance;
}

module.exports = function (instance) {
    return decorateInstance(instance);
};