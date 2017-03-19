class Query
  attr_accessor :update_params, :where_params

  def initialize(table, type)
    @table = table
    @type = type
    @values = []
    self.update_params = {}
    self.where_params = {}
  end

  def add_update_param(col, val)
    self.update_params[col] = val
  end

  def add_where_param(col, val)
    self.where_params[col] = val
  end

  def query_string
    if @type == :update
      update_query_string
    elsif @type == :where
      where_query_string
    end
  end

  def val
    @values
  end

  private

  def update_query_string
    return nil if update_params.empty?
    @values = []
    query = "update #{@table.to_s} set "
    set_vars = []
    update_params.each_with_index do |(k, v), i|
      type = if v.is_a? Fixnum
        "int"
      elsif v.is_a? String
        "text"
      end
      @values << v
      set_vars << "#{k.to_s} = $#{@values.length}::#{type}"

    end
    query += set_vars.join(", ")
    where_vars = []
    where_params.each_with_index do |(k, v), i|
      type = if v.is_a? Fixnum
        "int"
      elsif v.is_a? String
        "text"
      end
      @values << v
      where_vars << "#{k.to_s} = $#{@values.length}::#{type}"

    end
    if where_vars.length > 0
      query += " where "
      query += where_vars.join(" and ")
    end
    query += ";"
  end

  def where_query_string
  end

end
