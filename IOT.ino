#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Servo.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <ArduinoJson.h>

// Cấu hình Wi-Fi
const char* ssid = "ten wifi";
const char* password = "abcxyz";

// Khởi tạo Web server
ESP8266WebServer server(80);

// Cấu hình Servo
Servo myServo;
const int servoPin = 15;
const int openAngle = 180;
const int closeAngle = 0;

// Cấu hình cảm biến vân tay
SoftwareSerial mySerial(12, 13); // RX, TX
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Cấu hình LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Khai báo bàn phím
const byte ROWS = 4; // 4 hàng
const byte COLS = 4; // 4 cột
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

byte rowPins[ROWS] = {16, 0, 2, 3};
byte colPins[COLS] = {1, 10, 9, 14};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

//Biến kiểm tra timeout
unsigned long scanStartTime = 0;
const unsigned long scanTimeout = 10000; // Thời gian timeout (10 giây)
const unsigned long scanTimeoutPW = 60000; // Thời gian timeout (60 giây)
const unsigned long scanTimeoutAF = 60000; // Thời gian timeout (60 giây)
bool run = false; // chống lặp 

// Cấu hình mật khẩu
String passwordCode = "1234";
String inputPassword = "";
uint8_t id;

// Hàm khởi tạo
void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Dang ket noi...");

    while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    }
    
    lcd.clear();
    lcd.print("WiFi ket noi!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(2000);
    lcd.clear();

  // Khởi tạo Web Server
    server.on("/fingerprint", handleFingerprintRequest);
    server.on("/password", handlePasswordRequest);
    server.on("/changePassword", handleChangePassword);
    server.on("/deleteFingerprint", deleteFingerprint);
    server.on("/addNewFingerprint", newFingerprintRequest);
    server.on("/listFingerprintID", listFingerprintIDs);
    server.on("/heartbeat", HTTP_POST, handleHeartbeat);
    server.begin();

    myServo.attach(servoPin);
    myServo.write(closeAngle);
    mySerial.begin(57600);
    finger.begin(57600);
}

//Hàm nhận heartbeat từ nodejs
void handleHeartbeat() {
    infoResponse(200, "success", "Device active!", 0);
}

//Hàm xử lý kết quả trả về cho client
void infoResponse(int requestCode, String status, String message, int data){
  // Tạo đối tượng JSON
  StaticJsonDocument<200> jsonResponse; // khai báo đối tượng json() có kích thước tối đa 200 byte
  jsonResponse["status"] = status;
  jsonResponse["message"] = message;
  if(data){
    jsonResponse["data"] = data;
  }
  // Chuyển đổi đối tượng JSON thành chuỗi
  String response;
  serializeJson(jsonResponse, response);

  // Gửi phản hồi JSON
  server.send(requestCode, "application/json", response); //gửi request code 200
  server.client().stop(); // Đóng kết nối sau khi gửi phản hồi
}

// Hàm xử lý yêu cầu mở cửa bằng mật khẩu
void handlePasswordRequest() {
    lcd.clear();
    lcd.print("Nhap mat khau:");

    // Kích hoạt quét vân tay
    scanStartTime = millis(); // Lưu thời gian bắt đầu quét
    while(!scanPassword()); // Lấy mật khẩu nếu được kích hoat
    infoResponse(400, "error", "Unlock fail.", 0);
}

//Mở cửa bằng mật khẩu (truyền từ server)
bool scanPassword() {
  // Kiểm tra timeout
  if (millis() - scanStartTime > scanTimeoutPW) {
      inputPassword = ""; // Reset mật khẩu đã nhập
      lcd.clear();
      lcd.print("Het TG nhap");
      return true;
  }

  char key = keypad.getKey();
  if (key) {
    delay(200); // Chống dội phím, chờ 200ms
    if (key == '#') { // Nhấn '#' để kiểm tra mật khẩu
      if (inputPassword == passwordCode) {
        lcd.clear();
        lcd.print("Mat khau dung!");
        delay(3000); // Giữ 2 giây
        openDoor();
        lcd.clear();
        inputPassword = ""; // Reset mật khẩu đã nhập
        infoResponse(200, "success", "Unlock success!", 0);
        return true;
      } else {
        lcd.clear();
        lcd.print("Mat khau sai!");
        delay(2000); // Hiển thị 2 giây
        inputPassword = ""; // Reset mật khẩu đã nhập
        infoResponse(403, "error", "Unlock fail.", 0);
        return true;
      }
    } else if (key == '*') { // Nhấn '*' để xóa mật khẩu đã nhập
      inputPassword = "";
      lcd.clear();
      lcd.print("Nhap mat khau:");
    } else { // Thêm ký tự vào mật khẩu đã nhập
      inputPassword += key;
      lcd.setCursor(0, 1);
      lcd.print(inputPassword);
    }
  }
  return false;
}

