import React, { useCallback, useRef, useState } from "react";
import { IconFileUpload } from "@tabler/icons-react";
import { ViewerTheme } from "../types";
import { themeToCssVars } from "./theme-vars";
import { classNames } from "./flow-types";

export interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  theme: Partial<ViewerTheme>;
  accept?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A drop zone for selecting ASL definition files (JSON / YAML).
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  theme,
  accept = ".json,.yaml,.yml",
  disabled = false,
  className,
  style,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) onFileSelect(file);
      // Allow selecting the same file again
      event.target.value = "";
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file && !disabled) onFileSelect(file);
    },
    [onFileSelect, disabled],
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) return;
      dragDepth.current += 1;
      setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    // dragleave also fires when moving over children; count the depth
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragOver(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPicker();
      }
    },
    [openPicker],
  );

  return (
    <div
      className={classNames(
        "asl-root",
        "asl-dropzone",
        isDragOver && "is-dragging",
        disabled && "is-disabled",
        className,
      )}
      style={{ ...themeToCssVars(theme), ...style }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload a workflow definition file"
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        hidden
        tabIndex={-1}
      />
      <span className="asl-dropzone__icon">
        <IconFileUpload size={22} aria-hidden />
      </span>
      <span className="asl-dropzone__title">
        {isDragOver
          ? "Drop to load the workflow"
          : "Drop a file or click to browse"}
      </span>
      <span className="asl-dropzone__hint">
        JSON or YAML · ASL definitions and CloudFormation / SAM templates
      </span>
    </div>
  );
};

export interface URLInputProps {
  onUrlSubmit: (url: string) => void;
  theme: Partial<ViewerTheme>;
  disabled?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A URL input for loading ASL definitions from URLs
 */
export const URLInput: React.FC<URLInputProps> = ({
  onUrlSubmit,
  theme,
  disabled = false,
  defaultValue = "",
  placeholder = "https://example.com/state-machine.json",
  className,
  style,
}) => {
  const [url, setUrl] = useState(defaultValue);
  const canSubmit = url.trim().length > 0 && !disabled;

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (canSubmit) onUrlSubmit(url.trim());
    },
    [url, onUrlSubmit, canSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={classNames("asl-root", "asl-url-form", className)}
      style={{ ...themeToCssVars(theme), ...style }}
    >
      <input
        type="url"
        className="asl-input"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Workflow definition URL"
      />
      <button type="submit" className="asl-button" disabled={!canSubmit}>
        Load
      </button>
    </form>
  );
};
