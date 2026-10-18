#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
cd /mnt/c/Users/Asus/Desktop/dev/JunctionXIf/video/build/final
mkdir -p tl
for t in 2 12.5 13.5 27 27.9 31 40 49 51.6 52.8 58.5 59.9 64 66.2 66.8 80.5 81.2 84.2 85.5 87 89.5 92.5 96.5 99.5; do
  ffmpeg -loglevel error -ss "$t" -i demo-showcase.mp4 -frames:v 1 -y "tl/f_${t}.jpg"
done
ls tl
