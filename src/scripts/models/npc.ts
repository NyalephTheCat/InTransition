import { Serializable } from "../utils/serialize";

export class NPC extends Serializable {
  id: string;
  firstName: string;
  lastName: string;
  experiences: string[] = [];
  traits: Record<string, any> = {};

  constructor(id: string, firstName: string, lastName: string, experiences?: string[], traits?: Record<string, any>) {
    super();
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    if (experiences) this.experiences = experiences;
    if (traits) this.traits = traits;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
window.NPC = NPC;