variable "resource_group_name" {
  type    = string
  default = "worms-hosted"
}

provider "azurerm" {
  version = "2.35.0"
  features {}
}

provider "github" {
}

terraform {
  backend "azurerm" {
    resource_group_name  = "worms-hosted"
    storage_account_name = "wormshostedtfstate"
    container_name       = "terraform-state"
    key                  = "tfstate"
  }
}

data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

data "azurerm_subscription" "current" {
}

data "github_repository" "worms" {
  full_name = "PeterGerrard/WormsHosted"
}

resource "azurerm_storage_account" "example" {
  name                      = "wormshosted"
  resource_group_name       = data.azurerm_resource_group.rg.name
  location                  = data.azurerm_resource_group.rg.location
  account_tier              = "Standard"
  account_replication_type  = "GRS"
  enable_https_traffic_only = true

  static_website {
    index_document = "index.html"
  }
}

module "service_principal" {
  source  = "innovationnorway/service-principal/azuread"
  version = "3.0.0-alpha.1"
  name    = "github-worms-controller"
  years   = 1
  role    = "Contributor"
  scopes  = [data.azurerm_resource_group.rg.id]
}

resource "azurerm_role_assignment" "data-contributor-role" {
  scope                = azurerm_storage_account.example.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = module.service_principal.object_id
}

data "github_actions_public_key" "example_public_key" {
  repository = data.github_repository.worms.name
}

resource "github_actions_secret" "deploy_secret" {
  repository      = data.github_repository.worms.name
  secret_name     = "AZURE_CREDENTIALS"
  plaintext_value = <<EOF
{
  "clientId": "${module.service_principal.client_id}",
  "clientSecret": "${module.service_principal.client_secret}",
  "subscriptionId": "${data.azurerm_subscription.current.subscription_id}",
  "tenantId": "${module.service_principal.tenant_id}"
}
EOF
}

resource "azurerm_app_service_plan" "example" {
  name                = "azure-functions-consumption-plan"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  kind                = "FunctionApp"

  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_function_app" "example" {
  name                       = "wormshosted-add-game"
  location                   = data.azurerm_resource_group.rg.location
  resource_group_name        = data.azurerm_resource_group.rg.name
  app_service_plan_id        = azurerm_app_service_plan.example.id
  storage_account_name       = azurerm_storage_account.example.name
  storage_account_access_key = azurerm_storage_account.example.primary_access_key
}