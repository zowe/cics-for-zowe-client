docker run -it --rm -d \
  -p 8080:8080 \
  --name cmci-wiremock \
  -v ./mappings:/home/wiremock/mappings \
  -v ./__files:/home/wiremock/__files \
  wiremock/wiremock:3.10.0

sleep 1

docker ps

sleep 2

curl http://localhost:8080/__admin/mappings