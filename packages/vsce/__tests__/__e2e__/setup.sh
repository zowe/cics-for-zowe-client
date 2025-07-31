
install-extension /config/workspace/dist/cics-extension-for-zowe-3.*.vsix --extensions-dir /config/extensions

mkdir -p /config/data/User
rm /config/data/User/settings.json || true
cp /config/workspace/globalUserSettings.json /config/data/User/settings.json
chmod -R 777 /config/data

