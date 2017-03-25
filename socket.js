var net = require('net');

var checkPayload = function checkPayload(buff) {
  //buff has Type Project_id and Log_level_length
  if (buff.length < 6) {
    return false;
  }
  var length = 6 + buff[5] + 1;

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
  msg.log_level = getString(data);
  msg.log_message = getString(data);
  msg.timestamp = getInt(data);
  msg.line_number = getInt(data);
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

var server = net.createServer(function(socket) {
  var buffer = new Buffer([]);
  socket.on('close', function(had_error){

  });

  socket.on('connect', function(){

  });

  socket.on('data', function(data){
    buffer = Buffer.concat([buffer, data]);
    var length = checkPayload(buffer);
    if (length) {
      var message = buffer.slice(0, length);
      buffer = buffer.slice(length, buffer.length);
      message = parseMonitoringMessage(message);
      console.log(message);
    }
  });


});

server.listen(8090, '0.0.0.0');
