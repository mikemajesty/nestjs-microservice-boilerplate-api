#!/bin/bash
AUDIT=$(npm audit --omit=dev)

high='high'

case $AUDIT in
  *"$high"*)
    echo "npm high audit"
    exit 1
    ;;
esac

critical='critical'

case $AUDIT in
  *"$critical"*)
    echo "npm critical audit"
    exit 1
    ;;
esac