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
        borderRadius: "12px",
        padding: "32px",
        textAlign: "center",
        background: theme.background,
        color: theme.textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
        fontFamily: "'Inter', sans-serif",
        ...style,
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = theme.infoColor;
          e.currentTarget.style.background = `${theme.infoColor}05`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = theme.borderColor;
          e.currentTarget.style.background = theme.background;
        }
      }}
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

      <div
        style={{
          fontSize: "32px",
          marginBottom: "16px",
          color: theme.infoColor,
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
        }}
      >
        📁
      </div>
      <div
        style={{
          fontSize: "16px",
          marginBottom: "8px",
          fontWeight: 600,
          color: theme.textColor,
        }}
      >
        Drop a file here or click to browse
      </div>
      <div
        style={{
          fontSize: "13px",
          color: theme.textColorSecondary,
          maxWidth: "200px",
          margin: "0 auto",
          lineHeight: "1.5",
        }}
      >
        Supports JSON and YAML workflow definitions
      </div>
    </div>
  );
};

interface URLInputProps {
  onUrlSubmit: (url: string) => void;
  theme: ViewerTheme;
  disabled?: boolean;
  defaultValue?: string;
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
  defaultValue = "",
  placeholder = "Enter URL to ASL definition (JSON or YAML)",
  className,
  style,
}) => {
  const [url, setUrl] = React.useState(defaultValue);

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
        gap: "12px",
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
          padding: "10px 16px",
          border: `1px solid ${theme.borderColor}`,
          borderRadius: "8px",
          background: theme.surfaceColor,
          color: theme.textColor,
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = theme.infoColor)}
        onBlur={(e) => (e.target.style.borderColor = theme.borderColor)}
      />
      <button
        type="submit"
        disabled={!url.trim() || disabled}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "8px",
          background:
            url.trim() && !disabled ? theme.infoColor : theme.borderColor,
          color: "white",
          cursor: url.trim() && !disabled ? "pointer" : "not-allowed",
          fontSize: "14px",
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          transition: "all 0.2s",
          boxShadow:
            url.trim() && !disabled ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
        }}
        onMouseEnter={(e) => {
          if (url.trim() && !disabled) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (url.trim() && !disabled) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          }
        }}
      >
        Load
      </button>
    </form>
  );
};
