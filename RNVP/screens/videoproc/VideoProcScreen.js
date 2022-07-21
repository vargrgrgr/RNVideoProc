import React, {Component} from 'react';
import {
  View, Button, Dimensions, PixelRatio, TextInput, Text, StyleSheet
} from 'react-native';
import {VideoPlayer} from '../../RNVP_module';
import Trimmer from '../../react-native-trimmer'

const maxTrimDuration = 60000;
const minimumTrimDuration = 1000;
const initialTotalDuration = 10000
const initialLeftHandlePosition = 0;
const initialRightHandlePosition = 5000;
const scrubInterval = 50;
const initialTrimUnitSize = 5000;



 class VideoProcScreen extends Component {
   
  state = {
    playing: false,
    trimmerLeftHandlePosition: initialLeftHandlePosition,
    trimmerRightHandlePosition: initialRightHandlePosition,
    videoSource: this.props.route.params.local_path,
    videoLength: this.props.route.params.video_length*1000,
    scrubberPosition: 0,
    currentT: 0,
    startT: 0,
    leftnumber: 0,
    rightnumber: 10000,
    totalDuration: initialTotalDuration,
    TrimUnitSize: initialTrimUnitSize,
    trimFix: true
  }

  playScrubber = () => {
    this.forceUpdate();
    this.setState({ playing: true });
    this.scrubberInterval = setInterval(() => {
      this.setState({ scrubberPosition: this.state.scrubberPosition + scrubInterval })
      if(this.state.scrubberPosition+ scrubInterval>this.state.trimmerRightHandlePosition){
        this.setState({ playing: false });
        clearInterval(this.scrubberInterval)
        this.setState({ scrubberPosition: this.state.trimmerLeftHandlePosition });
      }
    }, scrubInterval)
  }

  pauseScrubber = () => {
    clearInterval(this.scrubberInterval)
    this.setState({ playing: false, scrubberPosition: this.state.trimmerLeftHandlePosition});
  }

  onScrubbingComplete = (newValue) => {
    this.setState({ playing: false, scrubberPosition: newValue })
  }
  //----------------
  trimVideo = () => {
      const options = {
          startTime: this.state.trimmerLeftHandlePosition/1000,
          endTime: this.state.trimmerRightHandlePosition/1000,
          saveToCameraRoll: true, // default is false // iOS only
      };
      this.videoPlayerRef.trim(options)
          .then((newSource) => console.log(newSource))
          .catch(console.warn);
  }
  //----------------
  getPreviewImageForSecond = (second) => {
      const maximumSize = { width: 1080, height: 1080 }; // default is { width: 1080, height: 1080 } iOS only
      this.videoPlayerRef.getPreviewForSecond(second, maximumSize) // maximumSize is iOS only
      .then((base64String) => console.log('This is BASE64 of image', base64String))
      .catch(console.warn);
  }

  getVideoInfo = () => {
      this.videoPlayerRef.getVideoInfo()
      .then((info) => console.log(info))
      .catch(console.warn);
  }
  onHandleChange = ({ leftPosition, rightPosition }) => {
    if(this.state.trimFix==true){
      this.fixTrimHandle(leftPosition, rightPosition);
    }else{
      this.setState({ trimmerRightHandlePosition: rightPosition });
      this.setState({ trimmerLeftHandlePosition: leftPosition });
      this.setState({startT: this.state.trimmerLeftHandlePosition});
    }

    this.pauseScrubber();
    this.playScrubber();
    this.pauseScrubber();
    this.forceUpdate();
  }

  //혹시 제스쳐핸들러가 핸들 위치를 잘못 설정했을 경우 fix
  fixTrimHandle = (leftposition, rightposition) => {
    leftval = Math.abs(leftposition-this.state.trimmerLeftHandlePosition);
    rightval = Math.abs(rightposition-this.state.trimmerRightHandlePosition);
    if(leftval>=rightval){
      this.setState({ trimmerLeftHandlePosition: leftposition });
      if(leftposition+this.state.TrimUnitSize<=this.state.videoLength){
        this.setState({ trimmerRightHandlePosition: leftposition+this.state.TrimUnitSize });
      }else{
                  this.setState({ trimmerLeftHandlePosition: (leftposition+this.state.TrimUnitSize-this.state.videoLength) });
                  this.setState({ trimmerRightHandlePosition: this.state.trimmerLeftHandlePosition+this.state.TrimUnitSize });
      }
    }else{
      this.setState({ trimmerRightHandlePosition: rightposition });
      this.setState({ trimmerLeftHandlePosition: rightposition-this.state.TrimUnitSize });
      if(rightposition-this.state.TrimUnitSize<0){
        this.setState({ trimmerLeftHandlePosition: 0 });
      }
    }
    this.setState({ scrubberPosition: this.state.trimmerLeftHandlePosition });
    this.setState({startT: this.state.trimmerLeftHandlePosition});
  } 
  onChanged (text) {
    this.setState({
        //leftnumber: text.replace(/[^0-9]/g, ''),
        leftnumber: text
    });
  }
  onChanged2 (text) {
    this.setState({
        //rightnumber: text.replace(/[^0-9]/g, ''),
        rightnumber: text
    }); 
  }
    
  render(){
    const {
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
      scrubberPosition,
      playing,
      currentT,
      leftnumber,
      rightnumber,
      videoSource,
      videoLength,
      startT,
      trimfix,
    } = this.state;


  return (
      <View style={styles.container}>
          <View style={styles.videoview}>
            <VideoPlayer
              ref={ref => this.videoPlayerRef = ref}
              startTime={this.state.startT/1000}  // seconds
              play={false}     // default false
              replay={false}   // should player play video again if it's ended
              rotate={false}   // use this prop to rotate video if it captured in landscape mode iOS only
              background_Color={'Black'}
              currentTime={scrubberPosition/1000}
              source={videoSource}
              resizemode={"AVLayerVideoGravityResizeAspectFill"}
              onChange={({ nativeEvent }) => console.log({ nativeEvent })} // get Current time on every second
            />
          </View>
          <View style={styles.buttonsview}>
            <View style={styles.button}>
            {
              playing? 
              <Button title="Pause" color="#f638dc" onPress={this.pauseScrubber}/> : 
              <Button title="Play" color="#f638dc" onPress={this.playScrubber}/>
            }
            </View>
            <View style={styles.button}>
            {
              <Button title="Trim" color="#f638dc" onPress={this.trimVideo}/>
            }
            </View>
          
          </View>
          <View style={styles.trimmer}>
            <Trimmer
            onHandleChange= {this.onHandleChange}
            totalDuration={videoLength}
            trimmerLeftHandlePosition={trimmerLeftHandlePosition}
            trimmerRightHandlePosition={trimmerRightHandlePosition}
            minimumTrimDuration={minimumTrimDuration}
            maxTrimDuration={maxTrimDuration}
            maximumZoomLevel={200}
            zoomMultiplier={20}
            initialZoomValue={0.8}
            scaleInOnInit={true}
            tintColor="#f638dc"
            markerColor="#5a3d5c"
            trackBackgroundColor="#382039"
            trackBorderColor="#5a3d5c"
            scrubberColor="#b7e778"
            scrubberPosition={scrubberPosition}
            onScrubbingComplete={this.onScrubbingComplete}
            onLeftHandlePressIn={() => console.log('LeftHandlePressIn')}
            onRightHandlePressIn={() => console.log('RightHandlePressIn')}
            onScrubberPressIn={() => console.log('onScrubberPressIn')}
            />
          </View>
      </View>        
      );
    }


};
export default VideoProcScreen;

const styles = StyleSheet.create({
    container:{
      flex:1,
      justifyContent: 'space-around'
    },
    videoview:{
      flex:1.5
    },
    buttonsview:{
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex:0.2
    },
    trimmerview:{

      flex:0.1
    },
    button:{
      width:50,
      height:40,
      opacity: 50,
      borderRadius: 15,
      backgroundColor:'white'
    }
  })