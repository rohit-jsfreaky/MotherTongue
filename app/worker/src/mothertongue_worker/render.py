"""Stage 4 — render: the scenes + the new voice + the music bed + on-screen text + subtitles -> MP4 and SRT (FFmpeg, CPU)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .languages import Language
from .media import run_ffmpeg_locked

FONTS_DIR = Path(__file__).resolve().parents[2] / "fonts"


def _ass_colour(hex_rgb: str, alpha: int = 0) -> str:
    h = hex_rgb.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper()


def _ts(t: float) -> str:
    t = max(0.0, t)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _srt_ts(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", "(").replace("}", ")").replace("\n", "\\N")


def build_ass(master: dict[str, Any], lines: list[dict[str, Any]], voices: dict[str, dict[str, Any]],
              placement: dict[str, str], lang: Language, legal: str | None) -> str:
    w, h = master["canvas"]["w"], master["canvas"]["h"]
    colours = master["brand"].get("colours", {})
    accent = _ass_colour(colours.get("accent", "#F2B33D"))
    ink = _ass_colour(colours.get("ink", "#1B1B1B"))
    white, black = _ass_colour("#FFFFFF"), _ass_colour("#000000")
    shade = _ass_colour("#000000", 0x70)
    font = lang.font
    big, mid, small = round(h * 0.052), round(h * 0.034), round(h * 0.019)
    styles = [
        # name, size, primary, outline, back, bold, borderstyle, outline px, shadow, align, marginV
        ("Headline", big, white, black, shade, -1, 1, 0, 2, 8, round(h * 0.17)),
        ("Card", round(big * 1.05), ink, accent, accent, -1, 4, round(h * 0.014), 0, 2, round(h * 0.30)),
        ("Caption", mid, white, shade, shade, 0, 4, round(h * 0.008), 0, 2, round(h * 0.12)),
        ("Legal", small, white, black, shade, 0, 1, 1, 0, 2, round(h * 0.035)),
    ]
    out = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {w}", f"PlayResY: {h}", "WrapStyle: 0",
        "ScaledBorderAndShadow: yes", "", "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
        "MarginR, MarginV, Encoding",
    ]
    for name, size, prim, outl, back, bold, bstyle, opx, shadow, align, mv in styles:
        out.append(f"Style: {name},{font},{size},{prim},{prim},{outl},{back},{bold},0,0,0,100,100,0,0,{bstyle},"
                   f"{opx},{shadow},{align},{round(w * 0.08)},{round(w * 0.08)},{mv},1")
    out += ["", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    by_scene = {ln["scene"]: ln for ln in lines}
    align_for = {"top": (8, round(h * 0.17)), "middle": (5, 0), "bottom": (2, round(h * 0.30))}
    for s in master["scenes"]:
        ln = by_scene[s["id"]]
        start, end = float(s["start"]), float(s["end"])
        screen = ln.get("screen_filled", "")
        if screen:
            style = "Card" if s.get("role") in ("price", "offer") else "Headline"
            align, mv = align_for[placement.get(s["id"], "top")]
            out.append(f"Dialogue: 1,{_ts(start + 0.1)},{_ts(end - 0.05)},{style},,0,0,{mv},,"
                       f"{{\\an{align}\\fad(180,120)}}{_esc(screen)}")
        v = voices.get(s["id"])
        if v:
            out.append(f"Dialogue: 0,{_ts(v['start'])},{_ts(min(end, v['start'] + v['seconds'] + 0.2))},Caption,,0,0,0,,"
                       f"{_esc(v['text'])}")
    if legal:
        last = master["scenes"][-1]
        out.append(f"Dialogue: 2,{_ts(float(last['start']))},{_ts(float(last['end']))},Legal,,0,0,0,,{_esc(legal)}")
    return "\n".join(out) + "\n"


def build_srt(master: dict[str, Any], voices: dict[str, dict[str, Any]]) -> str:
    blocks = []
    for i, s in enumerate(master["scenes"], 1):
        v = voices.get(s["id"])
        if v:
            blocks.append(f"{i}\n{_srt_ts(v['start'])} --> {_srt_ts(min(float(s['end']), v['start'] + v['seconds'] + 0.2))}"
                          f"\n{v['text']}\n")
    return "\n".join(blocks)


async def render(master: dict[str, Any], assets_dir: Path, out_dir: Path, ass_text: str,
                 voices: dict[str, dict[str, Any]], threads: int) -> Path:
    w, h, fps = master["canvas"]["w"], master["canvas"]["h"], master["canvas"].get("fps", 30)
    total = float(master["scenes"][-1]["end"])
    ass_path = out_dir / "overlay.ass"
    ass_path.write_text(ass_text, encoding="utf-8")
    args: list[str] = []
    vf: list[str] = []
    for i, s in enumerate(master["scenes"]):
        dur = float(s["end"]) - float(s["start"])
        args += ["-ss", f"{float(s.get('clip_in', 0)):.2f}", "-t", f"{dur:.3f}", "-i", str(assets_dir / s["clip"])]
        vf.append(f"[{i}:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={fps},"
                  f"setsar=1,format=yuv420p,trim=duration={dur:.3f},setpts=PTS-STARTPTS[v{i}]")
    n = len(master["scenes"])
    vf.append("".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[base]")
    # libass needs forward slashes and escaped drive colons inside a filter graph.
    ass_arg = ass_path.as_posix().replace(":", "\\:")
    fonts_arg = FONTS_DIR.as_posix().replace(":", "\\:")
    vf.append(f"[base]ass='{ass_arg}':fontsdir='{fonts_arg}'[vout]")

    idx = n
    voice_labels = []
    for sid, v in voices.items():
        args += ["-i", v["path"]]
        ms = int(v["start"] * 1000)
        vf.append(f"[{idx}:a]aresample=48000,adelay={ms}|{ms},apad[a{idx}]")
        voice_labels.append(f"[a{idx}]")
        idx += 1
    vf.append("".join(voice_labels) + f"amix=inputs={len(voice_labels)}:normalize=0:duration=longest,"
              f"atrim=duration={total:.3f}[voice]")
    music = master.get("music")
    if music:
        args += ["-stream_loop", "-1", "-i", str(assets_dir / music)]
        vf.append("[voice]asplit=2[vmix][vkey]")
        vf.append(f"[{idx}:a]aresample=48000,atrim=duration={total:.3f},volume={master.get('music_volume', 0.35)},"
                  f"afade=t=out:st={total - 1.2:.2f}:d=1.2[mus]")
        vf.append("[mus][vkey]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck]")
        vf.append("[vmix][duck]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,"
                  "aresample=48000[aout]")
    else:
        vf.append("[voice]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
    mp4 = out_dir / "version.mp4"
    args += ["-filter_complex", ";".join(vf), "-map", "[vout]", "-map", "[aout]",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", f"{total:.3f}",
             "-threads", str(threads), "-filter_complex_threads", str(threads), str(mp4)]
    await run_ffmpeg_locked(args)
    return mp4
