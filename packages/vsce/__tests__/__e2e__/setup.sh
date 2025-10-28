
install-extension /config/workspace/dist/`ls -t /config/workspace/dist/ | grep cics-extension-for-zowe | head -n 1` --extensions-dir /config/extensions

mkdir -p /config/data/User
mkdir -p /config/workspace/.vscode

if [ -f "/config/data/User/settings.json" ]; then
  rm /config/data/User/settings.json
fi

cp /config/workspace/globalUserSettings.json /config/data/User/settings.json
cp /config/workspace/workspaceUserSettings.json /config/workspace/.vscode/settings.json
chmod -R 777 /config/data

