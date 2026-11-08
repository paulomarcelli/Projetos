import mediapipe as mp, json
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
opt = vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=str(__import__('pathlib').Path(__file__).with_name('face_landmarker.task'))), num_faces=1)
det = vision.FaceLandmarker.create_from_options(opt)
res={}
for n in ['lula','bolsonaro','xandao','trump','eduarda','erika','pavanato','nikolas','flavio','renan','dilma']:
    img = mp.Image.create_from_file(str(__import__('pathlib').Path(__file__).resolve().parent.parent / 'fotos' / f'{n}.jpg'))
    r = det.detect(img)
    if not r.face_landmarks: print(n,'sem rosto'); continue
    L=r.face_landmarks[0]; W,H=img.width,img.height
    P=lambda i:[L[i].x*W, L[i].y*H]
    def media(ids): xs=[P(i)[0] for i in ids]; ys=[P(i)[1] for i in ids]; return [sum(xs)/len(xs), sum(ys)/len(ys)]
    res[n]={'olho_e': media([33,133,159,145]), 'olho_d': media([362,263,386,374]),
      'sobr_e': media([70,63,105,66,107]), 'sobr_d': media([336,296,334,293,300]),
      'boca': media([13,14,78,308]), 'canto_e': P(78), 'canto_d': P(308), 'queixo': P(152), 'testa': P(10), 'nariz': P(1),
      # contornos completos (para as expressões redesenharem no lugar certo, do tamanho certo)
      'c_olho_e': [P(i) for i in [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]],
      'c_olho_d': [P(i) for i in [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249]],
      'c_sobr_e': [P(i) for i in [46, 53, 52, 65, 55, 107, 66, 105, 63, 70]],
      'c_sobr_d': [P(i) for i in [276, 283, 282, 295, 285, 336, 296, 334, 293, 300]],
      'c_labios': [P(i) for i in [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]],
      'c_rosto': [P(i) for i in [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]],
      'c_boca': [P(i) for i in [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]]}
    print(n, 'ok')
json.dump(res, open(__import__('pathlib').Path(__file__).with_name('rostos.json'),'w'), indent=1)
