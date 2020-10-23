param location string = resourceGroup().location
param namePrefix string = 'wormshosted'

var storageAccountName = '${namePrefix}${uniqueString(resourceGroup().id)}'

resource stg 'Microsoft.Storage/storageAccounts@2019-06-01' = {
    name: storageAccountName
    location: location
    kind: 'StorageV2'
    sku: {
        name: 'Standard_LRS'
    }
}

resource webcontainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2020-08-01-preview' = {
    name: '${stg.name}/default/$web'
}

output storageId string = stg.id