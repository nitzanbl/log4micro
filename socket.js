var net = require('net');
var pg = require('pg');
var http = require('http');
var io = require('socket.io');
////////////////////// Management Message Socket////////////////////
var clients = [];
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
        console.log('Received message from client!',event);
    });

    client.on('disconnect',function(){
        console.log('Server has disconnected');
        clients.splice(clients.indexOf(client), 1);
    });
});


////////////////////// Monitoring Message Socket////////////////////

//var client = new pg.Client({host: 'localhost', user: 'postgres', database: 'log4micro', password: 'log4micro'});

var checkPayload = function checkPayload(buff) {
  console.log('buff.length: '+ buff.length);

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
  console.log('until tags');
  var numTags = buff[length - 1];
  for(var i=0; i<numTags; ++i) {
    console.log('for tags');

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

  console.log('after tags');


  //buff has number_of_data_fields
  if (buff.length < length + 1) {
    return false;
  }

  var numData = buff[length];
  console.log('num data:' + numData);

  length += 1;
  for(var i=0; i<numData; ++i) {
    console.log('for data');

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
    var buffer = new Buffer([]);
    socket.on('close', function(had_error){

    });


    socket.on('data', function(data){
      buffer = Buffer.concat([buffer, data]);
      console.log(buffer.toJSON());
      var length = checkPayload(buffer);
      console.log('length :' + length);
      if (length) {
        var message = buffer.slice(0, length);
        buffer = buffer.slice(length, buffer.length);
        message = parseMonitoringMessage(message);
        clients.forEach(function(c) {
          c.send(message);
        })
        console.log(message);
        // client.query('insert into logs (project_id, log_level, log_message, tags, time, function_name, file_name, line)\
        // values ($1, $2, $3, $4, $5, $6, $7, $8) returning *;',
        // [message.project_id, message.log_level, message.log_message, message.tags, message.time, message.function_name, message.file_name, message.line], function(err, res) {
        //   if(err) {
        //     console.log(err);
        //     return;
        //   }else {
        //     console.log('log was inserted');
        //     if(message.data.length > 0){
        //       var log_id = res.rows[0].id;
        //       var query = 'insert into data (project_id, log_id, name, value, type) values ';
        //       var pre = '';
        //       var vals= [message.project_id, log_id];
        //       for(var i=0; i<message.data.length; i+=1){
        //         query += pre+ '($1, $2, $'+(vals.length+1)+', $'+(vals.length+2)+', $'+(vals.length+3)+')';
        //         pre = ', ';
        //         vals.push(message.data[i].name);
        //         vals.push(new Buffer(message.data[i].value, 'hex'));
        //         vals.push(message.data[i].type);
        //       }
        //       query +=  ';';
        //       client.query(query, vals, function(err, res){
        //         if(err){
        //           console.log(err);
        //         }else {
        //           console.log('data was inserted');
        //         }
        //       });
        //     }
        //   }
        // });
      }
    });


  });

  server.listen(8090, '0.0.0.0');
}

startServer();
