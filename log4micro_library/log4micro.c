#include "log4micro.h"

Log4Micro log4micro;

#define L_CONNECT(msg) log_monitoring_message(msg, 0, "NOTIF", __FILE__, __FUNCTION__, __LINE__);
#define LOG_MESSAGE(msg, level) log_monitoring_message(msg, 1, level, __FILE__, __FUNCTION__, __LINE__);



int meets_level(int log_level) {
  while (log4micro.serial->available()) {
    uint8_t num = log4micro.serial->read();
    if (num < 7) {
      log4micro.level_control = num;

    }
    Serial.println("Recieved Message");
  }
  if (log_level + 1 < log4micro.level_control) { return 0; }
  return 1;
}

void log_monitoring_message_check(const char *message, int lv, const char *log_level, const char *file_name, const char* func_name, const uint32_t line) {
  if (meets_level(lv)) {
    Serial.println("Sending Message");
    log_monitoring_message(message, 1, log_level, file_name, func_name, line);
  }
}

void log_monitoring_message_check(const char *message, int lv, const char *log_level, const char *file_name, const char* func_name, const uint32_t line, const char *vname, int val) {
  if (meets_level(lv)) {
    Serial.println("Sending Message");
    log_monitoring_message(message, 1, log_level, file_name, func_name, line, vname, val);
  }
}

void log_monitoring_message(const char *message, uint8_t type, const char *log_level, const char *file_name, const char* func_name, const uint32_t line) {
    uint8_t preamble = 0;
    uint8_t counter = 0;
    log4micro.serial->write((uint8_t)170);
    while(preamble != 80) {
      while (!log4micro.serial->available()) {
             counter += 1;
      if (counter > 100) {
        counter = 0;
        log4micro.serial->write((uint8_t)170);
      }
        delay(10);
      }
           counter += 1;
      if (counter > 100) {
        counter = 0;
        log4micro.serial->write((uint8_t)170);
      }

      preamble = log4micro.serial->read();
      Serial.print("Received Preamble: ");
      Serial.println(preamble, DEC);
    }
    counter = 0;
    uint8_t mmBuff[10];
    mmBuff[0] = type;
    mmBuff[1] = (log4micro.project_id >> 24) % 256;
    mmBuff[2] = (log4micro.project_id >> 16) % 256;
    mmBuff[3] = (log4micro.project_id >> 8) % 256;
    mmBuff[4] = (log4micro.project_id) % 256;
    mmBuff[5] = strlen(log_level);
    log4micro.serial->write(mmBuff, 6);
    log4micro.serial->write(log_level, mmBuff[5]);
    mmBuff[0] = strlen(message);
    log4micro.serial->write(mmBuff[0]);
    log4micro.serial->write(message, mmBuff[0]);
    mmBuff[0] = 0;
    mmBuff[1] = 0;
    mmBuff[2] = 0;
    mmBuff[3] = 0;
    mmBuff[4] = (line >> 24) % 256;
    mmBuff[5] = (line >> 16) % 256;
    mmBuff[6] = (line >> 8) % 256;
    mmBuff[7] = (line) % 256;
    mmBuff[8] = strlen(file_name);

    log4micro.serial->write(mmBuff, 9);
    log4micro.serial->write(file_name, mmBuff[8]);
    mmBuff[0] = strlen(func_name);
    log4micro.serial->write(mmBuff[0]);
    log4micro.serial->write(func_name, mmBuff[0]);
    log4micro.serial->write((uint8_t)0);
    log4micro.serial->write((uint8_t)0);
}
void log_monitoring_message(const char *message, uint8_t type, const char *log_level, const char *file_name, const char* func_name, const uint32_t line, const char *vname, int val) {
    uint8_t preamble = 0;
    uint8_t counter = 0;
    log4micro.serial->write((uint8_t)170);
    while(preamble != 80) {
      while (!log4micro.serial->available()) {
             counter += 1;
      if (counter > 100) {
        counter = 0;
        log4micro.serial->write((uint8_t)170);
      }
        delay(10);
      }
           counter += 1;
      if (counter > 100) {
        counter = 0;
        log4micro.serial->write((uint8_t)170);
      }

      preamble = log4micro.serial->read();
      Serial.print("Received Preamble: ");
      Serial.println(preamble, DEC);
    }
    counter = 0;
    uint8_t mmBuff[10];
    mmBuff[0] = type;
    mmBuff[1] = (log4micro.project_id >> 24) % 256;
    mmBuff[2] = (log4micro.project_id >> 16) % 256;
    mmBuff[3] = (log4micro.project_id >> 8) % 256;
    mmBuff[4] = (log4micro.project_id) % 256;
    mmBuff[5] = strlen(log_level);
    log4micro.serial->write(mmBuff, 6);
    log4micro.serial->write(log_level, mmBuff[5]);
    mmBuff[0] = strlen(message);
    log4micro.serial->write(mmBuff[0]);
    log4micro.serial->write(message, mmBuff[0]);
    mmBuff[0] = 0;
    mmBuff[1] = 0;
    mmBuff[2] = 0;
    mmBuff[3] = 0;
    mmBuff[4] = (line >> 24) % 256;
    mmBuff[5] = (line >> 16) % 256;
    mmBuff[6] = (line >> 8) % 256;
    mmBuff[7] = (line) % 256;
    mmBuff[8] = strlen(file_name);

    log4micro.serial->write(mmBuff, 9);
    log4micro.serial->write(file_name, mmBuff[8]);
    mmBuff[0] = strlen(func_name);
    log4micro.serial->write(mmBuff[0]);
    log4micro.serial->write(func_name, mmBuff[0]);
    log4micro.serial->write((uint8_t)0);
    log4micro.serial->write((uint8_t)1);
    log4micro.serial->write((uint8_t)0);
    mmBuff[0] = strlen(vname);
    log4micro.serial->write(mmBuff[0]);
    log4micro.serial->write(vname, mmBuff[0]);
    mmBuff[0] = 4;
    mmBuff[1] = (val >> 24) % 256;
    mmBuff[2] = (val >> 16) % 256;
    mmBuff[3] = (val >> 8) % 256;
    mmBuff[4] = (val) % 256;
    log4micro.serial->write(mmBuff, 5);
}

void log4micro_connect(const char *title, int project_id) {
  log4micro.project_id = project_id;
  log4micro.serial = &serial;
  log4micro.serial->begin(4800);
  delay(100);
  L_CONNECT(title);
}
