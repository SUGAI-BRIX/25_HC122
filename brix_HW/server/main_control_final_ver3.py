# main_control.py (Python 3.6 대응 최종본)
import subprocess
import requests
import sys, os, shutil, glob
import threading
import time
import serial
from serial.tools import list_ports

from pysignal import init_serial, close_serial, send_motor_command
from result_store import get_final_counts, reset_counts
from server.worker_queue import worker  #  큐 공유

# ========== FastAPI 서버 관련 ==========
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Optional
import uvicorn
import asyncio  #  추가

# [WS] 수정: 웹소켓 클라이언트용 import
import json  # [WS] 수정
try:
    import websockets  # pip install websockets
except ImportError:
    websockets = None  # [WS] 수정: 라이브러리 미설치 환경 대비

#  설정값은 전부 config.py에서 가져온다
from config import (
    SPRING_LOGIN_URL,
    SPRING_INSPECTION_URL,
    FASTAPI_INSPECTION_URL,
    EC2_WS_URL,
    USERNAME,
    PASSWORD,
    FRUIT_TYPE_ID,
    ARDUINO_BAUD,
    ARDUINO_PORT_OVERRIDE,
    HOME,
    YOLO_PY,
    WEIGHTS,
    CAPTURES_DIR,
    STOPFILE,
    SOURCE,
    FASTAPI_HOST,
    FASTAPI_PORT,
)

app = FastAPI()

server: Optional[uvicorn.Server] = None
server_thread: Optional[threading.Thread] = None

class InspectionData(BaseModel):
    fruitTypeId: int
    counts: Dict[str, int]

def get_access_token(username: str, password: str):
    payload = {"username": username, "password": password}
    headers = {"Content-Type": "application/json"}
    try:
        res = requests.post(SPRING_LOGIN_URL, json=payload, headers=headers)
        res.raise_for_status()
        token = res.json().get("data", {}).get("accessToken")
        print(" AccessToken:", token)
        return token
    except Exception as e:
        print(" 로그인 실패:", e)
        return None

@app.post("/send-inspection")
def send_inspection(data: InspectionData):
    print(" [FastAPI] 검사 데이터 수신:", data.dict())
    token = get_access_token(USERNAME, PASSWORD)
    if not token:
        return {"message": "AccessToken 발급 실패"}

    payload = {"fruitTypeId": data.fruitTypeId, "counts": data.counts}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = requests.post(SPRING_INSPECTION_URL, json=payload, headers=headers)
        print(" Spring 응답:", response.status_code, response.text)
        if response.status_code == 200:
            return {"message": "전송 성공", "server_response": response.json()}
        else:
            return {"message": "전송 실패", "status": response.status_code}
    except Exception as e:
        print(" Spring 요청 예외:", e)
        return {"message": "예외 발생", "error": str(e)}

# ===== EC2 → Jetson 결과 콜백 =====
class GradeResult(BaseModel):
    type: Optional[str] = "grade_result"
    brix: float
    grade: str
    inference_ms: int
    filename: Optional[str] = None

@app.post("/receive-result")
async def receive_result(data: GradeResult):
    print(" [Jetson] result received:", data.dict())
    try:
        worker.add(data.grade)  #  같은 프로세스라 바로 가능
        print(f"[QUEUE] grade={data.grade} enqueued")
        return {"ok": True}
    except Exception as e:
        print(" worker.add 실패:", e)
        return {"ok": False, "error": str(e)}

#  서버 실행/종료 (Python 3.6 이벤트 루프 대응)
def start_server():
    global server, server_thread
    if server is not None:
        print(" FastAPI 서버가 이미 실행 중입니다.")
        return
    # host/port도 config에서
    config = uvicorn.Config(app, host=FASTAPI_HOST, port=FASTAPI_PORT, log_level="info")
    server = uvicorn.Server(config)

    def run():
        #  Python 3.6에서는 스레드 내 이벤트 루프를 수동 생성해야 함
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(server.serve())

    server_thread = threading.Thread(target=run, daemon=True)
    server_thread.start()
    print(" FastAPI 서버 시작됨")

def stop_server():
    global server, server_thread
    if server is None:
        print(" 서버가 실행 중이 아닙니다.")
        return
    print(" FastAPI 서버 종료 중...")
    server.should_exit = True
    if server_thread:
        server_thread.join(timeout=5)
    server = None
    server_thread = None
    print(" FastAPI 서버 종료 완료")

# ========== Arduino & YOLO 관련 ==========
detect_process = None

