"""Renderiza uma prévia (preview.png) com todos os modelos lado a lado."""
import math, os, bpy
D = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(D, "..", "models")
bpy.ops.wm.read_factory_settings(use_empty=True)
x = 0
for n, w in [("tenshu", 5), ("yagura", 3.2), ("samurai", 1.4), ("oni", 1.6), ("torii", 3), ("bridge", 3.4), ("sakura", 2), ("lantern", 1.2), ("rock", 1.4)]:
    bpy.ops.import_scene.gltf(filepath=os.path.join(M, n + ".glb"))
    for o in bpy.context.selected_objects:
        if o.parent is None: o.location.x += x + w / 2
    x += w
cx = x / 2
bpy.ops.object.camera_add(location=(cx, -17, 7), rotation=(math.radians(72), 0, 0))
cam = bpy.context.active_object; cam.data.lens = 26; bpy.context.scene.camera = cam
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(50), math.radians(15), math.radians(30))); bpy.context.active_object.data.energy = 4
bpy.ops.mesh.primitive_plane_add(size=80, location=(cx, 0, 0))
p = bpy.context.active_object; m = bpy.data.materials.new("g"); m.use_nodes = True
m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.25, 0.5, 0.2, 1); p.data.materials.append(m)
w = bpy.data.worlds.new("w"); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.6, 0.7, 0.85, 1)
s = bpy.context.scene; s.render.engine = "CYCLES"; s.cycles.samples = 24; s.cycles.device = "CPU"
s.render.resolution_x, s.render.resolution_y = 1400, 520
s.render.filepath = os.path.join(D, "preview.png"); bpy.ops.render.render(write_still=True)
