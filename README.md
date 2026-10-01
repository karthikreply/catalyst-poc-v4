# Catalyst POC

A clickable, white-labeled demo for a partner-led AI value-discovery session with Heartland Mutual Insurance.

## Run locally

```bash
git checkout cursor/catalyst-poc-31d3
npm install
npm run dev
```

For an uncommon port:

```bash
npm run dev -- --hostname 0.0.0.0 --port 43127
```

Production start (binds `0.0.0.0` and honours `PORT`, default `8080`):

```bash
npm run build
npm start
```

## Host on Azure App Service

Linux, Node 22, `next start`. No WSL. This VM cannot deploy for you until Azure secrets are present; run the script from **Azure Cloud Shell** or from Windows after `az login`.

Placeholders you must fill in (do not commit secrets):

| Variable | Meaning |
|---|---|
| `AZURE_SUBSCRIPTION_ID` | Target subscription |
| `AZURE_RESOURCE_GROUP` | Resource group (created if missing). Default `rg-catalyst-poc` |
| `AZURE_LOCATION` | Region. Default `uksouth` |
| `AZURE_APP_NAME` | Globally unique web app name (required) |
| `AZURE_PLAN_NAME` | App Service plan name. Default `<app>-plan` |
| `AZURE_SKU` | Plan SKU. Default `B1` |

### Azure Cloud Shell (bash)

Upload or clone this repository, then:

```bash
git checkout cursor/catalyst-poc-31d3
export AZURE_SUBSCRIPTION_ID="<subscription-id>"
export AZURE_RESOURCE_GROUP="rg-catalyst-poc"
export AZURE_LOCATION="uksouth"
export AZURE_APP_NAME="<globally-unique-name>"
bash scripts/azure-deploy.sh
```

The script creates the resource group, Linux App Service plan, Node 22 web app, zip-deploys this repo, and prints `https://<app>.azurewebsites.net`. First boot runs `npm ci` and `npm run build` on App Service (Oryx); wait a few minutes before opening the URL.

### Windows PowerShell (no WSL)

Install [Azure CLI](https://aka.ms/installazurecliwindows), open PowerShell, then:

```powershell
az login
git checkout cursor/catalyst-poc-31d3
$env:AZURE_SUBSCRIPTION_ID = "<subscription-id>"
$env:AZURE_RESOURCE_GROUP = "rg-catalyst-poc"
$env:AZURE_LOCATION = "uksouth"
$env:AZURE_APP_NAME = "<globally-unique-name>"
powershell -ExecutionPolicy Bypass -File scripts/azure-deploy.ps1
```

### Docker (optional)

```bash
docker build -t catalyst-poc .
docker run --rm -p 8080:8080 catalyst-poc
```

The same image can be pushed to Azure Container Registry and configured on the web app later; the scripts above deploy source zip + Oryx instead, so Cloud Shell does not need ACR.

## Checks

```bash
npm test
npm run lint
npm run build
```
