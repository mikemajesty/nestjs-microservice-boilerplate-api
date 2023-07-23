#!/bin/bash
AUDIT=$(npm audit --omit=dev)

high='high'
RED= '\033[0;31m' 
case $AUDIT in
  *"$high"*)
    echo -e "${RED}npm high audit"
    exit 1
    ;;
esac

critical='critical'

case $AUDIT in
  *"$critical"*)
    echo -e "${RED}npm critical audit"
    exit 1
    ;;
esac