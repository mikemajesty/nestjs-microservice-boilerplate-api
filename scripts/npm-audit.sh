#!/bin/bash
AUDIT=$(npm audit --omit=dev)

high='high'

case $AUDIT in
  *"$high"*)
    echo ""
    echo  "\033[0;31mnpm high audit"
    echo ""
    exit 1
    ;;
esac

critical='critical'

case $AUDIT in
  *"$critical"*)
    echo ""
    echo "\033[0;31mnpm critical audit"
    echo ""
    exit 1
    ;;
esac