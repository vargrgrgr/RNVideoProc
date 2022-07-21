import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import SelectVideoScreen from '../screens/selectvideo/SelectVideoScreen';
import VideoProcScreen from '../screens/videoproc/VideoProcScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectVideo">
      <Stack.Screen name="SelectVideo" component={SelectVideoScreen} />
      <Stack.Screen name="VideoProc" component={VideoProcScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}