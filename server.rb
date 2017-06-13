#!/usr/bin/env ruby
require 'sinatra'
require 'sinatra/cross_origin'
require 'pg'
require './query.rb'
require 'json'
require 'date'

COMMAND_TYPE = {CONNECT: 0, LOG_MESSAGE: 1}

set :bind, '0.0.0.0'
set :port, 80
set :allow_methods, [:get, :post, :options, :put, :delete]

def getDBConnection
  PG.connect(host: 'localhost', user: 'postgres', dbname: 'log4micro', password: 'log4micro')
end

configure do
  mime_type :json, 'application/json'
  enable :cross_origin
  set :server, :puma
end

options "*" do
  response.headers["Allow"] = "HEAD,GET,PUT,POST,DELETE,OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept"
  200
end

get '/home' do
  'hello'
end

get '/log_view' do
  File.read("./html/index.html")
end

#PROJECTS

post '/projects' do
  content_type :json
  data = JSON.parse(request.body.read) rescue nil
  data = params if data.nil?
  level_control = 'all'
  level_control = data['level_control'].to_s if data.has_key? 'level_control'
  res = getDBConnection.exec_params('insert into projects (name, description, level_control, status) values ($1::text, $2::text, $3::text, \'started\') returning *;', [data['name'].to_s, data['description'].to_s, level_control])
  if res.cmd_tuples > 0
    JSON.generate(res[0])
  else
    status 400
    JSON.generate(status: "Error creating project, Invalid parameters")
  end
end

get '/projects' do
  content_type :json
  projects = []
  getDBConnection.exec('SELECT projects.*, coalesce(sessions, 0) as sessions, coalesce(messages,0) as messages, coalesce((errors*100/messages), 0) as error_rate FROM projects LEFT JOIN (SELECT project_id, COUNT(*) as sessions FROM logs WHERE type= 0 GROUP BY project_id) as stable ON stable.project_id = id LEFT JOIN (SELECT project_id, COUNT(*) as messages FROM logs WHERE type > 0 GROUP BY project_id) as mtable on mtable.project_id = id LEFT JOIN (SELECT project_id, COUNT(*) as errors FROM logs where log_level = \'error\' GROUP BY project_id) as etable on etable.project_id = id;') do |res|
    res.each do |row|
      projects << row
    end
  end
  JSON.generate(projects)
end

get '/projects/:id' do
  content_type :json
  project = nil
  getDBConnection.exec_params('select * from projects where id=$1::int limit 1;', [params['id'].to_i]) do |res|
    if res.num_tuples > 0
      project = res[0]
    end
  end
  if project.nil?
    status 400
    JSON.generate({status: 'Invalid project id'})
  else
    sessions = []
    getDBConnection.exec_params('select * from sessions where project_id=$1::int;', [project['id']]) do |res|
      if res.num_tuples > 0
        res.num_tuples.times do |i|
          sessions << res[i]
        end
      end
    end
    project[:sessions] = sessions
    JSON.generate(project)
  end
end

put '/projects/:id' do
  content_type :json
  query = Query.new(:projects, :update)
  if params.has_key? "name"
    query.add_update_param( :name, params['name'] )
  end
  if params.has_key? "description"
    query.add_update_param( :description, params['description'] )
  end
  if params.has_key? "level_control"
    query.add_update_param( :level_control, params['level_control'] )
  end
  if params.has_key? "status"
    query.add_update_param( :status, params['status'] )
  end
  query.add_where_param(:id, params["id"].to_i)
  qstr = query.query_string
  getDBConnection.exec_params(qstr, query.val)
  JSON.generate({msg: "your project was updated successfully"})
end

delete '/projects/:id' do
  content_type :json
  res = getDBConnection.exec_params('delete from projects where id=$1::int; delete from sessions where project_id=$1::int; delete from logs where project_id=$1::int;', [params['id'].to_i])
  if res.cmd_tuples > 0
    JSON.generate(status: "project was deleted successfully")
  else
    status 400
    JSON.generate(status: "Invalid project id")
  end
end

#SESSIONS

post '/projects/:project_id/sessions' do
  content_type :json
  data = JSON.parse(request.body.read) rescue nil
  data = params if data.nil?

  res = getDBConnection.exec_params('insert into sessions (name, project_id, date) values ($1::text, $2::int, $3::timestamp) returning *;', [data['name'].to_s, params['project_id'].to_i, PG::TextEncoder::TimestampWithoutTimeZone.new.encode(DateTime.strptime(data['time'], '%s'))])
  if res.cmd_tuples > 0
    JSON.generate(res[0])
  else
    status 400
    JSON.generate(status: "Error creating session, Invalid parameters")
  end
end

