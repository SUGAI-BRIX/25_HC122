<img width="591" height="827" alt="image" src="https://github.com/user-attachments/assets/988e34e5-0068-41f4-a9b7-85176760959d" /># 2025년 한이음 드림업 프로젝트 : BRIX 🍓 - RGB 카메라와 AI 기반 과일 당도 예측 및 자동 분류 시스템  (25_HC122)

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
- RGB 카메라 + AI 기술을 활용하면 저비용·비파괴·실시간 측정 가능
- 생산자-소비자 간 신뢰 기반 직거래 플랫폼 수요 증가

**1-3. 프로젝트 특장점**

- 저비용 RGB 카메라 기반 비파괴 당도 예측
- YOLOv5 객체 탐지 + CNN 회귀모델 기반 실시간 품질 분석
- Jetson Nano + 컨베이어 시스템을 통한 자동 분류·이송
- 토큰 기반 직거래 플랫폼 (등급별 판매 권한, 리뷰, 채팅 기능)

**1-4. 주요 기능**

📌 소프트웨어(S/W)
- 과일 객체 인식 : YOLOv5 기반 딥러닝 모델로 이미지 내 과일 탐지 및 위치 분할
- 당도 예측 및 등급 분류 : CNN 회귀 모델로 Brix 값을 추정하고, K-Means 기반 S/A/B/C 자동 등급화
- 거래 플랫폼 서비스 : Spring Boot 백엔드 + React Native 앱을 통해 상품 등록, 구매, 리뷰 작성, 시세 그래프 조회 가능
- 사용자 관리 및 인증 : JWT 기반 로그인/회원가입, Redis를 통한 Refresh Token 관리, AWS S3 프로필·상품 이미지 저장

📌 하드웨어(H/W)
- Jetson Nano 실시간 추론 : YOLO + CNN 모델을 탑재해 현장에서 실시간 과일 탐지 및 당도 예측 수행
- RGB 카메라 촬영 : 고정형 카메라 또는 스마트폰 카메라를 통해 과일 이미지 촬영
- 컨베이어 벨트 제어 : 과일을 자동으로 이송하고, 등급 결과에 따라 위치별로 분류
- Arduino Uno + MG90S 서보모터 : Jetson Nano로부터 전달받은 S/A/B/C 신호를 기반으로 과일을 지정된 구역으로 분류

**1-5. 기대 효과 및 활용 분야**

📌 기대 효과
- 농가 : 자동 품질 측정으로 노동력 절감, 소득 안정화
- 소비자 : 객관적 품질 데이터를 기반으로 신뢰 있는 구매 결정
- 사회적 효과 : 스마트 농업 및 디지털 유통 활성화, 직거래 문화 확산
- 연구적 활용 : 과일 품질 빅데이터 축적, 스마트팜/정책 데이터 기반 확장

📌 활용 분야
- 농업 및 스마트팜 : 과일 당도·품질 자동 측정, 데이터 기반 농장 운영
- 유통 및 직거래 플랫폼 : 과학적 등급 기준에 기반한 신뢰 거래, 중간 마진 절감
- 프리미엄 시장 : S/A 등급 과일의 프리미엄 마케팅 및 수출용 시장 진출
- 연구 및 정책 : 장기 품질 데이터 기반으로 스마트 농업 연구 및 유통 정책 수립
  
**1-6. 기술 스택**

- 프론트엔드 : React Native, Expo
- 백엔드 : Java (Spring Boot), Redis, AWS S3, RDS(MySQL)
- AI/ML : PyTorch, YOLOv5, OpenCV, FastAPI
- DB : MySQL, Redis
- 클라우드 : AWS EC2, Docker
- H/W : Jetson Nano, RGB 카메라, Arduino Uno R3, MG90S 서보모터, 컨베이어 벨트
  
---

## **💡2. 팀원 소개**

---

