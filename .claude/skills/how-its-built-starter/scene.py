"""scene.py: the starter's Blender scene template (a flat, basic look). make_short.py runs it:

    blender -b --factory-startup -P scene.py -- <video folder> [--fast] [--stills]

Reads <folder>/spec.json (and voice.wav / voice.mp3 if one is there), builds the stage (a block of ground cut open at
the front, a sky colour, an optional house), adds every part on the word that names it (the words are spread evenly
over the voice, or read at 4 words a second without one), puts one-word captions on screen and renders
<folder>/short.mp4. --stills renders one picture per part into <folder>/stills/ instead. Writes <folder>/render.json.

Coordinates: metres. The ground's top is z = 0, its cut face is the plane y = 0 (the camera looks at it from -y),
x runs left to right. A part's "pos" is its centre.
"""
import json, math, re, sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
FOLDER = Path(argv[0]).resolve()
FAST, STILLS = "--fast" in argv, "--stills" in argv
spec = json.loads((FOLDER / "spec.json").read_text(encoding="utf-8"))

FPS = 12 if FAST else 30
W, H = (360, 640) if FAST else (1080, 1920)
WPS = float(spec.get("wps", 4.0))
LEAD, TAIL = 0.4, 1.6          # seconds of picture before the first word and after the last
STAGE = {"sky": "#8ec9f2", "grass": "#58b947", "soil": ["#7a4b2c", "#9a5b34", "#6b4636"],
         "width": 24, "depth": 16, "height": 7, "house": None, **spec.get("stage", {})}


def lin(hexcol):               # "#rrggbb" (sRGB) -> linear RGB, what Blender stores
    h = hexcol.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


MATS = {}
def mat(hexcol):
    if hexcol not in MATS:
        m = bpy.data.materials.new(hexcol)
        m.diffuse_color = (*lin(hexcol), 1.0)
        MATS[hexcol] = m
    return MATS[hexcol]


def obj_from(bm, name, color, pos=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    o.data.materials.append(mat(color))
    o.location = pos
    bpy.context.scene.collection.objects.link(o)
    return o


def add_box(bm, center, size):
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.LocRotScale(Vector(center), None, Vector(size)))


AXIS = {"z": Euler((0, 0, 0)), "x": Euler((0, math.pi / 2, 0)), "y": Euler((math.pi / 2, 0, 0))}


def build(p):
    """One part as a mesh centred on its pos. Kinds: box, cylinder, cone, sphere, shell, stairs, pawn, hole."""
    kind, size = p.get("kind", "box"), [float(v) for v in p.get("size", [1, 1, 1])]
    bm = bmesh.new()
    if kind == "box" or kind == "hole":
        add_box(bm, (0, 0, 0), size)
    elif kind in ("cylinder", "cone"):
        r1 = size[0] / 2
        r2 = size[1] / 2 if kind == "cone" else r1
        rot = AXIS[p.get("axis", "z")].to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=28, radius1=r1, radius2=r2, depth=size[2], matrix=rot)
    elif kind == "sphere":
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=0.5,
                                  matrix=Matrix.Diagonal((*size, 1.0)))
    elif kind == "shell":      # a concrete box seen in cutaway: floor, back wall, two side walls (no front, no top)
        w, d, h = size
        t = float(p.get("wall", 0.3))
        add_box(bm, (0, 0, -h / 2 + t / 2), (w, d, t))
        add_box(bm, (0, d / 2 - t / 2, 0), (w, t, h))
        add_box(bm, (-w / 2 + t / 2, 0, 0), (t, d, h))
        add_box(bm, (w / 2 - t / 2, 0, 0), (t, d, h))
    elif kind == "stairs":     # steps rising toward -x ("rise": "+x" for the other way)
        w, d, h = size
        n = int(p.get("steps", 6))
        sign = 1 if p.get("rise") == "+x" else -1
        for i in range(n):
            sh = h * (i + 1) / n
            add_box(bm, (sign * (-w / 2 + w * (i + 0.5) / n), 0, -h / 2 + sh / 2), (w / n, d, sh))
    elif kind == "pawn":       # a simple person: a body and a head
        dia, _, h = size
        rot = Matrix.Translation((0, 0, -h / 2 + h * 0.36))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=dia / 2, radius2=dia * 0.38, depth=h * 0.72, matrix=rot)
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=dia * 0.42,
                                  matrix=Matrix.Translation((0, 0, h / 2 - dia * 0.42)))
    else:
        raise SystemExit(f"part {p.get('name')}: unknown kind {kind}")
    o = obj_from(bm, p.get("name", kind), p.get("color", "#bbbbbb"), p.get("pos", (0, 0, 0)))
    if p.get("rot"):
        o.rotation_euler = [math.radians(a) for a in p["rot"]]
    return o


# ---- the words and when each one is said -------------------------------------------------------------------------
LINES = spec["script"]
WORDS = [w for line in LINES for w in line.split()]
KEY = [re.sub(r"[^a-z0-9']", "", w.lower()) for w in WORDS]

scene = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
scene.render.fps = FPS
scene.frame_start = 1

