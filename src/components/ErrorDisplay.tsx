import React from "react";
import {
  IconAlertHexagonFilled,
  IconAlertTriangleFilled,
  IconTool,
} from "@tabler/icons-react";
import { ValidationError, ViewerTheme } from "../types";
import { themeToCssVars } from "./theme-vars";
import { classNames } from "./flow-types";

export interface ErrorDisplayProps {
  errors: ValidationError[];
  theme: ViewerTheme;
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * Lists the validation / loading issues that prevent a workflow from being
 * rendered.
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  theme,
  width = "100%",
  height = "100%",
  className,
}) => {
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.length - errorCount;
  const sorted = [...errors].sort(
    (a, b) =>
      (a.severity === "error" ? 0 : 1) - (b.severity === "error" ? 0 : 1),
  );

  return (
    <div
      className={classNames("asl-root", "asl-errors", className)}
      style={{ ...themeToCssVars(theme), width, height }}
      role="alert"
    >
      <div className="asl-errors__header">
        <span className="asl-errors__icon">
          <IconTool size={20} aria-hidden />
        </span>
        <div>
          <h3 className="asl-errors__title">Workflow could not be rendered</h3>
          <p className="asl-errors__subtitle">
            Fix the issues below to view the state machine.
          </p>
        </div>
        <div className="asl-errors__counts">
          {errorCount > 0 && (
            <span className="asl-pill asl-pill--error">
              {errorCount} error{errorCount === 1 ? "" : "s"}
            </span>
          )}
          {warningCount > 0 && (
            <span className="asl-pill asl-pill--warning">
              {warningCount} warning{warningCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <ul className="asl-errors__list">
        {sorted.map((error, index) => (
          <li
            key={`${error.path}-${index}`}
            className={classNames(
              "asl-issue",
              error.severity === "warning" && "asl-issue--warning",
            )}
          >
            <span className="asl-issue__icon">
              {error.severity === "error" ? (
                <IconAlertHexagonFilled size={18} aria-label="Error" />
              ) : (
                <IconAlertTriangleFilled size={18} aria-label="Warning" />
              )}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="asl-issue__message">{error.message}</div>
              <div className="asl-issue__path">
                <span className="asl-chip" title={error.path}>
                  {error.path}
                  {error.line !== undefined &&
                    ` · line ${error.line}${error.column !== undefined ? `:${error.column}` : ""}`}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
