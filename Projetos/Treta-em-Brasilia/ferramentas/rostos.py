import mediapipe as mp, json
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
opt = vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=str(__import__('pathlib').Path(__file__).with_name('face_landmarker.task'))), num_faces=1)
det = vision.FaceLandmarker.create_from_options(opt)
res={}
for n in ['lula','bolsonaro','xandao','trump','eduarda','erika']:
    img = mp.Image.create_from_file(str(__import__('pathlib').Path(__file__).resolve().parent.parent / 'fotos' / f'{n}.jpg'))
    r = det.detect(img)
    if not r.face_landmarks: print(n,'sem rosto'); continue
    L=r.face_landmarks[0]; W,H=img.width,img.height
    P=lambda i:[L[i].x*W, L[i].y*H]
    def media(ids): xs=[P(i)[0] for i in ids]; ys=[P(i)[1] for i in ids]; return [sum(xs)/len(xs), sum(ys)/len(ys)]
    res[n]={'olho_e': media([33,133,159,145]), 'olho_d': media([362,263,386,374]),
      'sobr_e': media([70,63,105,66,107]), 'sobr_d': media([336,296,334,293,300]),
      'boca': media([13,14,78,308]), 'canto_e': P(78), 'canto_d': P(308), 'queixo': P(152), 'testa': P(10), 'nariz': P(1)}
    print(n, {k:[round(v[0]),round(v[1])] for k,v in res[n].items()})
json.dump(res, open(__import__('pathlib').Path(__file__).with_name('rostos.json'),'w'), indent=1)
