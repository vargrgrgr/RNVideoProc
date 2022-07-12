/**
 * @format
 */
import React from 'react';
import { AppRegistry } from 'react-native';

import App from './src/App';
import {name as appName} from './app.json';


const REGISTER_APP = () => (
      <App />
  );

AppRegistry.registerComponent(appName, () => REGISTER_APP);
