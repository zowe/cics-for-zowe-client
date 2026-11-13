#!/usr/bin/env bash

# Generate VSCE NOTICE
cd packages/vsce
pnpm dlx @houdiniproject/noticeme -u

# Generate CLI NOTICE
cd ../cli
pnpm dlx @houdiniproject/noticeme -u

# Generate SDK NOTICE
cd ../sdk
pnpm dlx @houdiniproject/noticeme -u

# Return to root and ensure NOTICE headers are present
cd ../..
pnpm install && node scripts/updateNoticeHeaders.js
