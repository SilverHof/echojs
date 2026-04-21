#!/bin/bash
cd /home/jombozana/Desktop/Frontend/echojs/packages/echojs-http
bun test --run 2>&1
echo "Exit code: $?"
