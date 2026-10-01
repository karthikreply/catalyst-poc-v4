#!/bin/sh
# Azure App Service Linux / Docker entrypoint. Honours PORT (App Service sets it).
exec node scripts/start-production.mjs
