// Composer: encode per-scene videos, mux per-scene audio, concat with crossfades.
// Run: node compose.cjs
const { execFileSync } = require("child_process");
const ffmpeg = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const FPS = 30;
const ASSETS = path.join(ROOT, "..", "soft-landing", "public", "assets");
const VO = path.join(ROOT, "build", "vo");
const FRAMES = path.join(ROOT, "build", "frames");
const OUT = path.join(ROOT, "build", "scenes");
const FINAL = path.join(ROOT, "build", "final");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FINAL, { recursive: true });

const FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf";
if (!fs.existsSync(FONT_BOLD)) throw new Error("font missing: " + FONT_BOLD);

function run(args, label) {
  console.log(">>", label || args[0]);
  execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "inherit"] });
}

// ---- 1. scenes from PNG frames ----
function framesVideo(scene, duration, outName) {
  const out = path.join(OUT, outName);
  run(["-y",
    "-framerate", String(FPS), "-i", path.join(FRAMES, scene, "%05d.png"),
    "-t", String(duration),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p", "-r", String(FPS), out], outName + " (video)");
  return out;
}

// ---- 2. audio helpers ----
function muxAudio(videoIn, filterComplex, audioMaps, outName, extraInputs) {
  const out = path.join(OUT, outName);
  const args = ["-y", "-i", videoIn];
  (extraInputs || []).forEach((a) => args.push("-i", a));
  args.push(
    "-filter_complex", filterComplex,
    "-map", "0:v:0", ...audioMaps,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-shortest", out);
  run(args, outName + " (audio)");
  return out;
}

const scene1 = framesVideo("scene1", 13, "s1_v.mp4");
const s1 = muxAudio(scene1,
  "[1:a]atrim=0:13,asetpts=PTS-STARTPTS[m];" +
  "[2:a]adelay=6000|6000[j];" +
  "[m][j]amix=inputs=2:duration=first:normalize=0[a]",
  ["-map", "[a]"], "s1.mp4", [path.join(ASSETS, "first.mp3"), path.join(ASSETS, "J voice.mp3")]);

const scene2 = framesVideo("scene2", 30, "s2_v.mp4");
const s2 = muxAudio(scene2,
  "[1:a]atrim=0:30,asetpts=PTS-STARTPTS," +
  "volume=volume='if(lt(t,2),1-0.85*(t/2),0.15)':eval=frame[m];" +
  "[2:a]adelay=6000|6000[j];" +
  "[m][j]amix=inputs=2:duration=first:normalize=0[a]",
  ["-map", "[a]"], "s2.mp4", [path.join(ASSETS, "second.mp3"), path.join(VO, "vo_scene2.mp3")]);

const scene3 = framesVideo("scene3", 13, "s3_v.mp4");
const s3 = muxAudio(scene3,
  "[1:a]atrim=0:8,asetpts=PTS-STARTPTS[m];" +
  "[2:a]adelay=8000|8000[j];" +
  "[m][j]amix=inputs=2:duration=longest:normalize=0,apad[a]",
  ["-map", "[a]"], "s3.mp4", [path.join(ASSETS, "third.mp3"), path.join(VO, "vo_scream.mp3")]);

const scene4 = framesVideo("scene4", 7, "s4_v.mp4");
const s4 = muxAudio(scene4,
  "[1:a]atrim=0:7,asetpts=PTS-STARTPTS[a]",
  ["-map", "[a]"], "s4.mp4", [path.join(ASSETS, "forth.mp3")]);

const blackV = framesVideo("black", 4, "b_v.mp4");
const b = muxAudio(blackV,
  "[1:a]adelay=500|500,apad[j]",
  ["-map", "[j]"], "b.mp4", [path.join(VO, "vo_interlude.mp3")]);

// ---- 3. scene 5: fifth.mp4 + logo + "Get a life.. Insurance." ----
const s5 = path.join(OUT, "s5.mp4");
run(["-y",
  "-t", "20", "-i", path.join(ASSETS, "fifth.mp4"),
  "-i", path.join(ROOT, "build", "if-logo.png"),
  "-filter_complex",
  "[0:v]scale=-2:1080,pad=1920:1080:(ow-iw)/2:0,setsar=1[bg];" +
  "[bg][1:v]overlay=W-w-60:60[v1];" +
  "[v1]drawtext=fontfile='" + FONT_BOLD.replace(/:/g, "\\:") + "':" +
    "text='Get a life..':fontsize=120:fontcolor=white:borderw=8:bordercolor=black@0.35:" +
    "x=(w-text_w)/2:y=90:enable='between(t,2,4.97)'[v2];" +
  "[v2]drawtext=fontfile='" + FONT_BOLD.replace(/:/g, "\\:") + "':" +
    "text='Get a life.. Insurance.':fontsize=120:fontcolor=white:borderw=8:bordercolor=black@0.35:" +
    "x=(w-text_w)/2:y=90:enable='gte(t,4.97)'[v]",
  "-map", "[v]", "-map", "0:a:0",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18",
  "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-t", "20", s5], "s5.mp4 (overlay)");

// ---- 4. scene 6: frames + sixth.mp3 (7s..23s = 16s) ----
const scene6 = framesVideo("scene6", 16, "s6_v.mp4");
const s6 = muxAudio(scene6,
  "[1:a]atrim=7:23,asetpts=PTS-STARTPTS[a]",
  ["-map", "[a]"], "s6.mp4", [path.join(ASSETS, "sixth.mp3")]);

// ---- 5. concat with 0.5s crossfades ----
const clips = [
  { file: s1, d: 13 },
  { file: s2, d: 30 },
  { file: s3, d: 13 },
  { file: s4, d: 7 },
  { file: b, d: 4 },
  { file: s5, d: 20 },
  { file: s6, d: 16 },
];
const T = 0.5;
let args = ["-y"];
clips.forEach((c) => { args.push("-i", c.file); });
let fc = [];
// video chain
let prevV = "[0:v]", acc = clips[0].d;
for (let i = 1; i < clips.length; i++) {
  const outV = i === clips.length - 1 ? "[vF]" : `[vx${i}]`;
  fc.push(`${prevV}[${i}:v]xfade=transition=fade:duration=${T}:offset=${(acc - T).toFixed(3)}${outV}`);
  prevV = outV;
  acc = acc + clips[i].d - T;
}
// audio chain
let prevA = "[0:a]";
for (let i = 1; i < clips.length; i++) {
  const outA = i === clips.length - 1 ? "[aF]" : `[ax${i}]`;
  fc.push(`${prevA}[${i}:a]acrossfade=d=${T}:c1=tri:c2=tri${outA}`);
  prevA = outA;
}
args.push("-filter_complex", fc.join(";"), "-map", "[vF]", "-map", "[aF]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  path.join(FINAL, "demo-showcase.mp4"));
run(args, "FINAL concat");

console.log("FINAL:", path.join(FINAL, "demo-showcase.mp4"), "expected ~" + acc.toFixed(1) + "s");
