import { Requirement } from "../models/requirement";

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