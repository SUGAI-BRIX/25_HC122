# 2025년 한이음 드림업 프로젝트 : BRIX 🍓 - RGB 카메라와 AI 기반 과일 당도 예측 및 자동 분류 시스템  (25_HC122)

--- 

## **💡1. 프로젝트 개요**

---

**1-1. 프로젝트 소개**

- 프로젝트 명 : RGB 카메라와 AI 기반 과일 당도 예측 및 자동 분류 시스템
- 프로젝트 정의 : RGB 카메라와 AI 모델(CNN + YOLO)을 활용하여 과일의 당도를 비파괴적으로 측정하고, Jetson Nano 기반 자동 분류 장치 및 모바일 직거래 플랫폼과 연동하는 스마트 농업 서비스
    
    ![프로젝트 이미지](https://github.com/user-attachments/assets/6be524a9-c0c1-48b7-8741-1216298f2768)
    

**1-2. 개발 배경 및 필요성**

- 기존 당도 측정은 고가 장비(NIR, 굴절당도계) 혹은 파괴적 방식으로 농가 보급이 어려움
- 소비자는 외형뿐 아니라 당도, 신선도 등 객관적 품질 데이터를 원하지만 제공 서비스 부족
- RGB 카메라 + AI 기술을 활용하면 저비용·비파괴·실시간 측정 가한 코드입니다.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, Subset
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
import cv2 # BGR -> RGB -> HSV
import albumentations as A # 이미지 증강
from albumentations.pytorch import ToTensorV2 # Numpy Ndarray -> Pytorch Tensor
import matplotlib.pyplot as plt

print(torch.cuda.is_available())

# ===============================
#  RGB + HSV (6채널) 데이터셋 클래스
# ===============================
class RGBHSVDataset_Lite(Dataset):
    def __init__(self, csv_file, img_size=None, transform=None):
        self.data = pd.read_csv(csv_file)
        self.img_size = img_size
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def _ensure_uint8_hwc(self, img):
        if isinstance(img, torch.Tensor):
            img = img.detach().cpu().permute(1, 2, 0).numpy()
            if img.max() <= 1.0:
                img = (img * 255.0).clip(0, 255)
            img = img.astype(np.uint8)
        else:
            if img.dtype != np.uint8:
                if img.max() <= 1.0:
                    img = (img * 255.0).clip(0, 255).astype(np.uint8)
                else:
                    img = img.clip(0, 255).astype(np.uint8)
        return img

    def __getitem__(self, idx):
        img_path = self.data.iloc[idx, 0]
        brix = float(self.data.iloc[idx, 1])

        # 1) 이미지 로드 (BGR)
        bgr = cv2.imread(img_path)
        if bgr is None:
            raise FileNotFoundError(f"Failed to read image: {img_path}")
        if self.img_size is not None:  
            bgr = cv2.resize(bgr, self.img_size, interpolation=cv2.INTER_AREA)

        # 2) BGR -> RGB
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

        # 3) Albumentations 증강
        if self.transform:
            out = self.transform(image=rgb)
            rgb = out["image"]

        # 4) uint8 HWC 변환
        rgb = self._ensure_uint8_hwc(rgb)

        # 5) RGB 정규화 + HSV
        rgb_f = rgb.astype(np.float32) / 255.0
        hsv   = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
        hsv[..., 0] /= 179.0
        hsv[..., 1] /= 255.0
        hsv[..., 2] /= 255.0

        # 6) RGB + HSV → (6, H, W)
        combined = np.concatenate([rgb_f, hsv], axis=-1)
        combined = np.transpose(combined, (2, 0, 1))
        image_tensor = torch.from_numpy(combined).float()

        return image_tensor, torch.tensor(brix, dtype=torch.float32)

# ===============================
#   6채널 CNN 회귀 모델
# ===============================
class BrixRegression6CH_Deep(nn.Module):
    def __init__(self):
        super().__init__()

        def conv_block(in_ch, out_ch, p_drop):
            return nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 3, padding=1),
                nn.BatchNorm2d(out_ch),
                nn.LeakyReLU(),
                nn.Conv2d(out_ch, out_ch, 3, padding=1),
                nn.BatchNorm2d(out_ch),
                nn.LeakyReLU(),
                nn.MaxPool2d(2),
                nn.Dropout(p_drop)
            )

        self.layer1 = conv_block(6, 32, 0.1)
        self.layer2 = conv_block(32, 64, 0.2)
        self.layer3 = conv_block(64, 128, 0.3)
        self.layer4 = conv_block(128, 256, 0.4)

        self.global_pool = nn.AdaptiveAvgPool2d(1)

        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.LeakyReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1)
        )

    def forward(self, x):
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.global_pool(x)
        x = self.fc(x)
        return x.squeeze(1)