// Hàm xử lý yêu cầu mở cửa bằng vân tay
void handleFingerprintRequest() {
    lcd.clear();
    lcd.print("Đang quet van tay...");
    // Kích hoạt quét vân tay
    scanStartTime = millis(); // Lưu thời gian bắt đầu quét
    while(!scanFingerprint());
    infoResponse(400, "error", "Unlock fail.", 0);
}

int getId(){
  for (int id = 1; id <= 127; id++) {
      uint8_t result = finger.loadModel(id);
      if (result == FINGERPRINT_OK) {
          return id;
      }
  }
  return -1;
}

// Hàm quét vân tay liên tục
bool scanFingerprint() {
    //Thực hiện quét vân tay
    int result = finger.getImage(); // Lấy hình ảnh từ cảm biến
    if (result == FINGERPRINT_OK) {
    result = finger.image2Tz(); // chuyển hình ảnh thành mẫu đặc trung có thể so sánh được
    if (result == FINGERPRINT_OK) {
        result = finger.fingerSearch(); // tìm kiếm 
        if (result == FINGERPRINT_OK) {
        lcd.clear();
        lcd.print("Xin chao!");
        openDoor();
        infoResponse(200, "success", "Unlock success!", getId());
        return true;
        } else {
            lcd.clear();
            lcd.print("Van tay sai");
        }
    }
  } else {
    lcd.clear();
    lcd.print("Khong thay van tay");
  }
  return false;
}

//Xoá vân tay theo id
void deleteFingerprint() {
    if (server.hasArg("id")) { // Kiểm tra nếu yêu cầu HTTP có tham số "id"
        int fingerID = server.arg("id").toInt(); // Lấy ID từ tham số "id"
        // Kiểm tra nếu ID hợp lệ (trong khoảng 1 đến 127)
        if (fingerID < 1 || fingerID > 127) {
            lcd.clear();
            lcd.print("ID khong hop le");
            infoResponse(403, "error", "Invalid ID.", 0);
            return;
        }

        // Thực hiện xoá vân tay với ID đã cho
        uint8_t result = finger.deleteModel(fingerID);
        if (result == FINGERPRINT_OK) {
            lcd.clear();
            lcd.print("Xoa thanh cong");
            infoResponse(200, "success", "Delete success!", 0);
            return;
        } else if (result == FINGERPRINT_PACKETRECIEVEERR) {
            lcd.clear();
            lcd.print("Loi giao tiep");
            infoResponse(400, "error", "Commmunication error.", 0);
            return;
        } else if (result == FINGERPRINT_BADLOCATION) {
            lcd.clear();
            lcd.print("ID khong ton tai");
            infoResponse(403, "error", "ID not exist.", 0);
            return;
        } else {
            lcd.clear();
            lcd.print("Xoa that bai");
            infoResponse(500, "error", "Delete fail.", 0);
            return;
        }
    } else {
        infoResponse(400, "error", "Missing ID Parameter.", 0);
        return;
    }
}

// Hàm xử lý yêu cầu thêm vân tay
void newFingerprintRequest() {
    lcd.clear();
    lcd.print("Đang quet van tay...");

    // Kích hoạt quét vân tay
    scanStartTime = millis(); // Lưu thời gian bắt đầu quét
    run = false;
    while(!scanAddFinger());// Lấy vân tay để thêm mới
    infoResponse(400, "error", "Add fingerprint fail.", 0);
}

//Phần thực hiện xử lý thêm vân tay
uint8_t readnumber(void) {
  uint8_t num = 0;

  while (num == 0) {
    while (! Serial.available());
    num = Serial.parseInt();
  }
  return num;
}

bool scanAddFinger(){
  scanStartTime = millis();

  if(run){
    return true;
  }
  Serial.println("Ready to enroll a fingerprint!");
  Serial.println("Please type in the ID # (from 1 to 127) you want to save this finger as...");
  if (server.hasArg("id")) {
    id = server.arg("id").toInt(); // Lấy ID từ tham số "id"
    run = true;
  }
  else{
    id = readnumber();
    run = true;
  }
  if (id == 0) {// ID #0 not allowed, try again!
    return true;
  }
  Serial.print("Enrolling ID #");
  Serial.println(id);
  while (! getFingerprintEnroll() );
  return false;
}

