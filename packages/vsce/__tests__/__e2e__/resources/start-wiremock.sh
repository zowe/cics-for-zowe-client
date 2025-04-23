if [ -z "$1" ]; then
  echo "No directory provided. Please provide a directory for WireMock mappings."
  exit 1
fi

docker run -it --rm -d \
    -p 8080:8080 \
    --name wiremock \
    -v "$1" \
    wiremock/wiremock:latest

sleep 1

docker ps

sleep 2

curl http://localhost:8080/__admin/mappings