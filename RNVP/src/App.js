
import * as React from 'react';
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import SelectVideoScreen from '../screens/selectvideo/SelectVideoScreen';
import VideoProcScreen from '../screens/videoproc/VideoProcScreen';



function App() {
const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectVideo">
      <Stack.Screen name="SelectVideo" component={SelectVideoScreen} />
        <Stack.Screen name="VideoProc" component={VideoProcScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;