| 사진 | <img width="100" height="170" alt="image" src="https://github.com/user-attachments/assets/3346c8e6-08d4-4a39-84f3-093828dd7701" /> | <img width="100" height="170" alt="image" src="https://github.com/user-attachments/assets/f0a1f1fd-05ba-4281-bba3-f560878108c0"  /> | <img width="100" height="170" alt="image" src="https://github.com/user-attachments/assets/79347fbf-d45c-4f18-a2b5-def33dea79d5" /> | <img width="100" height="170" src="https://github.com/user-attachments/assets/6a89cc36-32c4-4145-ab12-6c0339fbd7c1" /> | <img width="100" height="170" alt="image" src="https://github.com/user-attachments/assets/9e265fb2-dc21-4cb8-a592-6bf13ba1d13c" /> | <img width="100" height="170" alt="image" src="https://github.com/user-attachments/assets/0da0b15f-137f-494a-85f9-721835ec0672" />
" /> |
| ---- | ----- | ----- | ----- | ----- | ----- | ---- |
| 팀원 | 팀원1 | 팀원2 | 팀원3 | 팀원4 | 팀원5 | 멘토 |
| 역할 | AI 개발 | AI 개발 | 백엔드 개발 | 백엔드 개발 | 프론트엔드 개발 | 프로젝트 총괄 |

---

## **💡3. 시스템 구성도**

---
> 
- 서비스 구성도

![서비스 구성도](https://github.com/user-attachments/assets/144ad0fc-9c29-4c74-a2ab-00be34092475)

- 엔티티 관계도

![엔티티 관계도](https://github.com/user-attachments/assets/62386e8d-881f-4ca8-8b42-e35f8c829eeb)

---

## **💡4. 작품 소개영상**

---

> [![[2025 한이음 드림업 공모전 시연 영상] RGB카메라와 인공지능을 활용한 과일 당도 측정 서비스](https://github.com/user-attachments/assets/e1e84ff0-4696-4299-93a6-c3238927da3c)](https://youtu.be/2iMyMO82c9s?si=YAMznI-zBLoh6I4d)

---

## **💡5. 핵심 소스코드**

---

- 소스코드 설명 : CNN 기반의 6채널 입력 모델 구조를 정의한 코드입니다.

```python
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
```
- 소스코드 설명 : 모델 훈련 코드입니다.

```python
# ===============================
#   K-Fold 학습 루프
# ===============================
def train_kfold(
    csv_file,
    k=5,
    epochs=30,
    batch_size=32,
    lr=1e-3,
    img_size=(128, 128),
    use_augmentation=True,
    patience=10,
    save_dir="./best_model"
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    os.makedirs(save_dir, exist_ok=True)

    # Transform 정의
    transform = A.Compose([
        A.HorizontalFlip(p=0.5) if use_augmentation else A.NoOp(),
        A.RandomBrightnessContrast(p=0.3) if use_augmentation else A.NoOp(),
        A.Resize(img_size[0], img_size[1]),
        ToTensorV2()
    ])

    dataset = RGBHSVDataset_Lite(csv_file, img_size=None, transform=transform)

    brix_all = dataset.data.iloc[:, 1].astype(float).values
    y_bins = _make_stratify_bins(brix_all, n_bins=5)
    skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=42)

    for fold, (tr_idx, va_idx) in enumerate(skf.split(np.arange(len(dataset)), y_bins), start=1):
        print(f"\n Fold {fold}/{k}")

        train_loader = DataLoader(Subset(dataset, tr_idx), batch_size=batch_size, shuffle=True)
        val_loader   = DataLoader(Subset(dataset, va_idx), batch_size=1, shuffle=False)

        model = BrixRegression6CH_Deep().to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max(10, epochs))
        criterion = nn.SmoothL1Loss()

        for epoch in range(1, epochs + 1):
            # ----- Train -----
            model.train()
            run_loss = 0.0
            for images, labels in train_loader:
                images, labels = images.to(device), labels.to(device)
                preds = model(images)
                loss = criterion(preds, labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                run_loss += loss.item() * images.size(0)

            # ----- Validate -----
            model.eval()
            val_preds, val_trues = [], []
            with torch.no_grad():
                for images, labels in val_loader:
                    images = images.to(device)
                    out = model(images)
                    val_preds.append(out.item())
                    val_trues.append(float(labels.item()))

            val_mae = mean_absolute_error(val_trues, val_preds)
            print(f"[Fold {fold}][Epoch {epoch}] TrainLoss={run_loss/len(train_loader.dataset):.4f}, ValMAE={val_mae:.4f}")
```

