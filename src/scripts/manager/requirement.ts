import { NarrativeManager as NarrativeManager } from "./storylet";

export abstract class Requirement {
  constructor(public expected: boolean) {}

  abstract check(...context: any[]): boolean;
}

export enum RequirementCompositeOperator { AND = "AND", OR = "OR" }
export class RequirementComposite extends Requirement {
  constructor(
    public requirements: Requirement[],
    public operator: RequirementCompositeOperator = RequirementCompositeOperator.AND,
    expected: boolean = true
  ) {
    super(expected);
  }

  check(...context: any[]): boolean {
    if (this.operator === RequirementCompositeOperator.AND) {
      return this.requirements.every((requirement) => requirement.check(...context) === this.expected);
    } else {
      return this.requirements.some((requirement) => requirement.check(...context) === this.expected);
    }
  }
}

export class RequirementStoryletPlayed extends Requirement {
  constructor(
    public storyletId: string,
    expected: boolean = true
  ) {
    super(expected);
  }

  check(): boolean {
    return NarrativeManager.playedStorylets.has(this.storyletId) === this.expected;
  }
}

export class RequirementAlways extends Requirement {
  constructor(expected: boolean = true) {
    super(expected);
  }

  check(): boolean {
    return this.expected;
  }
}

export class RequirementVariable extends Requirement {
  constructor(
    public variable: string,
    public requirement: Requirement,
    expected: boolean = true
  ) {
    super(expected);
  }

  check(): boolean {
    return this.requirement.check(State.getVar(this.variable));
  }
}

export enum RequirementVariableComparator { 
  EQ = "==",
  NE = "!=",
  GT = ">",
  GTE = ">=",
  LT = "<",
  LTE = "<="
}
export class RequirementVariableComp<T> extends Requirement {
  constructor(
    public comparator: RequirementVariableComparator,
    public expectedValue: T,
    expected: boolean = true 
  ) {
    super(expected);
  }

  private _check(currentValue: T): boolean {
    switch (this.comparator) {
      case RequirementVariableComparator.EQ:
        return currentValue === this.expectedValue;
      case RequirementVariableComparator.NE:
        return currentValue !== this.expectedValue;
      case RequirementVariableComparator.GT:
        return currentValue > this.expectedValue;
      case RequirementVariableComparator.GTE:
        return currentValue >= this.expectedValue;
      case RequirementVariableComparator.LT:
        return currentValue < this.expectedValue;
      case RequirementVariableComparator.LTE:
        return currentValue <= this.expectedValue;
    }
  }

  check(currentValue: T): boolean {
    return this._check(currentValue) === this.expected;
  }
}

// TODO: Add more requirements as needed