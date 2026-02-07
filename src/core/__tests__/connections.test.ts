import { createConnections } from "../layout/connections";
import { StateDefinition } from "../../types";

describe("createConnections", () => {
  it("should create a Next connection", () => {
    const state: StateDefinition = {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456:function:A",
      Next: "NextState",
    };

    const connections = createConnections("StateA", state);

    expect(connections).toHaveLength(1);
    expect(connections[0]).toEqual({
      from: "StateA",
      to: "NextState",
      type: "next",
    });
  });

  it("should create Choice connections with labels", () => {
    const state: StateDefinition = {
      Type: "Choice",
      Choices: [
        { Variable: "$.value", StringEquals: "yes", Next: "YesState" },
        { Variable: "$.count", NumericEquals: 42, Next: "FortyTwoState" },
      ],
    };

    const connections = createConnections("ChoiceState", state);

    expect(connections).toHaveLength(2);
    expect(connections[0].type).toBe("choice");
    expect(connections[0].label).toBe("Choice 1");
    expect(connections[0].to).toBe("YesState");
    expect(connections[0].condition).toContain("$.value");

    expect(connections[1].type).toBe("choice");
    expect(connections[1].label).toBe("Choice 2");
    expect(connections[1].to).toBe("FortyTwoState");
  });

  it("should create Default connection", () => {
    const state: StateDefinition = {
      Type: "Choice",
      Choices: [{ Variable: "$.x", BooleanEquals: true, Next: "TrueState" }],
      Default: "DefaultState",
    };

    const connections = createConnections("ChoiceState", state);

    const defaultConn = connections.find((c) => c.type === "default");
    expect(defaultConn).toBeDefined();
    expect(defaultConn!.to).toBe("DefaultState");
    expect(defaultConn!.label).toBe("Default");
  });

  it("should create Catch connections with error info", () => {
    const state: StateDefinition = {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456:function:A",
      Catch: [
        { ErrorEquals: ["States.TaskFailed"], Next: "ErrorHandler" },
        {
          ErrorEquals: ["States.Timeout", "States.ALL"],
          Next: "TimeoutHandler",
        },
      ],
      Next: "Done",
    };

    const connections = createConnections("TaskState", state);

    const catchConns = connections.filter((c) => c.type === "error");
    expect(catchConns).toHaveLength(2);
    expect(catchConns[0].label).toBe("Catch 1");
    expect(catchConns[0].condition).toBe("States.TaskFailed");
    expect(catchConns[1].condition).toBe("States.Timeout, States.ALL");
  });

  it("should return empty array for terminal states with no connections", () => {
    const state: StateDefinition = {
      Type: "Succeed",
    };

    const connections = createConnections("SucceedState", state);

    expect(connections).toHaveLength(0);
  });

  it("should combine all connection types", () => {
    const state: StateDefinition = {
      Type: "Choice",
      Choices: [{ Variable: "$.ok", BooleanEquals: true, Next: "ProcessOk" }],
      Default: "ProcessDefault",
    };

    const connections = createConnections("Router", state);

    expect(connections).toHaveLength(2);
    const types = connections.map((c) => c.type);
    expect(types).toContain("choice");
    expect(types).toContain("default");
  });
});
