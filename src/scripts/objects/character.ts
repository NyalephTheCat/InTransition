import Color from "ts-color-class";
import { Serializable } from "../utils/serializable";

// Struct for relationship
export class Relationship extends Serializable {
  constructor(
    public type: string,
    public strength: number, // (0..1)
  ) { super() }
}
(window as any).Relationship = Relationship;

export class Clothes extends Serializable {
  constructor(
    public id: string,
    public type: string,
    public color: Color,
    public style: string,
    public slots: string[] = [], // Slots occupied by the clothes
    public hides: string[] = [], // Slots hidden by the clothes
  ) { super() }

  variant(changes: { [key in keyof Clothes]?: any }) {
    return this.clone()._init(Object.assign(this.clone(), changes))
  }

  static all: Record<string, Clothes> = {
    "base:shirt": new Clothes("base:shirt", "shirt", new Color({ h: 0.6, s: 0.5, l: 0.5 }), "t-shirt", ["base:torso"], ["base:torso", "base:breasts", "base:nipples", "base:belly"]),
  }
  static register(clothes: Clothes) {
    Clothes.all[clothes.id] = clothes
  }

  static get(id: string) {
    return Clothes.all[id]
  }
}
(window as any).Clothes = Clothes;

export class Pronoun extends Serializable {
  constructor(
    public subject: string,
    public object: string,
    public possessive: string,
    public reflexive: string,
    public noun: string,
  ) { super() }

  get display() { return `${this.subject}/${this.object}` }
}
(window as any).Pronoun = Pronoun;

export class Character extends Serializable {
  public color: { bg: Color, fg: Color };
  public dateOfBirth!: Date;
  
  constructor(
    public id: string,
    public firstName: string,
    public lastName: string|null,
    public pronoun: Pronoun,
    dateOfBirth?: Date|number,
    public relationship?: Record<string, Relationship>,
    public skills?: Record<string, Record<string, number>>, // Category -> Trait -> Amount (-1..1)
    public body?: any, // Body struct, we will see it later
    public clothes?: string[], // Clothes ids
    color: { bg: Color, fg: Color }|Color = Character.generateColors(),
  ) { 
    super()

    this.color = color instanceof Color ? Character.generateColors(color) : color;

    // The date of birth is either a date or a number (year old, with a random month and day to be applied)
    if (dateOfBirth instanceof Date) this.dateOfBirth = dateOfBirth;
    else if (typeof dateOfBirth === 'number') {
      this.dateOfBirth = new Date(new Date().getFullYear() - dateOfBirth, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
      // If the date of birth's day is not passed, we need to lower the year to match the given age
      const now = new Date();
      // Check if the birthday has already passed this year
      if (now.getMonth() > this.dateOfBirth.getMonth() || (now.getMonth() === this.dateOfBirth.getMonth() && now.getDate() > this.dateOfBirth.getDate())) {
        this.dateOfBirth.setFullYear(now.getFullYear() - dateOfBirth);
      } else {
        this.dateOfBirth.setFullYear(now.getFullYear() - dateOfBirth - 1);
      }
    }

    Character.all[id] = this;
  }

  get age() {
    const now = new Date();
    let age = now.getFullYear() - this.dateOfBirth.getFullYear();
    if (now.getMonth() < this.dateOfBirth.getMonth() || (now.getMonth() === this.dateOfBirth.getMonth() && now.getDate() < this.dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  get name() { 
    if (!this.lastName) return this.firstName;
    return `${this.firstName} ${this.lastName}` 
  }

  get description() {
    // TODO: Add a more comprehensive description system based on templates and the body struct.
    return `${this.name} (${this.age} years old). This will then contain a more detailed description of the character's appearance based on what their body looks like and what they are wearing.`
  }

  static generateColors(color?: Color): { bg: Color, fg: Color } {
    // Create one color with a random hue, that isn't too dark or too light
    if (!color) { color = new Color({ h: Math.random(), s: 0.5, l: 0.5 }) }
    else {
      // Set color to have the correct luminance and saturation
      color = new Color(color).saturation(0.5).lightness(0.5)
    }

    // Create a background / foreground colors that make the colors contrasting and readable.
    let bg = new Color(color).darken(0.3)
    let fg = new Color(color).lighten(0.3)

    return { bg, fg }
  }

  static all: Record<string, Character> = {}
  static get(id: string) {
    return Character.all[id]
  }
}
(window as any).Character = Character;