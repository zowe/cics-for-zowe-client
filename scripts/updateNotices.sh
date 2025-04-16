#!/usr/bin/env bash

# Temporarily remove monorepo structure
mv package.json _package.json && mv package-lock.json _package-lock.json

# Generate VSCE NOTICE
cd packages/vsce && npm install
npx @houdiniproject/noticeme -u

# Generate CLI NOTICE
cd ../cli && npm install
npx @houdiniproject/noticeme -u

# Generate SDK NOTICE
cd ../sdk && npm install
npx @houdiniproject/noticeme -u

# Undo restructure
cd ../..
mv _package.json package.json && mv _package-lock.json package-lock.json
rm packages/*/package-lock.json

# Ensure NOTICE headers are present
npm install && node scripts/updateNoticeHeaders.js
