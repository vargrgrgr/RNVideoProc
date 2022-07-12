/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';

import App from './src/App';
import {name as appName} from './app.json';
if (!new class { x }().hasOwnProperty('x')) throw new Error('Transpiler is not configured correctly');

const REGISTER_APP = () => (
      <App />
  );

AppRegistry.registerComponent(appName, () => REGISTER_APP);
