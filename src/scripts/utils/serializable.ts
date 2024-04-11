export class Serializable {
  [key: string]: any;

  constructor() {}

  public _init(data: { [key in keyof Serializable]?: any }) {
    Object.keys(data).forEach(key => {
      this[key] = clone(data[key])
    })
    return this;
  }

  public clone() { return Object.assign(Object.create(Object.getPrototypeOf(this)), this) }

  public toJSON() {
    // Create object with all properties
    let obj: { [key: string]: any } = Object.keys(this).reduce((acc: { [key in keyof Serializable]?: any}, key) => {
      acc[key] = clone(this[key])
      return acc
    }, {})

    return JSON.reviveWrapper(`(new ${this.constructor.name}())._init($ReviveData$})`, obj)
  }
}