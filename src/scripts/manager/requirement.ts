import { Serializable } from "../utils/serializable";
import { NPC } from "./npc";
import { NarrativeManager } from "./storylet";

export abstract class Requirement extends Serializable {
  constructor(public expected: boolean) { super(); }

  abstract check(...context: any[]): boolean;

  abstract display(): JQuery<HTMLElement>;
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

  display(): JQuery<HTMLElement> {
    const operatorString = this.operator === RequirementCompositeOperator.AND ? "AND" : "OR";
    const requirementsDisplay = this.requirements.map(req => req.display());
    const $container = $('<span></span>');

    for (let i = 0; i < requirementsDisplay.length; i++) {
      $container.append(requirementsDisplay[i]);
      if (i < requirementsDisplay.length - 1) {
        $container.append(`<span class="${operatorString.toLowerCase()}">${operatorString}</span>`);
      }
    }

    return $container;
  }
}
(window as any).RequirementComposite = RequirementComposite;

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

  display(): JQuery<HTMLElement> {
    const playedString = this.expected ? "played" : "not played";
    return $(`<span>Storylet "${this.storyletId}" ${playedString}</span>`);
  }
}
(window as any).RequirementStoryletPlayed = RequirementStoryletPlayed;

export class RequirementAlways extends Requirement {
  constructor(expected: boolean = true) {
    super(expected);
  }

  check(): boolean {
    return this.expected;
  }

  display(): JQuery<HTMLElement> {
    return $('<span>Always</span>');
  }
}
(window as any).RequirementAlways = RequirementAlways;

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

  display(): JQuery<HTMLElement> {
    return $(`<span>${this.variable} </span>`).add(this.requirement.display());
  }
}
(window as any).RequirementVariable = RequirementVariable;

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

  protected _check(currentValue: T): boolean {
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

  display(): JQuery<HTMLElement> {
    return $(`<span>${this.comparator} ${this.expectedValue}</span>`);
  }
}
(window as any).RequirementVariableComp = RequirementVariableComp;

export class RequirementLastName extends Requirement {
  constructor(
    public lastName: string,
    expected: boolean = true
  ) {
    super(expected);
  }

  check(npc: NPC): boolean {
    return (npc.lastName === this.lastName) === this.expected;
  }

  display(): JQuery<HTMLElement> {
    return $(`<span>Last name is ${this.lastName}</span>`);
  }
}
(window as any).RequirementLastName = RequirementLastName;

Macro.add("requirement", {
  handler() {
    // displays a requirement passed as an argument
    const requirement = this.args[0];
    if (!(requirement instanceof Requirement)) {
      return;
    }
    $(this.output).append(requirement.display());
  }
});