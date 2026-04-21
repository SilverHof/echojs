#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir("/home/jombozana/Desktop/Frontend/echojs/packages/echojs-http")

result = subprocess.run(
    ["bun", "test", "--run"],
    capture_output=True,
    text=True,
    timeout=120
)

print("STDOUT:")
print(result.stdout)
print("\nSTDERR:")
print(result.stderr)
print(f"\nEXIT CODE: {result.returncode}")
