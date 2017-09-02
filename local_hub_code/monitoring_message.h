#ifndef MONITORING_MESSAGE
#define MONITORING_MESSAGE

typedef struct Tag {
  uint8_t name_length;
  uint8_t *name;
} Tag;

typedef struct Data {
  uint8_t data_type;
  uint8_t name_length;
  uint8_t *name;
  uint8_t value_length;
  uint8_t *value;
} Data;

typedef struct MonitoringMessage {
  uint8_t type;
  uint32_t project_id;
  uint8_t log_level_length;
  uint8_t *log_level;
  uint8_t log_message_length;
  uint8_t *log_message;
  uint32_t timestamp;
  uint32_t line_number;
  uint8_t filename_length;
  uint8_t *filename;
  uint8_t function_name_length;
  uint8_t *function_name;
  uint8_t num_tags;
  Tag *tags;
  uint8_t num_data;
  Data *data;
} MonitoringMessage;
#endif
