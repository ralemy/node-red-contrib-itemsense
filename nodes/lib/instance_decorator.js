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

function addReaderFeatures(instance){
    const makeRequest = instance._itemsenseService.makeRequest.bind(instance._itemsenseService);
    instance.readerFeatures={
        configureFeature:(readerDefinitionName,body) => makeRequest(
            {getRequestUrl:()=> instance.readerDefinitions.model.path + "/" + readerDefinitionName + "/featureChanges"},
            {method:"POST"},
            body
        ),
        getFeatureStatus:(readerDefinitionName,body) => makeRequest(
            {getRequestUrl:()=> instance.readerDefinitions.model.path + "/" + readerDefinitionName + "/featureChanges/" + body.feature},
            {method:"GET"}
        ),
        getActiveFeatureRequestStatus:(readerDefinitionName) => makeRequest(
            {getRequestUrl:()=> instance.readerDefinitions.model.path + "/" + readerDefinitionName + "/featureChanges"},
            {method:"GET"}
        )
    }
}


function decorateInstance(instance) {
    addReaderGroups(instance);
    addReaderFeatures(instance);
    return instance;
}

module.exports = function (instance) {
    return decorateInstance(instance);
};