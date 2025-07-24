
curl -fsSL https://code-server.dev/install.sh | sh

code-server --install-extension /config/workspace/dist/cics-extension-for-zowe-3.10.0.vsix --extensions-dir /config/extensions

rm /config/data/User/settings.json || true

mkdir -p /config/data/User
touch /config/data/User/settings.json || true

echo '{"security.workspace.trust.banner": "never","security.workspace.trust.enabled": false,"security.workspace.trust.startupPrompt": "never","security.workspace.trust.untrustedFiles": "open"}' >> /config/data/User/settings.json

sudo chmod -R 777 /config
