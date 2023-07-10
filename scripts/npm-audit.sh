#!/bin/bash
AUDIT=$(npm audit --omit=dev)

high='high'

case $AUDIT in
  *"$high"*)
    exit 1
    ;;
esac

critical='critical'

case $AUDIT in
  *"$critical"*)
    exit 1
    ;;
esac