uint8_t getFingerprintEnroll() {

  int p = -1;
  Serial.print("Waiting for valid finger to enroll as #"); Serial.println(id);
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
    case FINGERPRINT_OK:
      Serial.println("Image taken");
      break;
    case FINGERPRINT_NOFINGER:
      Serial.print(".");
      break;
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("Communication error");
      break;
    case FINGERPRINT_IMAGEFAIL:
      Serial.println("Imaging error");
      break;
    default:
      Serial.println("Unknown error");
      break;
    }
  }

  // OK success!

  p = finger.image2Tz(1);
  switch (p) {
    case FINGERPRINT_OK:
      Serial.println("Image converted");
      break;
    case FINGERPRINT_IMAGEMESS:
      Serial.println("Image too messy");
      return p;
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("Communication error");
      return p;
    case FINGERPRINT_FEATUREFAIL:
      Serial.println("Could not find fingerprint features");
      return p;
    case FINGERPRINT_INVALIDIMAGE:
      Serial.println("Could not find fingerprint features");
      return p;
    default:
      Serial.println("Unknown error");
      return p;
  }

  Serial.println("Remove finger");
  delay(2000);
  p = 0;
  while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
  }
  Serial.print("ID "); Serial.println(id);
  p = -1;
  Serial.println("Place same finger again");
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
    case FINGERPRINT_OK:
      Serial.println("Image taken");
      break;
    case FINGERPRINT_NOFINGER:
      Serial.print(".");
      break;
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("Communication error");
      break;
    case FINGERPRINT_IMAGEFAIL:
      Serial.println("Imaging error");
      break;
    default:
      Serial.println("Unknown error");
      break;
    }
  }

  // OK success!

  p = finger.image2Tz(2);
  switch (p) {
    case FINGERPRINT_OK:
      Serial.println("Image converted");
      break;
    case FINGERPRINT_IMAGEMESS:
      Serial.println("Image too messy");
      return p;
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("Communication error");
      return p;
    case FINGERPRINT_FEATUREFAIL:
      Serial.println("Could not find fingerprint features");
      return p;
    case FINGERPRINT_INVALIDIMAGE:
      Serial.println("Could not find fingerprint features");
      return p;
    default:
      Serial.println("Unknown error");
      return p;
  }

  // OK converted!
  Serial.print("Creating model for #");  Serial.println(id);

  p = finger.createModel();
  if (p == FINGERPRINT_OK) {
    Serial.println("Prints matched!");
  } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("Communication error");
    return p;
  } else if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("Fingerprints did not match");
    return p;
  } else {
    Serial.println("Unknown error");
    return p;
  }

  Serial.print("ID "); Serial.println(id);
  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    Serial.println("Stored!");
    lcd.clear();
    lcd.print("Them van tay TC");
    infoResponse(200, "success", "Add fingerprint success!", 0);
  } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("Communication error");
    return p;
  } else if (p == FINGERPRINT_BADLOCATION) {
    Serial.println("Could not store in that location");
    return p;
  } else if (p == FINGERPRINT_FLASHERR) {
    Serial.println("Error writing to flash");
    return p;
  } else {
    Serial.println("Unknown error");
    return p;
  }
  return true;
}

//Thay đổi mật khẩu
void handleChangePassword() {
  if (server.hasArg("currentPassword") && server.hasArg("newPassword")) {
    String currentPassword = server.arg("currentPassword");
    String newPassword = server.arg("newPassword");
    Serial.println(currentPassword);
    Serial.println(newPassword);
    if (currentPassword == passwordCode) {
      passwordCode = newPassword;
      lcd.clear();
      lcd.print("Doi MK thanh cong");
      infoResponse(200, "success", "Update password success!", 0);
      return;
    } else {
      lcd.clear();
      lcd.print("MK cu sai");
      infoResponse(403, "error", "Incorrect Current Password.", 0);
    }
  } else {
    infoResponse(400, "error", "Bad Request.", 0);
  }
}

//liệt kê danh sách fingerprintID
void listFingerprintIDs() {
    bool foundAny = false;
    for (int id = 1; id <= 127; id++) {
        uint8_t result = finger.loadModel(id);
        if (result == FINGERPRINT_OK) {
            Serial.print("Fingerprint ID ");
            Serial.print(id);
            Serial.println(" is registered.");
            foundAny = true;
            infoResponse(200, "success", "Get list success!", 0);
            return;
        }
    }
    if (!foundAny) {
        Serial.println("No fingerprints found.");
    }
}
void openDoor() {
  myServo.write(openAngle);
  delay(5000);
  myServo.write(closeAngle);
  lcd.clear();
  lcd.print("Cua da dong");
}

void loop() {
  server.handleClient(); // Xử lý yêu cầu từ Web Server
}