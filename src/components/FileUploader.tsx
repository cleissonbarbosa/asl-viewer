import React, { useCallback } from "react";
import { ViewerTheme } from "../types";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  theme: ViewerTheme;
  accept?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A file uploader component for selecting ASL definition files
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  theme,
  accept = ".json,.yaml,.yml",
  disabled = false,
  className,
  style,
}) => {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && !disabled) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  return (
    <div
      className={className}
      style={{
        border: `2px dashed ${theme.borderColor}`,
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
        background: theme.background,
        color: theme.textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.2s ease",
        ...style,
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => {
        if (!disabled) {
          document.getElementById("file-input")?.click();
        }
      }}
    >
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: "none" }}
      />

      <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
      <div
        style={{ fontSize: "16px", marginBottom: "4px", fontWeight: "bold" }}
      >
        Drop a file here or click to browse
      </div>
      <div style={{ fontSize: "12px", opacity: 0.7 }}>
        Supports JSON and YAML files
      </div>
    </div>
  );
};

interface URLInputProps {
  onUrlSubmit: (url: string) => void;
  theme: ViewerTheme;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A URL input component for loading ASL definitions from URLs
 */
export const URLInput: React.FC<URLInputProps> = ({
  onUrlSubmit,
  theme,
  disabled = false,
  placeholder = "Enter URL to ASL definition (JSON or YAML)",
  className,
  style,
}) => {
  const [url, setUrl] = React.useState("");

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (url.trim() && !disabled) {
        onUrlSubmit(url.trim());
      }
    },
    [url, onUrlSubmit, disabled],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      style={{
        display: "flex",
        gap: "8px",
        ...style,
      }}
    >
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: "8px 12px",
          border: `1px solid ${theme.borderColor}`,
          borderRadius: "4px",
          background: theme.background,
          color: theme.textColor,
          fontSize: "14px",
        }}
      />
      <button
        type="submit"
        disabled={!url.trim() || disabled}
        style={{
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          background:
            url.trim() && !disabled ? theme.infoColor : theme.borderColor,
          color: "white",
          cursor: url.trim() && !disabled ? "pointer" : "not-allowed",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Load
      </button>
    </form>
  );
};
