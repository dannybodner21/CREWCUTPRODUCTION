#!/bin/bash

curl -s "https://www.crewcut.agency/api/lewis" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"calculateFees","params":{"jurisdictionName":"San Diego","stateCode":"CA","selectedServiceAreaIds":[],"projectType":"Residential","useSubtype":"Multifamily","numUnits":50,"squareFeet":50000}}' \
  | jq '.data.fees[] | select(.feeName | contains("Monthly")) | {feeName, calculatedAmount, isRecurring}'
