#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
cd /mnt/c/Users/Asus/Desktop/dev/JunctionXIf
for fname in "first.mp3" "J voice.mp3" "second.mp3" "third.mp3" "forth.mp3" "sixth.mp3" "fifth.mp4"; do
  printf "== %s  " "$fname"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$fname" 2>&1
done
printf "== if-logo.png dims  "
ffprobe -v error -show_entries stream=width,height -of csv=p=0 soft-landing/public/if-logo.png 2>&1
printf "== fifth.mp4 stream  "
ffprobe -v error -select_streams v -show_entries stream=width,height,r_frame_rate,codec_name,duration -of csv=p=0 fifth.mp4 2>&1
