import { StateDefinition, Connection } from "../../types";

/**
 * Creates connections between states based on state definition
 */
export function createConnections(
  stateName: string,
  state: StateDefinition,
): Connection[] {
  const connections: Connection[] = [];

  // Next connection
  if (state.Next) {
    connections.push({
      from: stateName,
      to: state.Next,
      type: "next",
    });
  }

  // Choice connections
  if (state.Choices) {
    state.Choices.forEach((choice, index) => {
      connections.push({
        from: stateName,
        to: choice.Next,
        type: "choice",
        label: `Choice ${index + 1}`,
        condition: formatChoiceCondition(choice),
      });
    });
  }

  // Default connection for Choice states
  if (state.Default) {
    connections.push({
      from: stateName,
      to: state.Default,
      type: "default",
      label: "Default",
    });
  }

  // Catch connections
  if (state.Catch) {
    state.Catch.forEach((catchDef, index) => {
      connections.push({
        from: stateName,
        to: catchDef.Next,
        type: "error",
        label: `Catch ${index + 1}`,
        condition: catchDef.ErrorEquals.join(", "),
      });
    });
  }

  return connections;
}

/**
 * Formats choice condition into human-readable string
 */
function formatChoiceCondition(choice: any): string {
  // Create a human-readable condition string
  if (choice.Variable) {
    const variable = choice.Variable;

    if (choice.StringEquals !== undefined)
      return `${variable} == "${choice.StringEquals}"`;
    if (choice.StringLessThan !== undefined)
      return `${variable} < "${choice.StringLessThan}"`;
    if (choice.StringGreaterThan !== undefined)
      return `${variable} > "${choice.StringGreaterThan}"`;
    if (choice.NumericEquals !== undefined)
      return `${variable} == ${choice.NumericEquals}`;
    if (choice.NumericLessThan !== undefined)
      return `${variable} < ${choice.NumericLessThan}`;
    if (choice.NumericGreaterThan !== undefined)
      return `${variable} > ${choice.NumericGreaterThan}`;
    if (choice.BooleanEquals !== undefined)
      return `${variable} == ${choice.BooleanEquals}`;
  }

  return "condition";
}