voice = next((FOLDER / n for n in ("voice.wav", "voice.mp3", "voice.m4a") if (FOLDER / n).exists()), None)
if voice:
    se = scene.sequence_editor_create()
    strips = se.strips if hasattr(se, "strips") else se.sequences
    snd = strips.new_sound("voice", str(voice), 1, 1 + round(LEAD * FPS))
    talk = snd.frame_final_duration / FPS
    # the words, spread evenly over the voice (the full kit times every part on the real word instead)
    times = [LEAD + talk * (i + 0.5) / len(WORDS) for i in range(len(WORDS))]
    total = LEAD + talk + TAIL
else:
    times = [LEAD + i / WPS for i in range(len(WORDS))]
    total = LEAD + len(WORDS) / WPS + TAIL
scene.frame_end = 1 + math.ceil(total * FPS)
frame = lambda t: 1 + round(t * FPS)

# ---- the look: flat colours, an outline, a sky colour --------------------------------------------------------------
scene.render.engine = "BLENDER_WORKBENCH"
sh = scene.display.shading
sh.light, sh.color_type = "STUDIO", "MATERIAL"
sh.show_object_outline, sh.object_outline_color = True, (0.04, 0.04, 0.04)
sh.show_shadows = sh.show_cavity = False
scene.display.render_aa = "FXAA" if FAST else "8"
scene.view_settings.view_transform = "Standard"
scene.world = bpy.data.worlds.new("sky")
scene.world.color = lin(STAGE["sky"])
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = W, H, 100

# ---- the stage: a block of ground cut open at y = 0, grass on top, soil layers below --------------------------------
gw, gd, gh = STAGE["width"], STAGE["depth"], STAGE["height"]
ground, top = [], 0.0
layers = [("grass", STAGE["grass"], 0.35)] + [(f"soil{i}", c, (gh - 0.35) / len(STAGE["soil"])) for i, c in enumerate(STAGE["soil"])]
for name, color, th in layers:
    bm = bmesh.new()
    add_box(bm, (0, gd / 2, top - th / 2), (gw, gd, th))
    ground.append(obj_from(bm, name, color))
    top -= th
if STAGE.get("house"):         # a plain house behind: {"pos": [x, y], "size": [w, d, h], "wall": "#..", "roof": "#.."}
    hs = STAGE["house"]
    w, d, h = hs.get("size", [6, 5, 4])
    x, y = hs.get("pos", [-5, 10])
    bm = bmesh.new()
    add_box(bm, (x, y, h / 2), (w, d, h))
    obj_from(bm, "house", hs.get("wall", "#f1ede4"))
    bm = bmesh.new()           # a gable roof: ridge along x
    x0, x1, y0, y1, rh = x - w / 2 - 0.2, x + w / 2 + 0.2, y - d / 2 - 0.3, y + d / 2 + 0.3, d * 0.4
    v = [bm.verts.new(c) for c in ((x0, y0, h), (x1, y0, h), (x1, y1, h), (x0, y1, h), (x0, y, h + rh), (x1, y, h + rh))]
    for f in ((0, 3, 2, 1), (0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5)):
        bm.faces.new([v[i] for i in f])
    obj_from(bm, "roof", hs.get("roof", "#b0412e"))

# ---- the parts, each arriving on the word that names it -------------------------------------------------------------
def key_vis(o, f, visible):    # an on/off switch at frame f (constant: no blend between keys)
    edit = bpy.context.preferences.edit
    edit.keyframe_new_interpolation_type = "CONSTANT"
    o.hide_render = not visible
    o.keyframe_insert("hide_render", frame=f)
    edit.keyframe_new_interpolation_type = "BEZIER"


arrivals, unmatched, cursor = [], [], 0
for p in spec.get("parts", []):
    o = build(p)
    at = p.get("at")
    if isinstance(at, (int, float)):
        t_land = float(at)
    else:
        want = re.sub(r"[^a-z0-9']", "", str(at or "").lower())
        idx = next((i for i in range(cursor, len(KEY)) if KEY[i] == want), None)
        if idx is None:
            unmatched.append(f"{p.get('name')}: '{at}'")
            t_land = (arrivals[-1][1] + 2.0) if arrivals else LEAD
        else:
            cursor, t_land = idx, times[idx]
    dur = float(p.get("dur", 0.5))
    how = p.get("how", "grow" if p.get("kind") == "hole" else "drop")
    f0, f1 = frame(max(0.0, t_land - dur * 0.7)), frame(t_land + dur * 0.3)
    f1 = max(f1, f0 + 1)
    pos = Vector(p.get("pos", (0, 0, 0)))
    if p.get("kind") == "hole":            # a hole: cut out of every ground layer, opening as it grows
        o.display_type, o.hide_render = "WIRE", True
        for g in ground:
            m = g.modifiers.new(o.name, "BOOLEAN")
            m.operation, m.object = "DIFFERENCE", o
    else:
        if f0 > 1:
            key_vis(o, 1, False)
        key_vis(o, f0, True)
    if how == "grow" or p.get("kind") == "hole":
        o.scale = (0.001, 0.001, 0.001)
        o.keyframe_insert("scale", frame=f0)
        o.scale = (1, 1, 1)
        o.keyframe_insert("scale", frame=f1)
    elif how in ("drop", "rise", "slide"):
        off = Vector(p.get("from", {"drop": (0, 0, 7), "rise": (0, 0, -4), "slide": (-6, 0, 0)}[how]))
        o.location = pos + off
        o.keyframe_insert("location", frame=f0)
        o.location = pos
        o.keyframe_insert("location", frame=f1)
    arrivals.append((p.get("name", p.get("kind")), t_land, f1))

