import { validateASLDefinition, parseASLDefinition } from "../validation";
import { ASLDefinition, StateDefinition, ValidationError } from "../../types";

describe("validateASLDefinition", () => {
  describe("Basic validation", () => {
    it("should validate a simple valid workflow", () => {
      const definition: ASLDefinition = {
        StartAt: "HelloWorld",
        States: {
          HelloWorld: {
            Type: "Pass",
            Result: "Hello World!",
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toHaveLength(0);
    });

    it("should require StartAt field", () => {
      // @ts-ignore
      const definition = {
        States: {
          HelloWorld: {
            Type: "Pass",
            End: true,
          },
        },
      } as ASLDefinition;

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "StartAt field is required",
        path: "StartAt",
        severity: "error",
      });
    });

    it("should require States field", () => {
      const definition = {
        StartAt: "HelloWorld",
      } as ASLDefinition;

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "States field is required and must contain at least one state",
        path: "States",
        severity: "error",
      });
    });

    it("should require States to contain at least one state", () => {
      const definition: ASLDefinition = {
        StartAt: "HelloWorld",
        States: {},
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "States field is required and must contain at least one state",
        path: "States",
        severity: "error",
      });
    });

    it("should validate that StartAt references an existing state", () => {
      const definition: ASLDefinition = {
        StartAt: "NonExistentState",
        States: {
          HelloWorld: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "StartAt references non-existent state: NonExistentState",
        path: "StartAt",
        severity: "error",
      });
    });
  });

  describe("State validation", () => {
    it("should require Type field for all states", () => {
      const definition: ASLDefinition = {
        StartAt: "InvalidState",
        States: {
          InvalidState: {
            End: true,
          } as StateDefinition,
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "Type field is required for all states",
        path: "States.InvalidState.Type",
        severity: "error",
      });
    });

    describe("Pass state validation", () => {
      it("should validate Pass state without Resource", () => {
        const definition: ASLDefinition = {
          StartAt: "PassState",
          States: {
            PassState: {
              Type: "Pass",
              Result: "Test result",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });

      it("should not allow Resource field in Pass state", () => {
        const definition: ASLDefinition = {
          StartAt: "PassState",
          States: {
            PassState: {
              Type: "Pass",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:HelloWorld",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Pass states cannot have Resource field",
          path: "States.PassState.Resource",
          severity: "error",
        });
      });
    });

    describe("Task state validation", () => {
      it("should require Resource field for Task state", () => {
        const definition: ASLDefinition = {
          StartAt: "TaskState",
          States: {
            TaskState: {
              Type: "Task",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Task states must have Resource field",
          path: "States.TaskState.Resource",
          severity: "error",
        });
      });

      it("should validate Task state with Resource", () => {
        const definition: ASLDefinition = {
          StartAt: "TaskState",
          States: {
            TaskState: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:HelloWorld",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });

    describe("Choice state validation", () => {
      it("should require Choices array for Choice state", () => {
        const definition: ASLDefinition = {
          StartAt: "ChoiceState",
          States: {
            ChoiceState: {
              Type: "Choice",
              Default: "DefaultState",
            },
            DefaultState: {
              Type: "Pass",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Choice states must have non-empty Choices array",
          path: "States.ChoiceState.Choices",
          severity: "error",
        });
      });

      it("should not allow End field in Choice state", () => {
        const definition: ASLDefinition = {
          StartAt: "ChoiceState",
          States: {
            ChoiceState: {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.foo",
                  StringEquals: "bar",
                  Next: "NextState",
                },
              ],
              End: true,
            },
            NextState: {
              Type: "Pass",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Choice states cannot have End field",
          path: "States.ChoiceState.End",
          severity: "error",
        });
      });

      it("should not allow Next field in Choice state", () => {
        const definition: ASLDefinition = {
          StartAt: "ChoiceState",
          States: {
            ChoiceState: {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.foo",
                  StringEquals: "bar",
                  Next: "NextState",
                },
              ],
              Next: "NextState",
            },
            NextState: {
              Type: "Pass",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Choice states cannot have Next field",
          path: "States.ChoiceState.Next",
          severity: "error",
        });
      });

      it("should validate valid Choice state", () => {
        const definition: ASLDefinition = {
          StartAt: "ChoiceState",
          States: {
            ChoiceState: {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.foo",
                  StringEquals: "bar",
                  Next: "NextState",
                },
              ],
              Default: "DefaultState",
            },
            NextState: {
              Type: "Pass",
              End: true,
            },
            DefaultState: {
              Type: "Pass",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });

    describe("Wait state validation", () => {
      it("should require one time specification field", () => {
        const definition: ASLDefinition = {
          StartAt: "WaitState",
          States: {
            WaitState: {
              Type: "Wait",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message:
            "Wait states must have one of: Seconds, Timestamp, SecondsPath, or TimestampPath",
          path: "States.WaitState",
          severity: "error",
        });
      });

      it("should only allow one time specification field", () => {
        const definition: ASLDefinition = {
          StartAt: "WaitState",
          States: {
            WaitState: {
              Type: "Wait",
              Seconds: 10,
              Timestamp: "2023-12-31T23:59:59Z",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Wait states can only have one time specification field",
          path: "States.WaitState",
          severity: "error",
        });
      });

      it("should validate Wait state with Seconds", () => {
        const definition: ASLDefinition = {
          StartAt: "WaitState",
          States: {
            WaitState: {
              Type: "Wait",
              Seconds: 10,
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });

      it("should validate Wait state with Timestamp", () => {
        const definition: ASLDefinition = {
          StartAt: "WaitState",
          States: {
            WaitState: {
              Type: "Wait",
              Timestamp: "2023-12-31T23:59:59Z",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });

    describe("Parallel state validation", () => {
      it("should require Branches for Parallel state", () => {
        const definition: ASLDefinition = {
          StartAt: "ParallelState",
          States: {
            ParallelState: {
              Type: "Parallel",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Parallel states must have non-empty Branches array",
          path: "States.ParallelState.Branches",
          severity: "error",
        });
      });

      it("should validate Parallel state with Branches", () => {
        const definition: ASLDefinition = {
          StartAt: "ParallelState",
          States: {
            ParallelState: {
              Type: "Parallel",
              Branches: [
                {
                  StartAt: "Branch1",
                  States: {
                    Branch1: {
                      Type: "Pass",
                      End: true,
                    },
                  },
                },
              ],
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });

    describe("Map state validation", () => {
      it("should require Iterator for Map state", () => {
        const definition: ASLDefinition = {
          StartAt: "MapState",
          States: {
            MapState: {
              Type: "Map",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Map states must have Iterator field",
          path: "States.MapState.Iterator",
          severity: "error",
        });
      });

      it("should validate Map state with Iterator", () => {
        const definition: ASLDefinition = {
          StartAt: "MapState",
          States: {
            MapState: {
              Type: "Map",
              Iterator: {
                StartAt: "IteratorState",
                States: {
                  IteratorState: {
                    Type: "Pass",
                    End: true,
                  },
                },
              },
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });

    describe("Fail state validation", () => {
      it("should not allow Next field in Fail state", () => {
        const definition: ASLDefinition = {
          StartAt: "FailState",
          States: {
            FailState: {
              Type: "Fail",
              Next: "NextState",
            },
            NextState: {
              Type: "Pass",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Fail states cannot have Next field",
          path: "States.FailState.Next",
          severity: "error",
        });
      });

      it("should validate Fail state", () => {
        const definition: ASLDefinition = {
          StartAt: "FailState",
          States: {
            FailState: {
              Type: "Fail",
              Cause: "Something went wrong",
              Error: "CustomError",
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });

    describe("Succeed state validation", () => {
      it("should not allow Next field in Succeed state", () => {
        const definition: ASLDefinition = {
          StartAt: "SucceedState",
          States: {
            SucceedState: {
              Type: "Succeed",
              Next: "NextState",
            },
            NextState: {
              Type: "Pass",
              End: true,
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toContainEqual({
          message: "Succeed states cannot have Next field",
          path: "States.SucceedState.Next",
          severity: "error",
        });
      });

      it("should validate Succeed state", () => {
        const definition: ASLDefinition = {
          StartAt: "SucceedState",
          States: {
            SucceedState: {
              Type: "Succeed",
            },
          },
        };

        const errors = validateASLDefinition(definition);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe("Reference validation", () => {
    it("should validate Next references", () => {
      const definition: ASLDefinition = {
        StartAt: "FirstState",
        States: {
          FirstState: {
            Type: "Pass",
            Next: "NonExistentState",
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "Next references non-existent state: NonExistentState",
        path: "States.FirstState.Next",
        severity: "error",
      });
    });

    it("should validate Choice references", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.foo",
                StringEquals: "bar",
                Next: "NonExistentState",
              },
            ],
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "Choice rule references non-existent state: NonExistentState",
        path: "States.ChoiceState.Choices[0].Next",
        severity: "error",
      });
    });

    it("should validate Default references", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.foo",
                StringEquals: "bar",
                Next: "ValidState",
              },
            ],
            Default: "NonExistentState",
          },
          ValidState: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "Default references non-existent state: NonExistentState",
        path: "States.ChoiceState.Default",
        severity: "error",
      });
    });

    it("should validate Catch references", () => {
      const definition: ASLDefinition = {
        StartAt: "TaskState",
        States: {
          TaskState: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:HelloWorld",
            Catch: [
              {
                ErrorEquals: ["States.ALL"],
                Next: "NonExistentState",
              },
            ],
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: "Catch references non-existent state: NonExistentState",
        path: "States.TaskState.Catch[0].Next",
        severity: "error",
      });
    });
  });

  describe("Unreachable states detection", () => {
    it("should detect unreachable states", () => {
      const definition: ASLDefinition = {
        StartAt: "StartState",
        States: {
          StartState: {
            Type: "Pass",
            End: true,
          },
          UnreachableState: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toContainEqual({
        message: 'State "UnreachableState" is unreachable',
        path: "States.UnreachableState",
        severity: "warning",
      });
    });

    it("should not flag reachable states through Next", () => {
      const definition: ASLDefinition = {
        StartAt: "StartState",
        States: {
          StartState: {
            Type: "Pass",
            Next: "SecondState",
          },
          SecondState: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toHaveLength(0);
    });

    it("should not flag reachable states through Choice", () => {
      const definition: ASLDefinition = {
        StartAt: "ChoiceState",
        States: {
          ChoiceState: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.foo",
                StringEquals: "bar",
                Next: "ChoiceTarget",
              },
            ],
            Default: "DefaultTarget",
          },
          ChoiceTarget: {
            Type: "Pass",
            End: true,
          },
          DefaultTarget: {
            Type: "Pass",
            End: true,
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toHaveLength(0);
    });
  });

  describe("Complex workflow validation", () => {
    it("should validate a complex workflow with multiple state types", () => {
      const definition: ASLDefinition = {
        Comment: "A complex workflow example",
        StartAt: "CheckInput",
        States: {
          CheckInput: {
            Type: "Choice",
            Choices: [
              {
                Variable: "$.inputType",
                StringEquals: "immediate",
                Next: "ProcessImmediate",
              },
              {
                Variable: "$.inputType",
                StringEquals: "delayed",
                Next: "WaitThenProcess",
              },
            ],
            Default: "InvalidInput",
          },
          ProcessImmediate: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:ProcessData",
            Next: "Success",
          },
          WaitThenProcess: {
            Type: "Wait",
            Seconds: 60,
            Next: "ProcessDelayed",
          },
          ProcessDelayed: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:ProcessData",
            Next: "Success",
          },
          Success: {
            Type: "Succeed",
          },
          InvalidInput: {
            Type: "Fail",
            Cause: "Invalid input type provided",
            Error: "InvalidInputError",
          },
        },
      };

      const errors = validateASLDefinition(definition);
      expect(errors).toHaveLength(0);
    });
  });
});

describe("parseASLDefinition", () => {
  it("should parse valid JSON string", () => {
    const jsonString = JSON.stringify({
      StartAt: "HelloWorld",
      States: {
        HelloWorld: {
          Type: "Pass",
          Result: "Hello World!",
          End: true,
        },
      },
    });

    const result = parseASLDefinition(jsonString);
    expect(result).toEqual({
      StartAt: "HelloWorld",
      States: {
        HelloWorld: {
          Type: "Pass",
          Result: "Hello World!",
          End: true,
        },
      },
    });
  });

  it("should return object as-is if already parsed", () => {
    const definition: ASLDefinition = {
      StartAt: "HelloWorld",
      States: {
        HelloWorld: {
          Type: "Pass",
          Result: "Hello World!",
          End: true,
        },
      },
    };

    const result = parseASLDefinition(definition);
    expect(result).toBe(definition);
  });

  it("should throw error for invalid JSON", () => {
    const invalidJson = '{ "StartAt": "Test", invalid }';

    expect(() => parseASLDefinition(invalidJson)).toThrow("Invalid JSON");
  });

  it("should throw error for malformed JSON", () => {
    const malformedJson = '{ "StartAt": ';

    expect(() => parseASLDefinition(malformedJson)).toThrow("Invalid JSON");
  });
});
