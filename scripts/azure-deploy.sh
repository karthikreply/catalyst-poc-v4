#!/usr/bin/env bash
# Create Azure App Service (Linux, Node 22) resources and zip-deploy this repo.
# Does not read or invent credentials. Run after `az login` (Cloud Shell is already logged in).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }; }
need az
need zip

SUBSCRIPTION="${AZURE_SUBSCRIPTION_ID:-${1:-}}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-catalyst-poc}"
LOCATION="${AZURE_LOCATION:-uksouth}"
APP_NAME="${AZURE_APP_NAME:-}"
SKU="${AZURE_SKU:-B1}"

if [[ -z "$SUBSCRIPTION" ]]; then
  echo "Set AZURE_SUBSCRIPTION_ID (or pass it as the first argument)." >&2
  exit 1
fi
if [[ -z "$APP_NAME" ]]; then
  echo "Set AZURE_APP_NAME to a globally unique App Service name (letters, numbers, hyphens)." >&2
  exit 1
fi
PLAN_NAME="${AZURE_PLAN_NAME:-$APP_NAME-plan}"

az account set --subscription "$SUBSCRIPTION"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
az appservice plan create \
  --name "$PLAN_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku "$SKU" \
  --is-linux
az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$PLAN_NAME" \
  --runtime "NODE:22-lts"
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    NODE_ENV=production \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    WEBSITE_NODE_DEFAULT_VERSION=22-lts
az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "startup.sh"

ZIP="$(mktemp /tmp/catalyst-poc-XXXX.zip)"
trap 'rm -f "$ZIP"' EXIT
zip -r "$ZIP" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".next/*" \
  -x "coverage/*"

az webapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path "$ZIP" \
  --type zip \
  --async false

HOST="$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query defaultHostName -o tsv)"
echo "Deployed: https://${HOST}"
echo "Give Oryx a few minutes to npm ci && npm run build on first deploy."
