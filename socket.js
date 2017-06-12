var net = require('net');
var pg = require('pg');
var Pool = require('pg-pool');
var http = require('http');
var io = require('socket.io');
////////////////////// Management Message Socket////////////////////
var logLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
var clients = [];
var localHubs = {};
var server = http.createServer(function(req, res){
    res.writeHead(200,{ 'Content-Type': 'text/html' });
    res.end('log4micro web socket');
});

server.listen(8080);

// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client){
    console.log('someone connected');
    clients.push(client);
    // Success!  Now listen to messages to be received
    client.on('message',function(event){

      pool.connect().then(function(client) {
        client.query('update projects set level_control = $1 where id = $2;',
        [event.log_level, event.project_id], function(err, res) {
          if(err) {
            console.log(err);
            return;
          }else {
            console.log('level control was changed !');
          }
        });
      }).catch(function(err) {
        console.log("DB ERROR", err);
      });


        if (localHubs.hasOwnProperty(event.project_id)) {
          var log_level  = 0;
          if (event.log_level == 'TRACE') {
            log_level = 1;
          } else if(event.log_level == 'DEBUG') {
            log_level = 2;
          } else if(event.log_level == 'INFO') {
            log_level = 3;
          } else if(event.log_level == 'WARN') {
            log_level = 4;
          } else if(event.log_level == 'ERROR') {
            log_level = 5;
          } else if(event.log_level == 'FATAL') {
            log_level = 6;
          } else if(event.log_level == 'OFF') {
            log_level = 7;
          }
          var message = new Buffer([1, log_level]);
          localHubs[event.project_id].write(message);
        }
        console.log('Received message from client!',event);
    });

    client.on('disconnect',function(){
        console.log('Server has disconnected');
        clients.splice(clients.indexOf(client), 1);
    });
});


////////////////////// Monitoring Message Socket////////////////////

//var client = new pg.Client({host: 'localhost', user: 'postgres', database: 'log4micro', password: 'log4micro'});
var pool = new Pool({host: 'localhost', user: 'postgres', database: 'log4micro', password: 'log4micro', max: 10, min: 4})

var checkPayload = function checkPayload(buff) {
  //buff has Type Project_id session_id and Log_level_length
  if (buff.length < 10) {
    return false;
  }
  var length = 10 + buff[5] + 1;

  //buff has log_level and log_message_length
  if (buff.length < length) {
    return false;
  }
  length += buff[length-1] + 4 + 4 + 1 ;

  //buff has log_message timestamp line_number and file_name_length
  if (buff.length < length) {
    return false;
  }
  length += buff[length-1] + 1 ;

  //buff has file_name and function_name_length
  if (buff.length < length) {
    return false;
  }
  length += buff[length-1] + 1 ;

  //buff has function_name and number_of_tags
  if (buff.length < length) {
    return false;
  }

  var numTags = buff[length - 1];
  for(var i=0; i<numTags; ++i) {
    //buff has tag_length
    if(buff.length < length + 1) {
      return false;
    }
    length += buff[length] + 1;
    //buff has tag
    if(buff.length < length) {
      return false;
    }
  }


  //buff has number_of_data_fields
  if (buff.length < length + 1) {
    return false;
  }

  var numData = buff[length];

  length += 1;
  for(var i=0; i<numData; ++i) {
    //buff has data_type and name_length
    if(buff.length < length + 2) {
      return false;
    }
    length += buff[length + 1] + 2 + 1;
    //buff has data_name and value_length
    if(buff.length < length) {
      return false;
    }
    length += buff[length - 1];
    //buff has data_value
    if(buff.length < length) {
      return false;
    }

  }

  return length;

}

var sendTriggerNotification = function sendTriggerNotification(trigger, data) {
  clients = clients.filter(function(c) {
    try {
      c.emit('trigger_notification', {
        message: trigger.message,
        name: data.name,
      });
      return true;
    } catch(e) {
      console.log("exception : " + e);
      return false;
    }
  })
}

