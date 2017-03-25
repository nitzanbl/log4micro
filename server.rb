#!/usr/bin/env ruby
require 'sinatra'
require 'pg'
require './query.rb'
require 'json'

set :bind, '0.0.0.0'
set :port, 80

set :db, PG.connect(host: 'localhost', user: 'postgres', dbname: 'log4micro', password: 'log4micro')
configure do
  mime_type :json, 'application/json'
end

get '/home' do
  'hello'
end

#PROJECTS

post '/projects' do
  content_type :json
  res = settings.db.exec_params('insert into projects (name, description, level_control, status) values ($1::text, $2::text, \'all\', \'started\') returning *;', [params['name'].to_s, params['description'].to_s])
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
  settings.db.exec('select * from projects;') do |res|
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

delete 'projects/:id' do
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

post 'projects/:id/triggers' do
  content_type :json
  res = settings.db.exec_params('insert into triggers (project_id, trigger_data_id, trigger_condition, trigger_value) values ($1::int, $2::int, $3::text, $4) returning *;',
    [params['project_id'].to_i,
    params['trigger_data_id'].to_i,
    params['trigger_condition'].to_s,
    {value: [params['trigger_value']].pack('H*'), format: BINARY}])
  if res.cmd_tuples > 0
    JSON.generate(res[0])
  else
    status 400
    JSON.generate(status: "Error creating trigger, Invalid parameters")
  end
end

get '/projects/:id/triggers' do
  content_type :json
  triggers = []
  settings.db.exec('select * from triggers where project_id = $1::int;', [params['project_id'].to_i]) do |res|
    res.each do |row|
      triggers << row
    end
  end
  JSON.generate(triggers)
end

#LOGS

get '/projects/:id/logs' do
  halt 400, "invalid project id" if (params['id']=~ /\A\d+\z/).nil?
  content_type :json
  logs = []
  settings.db.exec_params('select * from logs where project_id=$1::int;', [params['id'].to_i]) do |res|
    res.each do |row|
      logs << row
    end
  end
  JSON.generate(logs)
end
