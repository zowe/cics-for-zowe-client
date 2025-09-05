
install-extension /config/workspace/dist/cics-extension-for-zowe-3.*.vsix --extensions-dir /config/extensions

mkdir -p /config/data/User

if [ -f "/config/data/User/settings.json" ]; then
  rm /config/data/User/settings.json
fi

cp /config/workspace/globalUserSettings.json /config/data/User/settings.json
chmod -R 777 /config/data

