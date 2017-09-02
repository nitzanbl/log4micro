
#include <wm_os.h>
#include <app_framework.h>
#include <cli.h>
#include <wm_os.h>
#include "monitoring_message.h"
#include <mdev_uart.h>

#define PORT 8090

#define MAXBUF 128

int messageIsFull(uint8_t *buff, uint32_t totalBytesRead) {
	int length = 0;
	int numTags = 0;
	int numData = 0;
	int i;

	if (totalBytesRead < 6) {
    return false;
  }
  length = 6 + buff[5] + 1;

  //buff has log_level and log_message_length
  if (totalBytesRead < length) {
    return 0;
  }
  length += buff[length-1] + 4 + 4 + 1 ;

  //buff has log_message timestamp line_number and file_name_length
  if (totalBytesRead < length) {
    return 0;
  }
  length += buff[length-1] + 1 ;

  //buff has file_name and function_name_length
  if (totalBytesRead < length) {
    return 0;
  }
  length += buff[length-1] + 1 ;

  //buff has function_name and number_of_tags
  if (totalBytesRead < length) {
    return 0;
  }

  numTags = buff[length - 1];
  for(i=0; i<numTags; ++i) {
    //buff has tag_length
    if(totalBytesRead < length + 1) {
      return 0;
    }
    length += buff[length] + 1;
    //buff has tag
    if(totalBytesRead < length) {
      return 0;
    }
  }


  //buff has number_of_data_fields
  if (totalBytesRead < length + 1) {
    return 0;
  }

  numData = buff[length];

  length += 1;
  for(i=0; i<numData; ++i) {
    //buff has data_type and name_length
    if(totalBytesRead < length + 2) {
      return 0;
    }
    length += buff[length + 1] + 2 + 1;
    //buff has data_name and value_length
    if(totalBytesRead < length) {
      return 0;
    }
    length += buff[length - 1];
    //buff has data_value
    if(totalBytesRead < length) {
      return 0;
    }

  }
	return length;
}
const char *LOG_LEVELS[] = {
	"ALL", "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "OFF"
};

void load_log_level(uint8_t *buff, uint32_t totalBytesRead, char *str) {
	int length = 0;

	if (totalBytesRead < 6) {
    return;
  }
  length = 6;
	memcpy(str, buff + length, buff[5]);
	str[buff[5]] = '\0';
	return;
}

void load_message(uint8_t *buff, uint32_t totalBytesRead, char *str) {
	int length = 0;

	if (totalBytesRead < 6) {
    return;
  }
  length = 6 + buff[5] + 1;
	memcpy(str, buff + length, buff[length-1]);
	str[buff[length-1]] = '\0';
	return;
}

int client_start(char *hostname)
{
	const uint8_t messagePreamble = 80;
	int sockfd;
	mdev_t *dev;
	uint8_t level_control = 0;
	uint8_t log4microBuffer[1000];
	uint8_t hadError;
	int totalBytesRead = 0;
	uart_drv_init(UART1_ID, UART_8BIT);
	/* handle */
	dev = uart_drv_open(UART1_ID, 4800);
	/* Get host address from the input name */
	struct hostent *hostinfo = gethostbyname(hostname);
	if (!hostinfo) {
		wmprintf("gethostbyname Failed\r\n");
		return -WM_FAIL;
	}

	struct sockaddr_in dest;

	char buffer[MAXBUF];
	/* Create a socket */
	/*---Open socket for streaming---*/
	if ((sockfd = net_socket(AF_INET, SOCK_STREAM, 0)) < 0) {
		wmprintf("Error in socket\r\n");
		return -WM_FAIL;
	}

	/*---Initialize server address/port struct---*/
	memset(&dest, 0, sizeof(dest));
	dest.sin_family = AF_INET;
	dest.sin_port = htons(PORT);
	dest.sin_addr = *((struct in_addr *) hostinfo->h_addr);
	char ip[16];
	int i;
	uint32_t address = dest.sin_addr.s_addr;
	net_inet_ntoa(address, ip);

	wmprintf("Server ip Address : %s\r\n", ip);
	/*---Connect to server---*/
	if (net_connect(sockfd,
			 (struct sockaddr *)&dest,
			 sizeof(dest)) != 0) {
		wmprintf("Error in connect\r\n");
		return -WM_FAIL;
	}
	net_socket_blocking(sockfd, NET_BLOCKING_OFF);
	/*---Get "Hello?"---*/
	memset(buffer, 0, MAXBUF);
	char wbuf[]
		= "Hello From Marvell\n";
	int rlen = 0;

	uint8_t tmp;
	uint32_t bRead;
	int messageSize = 0;
	uint8_t mmBuff[10];
	uint8_t startedMessage = 0;
	int num;
	while (1) {
		while (!startedMessage) {
			bRead = uart_drv_read(dev, log4microBuffer, 1);
			if (bRead > 0) {
				num = log4microBuffer[0];
				if (num == 170) {
					startedMessage = true;
					totalBytesRead = 0;
					uart_drv_write(dev, (uint8_t *)&messagePreamble, 1);
					break;
				}
			}
		}

		bRead = uart_drv_read(dev, log4microBuffer + totalBytesRead, 1);

		if (bRead > 0) {
			hadError = 0;
			for (i = 0; i < bRead; i+= 1) {
				num = log4microBuffer[totalBytesRead+i];
				if (num == 170) {
					hadError = 1;
					break;
				}
			}
			if (hadError) {
				totalBytesRead = 0;
				wmprintf("Writing message C\r\n");
				uart_drv_write(dev, (uint8_t *)&messagePreamble, 1);
				continue;
			}
			num = log4microBuffer[totalBytesRead];
			totalBytesRead += bRead;
			messageSize = messageIsFull(log4microBuffer, totalBytesRead);
			if (messageSize > 0) {
				startedMessage = false;

				uart_drv_write(dev, (uint8_t *)&level_control, 1);
				load_log_level(log4microBuffer, totalBytesRead, buffer);
				wmprintf("    %s - ", buffer);
				load_message(log4microBuffer, totalBytesRead, buffer);
				wmprintf("%s\r\n", buffer);
				net_write(sockfd, log4microBuffer, messageSize);
				if (totalBytesRead - messageSize > 0) {
					memcpy(log4microBuffer, log4microBuffer + messageSize, totalBytesRead - messageSize);
				}
				totalBytesRead = 0;
			}
		}

			if (recv(sockfd, &tmp, 2, MSG_PEEK) > 0) {
				rlen = net_read(sockfd, buffer, 2);
				if (rlen >= 2) {
					if (buffer[rlen-2] == 1) {
						wmprintf("**** Log Level Change = %s\r\n", LOG_LEVELS[buffer[rlen-1]]);
						level_control = buffer[rlen-1];
						uart_drv_write(dev, (uint8_t *)&buffer[rlen-1], 1);

					}
				}
			}

	}
	close(sockfd);
	return 0;
}


static void cmd_client_cli(int argc, char **argv)
{
	if (argc !=  2) {
		wmprintf("invalid arguments\r\n");
		return;
	}
	client_start(argv[1]);
}

static struct cli_command client_cli_cmds[] = {
	{"client-connect",
	 "<host name>",
	 cmd_client_cli}
};

int client_cli_init()
{
	return cli_register_command(&client_cli_cmds[0]);
}
