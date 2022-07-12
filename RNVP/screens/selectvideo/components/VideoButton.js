import React from 'react';
import { View, Button, Platform, StyleSheet } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useDispatch } from 'react-redux';
import VideoProc from '../../videoproc/VideoProcScreen';


export default function SelectFile () {
  const dispatch = useDispatch();
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
            ios: { "value": response.uri }
        }).value;
        Navigation.navigate(VideoProc, { local_path: path });
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
      if (!response.didCancel && !response.error) {
        const path = Platform.select({
            android: { "value": response.path },
            ios: { "value": response.uri }
        }).value;
        VideoProc({ local_path: path });
      }
    });
  };

  return (
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
    justifyContent: "center",
    alignItems: "center",
  }
});