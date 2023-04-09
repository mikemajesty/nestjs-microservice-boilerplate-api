#!/bin/bash

docker-compose down
docker-compose up -d

sleep 20

docker exec nestjs-microservice-primary ./scripts/mongo/rs-init.sh
