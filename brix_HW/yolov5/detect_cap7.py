# detect_cap7.py  (BASE + SORT + Trigger Cooldown)
import argparse
import os
import sys
from pathlib import Path
from typing import Tuple
import cv2
import numpy as np
import torch
import requests   # ✅ 트리거 전송용
import time       # ✅ 쿨다운용

# ===== YOLOv5 경로 =====
FILE = Path(__file__).resolve()
ROOT = FILE.parents[0]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))
ROOT = Path(os.path.relpath(ROOT, Path.cwd()))
os.environ.setdefault("OPENCV_VIDEOIO_PRIORITY_GSTREAMER", "1")

# YOLOv5 유틸
from utils.augmentations import letterbox
from utils.general import check_file, check_img_size, non_max_suppression, scale_coords, increment_path
from utils.torch_utils import select_device
from utils.plots import Annotator, colors
from models.experimental import attempt_load
from utils.datasets import IMG_FORMATS, VID_FORMATS, LoadImages, LoadStreams

# ===== SORT 추가 =====
from sort import Sort

# ===== 종료 플래그 =====
_TERMINATE = False
def _handle_term(signum, frame):
    global _TERMINATE
    _TERMINATE = True
try:
    import signal
    signal.signal(signal.SIGTERM, _handle_term)
    signal.signal(signal.SIGINT, _handle_term)
except Exception:
    pass

# ===== 트리거 전송 대상 URL =====
TRIGGER_URL = "http://13.125.20.176:8000/trigger-capture"

def is_gstreamer_source(src: str) -> bool:
    if not isinstance(src, str):
        return False
    s = src.strip()
    return ("nvarguscamerasrc" in s) or ("appsink" in s) or (" !" in s) or s.startswith("v4l2src ") or s.endswith(" appsink")

def gst_stream_loader(pipeline: str, img_size: Tuple[int, int], stride: int):
    cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
    if not cap.isOpened():
        raise Exception(f"GStreamer 파이프라인 오픈 실패: {pipeline}")
    while True:
        ok, im0 = cap.read()
        if not ok or im0 is None:
            continue
        img = letterbox(im0, new_shape=img_size, stride=stride, auto=True)[0]
        img = img[:, :, ::-1].transpose(2, 0, 1)
        img = np.ascontiguousarray(img)
        yield pipeline, img, im0, cap, ''

