#!/bin/bash

npm prune --production
zip -r deploy.zip * && \
  az functionapp deployment source config-zip --subscription "CDA Global Demos" --resource-group "brhugh-led" -n "brhugh-led-function-app" --src ./deploy.zip
rm ./deploy.zip
npm install
