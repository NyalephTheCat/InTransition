export class Serializable {
  [key: string]: any;

  constructor() {}

  public _init(data: { [key in keyof Serializable]?: any }) {
    Object.keys(data).forEach((key) => {
      this[key] = clone(data[key]);
    });
    return this;
  }

  public clone() {
    return Object.create(Object.getPrototypeOf(this))._init(this);
  }

  public toJSON() {
    // Create object with all properties
    let obj: { [key: string]: any } = Object.keys(this).reduce(
      (acc: { [key in keyof Serializable]?: any }, key) => {
        acc[key] = clone(this[key]);
        return acc;
      },
      {}
    );

    return JSON.reviveWrapper(
      `(new ${this.constructor.name}())._init($ReviveData$)`,
      obj
    );
  }
}

interface CustomJSON extends JSON {
  _real_parse(text: string, reviver?: (key: any, value: any) => any): any;
}

Object.defineProperty(JSON, "parse", {
  configurable: true,
  writable: true,

  value(text: string, reviver: (arg0: any, arg1: any) => any) {
    return (JSON as CustomJSON)._real_parse(text, (key, val) => {
      let value = val;

      /*
					Attempt to revive wrapped values.
				*/
      if (Array.isArray(value) && value.length === 2) {
        switch (value[0]) {
          case "(revive:set)":
            value = new Set(value[1]);
            break;
          case "(revive:map)":
            value = new Map(value[1]);
            break;
          case "(revive:date)":
            value = new Date(value[1]);
            break;
          case "(revive:eval)":
            try {
              /* eslint-disable no-eval */
              // For post-v2.9.0 `JSON.reviveWrapper()`.
              if (Array.isArray(value[1])) {
                const $ReviveData$ = value[1][1]; // eslint-disable-line no-unused-vars
                value = eval(value[1][0]);
              }

              // For regular expressions, functions, and pre-v2.9.0 `JSON.reviveWrapper()`.
              else {
                value = eval(value[1]);
              }
              /* eslint-enable no-eval */
            } catch (ex) {
              /* no-op; although, perhaps, it would be better to throw an error here */
              console.error("Error in JSON.parse: ", ex);
            }
            break;
        }
      } else if (

      /* legacy */
        typeof value === "string" &&
        value.slice(0, 10) === "@@revive@@"
      ) {
        try {
          value = eval(value.slice(10)); // eslint-disable-line no-eval
        } catch (ex) {
          /* no-op; although, perhaps, it would be better to throw an error here */
        }
      }
      /* /legacy */

      /*
					Call the custom reviver, if specified.
				*/
      if (typeof reviver === "function") {
        try {
          value = reviver(key, value);
        } catch (ex) {
          /* no-op; although, perhaps, it would be better to throw an error here */
        }
      }

      return value;
    });
  },
});