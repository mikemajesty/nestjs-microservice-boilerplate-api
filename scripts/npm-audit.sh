#!/bin/bash
AUDIT=$(npm audit --omit=dev)

SUB='high'

case $AUDIT in
  *"$SUB"*)
    exit 1
    ;;
esac