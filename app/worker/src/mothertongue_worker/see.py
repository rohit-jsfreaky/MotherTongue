"""Stage 1 — see the ad: Gemma (vision) looks at one frame per scene and tells us what's on screen and where text can go."""

from __future__ import annotations

from typing import Any

from .tf import TokenFactory, image_part

BANDS = ("top", "middle", "bottom")

SYSTEM = """You are the art director on a video ad. You get one frame per scene, in order.
For each frame report, honestly and briefly:
- "text_on_screen": every piece of text you can read in the frame, exactly as written (empty list if none);
- "text_band": where that text sits: "top", "middle", "bottom" or "none";
- "subject": what the main subject or product is, in a few words;
- "subject_band": where the subject mostly is: "top", "middle" or "bottom";
- "free_band": the band ("top", "middle" or "bottom") with the calmest empty space where new text can sit
  without covering the subject or existing text;
- "description": one short sentence describing the shot (what a viewer sees).
Reply as JSON: {"frames": [{"index": 0, "text_on_screen": [], "text_band": "none", "subject": "", "subject_band": "",
"free_band": "", "description": ""}, ...]} with one entry per frame, in the same order."""


async def see_scenes(tf: TokenFactory, frames: list[bytes]) -> list[dict[str, Any]]:
    content: list[dict[str, Any]] = [{"type": "text", "text": f"{len(frames)} frames, one per scene, in order."}]
    for i, jpg in enumerate(frames):
        content.append({"type": "text", "text": f"Frame {i}:"})
        content.append(image_part(jpg))
    data = await tf.chat_json("see", SYSTEM, content, max_tokens=2500, temperature=0.2)
    frames_out = data.get("frames") or []
    result = []
    for i in range(len(frames)):
        f = frames_out[i] if i < len(frames_out) and isinstance(frames_out[i], dict) else {}
        free = f.get("free_band") if f.get("free_band") in BANDS else None
        result.append({
            "text_on_screen": [str(t) for t in (f.get("text_on_screen") or [])],
            "text_band": f.get("text_band") or "none",
            "subject": str(f.get("subject") or ""),
            "subject_band": f.get("subject_band") if f.get("subject_band") in BANDS else None,
            "free_band": free,
            "description": str(f.get("description") or ""),
        })
    return result


def place_text(seen: dict[str, Any], preferred: str | None = None) -> str:
    """Pick the band for this scene's on-screen text: the free band, never on top of the subject."""
    # The template's preference only wins when the frame agrees that band is free (never over the product).
    if preferred in BANDS and preferred != seen.get("subject_band") and seen.get("free_band") in (None, preferred):
        return preferred
    if seen.get("free_band"):
        return seen["free_band"]
    return "top" if seen.get("subject_band") != "top" else "bottom"
