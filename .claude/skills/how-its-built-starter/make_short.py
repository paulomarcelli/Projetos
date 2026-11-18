"""make_short.py: render a basic How It's Built short from videos/<name>/spec.json, then print the readiness report.

    python make_short.py videos/<name>                   # full size: 1080x1920, 30 fps -> videos/<name>/short.mp4
    python make_short.py videos/<name> --fast            # small and quick (360x640, 12 fps), to check the timing
    python make_short.py videos/<name> --stills          # one picture per part -> videos/<name>/stills/
    python make_short.py videos/<name> --voice system    # first records the script with your computer's own voice

Your own recording goes in the video's folder as voice.wav or voice.mp3 (it is used when it is there). Needs Python 3.9+
and Blender 4.2 or newer (free, blender.org). Set BLENDER=<path> if it is installed somewhere unusual.
"""
import glob, json, os, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STUDIO = "in Morrow Studio (skool.com/morrow)"


def find_blender():
    for c in (os.environ.get("BLENDER"), shutil.which("blender"),
              "/Applications/Blender.app/Contents/MacOS/Blender",
              str(Path.home() / "Applications/Blender.app/Contents/MacOS/Blender"),
              *sorted(glob.glob("C:/Program Files/Blender Foundation/Blender*/blender.exe"), reverse=True)):
        if c and Path(c).exists():
            return c
    sys.exit("Blender not found. Install it free from https://www.blender.org/download/ "
             "(or set BLENDER=<path to the Blender program>), then run this again.")


def system_voice(folder, text):
    """Record the script with the computer's built-in voice (free, robotic): macOS say, Windows SAPI, Linux espeak."""
    out = folder / "voice.wav"
    if sys.platform == "darwin":
        cmd = ["say", "-r", "205", "--data-format=LEI16@22050", "-o", str(out), text]
    elif os.name == "nt":
        ps = ("Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
              f"$s.Rate = 1; $s.SetOutputToWaveFile('{out}'); $s.Speak([Console]::In.ReadToEnd()); $s.Dispose()")
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], input=text, text=True, encoding="utf-8", check=True)
        return out
    else:
        cmd = ["espeak-ng" if shutil.which("espeak-ng") else "espeak", "-s", "205", "-w", str(out), text]
    subprocess.run(cmd, check=True)
    return out


def script_facts(lines):
    words = sum(len(line.split()) for line in lines)
    turns = sum(1 for line in lines for s in re.split(r"(?<=[.!?])\s+", line) if re.match(r"but\b", s.strip(), re.I))
    return words, turns


def report(name, spec, r):
    words, turns = script_facts(spec["script"])
    secs = r.get("seconds", 0)
    lines = [
        "",
        f"VIRAL READINESS REPORT: {name}",
        "=" * 60,
        "What the starter made (measured, not scored):",
        f"  - script: {words} words, {turns} 'But... so...' turns",
        f"  - video: {secs:.1f} s, {r.get('size')}, {r.get('fps')} fps, {r.get('parts')} parts, flat look",
        f"  - voice: {r.get('voice') or 'none (captions only)'}; parts timed by {r.get('timing')}",
    ]
    if secs < 61:
        lines.append(f"  - {secs:.1f} s is under 61 s: TikTok's Creator Rewards only pays for videos over a minute")
    if r.get("unmatched"):
        lines.append(f"  - parts whose word is not in the script (placed 2 s after the one before): {', '.join(r['unmatched'])}")
    lines += [
        "",
        "This is a first draft. What it has NOT been through:",
        f"  [ ] Look and polish: lighting, textures, detailed sets, camera moves ............... {STUDIO}",
        f"  [ ] Mistake checks: floating parts, parts off screen or hidden, parts on their word .. {STUDIO}",
        f"  [ ] Sound: a bed, a hit on every arrival, loudness for TikTok / Reels / Shorts ........ {STUDIO}",
        f"  [ ] Thumbnail / cover ................................................................. {STUDIO}",
        f"  [ ] Review against a viral video you pick, before you post ............................ {STUDIO}",
        f"  [ ] Tested subjects: which subjects already won in this format ........................ {STUDIO}",
        "",
        "No score: none of the checks above ran, so nothing here says whether this video can go viral.",
        "=" * 60,
    ]
    return "\n".join(lines)


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("-"):
        sys.exit(__doc__)
    folder = Path(args[0]).resolve()
    spec = json.loads((folder / "spec.json").read_text(encoding="utf-8"))
    if "--voice" in args and args[args.index("--voice") + 1:][:1] == ["system"]:
        if not any((folder / n).exists() for n in ("voice.wav", "voice.mp3", "voice.m4a")):
            print("Recording the script with this computer's own voice...")
            system_voice(folder, " ".join(spec["script"]))
    flags = [f for f in ("--fast", "--stills") if f in args]
    cmd = [find_blender(), "-b", "--factory-startup", "-P", str(HERE / "scene.py"), "--", str(folder), *flags]
    print("Rendering in Blender" + (" (stills)" if "--stills" in flags else "") + "... this can take a few minutes.")
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    done = [line for line in p.stdout.splitlines() if line.startswith("STARTER_DONE ")]
    if p.returncode != 0 or not done:
        print("\n".join((p.stdout + p.stderr).splitlines()[-25:]))
        sys.exit("Blender stopped before the end (the lines above say why).")
    r = json.loads(done[-1][len("STARTER_DONE "):])
    if "--stills" in flags:
        print(f"{r.get('stills', 0)} stills -> {folder / 'stills'}")
        if r.get("unmatched"):
            print("Parts whose word is not in the script:", ", ".join(r["unmatched"]))
        return
    print(f"Video -> {folder / 'short.mp4'}")
    text = report(folder.name, spec, r)
    (folder / "readiness.txt").write_text(text.strip() + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