def _find_arduino_port():
    if ARDUINO_PORT_OVERRIDE:
        return ARDUINO_PORT_OVERRIDE
    prefer, fallback = [], []
    for p in list_ports.comports():
        desc = (p.description or "").lower()
        if any(k in desc for k in ["arduino", "ch340", "cp210", "usb-serial", "silicon labs"]):
            prefer.append(p.device)
        else:
            fallback.append(p.device)
    return (prefer or fallback or [None])[0]

def _send_arduino(cmd: str):
    port = _find_arduino_port()
    if not port:
        print(" Arduino 포트 없음")
        return
    try:
        with serial.Serial(port, ARDUINO_BAUD, timeout=1) as ser:
            time.sleep(2)
            ser.write(cmd.encode())
            ser.flush()
            print(f" Arduino({port}) ← '{cmd}' 전송")
    except Exception as e:
        print(" Arduino 전송 실패:", e)

def _ensure_dirs():
    os.makedirs(CAPTURES_DIR, exist_ok=True)
    try:
        if os.path.exists(STOPFILE):
            os.remove(STOPFILE)
    except Exception:
        pass

def start_yolo():
    global detect_process
    if detect_process and detect_process.poll() is None:
        print(" detect_cap6.py 이미 실행 중")
        return
    _ensure_dirs()
    cmd = [sys.executable, YOLO_PY,
           "--weights", WEIGHTS, "--source", SOURCE,
           "--imgsz", "640", "640", "--conf-thres", "0.6",
           "--stopfile", STOPFILE, "--view-img"]
    env = os.environ.copy()
    model_dir = os.path.join(HOME, "brixproject", "brix_model")
    env["PYTHONPATH"] = (model_dir + os.pathsep + env.get("PYTHONPATH", ""))
    detect_process = subprocess.Popen(cmd, env=env)

def stop_yolo():
    global detect_process
    if not detect_process:
        print(" detect_cap6.py 실행 안됨")
        return
    print(" YOLO 종료 중...")
    try:
        with open(STOPFILE, "w") as f:
            f.write("1")
    except Exception:
        pass
    try: detect_process.terminate()
    except Exception: pass
    try: detect_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        print(" 강제 kill()")
        try: detect_process.kill()
        except Exception: pass
    detect_process = None

def _clean_captures():
    try:
        patterns = ('*.jpg','*.jpeg','*.png','*.bmp','*.webp','*.JPG','*.JPEG','*.PNG','*.BMP','*.WEBP')
        deleted = 0
        if os.path.isdir(CAPTURES_DIR):
            for pat in patterns:
                for fp in glob.glob(os.path.join(CAPTURES_DIR, pat)):
                    try:
                        os.remove(fp); deleted += 1
                    except Exception as e:
                        print(f" 삭제 실패: {fp} ({e})")
            print(f" {deleted}개 이미지 삭제 완료")
    except Exception as e:
        print(" 이미지 삭제 오류:", e)

# ========== [WS] EC2 WebSocket 수신기 ==========
_ws_thread: Optional[threading.Thread] = None
_ws_stop_event: Optional[threading.Event] = None

async def _ws_listen_loop(stop_event: threading.Event):
    """
    EC2 웹소켓(/ws)에 연결해 grade_result 수신 시 grade만 worker.add로 넣는다.
    Python 3.6용: 주기적으로 stop_event 확인하도록 timeout 기반 recv 사용.
    """
    if websockets is None:
        print(" websockets 라이브러리가 설치되어 있지 않습니다. (pip install websockets)")
        return

    while not stop_event.is_set():
        try:
            print(f"[WS] connecting to {EC2_WS_URL} ...")
            # ping_interval/timeout 설정으로 keep-alive
            async with websockets.connect(EC2_WS_URL, ping_interval=20, ping_timeout=20) as ws:
                print("[WS] connected.")
                # 식별(선택): 서버는 수신을 사용하지 않지만 헬로 메시지 전송
                try:
                    await ws.send('{"hello":"jetson"}')
                except Exception:
                    pass

                # 메시지 루프
                while not stop_event.is_set():
                    try:
                        # timeout을 줘서 주기적으로 stop_event 확인
                        msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    except asyncio.TimeoutError:
                        continue  # 계속 대기
                    except Exception as e:
                        print("[WS] recv error:", e)
                        break

                    # JSON 파싱
                    try:
                        data = json.loads(msg)
                    except Exception:
                        print("[WS] non-json:", msg)
                        continue

                    # type이 grade_result 일 때만 처리
                    if data.get("type") != "grade_result":
                        # 필요시 다른 타입(예: capture) 로그만 남기고 무시
                        # print("[WS] ignore:", data)
                        continue

                    print("[WS] grade_result received:", data)

                    # grade 추출하여 큐에 투입
                    grade = data.get("grade")
                    if grade is not None:
                        try:
                            worker.add(grade)
                            print(f"[QUEUE] grade={grade} enqueued (via WS)")
                        except Exception as e:
                            print(" worker.add 실패:", e)
                    else:
                        print("[WS] 'grade' 필드가 없습니다.")

        except Exception as e:
            print("[WS] connect error:", e)

        # 재접속 백오프
        if not stop_event.is_set():
            await asyncio.sleep(2.0)

