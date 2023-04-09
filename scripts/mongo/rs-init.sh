#!/bin/bash

mongo <<EOF
var config = {
    "_id": "app",
    "version": 1,
    "members": [
        {
            "_id": 1,
            "host": "10.5.0.5:27017",
            "priority": 3
        },
        {
            "_id": 2,
            "host": "10.5.0.6:27017",
            "priority": 2
        },
        {
            "_id": 3,
            "host": "10.5.0.7:27017",
            "priority": 1
        }
    ]
};
rs.initiate(config, { force: true });
rs.status();
EOF