get '/projects/:project_id/sessions/:id' do
  content_type :json
  session = nil
  getDBConnection.exec_params('select * from sessions where id=$1::int and project_id=$2::int limit 1;',[params['id'].to_i, params['project_id'].to_i]) do |res|
    if res.num_tuples > 0
      session = res[0]
    end
  end
  if session.nil?
    status 400
    JSON.generate({status: 'Invalid params'})
  else
    JSON.generate(session)
  end
end


put '/projects/:project_id/sessions/:id' do
  content_type :json
  query = Query.new(:sessions, :update)
  if params.has_key? "name"
    query.add_update_param( :name, params['name'] )
  end
  query.add_where_param(:id, params["id"].to_i)
  qstr = query.query_string
  getDBConnection.exec_params(qstr, query.val)
  JSON.generate({msg: "your session was updated successfully"})
end

delete '/projects/:project_id/sessions/:id' do
  content_type :json
  res = getDBConnection.exec_params('delete from sessions where project_id=$1::int and id=$2::int; delete from logs where project_id=$1::int and session_id=$2::int;', [params['project_id'].to_i, params['id'].to_i])
  if res.cmd_tuples > 0
    JSON.generate(status: "session was deleted successfully")
  else
    status 400
    JSON.generate(status: "Invalid session or project id")
  end
end

#TRIGGERS

post '/projects/:project_id/triggers' do
  content_type :json
  res = getDBConnection.exec_params('insert into triggers (project_id, trigger_data_name, trigger_condition, trigger_value, message) values ($1::int, $2::text, $3::text, $4, $5::text) returning *;',
    [params['project_id'].to_i,
    params['trigger_data_name'].to_s,
    params['trigger_condition'].to_s,
    {value: [params['trigger_value']].pack('H*'), format: 1},
    params['message'].to_s
    ])
  if res.cmd_tuples > 0
    JSON.generate(res[0])
  else
    status 400
    JSON.generate(status: "Error creating trigger, Invalid parameters")
  end
end

get '/projects/:project_id/triggers' do
  content_type :json
  triggers = []
  getDBConnection.exec('SELECT triggers.*, dataf.type as trigger_data_type, dataf.value as current_value FROM triggers LEFT JOIN (SELECT data.* FROM data INNER JOIN (select name, MAX(id) as id FROM data WHERE project_id=$1::int group by name) AS md ON data.id = md.id) as dataf ON trigger_data_name = name where project_id = $1::int;', [params['project_id'].to_i]) do |res|
    res.each do |row|
      triggers << row
    end
  end
  JSON.generate(triggers)
end

get '/projects/:project_id/triggers/:id' do
  content_type :json
  trigger = nil
  getDBConnection.exec_params('select * from triggers where project_id=$1::int and id=$2::int limit 1;', [params['project_id'].to_i ,params['id'].to_i]) do |res|
    if res.num_tuples > 0
      trigger = res[0]
    end
  end
  if trigger.nil?
    status 400
    JSON.generate({status: 'Invalid trigger id or project id'})
  else
    JSON.generate(trigger)
  end
end

put '/projects/:project_id/triggers/:id' do
  content_type :json
  query = Query.new(:triggers, :update)
  if params.has_key? "trigger_data_name"
    query.add_update_param( :trigger_data_name, params['trigger_data_name'] )
  end
  if params.has_key? "trigger_value"
    query.add_update_param( :trigger_value, {value: [params['trigger_value']].pack('H*'), format: 1} )
  end
  if params.has_key? "trigger_condition"
    query.add_update_param( :trigger_condition, params['trigger_condition'] )
  end
  if params.has_key? "message"
    query.add_update_param( :message, params['message'] )
  end
  query.add_where_param(:id, params["id"].to_i)
  qstr = query.query_string
  getDBConnection.exec_params(qstr, query.val)
  JSON.generate({msg: "your trigger was updated successfully"})
end

delete '/projects/:project_id/triggers/:id' do
  content_type :json
  res = getDBConnection.exec_params('delete from triggers where project_id=$1::int and id=$2::int limit 1;', [params['project_id'].to_i ,params['id'].to_i])
  if res.cmd_tuples > 0
    JSON.generate(status: "trigger was deleted successfully")
  else
    status 400
    JSON.generate(status: "Invalid project id or trigger id")
  end
end

#DATA

get '/projects/:project_id/data' do
  content_type :json
  data = []
  getDBConnection.exec('select data.* from data inner join
  (select name, max(id) as max_id from data where project_id=$1::int group by name) as name_max on data.id = name_max.max_id where project_id = $1::int;',
  [params['project_id'].to_i]) do |res|
    res.each do |row|
      data << row
    end
  end
  JSON.generate(data)
end

