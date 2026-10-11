import sys, json, base64, io
from PIL import Image
IMG, OUT = sys.argv[1], sys.argv[2]
def b64(im, q=86):
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6); return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
def trim(im, h):
    a = im.split()[3].point(lambda v: 255 if v > 12 else 0); im = im.crop(a.getbbox())
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
robot = trim(Image.open(IMG + '/3.webp').convert('RGBA'), 640)
alien = trim(Image.open(IMG + '/4.webp').convert('RGBA'), 480)
scene = Image.open(IMG + '/5.webp').convert('RGB'); scene = scene.resize((900, round(scene.height * 900 / scene.width)), Image.LANCZOS)
out = {'robot': {'src': b64(robot), 'w': robot.width, 'h': robot.height},
       'alien': {'src': b64(alien), 'w': alien.width, 'h': alien.height},
       'cutscene': b64(scene, 82)}
json.dump(out, open(OUT + '/indie_assets.json', 'w'))
prev = Image.new('RGBA', (robot.width + alien.width + 30, 660), (255, 0, 255, 255)); prev.alpha_composite(robot, (10, 10)); prev.alpha_composite(alien, (robot.width + 20, 10)); prev.save(OUT + '/preview.png')
print(robot.size, alien.size, scene.size, round(len(json.dumps(out)) / 1024), 'KB')
