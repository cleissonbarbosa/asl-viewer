import { StateDefinition, Connection } from "../../types";
import { formatChoiceCondition } from "../asl-utils";

/**
 * Creates connections between states based on state definition
 */
export function createConnections(
  stateName: string,
  state: StateDefinition,
): Connection[] {
  const connections: Connection[] = [];
  if (!state || typeof state !== "object") return connections;

  // Next connection
  if (state.Next) {
    connections.push({
      from: stateName,
      to: state.Next,
      type: "next",
    });
  }

  // Choice connections
  if (Array.isArray(state.Choices)) {
    state.Choices.forEach((choice, index) => {
      if (!choice?.Next) return;
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
  if (Array.isArray(state.Catch)) {
    state.Catch.forEach((catchDef, index) => {
      if (!catchDef?.Next) return;
      connections.push({
        from: stateName,
        to: catchDef.Next,
        type: "error",
        label: `Catch ${index + 1}`,
        condition: Array.isArray(catchDef.ErrorEquals)
          ? catchDef.ErrorEquals.join(", ")
          : "",
      });
    });
  }

  return connections;
}
