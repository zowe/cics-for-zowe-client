if [ -z "$1" ]; then
  echo "No directory provided. Please provide a directory for WireMock mappings."
  exit 1
fi

docker run -it --rm -d \
    -p 8080:8080 \
    --name wiremock \
    -v "$1" \
    wiremock/wiremock:latest

sleep 2

echo "Starting wire mock"

docker ps

sleep 2