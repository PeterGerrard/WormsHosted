variable "resource_group_name" {
  type    = string
  default = "worms-hosted"
}

provider "azurerm" {
  version = "2.35.0"
  features {}
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
