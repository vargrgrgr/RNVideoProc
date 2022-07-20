
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SelectVideoScreen from '../screens/selectvideo/SelectVideoScreen';
import VideoProcScreen from '../screens/videoproc/VideoProcScreen';


const Stack = createStackNavigator();

const StackNavigation = () => {
  return (
    <Stack.Navigator>
        <Stack.Screen name="SelectVideo" component={SelectVideoScreen} />
        //<Stack.Screen name="VideoProc" component={VideoProcScreen} />
    </Stack.Navigator>
);
};

export default StackNavigation;
