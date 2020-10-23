param location string = resourceGroup().location
param namePrefix string = 'wormshosted'

var storageAccountName = '${namePrefix}${uniqueString(resourceGroup().id)}'

resource stg 'Microsoft.Storage/storageAccounts@2019-06-01' = {
    name: storageAccountName
    location: location
    kind: 'Storage'
    sku: {
        name: 'Standard_LRS'
    }
}

output storageId string = stg.id