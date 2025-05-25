import React from 'react';
import { ValidationError, ViewerTheme } from '../types';

interface ErrorDisplayProps {
  errors: ValidationError[];
  theme: ViewerTheme;
  width: number;
  height: number;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  theme,
  width,
  height
}) => {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <div
      style={{
        width,
        height,
        background: theme.background,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        color: theme.textColor
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: theme.errorColor,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <span style={{ marginRight: '8px' }}>⚠️</span>
        Workflow Validation Issues
      </div>
      
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        {errorCount > 0 && (
          <span style={{ color: theme.errorColor, marginRight: '16px' }}>
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        )}
        {warningCount > 0 && (
          <span style={{ color: '#ff9800' }}>
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: theme.nodeColors.task,
          borderRadius: '4px',
          padding: '12px'
        }}
      >
        {errors.map((error, index) => (
          <div
            key={index}
            style={{
              marginBottom: '8px',
              padding: '8px',
              background: theme.background,
              borderLeft: `4px solid ${error.severity === 'error' ? theme.errorColor : '#ff9800'}`,
              borderRadius: '2px',
              fontSize: '12px'
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                color: error.severity === 'error' ? theme.errorColor : '#ff9800'
              }}
            >
              {error.severity.toUpperCase()}: {error.path}
            </div>
            <div style={{ color: theme.textColor }}>
              {error.message}
            </div>
            {(error.line !== undefined || error.column !== undefined) && (
              <div
                style={{
                  fontSize: '10px',
                  marginTop: '4px',
                  opacity: 0.7,
                  color: theme.textColor
                }}
              >
                Line: {error.line || '?'}, Column: {error.column || '?'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '12px',
          opacity: 0.7,
          color: theme.textColor
        }}
      >
        Please fix the issues above to view the workflow diagram.
      </div>
    </div>
  );
};