var parseDataType = function parseDataType(data, type) {
  try {
    if (type == 0) {
      return data.readInt32BE();
    } else if (type == 1) {
      data.toString();
    } else if (type == 3) {
      return data.readFloatBE();
    } else if (type == 4) {
      return (data.readInt32BE(0)<<8) + data.readInt32BE(4)
    }
  } catch(e) {
    return null;
  }
}
// types 0-int 1-string 2-bool 3-float 4-pointer 5-binary 4n-array of type n
var testCompareData = function testCompareData(trigger, data) {
  if (trigger.trigger_data_name != data.name) { return false }
  if(data.type == -1) {
    if(trigger.trigger_condition == '>') {
      if(data.value > trigger.trigger_value[0]) {
        return true;
      }
    } else if(trigger.trigger_condition == '<') {
      if(data.value < trigger.trigger_value[0]) {
        return true;
      }

    } else if(trigger.trigger_condition == '=') {
      if(data.value == trigger.trigger_value[0]) {
        return true;
      }

    } else if(trigger.trigger_condition == '!=') {
      if(data.value != trigger.trigger_value[0]) {
        return true;
      }
    }
  } else if (data.type == 2 || data.type == 5 || data.type >= 40) {
    if (trigger.trigger_condition == '=') {
      if (data.value.equals(trigger.trigger_value)) {
        return true;
      }
   } else if(trigger.trigger_condition == '!=') {
     if (!data.value.equals(trigger.trigger_value)) {
       return true;
     }
   }
 } else {
  var trigger_value = parseDataType(trigger.trigger_value, data.type);
  var data_value = parseDataType(data.value, data.type);
  if(trigger.trigger_condition == '>') {
    if(data_value > trigger_value) {
      return true;
    }
  } else if(trigger.trigger_condition == '<') {
    if(data_value < trigger_value) {
      return true;
    }

  } else if(trigger.trigger_condition == '=') {
    if(data_value == trigger_value) {
      return true;
    }

  } else if(trigger.trigger_condition == '!=') {
    if(data_value != trigger_value) {
      return true;
    }
  }
}
return false;
}

var checkForTriggers = function checkForTriggers(psql, message) {
  var dataMap = {log4micro_log_level: {type: -1, name: 'log4micro_log_level', value: logLevels.indexOf(message.log_level)}};
  var data_numbers = '';
  var trigger_q_values = [message.project_id, 'log4micro_log_level']
  if (message.data.length > 0) {
    data_numbers = ', ' + message.data.map(function(d,i) {
      dataMap[d.name] = d;
      trigger_q_values.push(d.name)
      return '$'+(i+2);
    }).join(', ')
  }
  psql.query('SELECT * FROM triggers where project_id = $1 and trigger_data_name in ($2' + data_numbers + ');', trigger_q_values, function(err, res) {
    if(err) {
      console.log(err);
    } else {
      for(var i=0; i<res.rows.length; i+=1) {
        if(dataMap.hasOwnProperty(res.rows[i].trigger_data_name)) {
          if(testCompareData(res.rows[i], dataMap[res.rows[i].trigger_data_name])) {
            sendTriggerNotification(res.rows[i], dataMap[res.rows[i].trigger_data_name]);
          }
        }
      }
    }
  });

}

var getByte = function getByte(data) {
  var n = data.buff[0];
  data.buff = data.buff.slice(1, data.buff.length);
  return n;
}

var getInt = function getInt(data) {
  var x = (data.buff[0] << 24) + (data.buff[1] << 16) + (data.buff[2] << 8) + (data.buff[3]);
  data.buff = data.buff.slice(4, data.buff.length);
  return x;
}

var getString = function getString(data) {
  var length = data.buff[0];
  var str = data.buff.slice(1, 1 + length);
  data.buff = data.buff.slice(1 + length, data.buff.length);
  return str.toString();
}

