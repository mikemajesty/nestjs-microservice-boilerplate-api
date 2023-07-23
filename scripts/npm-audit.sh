#!/bin/bash
AUDIT=$(npm audit --omit=dev)

high='high'

case $AUDIT in
  *"$high"*)
    echo -e "\033[0;31mnpm high audit"
    exit 1
    ;;
esac

critical='critical'

case $AUDIT in
  *"$critical"*)
    echo -e "\033[0;31mnpm critical audit"
    exit 1
    ;;
esac