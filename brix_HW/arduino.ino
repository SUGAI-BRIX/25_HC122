#include <AccelStepper.h>
#include <Servo.h> 

#define enablePin 8   
#define dirxPin   2   
#define stepxPin  5   
#define motorInterfaceType 1
#define servoPin 9   

AccelStepper stepperx(motorInterfaceType, stepxPin, dirxPin);
Servo myservo;

bool running = false;


void setup() {
  pinMode(enablePin, OUTPUT);
  digitalWrite(enablePin, LOW);    
  
  stepperx.setMaxSpeed(1000);
  stepperx.setSpeed(-900);          // 속도 설정
  digitalWrite(dirxPin, LOW);     

  myservo.attach(servoPin);  // 서보 모터 핀 연결
  myservo.write(50);          // 서보 초기 위치 0도

  Serial.begin(9600);  
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read(); 

    // 서보 제어 (각도 설정)
    if (cmd == 'S') {
      myservo.write(0);    // 'S' → 0도
    } else if (cmd == 'A') {
      myservo.write(20);   // 'A' → 20도
    } else if (cmd == 'B') {
      myservo.write(50);   // 'B' → 50도
    } else if (cmd == 'C') {
      myservo.write(75);  // 'C' → 75도
    }

    // 스테퍼 모터 제어 (시작/정지)
    if (cmd == '1') {
      running = true;
      digitalWrite(enablePin, LOW);  
    } else if (cmd == '0') {
      running = false;
      digitalWrite(enablePin, HIGH);
    }
  }

  if (running) {
    stepperx.runSpeed();
  }

}