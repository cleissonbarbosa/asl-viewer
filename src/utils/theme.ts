/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViewerTheme } from '../types';

export const lightTheme: ViewerTheme = {
  background: '#ffffff',
  nodeColors: {
    pass: '#e8f4fd',
    task: '#e8f5e8',
    choice: '#fff8e1',
    wait: '#f3e5f5',
    succeed: '#e8f5e8',
    fail: '#ffebee',
    parallel: '#e0f2f1',
    map: '#f1f8e9'
  },
  textColor: '#232f3e',
  borderColor: '#d5dbdb',
  connectionColor: '#879196',
  errorColor: '#d13212',
  successColor: '#1d8102'
};

export const darkTheme: ViewerTheme = {
  background: '#232f3e',
  nodeColors: {
    pass: '#1e3a5f',
    task: '#1e4d26',
    choice: '#5d4e37',
    wait: '#4a2c54',
    succeed: '#1e4d26',
    fail: '#5c1e1e',
    parallel: '#1e4a47',
    map: '#3e4d1e'
  },
  textColor: '#ffffff',
  borderColor: '#5a6d7d',
  connectionColor: '#aab7b8',
  errorColor: '#ff6b6b',
  successColor: '#51cf66'
};

export function getTheme(themeName: 'light' | 'dark'): ViewerTheme {
  return themeName === 'dark' ? darkTheme : lightTheme;
}
