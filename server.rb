#!/usr/bin/env ruby
require 'sinatra'
require 'sinatra/cross_origin'
require 'pg'
require './query.rb'
require 'json'

COMMAND_TYPE = {CONNECT: 0, LOG_MESSAGE: 1}

set :bind, '0.0.0.0'
set :port, 80
set :allow_methods, [:get, :post, :options, :put, :delete]


set :db, PG.connect(host: 'localhost', user: 'postgres', dbname: 'log4micro', password: 'log4micro')
configure do
  mime_type :json, 'application/json'
  enable :cross_origin
end

options "*" do
  response.headers["Allow"] = "HEAD,GET,PUT,POST,DELETE,OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept"
  200
end

get '/home' do
  'hello'
end

#PROJECTS

post '/projects' do
  content_type :json
  data = JSON.parse(request.body.read) rescue nil
  data = params if data.nil?
  level_control = 'all'
  level_control = data['level_control'].to_s if data.has_key? 'level_control'
  res = settings.db.exec_params('insert into projects (name, description, level_control, status) values ($1::text, $2::text, $3::text, \'started\') returning *;', [data['name'].to_s, data['description'].to_s, level_control])
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
  settings.db.exec('SELECT projects.*, coalesce(sessions, 0) as sessions, coalesce(messages,0) as messages, coalesce((errors*100/messages), 0) as error_rate FROM projects LEFT JOIN (SELECT project_id, COUNT(*) as sessions FROM logs WHERE type= 0 GROUP BY project_id) as stable ON stable.project_id = id LEFT JOIN (SELECT project_id, COUNT(*) as messages FROM logs WHERE type > 0 GROUP BY project_id) as mtable on mtable.project_id = id LEFT JOIN (SELECT project_id, COUNT(*) as errors FROM logs where log_level = \'error\' GROUP BY project_id) as etable on etable.project_id = id;') do |res|
    res.each do |row|
      projects << row
    end
  end
  JSON.generate(projects)
end

get '/projects/:id' do
  content_type :json
  project = nil
  settings.db.exec_params('select * from projects where id=$1::int limit 1;', [params['id'].to_i]) do |res|
    if res.num_tuples > 0
      project = res[0]
    end
  end
  if project.nil?
    status 400
    JSON.generate({status: 'Invalid project id'})
  else
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
  settings.db.exec_params(qstr, query.val)
  JSON.generate({msg: "your project was updated successfully"})
end

delete '/projects/:id' do
  content_type :json
  res = settings.db.exec_params('delete from projects where id=$1::int;', [params['id'].to_i])
  if res.cmd_tuples > 0
    JSON.generate(status: "project was deleted successfully")
  else
    status 400
    JSON.generate(status: "Invalid project id")
  end
end

#TRIGGERS

post '/projects/:project_id/triggers' do
  content_type :json
  res = settings.db.exec_params('insert into triggers (project_id, trigger_data_id, trigger_condition, trigger_value) values ($1::int, $2::int, $3::text, $4) returning *;',
    [params['project_id'].to_i,
    params['trigger_data_id'].to_i,
    params['trigger_condition'].to_s,
    {value: [params['trigger_value']].pack('H*'), format: 1}])
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
  settings.db.exec('select * from triggers where project_id = $1::int;', [params['project_id'].to_i]) do |res|
    res.each do |row|
      triggers << row
    end
  end
  JSON.generate(triggers)
end

get '/projects/:project_id/triggers/:id' do
  content_type :json
  trigger = nil
  settings.db.exec_params('select * from triggers where project_id=$1::int and id=$2::int limit 1;', [params['project_id'].to_i ,params['id'].to_i]) do |res|
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

delete '/projects/:project_id/triggers/:id' do
  content_type :json
  res = settings.db.exec_params('delete from triggers where project_id=$1::int and id=$2::int limit 1;', [params['project_id'].to_i ,params['id'].to_i])
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
  settings.db.exec('select data.* from data inner join
  (select name, max(id) as max_id from data where project_id=$1::int group by name) as name_max on data.id = name_max.max_id where project_id = $1::int;',
  [params['project_id'].to_i]) do |res|
    res.each do |row|
      data << row
    end
  end
  JSON.generate(data)
end

get '/projects/:project_id/data/:id' do
  content_type :json
  data = nil
  settings.db.exec_params('select * from data where project_id=$1::int and id=$2::int limit 1;', [params['project_id'].to_i ,params['id'].to_i]) do |res|
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

get '/projects/:id/logs' do
  begin
    halt 400, "invalid project id" if (params['id']=~ /\A\d+\z/).nil?
    content_type :json
    logs = []
    settings.db.exec_params('select * from logs where project_id=$1::int order by id desc limit 50;', [params['id'].to_i]) do |res|
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
