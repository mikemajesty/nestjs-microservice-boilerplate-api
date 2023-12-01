#!/bin/bash

mongo <<EOF
ddb = db.getSiblingDB('nestjs-microservice')

db.createUser({
  user: 'admin',
  pwd: 'admin',
  roles: [{ role: 'readWrite', db: 'nestjs-microservice' }],
});
EOF
