import React  from 'react';
import {
  View, Button, StyleSheet,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'

function SelectVideoScreen ({navigation}) {
  componentDidMount();

  const recordVideo = () => {
    const options = {
      title: '영상 녹화',
      mediaType: 'video',
      storageOptions: {
        skipBackup: true,
        waitUntilSaved: true,
      },
    };

    launchCamera(options, (response) => {
      if (!response.didCancel && !response.error) {
        const path = Platform.select({
            android: { "value": response.path },
            ios: { "value": response.assets[0].uri }
        }).value;
        Vduration= response.assets[0].duration;
        console.log(Vduration);
        navigation.navigate('VideoProc', {local_path: path}, {duration: Vduration});
      }
    });
  };

  const pickVideo = () => {
    const options = {
      title: '영상 불러오기',
      mediaType: 'video',
      storageOptions: {
        skipBackup: true,
        waitUntilSaved: true,
      },
    };

    launchImageLibrary(options, (response) => {
      console.log(response);
      if (!response.didCancel && !response.error) {
        const path = Platform.select({
            android: { "value": response.path },
            ios: { "value": response.assets[0].uri }
        }).value;
        Vduration= response.assets[0].duration;
        console.log(Vduration);
        console.log(path);
        navigation.navigate('VideoProc', {local_path: path, video_length: Vduration});
      }
    });
  };
  return(
    <View style={styles.centeredView}>
      <Button
        onPress={recordVideo}
        title="카메라"
      />

      <Button
        onPress={pickVideo}
        title="라이브러리에서 열기"
      />
    </View>
  )
};
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,  
  },
});
export default SelectVideoScreen;
