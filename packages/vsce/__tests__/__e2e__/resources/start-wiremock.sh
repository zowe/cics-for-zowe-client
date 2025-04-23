docker run -it --rm -d \
    -p 8080:8080 \
    --name cmci-wiremock \
    -v "$1"/packages/vsce/__tests__/__e2e__/resources/wiremock:/home/wiremock
    wiremock/wiremock:3.10.0

sleep 1

docker ps

sleep 2

curl http://localhost:8080/__admin/mappings