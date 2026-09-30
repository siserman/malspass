#!/usr/bin/env python3
"""
Malspaß — record Klecks's lines with your ElevenLabs voice, on your own computer.

Your API key stays on this machine: the script reads it from the environment
variable ELEVENLABS_API_KEY or asks for it (hidden input), sends it only to
api.elevenlabs.io, and never writes it to disk.

Run it from the repository folder (Python 3.7+, no extra packages):

  python tools/make_voices.py --list-voices             which voices your account has
  python tools/make_voices.py --voice "Laura"           record every line that has no file yet
  python tools/make_voices.py --voice "Laura" --all     re-record everything (replaces old files)
  python tools/make_voices.py --voice "Laura" --only hello,sleepy --lang de

The lines come from js/lines.js. Each recording is saved as audio/<lang>-<key>.mp3,
then audio/clips.js (the app's list of recordings) is rewritten and the offline
cache version in sw.js is bumped, so the iPad picks up the new sound.
If ffmpeg is installed, leading/trailing silence is trimmed and loudness evened out.

Afterwards: parents' area → Testmodus → "Alle Sätze anhören", then commit and
push audio/ and sw.js.
"""
import argparse
import getpass
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINES_JS = ROOT / 'js' / 'lines.js'
AUDIO = ROOT / 'audio'
CLIPS_JS = AUDIO / 'clips.js'
SW_JS = ROOT / 'sw.js'
API = 'https://api.elevenlabs.io'
LANGS = ('de', 'en')


class ApiError(Exception):
    def __init__(self, code, detail):
        super().__init__(f'ElevenLabs error {code}: {detail}')
        self.code = code


def load_lines():
    text = LINES_JS.read_text(encoding='utf-8')
    m = re.search(r'/\* LINES-JSON \*/(.*?)/\* /LINES-JSON \*/', text, re.S)
    if not m:
        sys.exit('js/lines.js: could not find the LINES-JSON block.')
    return json.loads(m.group(1))


def write_text(path, text):
    # always LF, also on Windows
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def request(path, key, body=None, query=None, accept='application/json'):
    url = API + path + ('?' + urllib.parse.urlencode(query) if query else '')
    data = None if body is None else json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST' if data else 'GET', headers={
        'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': accept})
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return res.read()
    except urllib.error.HTTPError as err:
        raise ApiError(err.code, err.read().decode('utf-8', 'replace')[:400])
    except urllib.error.URLError as err:
        sys.exit(f'Could not reach ElevenLabs: {err.reason}')


def call(fn, *args):
    """Retry briefly on rate limits and server hiccups; explain the common errors."""
    for attempt in range(4):
        try:
            return fn(*args)
        except ApiError as err:
            if err.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(3 * (attempt + 1))
                continue
            if err.code == 401:
                sys.exit('ElevenLabs does not accept this API key (401).')
            sys.exit(str(err))


def list_voices(key):
    return json.loads(request('/v1/voices', key))['voices']


def pick_voice(voices, wanted):
    for v in voices:
        if v['voice_id'] == wanted:
            return v
    low = wanted.lower()
    found = [v for v in voices if v['name'].lower() == low] or \
            [v for v in voices if v['name'].lower().startswith(low)]
    if not found:
        sys.exit(f'No voice called "{wanted}" in your account. Try --list-voices.')
    return found[0]


def tts(key, voice_id, text, args, lang):
    settings = {'stability': args.stability, 'similarity_boost': args.similarity,
                'style': args.style, 'use_speaker_boost': True}
    if args.speed:
        settings['speed'] = args.speed
    body = {'text': text, 'model_id': args.model, 'voice_settings': settings}
    if args.language_code:
        body['language_code'] = lang
    return request(f'/v1/text-to-speech/{voice_id}', key, body, {'output_format': args.format}, 'audio/mpeg')


def polish(path):
    """Trim silence at both ends, even out loudness, mono 64 kbit/s (needs ffmpeg)."""
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        return False
    tmp = path.with_name(path.stem + '.tmp.mp3')
    head = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05'
    tail = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12'
    chain = f'{head},areverse,{tail},areverse,loudnorm=I=-16:TP=-1.5:LRA=11'
    result = subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', str(path), '-af', chain,
                             '-ac', '1', '-ar', '44100', '-b:a', '64k', str(tmp)])
    if result.returncode != 0 or not tmp.exists():
        if tmp.exists():
            tmp.unlink()
        return False
    tmp.replace(path)
    return True


def write_clips():
    clips = {lang: [] for lang in LANGS}
    for f in sorted(AUDIO.glob('*.mp3')):
        m = re.match(r'^(de|en)-([A-Za-z0-9_]+)\.mp3$', f.name)
        if m:
            clips[m.group(1)].append(m.group(2))
    write_text(CLIPS_JS, '/* Recorded clips in audio/ — generated by tools/make_voices.py, do not edit by hand. */\n'
                         'self.MAL_CLIPS = ' + json.dumps(clips, indent=2) + ';\n')
    return clips


def bump_cache():
    text = SW_JS.read_text(encoding='utf-8')
    m = re.search(r"var CACHE = 'malspass-v(\d+)';", text)
    if not m:
        return None
    n = int(m.group(1)) + 1
    write_text(SW_JS, text.replace(m.group(0), f"var CACHE = 'malspass-v{n}';", 1))
    return n