def start_ws_client():
    """웹소켓 수신기를 별도 스레드 + 전용 이벤트 루프로 실행 (Python 3.6 대응)"""
    global _ws_thread, _ws_stop_event
    if _ws_thread and _ws_thread.is_alive():
        print("[WS] 이미 실행 중")
        return
    _ws_stop_event = threading.Event()

    def _run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_ws_listen_loop(_ws_stop_event))
        finally:
            try:
                loop.run_until_complete(asyncio.sleep(0))
            except Exception:
                pass
            loop.close()

    _ws_thread = threading.Thread(target=_run, daemon=True)
    _ws_thread.start()
    print("[WS] 수신기 시작됨")

def stop_ws_client():
    """웹소켓 수신기를 안전하게 중단"""
    global _ws_thread, _ws_stop_event
    if not _ws_thread:
        print("[WS] 실행 중이 아님")
        return
    print("[WS] 수신기 종료 중...")
    try:
        _ws_stop_event.set()
    except Exception:
        pass
    _ws_thread.join(timeout=5)
    _ws_thread = None
    _ws_stop_event = None
    print("[WS] 수신기 종료 완료")

# ========== 버튼 콜백 ==========
def on_conveyor_start_click():
    try: send_motor_command('1', append_newline=False); print("컨베이어 시작 신호 '1' 전송")
    except Exception as e: print("컨베이어 시작 신호 전송 실패:", e)

def on_conveyor_stop_click():
    try: send_motor_command('0', append_newline=False); print("컨베이어 정지 신호 '0' 전송")
    except Exception as e: print("컨베이어 정지 신호 전송 실패:", e)

def on_servo_S_click():
    try: send_motor_command('S', append_newline=False); print("서보모터 'S' 전송")
    except Exception as e: print("서보모터 'S' 전송 실패:", e)

def on_servo_A_click():
    try: send_motor_command('A', append_newline=False); print("서보모터 'A' 전송")
    except Exception as e: print("서보모터 'A' 전송 실패:", e)

def on_servo_B_click():
    try: send_motor_command('B', append_newline=False); print("서보모터 'B' 전송")
    except Exception as e: print("서보모터 'B' 전송 실패:", e)

def on_servo_C_click():
    try: send_motor_command('C', append_newline=False); print("서보모터 'C' 전송")
    except Exception as e: print("서보모터 'C' 전송 실패:", e)

def on_init_serial_click():
    try: init_serial(); print("시리얼 초기화 완료")
    except Exception as e: print("시리얼 초기화 실패:", e)

def on_close_serial_click():
    try: close_serial(); print("시리얼 종료 완료")
    except Exception as e: print("시리얼 종료 실패:", e)

def on_start_button_click():
    start_server()
    init_serial(port=ARDUINO_PORT_OVERRIDE or _find_arduino_port(), baud=ARDUINO_BAUD)
    worker.start()
    start_yolo()
    send_motor_command('1', append_newline=False)
    print("▶ 컨베이어 시작")
    start_ws_client()  # [WS] 수정: 웹소켓 수신 시작

def on_end_button_click():
    print(" END 버튼 클릭됨")
    stop_yolo()
    worker.stop()
    counts = get_final_counts()
    payload = {"fruitTypeId": FRUIT_TYPE_ID, "counts": counts}
    try:
        print(f"➡ FastAPI로 전송: {payload}")
        res = requests.post(FASTAPI_INSPECTION_URL, json=payload, timeout=5)
        print(" 응답:", res.status_code, str(res.text)[:200])
    except Exception as e:
        print(" 전송 실패:", e)
    send_motor_command('0', append_newline=False)
    reset_counts()
    close_serial()
    _clean_captures()
    stop_ws_client()  # [WS] 수정: 웹소켓 수신 종료
    stop_server()
    print(" 결과 초기화 완료")