var getHex = function getHex(data) {
  var length = data.buff[0];
  var hex = data.buff.slice(1, 1 + length);
  data.buff = data.buff.slice(1 + length, data.buff.length);
  var tmp = [];
  for(var i=0; i<hex.length; i+=1){
    tmp.push(('0' + (hex[i] & 0xFF).toString(16)).slice(-2))
  }
  return tmp.join('');
}


var parseMonitoringMessage = function parseMonitoringMessage(buff) {
  var data = {buff: buff}
  var msg = {};
  msg.command_type = getByte(data);
  msg.project_id = getInt(data);
  msg.session_id = getInt(data);
  msg.log_level = getString(data);
  msg.log_message = getString(data);
  msg.time = getInt(data);
  msg.line = getInt(data);
  msg.file_name = getString(data);
  msg.function_name = getString(data);
  msg.tags = [];
  var numTags = getByte(data);
  for(var i =0; i<numTags; i+=1) {
    msg.tags.push(getString(data));
  }
  msg.data = [];
  var numData = getByte(data);
  for(var i =0; i<numData; i+=1) {
    var type = getByte(data);
    var name = getString(data);
    var value = getHex(data);
    msg.data.push({
      type: type,
      name: name,
      value: value
    });
  }
  return msg;
}


//client.connect(function(err) {
  //if(err) {
  //  throw err;
  //}
//  startServer(client);
//});




var startServer = function startServer(client) {
  var server = net.createServer(function(socket) {
    console.log('socket connected');
    var socket_project_id = null;
    var buffer = new Buffer([]);
    socket.on('close', function(had_error){
      if(socket_project_id != null) {
        delete localHubs[socket_project_id];
        socket_project_id = null;
      }
    });


    socket.on('data', function(data){
      buffer = Buffer.concat([buffer, data]);
      var length = checkPayload(buffer);
      if (length) {
        var message = buffer.slice(0, length);
        buffer = buffer.slice(length, buffer.length);
        message = parseMonitoringMessage(message);
        localHubs[message.project_id] = socket;
        socket_project_id = message.project_id;
        clients = clients.filter(function(c) {
          try {
            c.send(message);
            return true;
          } catch(e) {
            console.log("exception : " + e);
            return false;
          }
        })
        pool.connect().then(function(client) {

          var data_numbers = '';
          var trigger_q_values = [4, 'log4micro_log_level']
          if (message.data.length > 0) {
            data_numbers = ', ' + message.data.map(function(d,i) {
              trigger_q_values.push(d.name)
              return '$'+(i+2);
            }).join(', ')
          }
          'SELECT * FROM triggers where project_id = $1 and trigger_data_name in ($2' + data_numbers + ');';

          client.query('insert into logs (project_id, session_id, log_level, log_message, tags, time, function_name, file_name, line, type)\
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *;',
          [message.project_id, message.session_id, message.log_level, message.log_message, message.tags, new Date(message.time*1000), message.function_name, message.file_name, message.line, message.command_type], function(err, res) {
            if(err) {
              console.log(err);
              return;
            }else {
              console.log('log was inserted');
              if(message.data.length > 0){
                var log_id = res.rows[0].id;
                var query = 'insert into data (project_id, log_id, name, value, type) values ';
                var pre = '';
                var vals= [message.project_id, log_id];
                for(var i=0; i<message.data.length; i+=1){
                  query += pre+ '($1, $2, $'+(vals.length+1)+', $'+(vals.length+2)+', $'+(vals.length+3)+')';
                  pre = ', ';
                  vals.push(message.data[i].name);
                  vals.push(new Buffer(message.data[i].value, 'hex'));
                  vals.push(message.data[i].type);
                }
                query +=  ';';
                client.query(query, vals, function(err, res){
                  if(err){
                    console.log(err);
                  }else {
                    console.log('data was inserted');
                  }
                });
              }
            }
          });
        }).catch(function(err) {
          console.log("DB ERROR", err);
        });

      }
    });


  });

  server.listen(8090, '0.0.0.0');
}

startServer();