get '/projects/:project_id/logs/:log_id/data' do
  content_type :json
  data = []
  getDBConnection.exec('select * from data where project_id=$1::int and log_id=$2::int;',
  [params['project_id'].to_i, params['log_id'].to_i]) do |res|
    res.each do |row|
      data << row
    end
  end
  JSON.generate(data)
end

get '/projects/:project_id/data/:id' do
  content_type :json
  data = nil
  getDBConnection.exec_params('select * from data where project_id=$1::int and id=$2::int limit 1;', [params['project_id'].to_i ,params['id'].to_i]) do |res|
    if res.num_tuples > 0
      data = res[0]
    end
  end
  if data.nil?
    status 400
    JSON.generate({status: 'Invalid data id or project id'})
  else
    JSON.generate(data)
  end
end

#LOGS
#msg log_level time
get '/projects/:id/logs' do
  begin
    halt 400, "invalid project id" if (params['id']=~ /\A\d+\z/).nil?
    content_type :json
    index_parameters = 2
    query = 'select * from logs where project_id=$1::int '
    parameters = [params['id'].to_i]
    if params.has_key? "log_level"
      levels = params["log_level"].split("|")
      levels = PG::TextEncoder::Array.new.encode(levels)
      query += "and log_level = any($#{index_parameters}::text[]) "
      parameters << levels
      index_parameters += 1
    end
    if params.has_key? "message"
      msg = "%" + params["message"] + "%"
      query += "and log_message ilike $#{index_parameters}::text "
      parameters << msg
      index_parameters += 1
    end
    if params.has_key? "start_time"
      start_time = params["start_time"]
      start_time = PG::TextEncoder::TimestampWithoutTimeZone.new.encode(DateTime.strptime(start_time, '%s'))
      query += "and time >= $#{index_parameters}::timestamp "
      parameters << start_time
      index_parameters += 1
    end
    if params.has_key? "end_time"
      end_time = params["end_time"]
      end_time = PG::TextEncoder::TimestampWithoutTimeZone.new.encode(DateTime.strptime(end_time, '%s'))
      query += "and time <= $#{index_parameters}::timestamp "
      parameters << end_time
      index_parameters += 1
    end
    logs = []
    limit = if params.has_key? "limit"
        params["limit"].to_i
    else
        100
    end
    parameters << limit
    offset = if params.has_key? "offset"
        params["offset"]
    else
        0
    end
    parameters << offset
    query += "order by time desc, id desc limit $#{index_parameters}::int offset $#{index_parameters+1};"
    getDBConnection.exec_params(query, parameters) do |res|
      res.each do |row|
        logs << row
      end
    end
    JSON.generate(logs)
  rescue
    status 400
    JSON.generate({error:'error retrieving monitoring messages with supplied parameters'})
  end
end

get '/projects/:id/sessions/:session_id/logs' do
  begin
    halt 400, "invalid project id" if (params['id']=~ /\A\d+\z/).nil?
    halt 400, "invalid session id" if (params['session_id']=~ /\A\d+\z/).nil?

    content_type :json
    index_parameters = 3
    query = 'select * from logs where project_id=$1::int and session_id=$2::int '
    parameters = [params['id'].to_i, params['session_id'].to_i]
    if params.has_key? "log_level"
      levels = params["log_level"].split("|")
      levels = PG::TextEncoder::Array.new.encode(levels)
      query += "and log_level = any($#{index_parameters}::text[]) "
      parameters << levels
      index_parameters += 1
    end
    if params.has_key? "message"
      msg = "%" + params["message"] + "%"
      query += "and log_message ilike $#{index_parameters}::text "
      parameters << msg
      index_parameters += 1
    end
    if params.has_key? "start_time"
      start_time = params["start_time"]
      start_time = PG::TextEncoder::TimestampWithoutTimeZone.new.encode(DateTime.strptime(start_time, '%s'))
      query += "and time >= $#{index_parameters}::timestamp "
      parameters << start_time
      index_parameters += 1
    end
    if params.has_key? "end_time"
      end_time = params["end_time"]
      end_time = PG::TextEncoder::TimestampWithoutTimeZone.new.encode(DateTime.strptime(end_time, '%s'))
      query += "and time <= $#{index_parameters}::timestamp "
      parameters << end_time
      index_parameters += 1
    end
    logs = []
    limit = if params.has_key? "limit"
        params["limit"].to_i
    else
        100
    end
    parameters << limit
    offset = if params.has_key? "offset"
        params["offset"]
    else
        0
    end
    parameters << offset
    query += "order by time desc, id desc limit $#{index_parameters}::int offset $#{index_parameters+1};"
    getDBConnection.exec_params(query, parameters) do |res|
      res.each do |row|
        logs << row
      end
    end
    JSON.generate(logs)
  rescue
    status 400
    JSON.generate({error:'error retrieving monitoring messages with supplied parameters'})
  end
end