# ---- the camera: one view, a slow push-in ------------------------------------------------------------------------------
cs = {"target": [0, 2, -1.5], "dist": 24, "pitch": 14, "yaw": 0, "lens": 35, "push": 0.15, **spec.get("camera", {})}
cam_data = bpy.data.cameras.new("cam")
cam_data.lens, cam_data.sensor_fit, cam_data.sensor_height = cs["lens"], "VERTICAL", 24
cam_data.clip_start, cam_data.clip_end = 0.1, 400
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
pitch, yaw = math.radians(cs["pitch"]), math.radians(cs["yaw"])
look = Vector((-math.sin(yaw) * math.cos(pitch), math.cos(yaw) * math.cos(pitch), -math.sin(pitch)))  # camera -> target
target = Vector(cs["target"])
cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
edit = bpy.context.preferences.edit
edit.keyframe_new_interpolation_type = "LINEAR"          # an even push-in, start to end
for f, dist in ((1, cs["dist"]), (scene.frame_end, cs["dist"] * (1 - cs["push"]))):
    cam.location = target - look * dist
    cam.keyframe_insert("location", frame=f)
edit.keyframe_new_interpolation_type = "BEZIER"

# ---- one-word captions, parented to the camera ------------------------------------------------------------------
CAP_D = 2.0
vis_h = CAP_D * cam_data.sensor_height / cam_data.lens
vis_w = vis_h * W / H
for i, (w, t) in enumerate(zip(WORDS, times)):
    text = re.sub(r"[^\w'’-]", "", w).upper()
    if not text:
        continue
    cu = bpy.data.curves.new(f"cap{i}", "FONT")
    cu.body, cu.align_x, cu.align_y = text, "CENTER", "CENTER"
    cu.size = min(vis_h * 0.075, vis_w * 0.86 / (0.62 * len(text)))
    cu.extrude = 0.0
    o = bpy.data.objects.new(f"cap{i}", cu)
    o.data.materials.append(mat("#ffffff"))
    scene.collection.objects.link(o)
    pl = bmesh.new()           # a dark plate behind the word, so it reads on any background
    add_box(pl, (0, 0, -0.01), (cu.size * (0.66 * len(text) + 0.5), cu.size * 1.3, 0.001))
    plate = obj_from(pl, f"plate{i}", "#111111")
    end = times[i + 1] if i + 1 < len(times) else t + 0.6
    for c in (o, plate):
        c.parent = cam
        c.location = (0, vis_h * 0.11, -CAP_D)
        if frame(t - 0.08) > 1:
            key_vis(c, 1, False)
        key_vis(c, frame(t - 0.08), True)
        key_vis(c, max(frame(end - 0.08), frame(t - 0.08) + 1), False)

# ---- render ----------------------------------------------------------------------------------------------------------
im = scene.render.image_settings
summary = {"seconds": round(total, 2), "fps": FPS, "size": f"{W}x{H}", "words": len(WORDS),
           "voice": voice.name if voice else None, "parts": len(spec.get("parts", [])), "unmatched": unmatched,
           "timing": "even spread over the voice" if voice else f"{WPS:g} words a second, no voice"}
if STILLS:
    if hasattr(im, "media_type"):
        im.media_type = "IMAGE"
    im.file_format = "PNG"
    scene.render.resolution_percentage = 50
    out = FOLDER / "stills"
    out.mkdir(exist_ok=True)
    for k, (name, t, f1) in enumerate(arrivals, start=1):
        scene.frame_set(min(f1 + round(0.3 * FPS), scene.frame_end))
        scene.render.filepath = str(out / f"{k:02d}_{name}_{t:.1f}s.png")
        bpy.ops.render.render(write_still=True)
    summary["stills"] = len(arrivals)
else:
    if hasattr(im, "media_type"):
        im.media_type = "VIDEO"
    im.file_format = "FFMPEG"
    ff = scene.render.ffmpeg
    ff.format, ff.codec, ff.constant_rate_factor = "MPEG4", "H264", "MEDIUM" if FAST else "HIGH"
    ff.audio_codec, ff.audio_bitrate = ("AAC", 192) if voice else ("NONE", 192)
    for old in FOLDER.glob("short*.mp4"):
        old.unlink()
    scene.render.filepath = str(FOLDER / "short_")
    bpy.ops.render.render(animation=True)
    made = sorted(FOLDER.glob("short_*.mp4"), key=lambda p: p.stat().st_mtime)
    if made:
        made[-1].replace(FOLDER / "short.mp4")
        summary["video"] = "short.mp4"
(FOLDER / "render.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")
print("STARTER_DONE", json.dumps(summary))
