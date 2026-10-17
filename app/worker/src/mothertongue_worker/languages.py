"""Languages we offer. Only languages whose voice we tested on OmniVoice are listed (17 Oct: en, hi, it, bn)."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Language:
    code: str
    name: str
    script: str
    font: str
    # Rough speaking rate used to size lines before we hear them; the real length is measured after voicing.
    words_per_second: float
    # Characters that prove the text is in the right script (None = Latin, checked differently).
    script_chars: re.Pattern[str] | None
    # A neutral sentence used once to create the brand's reference voice for this language.
    voice_sample: str


LANGUAGES: dict[str, Language] = {
    "en": Language("en", "English", "Latin", "Hanken Grotesk", 2.6, None,
                   "Hello! This is how our brand sounds. Warm, clear and friendly, every time."),
    "it": Language("it", "Italian", "Latin", "Hanken Grotesk", 2.5, None,
                   "Ciao! Questa è la voce del nostro marchio. Calda, chiara e simpatica, sempre."),
    "hi": Language("hi", "Hindi", "Devanagari", "Noto Sans Devanagari", 2.1, re.compile(r"[ऀ-ॿ]"),
                   "नमस्ते! यह हमारे ब्रांड की आवाज़ है। गर्मजोशी भरी, साफ़ और दोस्ताना, हर बार।"),
    "bn": Language("bn", "Bengali", "Bengali", "Noto Sans Bengali", 1.9, re.compile(r"[ঀ-৿]"),
                   "নমস্কার! এটা আমাদের ব্র্যান্ডের গলা। উষ্ণ, পরিষ্কার আর বন্ধুর মতো, প্রতিবার।"),
}


def get_language(code: str) -> Language:
    try:
        return LANGUAGES[code]
    except KeyError:
        raise ValueError(f"language '{code}' is not offered yet") from None
