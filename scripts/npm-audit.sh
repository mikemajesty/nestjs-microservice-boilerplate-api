#!/bin/bash
AUDIT=$(npm audit --omit=dev)

SUB='high'

case $AUDIT in
  *"$SUB"*)
    exit 1
    ;;
esac

SUB2='critical'

case $AUDIT in
  *"$SUB2"*)
    exit 1
    ;;
esac