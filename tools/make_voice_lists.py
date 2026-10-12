#!/usr/bin/env python3
"""
Klecksinger — record the short German words as spoken lists, then cut them apart.

Why: recorded one by one, single words ("Dünn", "Braun", "Weiß") come out with the
voice's English accent, because the model has no context to tell the language from.
Inside a German list they come out German. So each group is recorded as one German
utterance ("Das sind die Farben. … Rot. … Orange. …"), cut at the pauses, and each
word is written to audio/de-<key>.mp3 with the same clean-up as make_voices.py.
A group is only written if the cut finds exactly as many words as expected.

  export ELEVENLABS_API_KEY=…            (or it asks, hidden)
  python tools/make_voice_lists.py               every group
  python tools/make_voice_lists.py colors sizes  only these groups

Use make_voices.py for everything else (sentences are fine on their own), and don't
re-record these keys with make_voices.py --all. Needs ffmpeg. Listen afterwards:
parents' area → Testmodus → "Alle Sätze anhören". Takes vary; if one word comes out
wrong, record its group again and keep the better file.
"""
import getpass
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_voices as mv  # noqa: E402  (shares the API helpers and the clean-up)

VOICE = 'Laura'
GROUPS = {
    'colors': ('Das sind die Farben.', ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white']),
    'shapes': ('Das sind die Formen.', ['circle', 'square', 'triangle', 'star', 'heart', 'flower']),
    'tools':  ('Das ist in meinem Malkasten.', ['tool_paint', 'tool_crayon', 'tool_water', 'tool_marker', 'tool_eraser', 'tool_bucket']),
    'shades': ('So kann man malen.', ['shade_light', 'shade_normal', 'shade_dark']),
    'sizes':  ('Die Pinsel sind dünn, mittel und dick.', ['size_s', 'size_m', 'size_l']),
}
BREAK = ' <break time="1.2s" /> '
SETTINGS = {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.0, 'use_speaker_boost': True, 'speed': 0.9}


def speech_parts(path, noise='-42dB', min_silence=0.45):
    """(start, end) of each spoken part, split at pauses of at least min_silence seconds."""
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af',
                          f'silencedetect=noise={noise}:d={min_silence}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', log).groups()
    end = int(h) * 3600 + int(m) * 60 + float(s)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    parts, t = [], 0.0
    for a, b in zip(starts, ends + [end]):
        if a - t > 0.08:
            parts.append((t, a))
        t = b
    if end - t > 0.08:
        parts.append((t, end))
    return parts


def main():
    names = sys.argv[1:] or list(GROUPS)
    unknown = [n for n in names if n not in GROUPS]
    if unknown:
        sys.exit('Unknown group: ' + ', '.join(unknown) + '. Groups: ' + ', '.join(GROUPS))
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip() or \
        getpass.getpass('ElevenLabs API key (hidden, not saved): ').strip()
    if not key:
        sys.exit('No API key given.')
    lines = mv.load_lines()
    voice = mv.pick_voice(mv.call(mv.list_voices, key), VOICE)['voice_id']
    work = mv.ROOT / 'build' / 'voice-lists'
    work.mkdir(parents=True, exist_ok=True)

    for name in names:
        carrier, keys = GROUPS[name]
        words = [lines[k]['de'] if lines[k]['de'].endswith(('.', '!', '?')) else lines[k]['de'] + '.' for k in keys]
        body = {'text': carrier + BREAK + BREAK.join(words), 'model_id': 'eleven_multilingual_v2', 'voice_settings': SETTINGS}
        src = work / f'{name}.mp3'
        src.write_bytes(mv.call(mv.request, f'/v1/text-to-speech/{voice}', key, body,
                                {'output_format': 'mp3_44100_128'}, 'audio/mpeg'))
        parts = speech_parts(src)
        if len(parts) != len(keys) + 1:
            print(f'{name}: heard {len(parts)} parts, expected {len(keys) + 1}; nothing written (see {src})')
            continue
        for k, (a, b) in zip(keys, parts[1:]):          # parts[0] is the carrier sentence
            out = mv.AUDIO / f'de-{k}.mp3'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-ss', f'{max(0.0, a - 0.06):.3f}',
                            '-to', f'{b + 0.10:.3f}', '-c:a', 'libmp3lame', '-b:a', '128k', str(out)], check=True)
            mv.polish(out)
        print(f'{name}: {len(keys)} words written')

    mv.write_clips()
    version = mv.bump_cache()
    print(f'Offline cache is now {version}.' if version else '')


if __name__ == '__main__':
    main()