def main():
    try:
        sys.stdout.reconfigure(errors='replace')
    except AttributeError:
        pass
    p = argparse.ArgumentParser(description="Record Klecks's lines with ElevenLabs (runs on your computer).")
    p.add_argument('--voice', help='voice name or id, for both languages')
    p.add_argument('--voice-de', help='voice for German (default: --voice)')
    p.add_argument('--voice-en', help='voice for English (default: --voice)')
    p.add_argument('--lang', default='de,en', help='languages to record (default: de,en)')
    p.add_argument('--only', help='comma-separated keys, e.g. hello,sleepy (recorded even if a file exists)')
    p.add_argument('--all', action='store_true', help='re-record every line, replacing existing files')
    p.add_argument('--model', default='eleven_multilingual_v2', help='ElevenLabs model id (default: eleven_multilingual_v2)')
    p.add_argument('--stability', type=float, default=0.5, help='voice stability 0–1 (default 0.5)')
    p.add_argument('--similarity', type=float, default=0.8, help='similarity boost 0–1 (default 0.8)')
    p.add_argument('--style', type=float, default=0.0, help='style exaggeration 0–1 (default 0)')
    p.add_argument('--speed', type=float, help='speaking speed, e.g. 0.9 = a little slower (if your model supports it)')
    p.add_argument('--language-code', action='store_true',
                   help='send the language to the model (only some models accept this, e.g. eleven_turbo_v2_5)')
    p.add_argument('--format', default='mp3_44100_128', help='ElevenLabs output format (default: mp3_44100_128)')
    p.add_argument('--no-ffmpeg', action='store_true', help='keep the raw ElevenLabs files')
    p.add_argument('--list-voices', action='store_true', help='show the voices in your account and stop')
    p.add_argument('--dry-run', action='store_true', help='only show what would be recorded')
    p.add_argument('--yes', action='store_true', help="don't ask before recording")
    args = p.parse_args()

    lines = load_lines()
    langs = [lang.strip() for lang in args.lang.split(',') if lang.strip()]
    unknown_langs = [lang for lang in langs if lang not in LANGS]
    if unknown_langs:
        sys.exit('Unknown language: ' + ', '.join(unknown_langs))
    keys = [k.strip() for k in args.only.split(',') if k.strip()] if args.only else list(lines)
    unknown_keys = [k for k in keys if k not in lines]
    if unknown_keys:
        sys.exit('Not in js/lines.js: ' + ', '.join(unknown_keys))

    jobs = []
    for lang in langs:
        for k in keys:
            out = AUDIO / f'{lang}-{k}.mp3'
            if out.exists() and not (args.all or args.only):
                continue
            jobs.append((lang, k, lines[k][lang], out))

    if not args.list_voices:
        if not jobs:
            write_clips()
            print('Nothing to record: every line already has a file. Use --all or --only to re-record.')
            return
        print(f'{len(jobs)} recordings, {sum(len(t) for _, _, t, _ in jobs)} characters:')
        for lang, k, text, out in jobs:
            print(f'  {out.name:<26} {text}')
        if args.dry_run:
            return

    key = os.environ.get('ELEVENLABS_API_KEY', '').strip() or \
        getpass.getpass('ElevenLabs API key (hidden, not saved): ').strip()
    if not key:
        sys.exit('No API key given.')
    voices = call(list_voices, key)

    if args.list_voices:
        for v in voices:
            print(f"  {v['name']:<30} {v['voice_id']}  {v.get('category', '')}")
        return

    voice_for = {}
    for lang in langs:
        wanted = getattr(args, f'voice_{lang}') or args.voice
        if not wanted:
            sys.exit('Choose a voice: --voice "Name" (see --list-voices).')
        voice_for[lang] = pick_voice(voices, wanted)
        print(f'{lang}: {voice_for[lang]["name"]} ({voice_for[lang]["voice_id"]})')
    if not args.yes and input('Record now? [y/N] ').strip().lower() not in ('y', 'yes', 'j', 'ja'):
        return

    AUDIO.mkdir(exist_ok=True)
    has_ffmpeg = bool(shutil.which('ffmpeg')) and not args.no_ffmpeg
    for i, (lang, k, text, out) in enumerate(jobs, 1):
        audio = call(tts, key, voice_for[lang]['voice_id'], text, args, lang)
        out.write_bytes(audio)
        tidy = polish(out) if has_ffmpeg else False
        print(f'  [{i}/{len(jobs)}] {out.name}' + ('' if tidy or not has_ffmpeg else '  (ffmpeg failed, kept raw)'))

    clips = write_clips()
    version = bump_cache()
    print(f'\nDone. {sum(len(v) for v in clips.values())} recordings listed in audio/clips.js'
          + (f', offline cache is now malspass-v{version}.' if version else '.'))
    if not has_ffmpeg and not args.no_ffmpeg:
        print('Tip: with ffmpeg installed, silence gets trimmed and loudness evened out.')
    print('Next: listen in the app (parents\' area → Testmodus → "Alle Sätze anhören"), then commit and push audio/ and sw.js.')


if __name__ == '__main__':
    main()
