export class MmData {
  public id: number;
  public log_id: number;
  public name: string;
  public value: string;
  public project_id: number;
  public type: number;
  public processedVal : any = null;

  public constructor(data) {
    this.id = +data.id;
    this.log_id = +data.log_id;
    this.name = data.name;
    this.value = data.value;
    this.project_id = +data.project_id;
    this.type = +data.type;
  }

  public getVal() {
    if (this.processedVal == null && typeof this.value == 'string') {
      if (this.type == 0) {
        this.processedVal = this.intValueForData();
      } else if (this.type == 1) {
        this.processedVal = this.stringValueForData();
      } else if (this.type == 2) {
        this.processedVal = this.boolValueForData();
      }
    }
    return this.processedVal;
  }

  private convertToBytes() {
    var bStr = this.value.substr(2);
    var bytes = []
    for (var i = 0; i < bStr.length; i+= 2) {
      var hx = bStr.substr(i, 2);
      bytes.push(parseInt(hx, 16))
    }
    return bytes;
  }
  private stringValueForData(): string {
    var bytes = this.convertToBytes();
    var str = ""
    for (var i = 0; i < bytes.length; i+=1) {
      str += String.fromCodePoint(bytes[i]);
    }
    return str;
  }

  public getType(): string {
    if (this.type == 0) {
      return "int";
    } else if (this.type == 1) {
      return "string";
    } else if (this.type == 2) {
      return "bool";
    }
  }

  private boolValueForData(): boolean {
    var bytes = this.convertToBytes();
    return bytes.length > 0 && bytes[0] != 0;
  }

  private intValueForData(): number {
    var bytes = this.convertToBytes();
    var num = 0;
    for (var i  = 0; i < bytes.length; i+=1) {
      num = (num << 8) + bytes[i];
    }
    return num;
  }
}
