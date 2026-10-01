# Create Azure App Service (Linux, Node 22) resources and zip-deploy this repo.
# Run from Windows PowerShell 5.1+ or PowerShell 7 after `az login`. No WSL required.
# Does not invent credentials.
[CmdletBinding()]
param(
  [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID,
  [string]$ResourceGroup = $(if ($env:AZURE_RESOURCE_GROUP) { $env:AZURE_RESOURCE_GROUP } else { "rg-catalyst-poc" }),
  [string]$Location = $(if ($env:AZURE_LOCATION) { $env:AZURE_LOCATION } else { "uksouth" }),
  [string]$AppName = $env:AZURE_APP_NAME,
  [string]$PlanName = $env:AZURE_PLAN_NAME,
  [string]$Sku = $(if ($env:AZURE_SKU) { $env:AZURE_SKU } else { "B1" })
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  throw "Azure CLI (az) is not on PATH. Install https://aka.ms/installazurecliwindows then open a new PowerShell window."
}
if ([string]::IsNullOrWhiteSpace($SubscriptionId)) {
  throw "Set -SubscriptionId or env AZURE_SUBSCRIPTION_ID."
}
if ([string]::IsNullOrWhiteSpace($AppName)) {
  throw "Set -AppName or env AZURE_APP_NAME to a globally unique App Service name."
}
if ([string]::IsNullOrWhiteSpace($PlanName)) {
  $PlanName = "$AppName-plan"
}

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

az account set --subscription $SubscriptionId
if ($LASTEXITCODE -ne 0) { throw "az account set failed" }

az group create --name $ResourceGroup --location $Location
if ($LASTEXITCODE -ne 0) { throw "az group create failed" }

az appservice plan create --name $PlanName --resource-group $ResourceGroup --location $Location --sku $Sku --is-linux
if ($LASTEXITCODE -ne 0) { throw "az appservice plan create failed" }

az webapp create --name $AppName --resource-group $ResourceGroup --plan $PlanName --runtime "NODE:22-lts"
if ($LASTEXITCODE -ne 0) { throw "az webapp create failed" }

az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings NODE_ENV=production SCM_DO_BUILD_DURING_DEPLOYMENT=true WEBSITE_NODE_DEFAULT_VERSION=22-lts
if ($LASTEXITCODE -ne 0) { throw "az webapp config appsettings set failed" }

az webapp config set --name $AppName --resource-group $ResourceGroup --startup-file "startup.sh"
if ($LASTEXITCODE -ne 0) { throw "az webapp config set failed" }

$Zip = Join-Path $env:TEMP "catalyst-poc-deploy.zip"
if (Test-Path $Zip) { Remove-Item -Force $Zip }
$Exclude = @("node_modules", ".git", ".next", "coverage")
$Items = Get-ChildItem -Force | Where-Object { $Exclude -notcontains $_.Name }
Compress-Archive -Path $Items.FullName -DestinationPath $Zip -Force

az webapp deploy --name $AppName --resource-group $ResourceGroup --src-path $Zip --type zip --async false
if ($LASTEXITCODE -ne 0) { throw "az webapp deploy failed" }

$HostName = az webapp show --name $AppName --resource-group $ResourceGroup --query defaultHostName -o tsv
Write-Host "Deployed: https://$HostName"
Write-Host "Give Oryx a few minutes to npm ci && npm run build on first deploy."
