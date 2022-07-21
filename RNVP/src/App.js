import * as React from 'react';
import {  StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from '../navigators/AppNavigator';

function App() {


  return (
    <>
      <NavigationContainer>
        <StackNavigation />
      </NavigationContainer>
    </>
  );
}

export default App;