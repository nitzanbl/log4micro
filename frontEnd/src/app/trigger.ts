export class Trigger {
  public id: number;
  public project_id: number;
  public trigger_condition: string;
  public trigger_value: string;
  public trigger_data_name: string;
  public trigger_data_type: number;
  public message: string;
  public current_value: string;
  public processedCurrentVal : any = null;
  public processedTriggerVal : any = null;

  public constructor(data) {
    this.id = data.id
    this.project_id = data.project_id
    this.trigger_condition = data.trigger_condition
    this.trigger_value = data.trigger_value
    this.trigger_data_name = data.trigger_data_name
    this.trigger_data_type = data.trigger_data_type
    this.message = data.message
    this.current_value = data.current_value
  }

  public getCurrentVal() {
    if (this.processedCurrentVal == null && typeof this.current_value == 'string') {
      if (this.trigger_data_type == 0) {
        this.processedCurrentVal = this.intValueForData(this.current_value);
      } else if (this.trigger_data_type == 1) {
        this.processedCurrentVal = this.stringValueForData(this.current_value);
      } else if (this.trigger_data_type == 2) {
        this.processedCurrentVal = this.boolValueForData(this.current_value);
      }
    }
    return this.processedCurrentVal;
  }

  public getTriggerVal() {
    if (this.processedTriggerVal == null && typeof this.trigger_value == 'string') {
      if (this.trigger_data_type == 0) {
        this.processedTriggerVal = this.intValueForData(this.trigger_value);
      } else if (this.trigger_data_type == 1) {
        this.processedTriggerVal = this.stringValueForData(this.trigger_value);
      } else if (this.trigger_data_type == 2) {
        this.processedTriggerVal = this.boolValueForData(this.trigger_value);
      }
    }
    return this.processedTriggerVal;
  }

  public getType(): string {
    if (this.trigger_data_type == 0) {
      return "int";
    } else if (this.trigger_data_type == 1) {
      return "string";
    } else if (this.trigger_data_type == 2) {
      return "bool";
    }
  }

  private convertToBytes(val) {
    var bStr = val.substr(2);
    var bytes = []
    for (var i = 0; i < bStr.length; i+= 2) {
      var hx = bStr.substr(i, 2);
      bytes.push(parseInt(hx, 16))
    }
    return bytes;
  }
  private stringValueForData(val): string {
    var bytes = this.convertToBytes(val);
    var str = ""
    for (var i = 0; i < bytes.length; i+=1) {
      str += String.fromCodePoint(bytes[i]);
    }
    return str;
  }

  private boolValueForData(val): boolean {
    var bytes = this.convertToBytes(val);
    return bytes.length > 0 && bytes[0] != 0;
  }

  private intValueForData(val): number {
    var bytes = this.convertToBytes(val);
    var num = 0;
    for (var i  = 0; i < bytes.length; i+=1) {
      num = (num << 8) + bytes[i];
    }
    return num;
  }
}
