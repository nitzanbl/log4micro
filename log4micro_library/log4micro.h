#ifndef __LOG_4_MICRO_H__
#define __LOG_4_MICRO_H__

#include <SoftwareSerial.h>

typedef struct Log4Micro {
  SoftwareSerial *serial;
  uint32_t project_id;
  uint8_t level_control = 0;
} Log4Micro;

extern Log4Micro log4micro;

#define L_TRACE(msg) log_monitoring_message_check(msg, 0, "TRACE", __FILE__, __FUNCTION__, __LINE__);
#define L_TRACE_I(msg, x) log_monitoring_message_check(msg, 1, "TRACE", __FILE__, __FUNCTION__, __LINE__, #x, x);
#define L_DEBUG(msg) log_monitoring_message_check(msg, 1, "DEBUG", __FILE__, __FUNCTION__, __LINE__);
#define L_DEBUG_I(msg, x) log_monitoring_message_check(msg, 1, "DEBUG", __FILE__, __FUNCTION__, __LINE__, #x, x);
#define L_INFO(msg) log_monitoring_message_check(msg, 2, "INFO", __FILE__, __FUNCTION__, __LINE__);
#define L_INFO_I(msg, x) log_monitoring_message_check(msg, 1, "INFO", __FILE__, __FUNCTION__, __LINE__, #x, x);
#define L_WARN(msg) log_monitoring_message_check(msg, 3, "WARN", __FILE__, __FUNCTION__, __LINE__);
#define L_WARN_I(msg, x) log_monitoring_message_check(msg, 1, "WARN", __FILE__, __FUNCTION__, __LINE__, #x, x);
#define L_ERROR(msg) log_monitoring_message_check(msg, 4, "ERROR", __FILE__, __FUNCTION__, __LINE__);
#define L_ERROR_I(msg, x) log_monitoring_message_check(msg, 1, "ERROR", __FILE__, __FUNCTION__, __LINE__, #x, x);

void log4micro_connect(const char *title, int project_id);

void log_monitoring_message_check(const char *message, int lv, const char *log_level, const char *file_name, const char* func_name, const uint32_t line);
void log_monitoring_message_check(const char *message, int lv, const char *log_level, const char *file_name, const char* func_name, const uint32_t line, const char *vname, int val);
void log_monitoring_message(const char *message, uint8_t type, const char *log_level, const char *file_name, const char* func_name, const uint32_t line);
void log_monitoring_message(const char *message, uint8_t type, const char *log_level, const char *file_name, const char* func_name, const uint32_t line, const char *vname, int val);

#endif