@torch.no_grad()
def run(
    weights=ROOT / 'yolov5s.pt',
    source=0,
    imgsz=(640, 640),
    conf_thres=0.6,
    iou_thres=0.45,
    device='',
    view_img=False,
    stopfile=str(Path.home() / "jetson/brixproject/stop_detect"),
):
    source = str(source)

    gst_mode = is_gstreamer_source(source)
    is_file = Path(source).suffix[1:] in (IMG_FORMATS + VID_FORMATS)
    is_url = source.lower().startswith(('rtsp://', 'rtmp://', 'http://', 'https://'))
    if is_url and is_file:
        source = check_file(source)
    webcam = (not gst_mode) and (source.isnumeric() or source.endswith('.txt') or (is_url and not is_file))

    # YOLO 모델 로드
    device_t = select_device(device)
    model = attempt_load(weights, map_location=device_t)
    model.eval()
    stride = int(getattr(model, 'stride', torch.tensor([32])).max())
    imgsz = check_img_size(imgsz, s=stride)
    if device_t.type != 'cpu':
        model.half()
    names = model.module.names if hasattr(model, 'module') else model.names

    # 데이터 로더
    if gst_mode:
        dataset = gst_stream_loader(source, imgsz, stride)
        use_custom_iter = True
    elif webcam:
        dataset = LoadStreams(source, img_size=imgsz, stride=stride)
        use_custom_iter = False
    else:
        dataset = LoadImages(source, img_size=imgsz, stride=stride)
        use_custom_iter = False

    # ===== SORT 트래커 인스턴스 =====
    tracker = Sort(max_age=15, min_hits=2, iou_threshold=0.3)

    # ===== Trigger Cooldown 상태 =====
    last_trigger_ts = [0.0]      # 리스트로 감싸서 클로저에서 수정 가능
    TRIGGER_COOLDOWN = 2.0       # 초 단위

    def inference_step(im_tensor, im0):
        pred = model(im_tensor, augment=False)[0]
        dets = non_max_suppression(pred, conf_thres, iou_thres, None, False)
        annotator = Annotator(im0, line_width=2, example=str(names))

        detected_this_frame = False

        for det in dets:
            if len(det):
                # 좌표 원본 스케일로 변환
                det[:, :4] = scale_coords(im_tensor.shape[2:], det[:, :4], im0.shape).round()

                # ▶ 기존 클래스 라벨 박스
                for *xyxy, conf, cls in det.tolist():
                    c = int(cls)
                    label = f"{names[c]} {float(conf):.2f}"
                    annotator.box_label(xyxy, label, color=colors(c, True))

                # ▶ SORT 업데이트 (x1,y1,x2,y2,conf) 입력
                det_np = det[:, :5].detach().cpu().numpy()
                tracks = tracker.update(det_np)

                # ▶ 트랙 박스 + ID 라벨(초록)
                for x1, y1, x2, y2, tid in tracks:
                    tid = int(tid)
                    annotator.box_label([x1, y1, x2, y2], f"ID {tid}", color=(0, 255, 0))

                detected_this_frame = True  # 이 프레임에서 최소 한 개 이상 검출됨

        # ▶ 쿨다운 기반 트리거 (검출이 있었을 때만, 1.5초 간격으로)
        if detected_this_frame:
            now = time.monotonic()
            if now - last_trigger_ts[0] >= TRIGGER_COOLDOWN:
                print("CAPTURE:detected", flush=True)
                try:
                    res = requests.post(TRIGGER_URL, json={"signal": "capture"})
                    print(f"📤 Trigger sent ({res.status_code})")
                except Exception as e:
                    print("❌ Trigger failed:", e)
                finally:
                    last_trigger_ts[0] = now  # 쿨다운 갱신

        # ▶ GUI 표시 및 q/ESC 종료 처리
        if view_img:
            cv2.imshow("YOLOv5 - detect_cap7", annotator.result())
            key = cv2.waitKey(1) & 0xFF
            if key in (27, ord('q')):
                return False

        return True

    try:
        if use_custom_iter:
            for _, img, im0, cap, _ in dataset:
                if _TERMINATE or (stopfile and os.path.exists(stopfile)):
                    break
                im = torch.from_numpy(img).to(device_t)
                im = im.half() if device_t.type != 'cpu' else im.float()
                im /= 255.0
                if im.ndimension() == 3:
                    im = im.unsqueeze(0)
                if not inference_step(im, im0):
                    break
        else:
            for _, im, im0s, _, _ in dataset:
                if _TERMINATE or (stopfile and os.path.exists(stopfile)):
                    break
                im_tensor = torch.from_numpy(im).to(device_t)
                im_tensor = im_tensor.half() if device_t.type != 'cpu' else im_tensor.float()
                im_tensor /= 255.0
                if im_tensor.ndimension() == 3:
                    im_tensor = im_tensor.unsqueeze(0)
                im0 = im0s if isinstance(im0s, np.ndarray) else im0s[0]
                if not inference_step(im_tensor, im0):
                    break
    finally:
        cv2.destroyAllWindows()
    print("DETECT_DONE", flush=True)

def parse_opt():
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default=str(ROOT / 'yolov5s.pt'))
    parser.add_argument('--source', type=str, default=str(ROOT / 'data/images'))
    parser.add_argument('--imgsz', nargs='+', type=int, default=[640])
    parser.add_argument('--conf-thres', type=float, default=0.6)
    parser.add_argument('--iou-thres', type=float, default=0.45)
    parser.add_argument('--device', default='')
    parser.add_argument('--view-img', action='store_true')
    parser.add_argument('--stopfile', type=str, default=str(Path.home() / "jetson/brixproject/stop_detect"))
    opt = parser.parse_args()
    opt.imgsz = opt.imgsz * 2 if len(opt.imgsz) == 1 else opt.imgsz
    return opt

def main(opt):
    run(
        weights=opt.weights,
        source=opt.source,
        imgsz=tuple(opt.imgsz),
        conf_thres=opt.conf_thres,
        iou_thres=opt.iou_thres,
        device=opt.device,
        view_img=opt.view_img,
        stopfile=opt.stopfile,
    )

if __name__ == "__main__":
    opt = parse_opt()
    main(opt)

