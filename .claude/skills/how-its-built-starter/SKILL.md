---
name: how-its-built-starter
description: Make a first-draft vertical 3D "How It's Built" short in Blender, a cutaway build where every step fixes the last step's problem, written as an "If you… But… So you… This is a…" chain. Free starter skill from Morrow Studio. Use it when the user wants a how-it's-built, build-chain or cutaway 3D short.
---

# How It's Built: the free starter skill

You help a creator make a **first draft** of a vertical 3D "How It's Built" short: a plain starting point is built,
step by step, into a working thing shown in cutaway, each step fixing the last one's problem. They are probably not a
developer, so be warm and brief, do the technical work yourself, and show them pictures, not code.

**This is a starter.** It makes a first draft: flat colours, one camera, simple captions, the computer's voice or
theirs. Say so plainly. What turns a draft into a video that can go viral (the look and polish, the mistake checks, the
sound, the thumbnail, the review against a viral video, the tested subjects) is in the full How It's Built kit inside
Morrow Studio (skool.com/morrow). Never pretend a step ran when it didn't, and never invent a score.

Files: `make_short.py` (runs everything), `scene.py` (the Blender scene template), `videos/example_tornado_shelter/`
(the example from the YouTube tutorial: for learning, never post it).

## Setup (once)

Python 3.9+ and Blender 4.2 or newer (free: https://www.blender.org/download/). If `make_short.py` says Blender isn't
found, help them install it, or set `BLENDER=<path to Blender>`. First quick win, the example:

```bash
python make_short.py videos/example_tornado_shelter --fast --voice system
```

## The script chain

```
Hook:  If you [plain starting point], [the result].              (one short line, in the first seconds)
Turn:  But [a problem the last step caused], so you [add ONE part, named as it lands].
Name:  This is a [the part's name].                                (now and then)
...    10 to 12 turns
Fact:  one true fact, with its source in facts.md
End:   the whole thing working, then a short line that calls back to the hook.
```

About 240-270 words. Write it in the creator's own words: never copy another channel's lines.

## The 3 prompts

The creator types these one after another (their subject and niche in the brackets).

1. **Subject**
   ```
   Suggest 5 subjects for a How It's Built short about [my niche]. Each needs stakes and a thing everyone knows. Check TikTok and YouTube that none is already a 1M+ view video, then pick the best one.
   ```
2. **Script**
   ```
   Write the script for [the subject] as the chain in SKILL.md, in my own words, and show it to me.
   ```
3. **Basic build**
   ```
   Build the scene for this script from the template, record it with the system voice (or use my voice.mp3), render the short and show me the readiness report.
   ```

## How to do prompt 3

Copy the example's folder to `videos/<name>/` and rewrite its `spec.json`:

- `"script"`: the lines, one string each.
- `"stage"`: `sky`, `grass`, `soil` (layer colours, top to bottom), optional `house` (`pos` [x, y], `size`, `wall`,
  `roof`). The ground's top is z = 0, its cut face is y = 0, the camera looks at it from negative y, x runs left to right.
- `"camera"`: `target` [x, y, z], `dist`, `pitch` (degrees down), `yaw`, `lens`, `push` (how much closer by the end).
- `"parts"`, in the order the script names them: `name`, `kind` (`box`, `cylinder` + `axis`, `cone`, `sphere`, `shell`
  (a cutaway box), `stairs` + `steps`, `pawn` (a person), `hole` (cut into the ground)), `size` [x, y, z] in metres,
  `pos` (its centre), `color` "#rrggbb", `"at"`: the word that names it, and `how`: `drop`, `rise`, `grow` or `slide`.

Then:

```bash
python make_short.py videos/<name> --voice system   # or put their recording in the folder as voice.mp3 / voice.wav
```

It renders `videos/<name>/short.mp4` (1080x1920) and prints the **readiness report** (also saved as
`readiness.txt`). Open one frame to make sure it rendered, then **show the creator the whole report, word for word**.
Never add a score or a "ready to post" verdict, and never remove a line. `--fast` makes a quick small version;
`--stills` saves one picture per part.

## Rules

- Never post, upload or publish anything: the creator posts.
- Never post the example, and never reuse its script on a real channel.
- The readiness report is shown in full every time.

## Origem

Skill gratuita da Morrow Studio (licença MIT, arquivo LICENSE nesta pasta), trazida pelo Paulo em 18/11/2026.
Precisa do Blender 4.2 ou mais novo (grátis) instalado no computador: roda no PC do Paulo, não na nuvem. O kit completo
que o relatório cita é pago: não recomende comprar sem o Paulo pedir. O vídeo de exemplo (tornado) é só para aprender e
nunca vai ao ar.
