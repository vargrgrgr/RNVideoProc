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
    trimFix: true,
    FilterUI: false,
    TrimmerUI: false
  }

  trimUI= () => {
    this.setState({TrimmerUI: true})
  }
  filterUI= () => {
    this.setState({FilterUI: true})
  }

  TrimmedVideoView = (source) => {
    //var RNFS = require('react-native-fs');
   // let exists = await RNFS.exists(source);
    console.log('source');
    console.log(source);
    //if(exists){
      //this.props.navigation.push('VideoProc', {local_path: source, video_length: 5});
    //}
  }

  playScrubber = () => {
    
    this.setState({startT: this.state.trimmerLeftHandlePosition/1000})
    this.setState({currentT: this.state.trimmerLeftHandlePosition/1000})
    //this.forceUpdate();
    this.setState({ playing: true });
    this.scrubberInterval = setInterval(() => {
      // this.setState({scrubberPosition: this.state.currentT })
      // if(this.state.currentT>=this.state.trimmerRightHandlePosition){
      //   this.setState({ playing: false });
      //   clearInterval(this.scrubberInterval)
      //   this.setState({ scrubberPosition: this.state.trimmerLeftHandlePosition });
      // }
      this.setState({ scrubberPosition: this.state.scrubberPosition + scrubInterval})
      this.setState({currentT: this.state.scrubberPosition/1000+1})
      if(this.state.scrubberPosition+ scrubInterval>this.state.trimmerRightHandlePosition-1000){
        this.setState({ scrubberPosition: this.state.trimmerLeftHandlePosition-1000})

      }
    }, scrubInterval)
  }

  pauseScrubber = () => {
    clearInterval(this.scrubberInterval)
    this.setState({ playing: false, scrubberPosition: this.state.trimmerLeftHandlePosition-1000});
  }

  onScrubbingComplete = (newValue) => {
    this.setState({ playing: false, scrubberPosition: newValue })
  }
  //----------------
  trimVideo = () => {
    console.log((Math.round(this.state.currentT)));
    const options = {
      startTime: (Math.round(this.state.trimmerLeftHandlePosition/1000)),
      endTime: (Math.round(this.state.trimmerLeftHandlePosition/1000))+5,
      quality: VideoPlayer.Constants.quality.QUALITY_1280x720, // iOS only
      saveToCameraRoll: true, // default is false // iOS only
      saveWithCurrentDate: false, // default is false // iOS only
    };
    console.log("trim");
    this.videoPlayerRef.trim(options)
      .then((newSource) => this.TrimmedVideoView(newSource))
      .catch(console.warn);
  //this.videoPlayerRef.trim(this.state.videoSource, this.state.trimmerLeftHandlePosition, this.state.trimmerRighttHandlePosition)
  }
  ff_trimVideo = () => {

    console.log("fftrim");
    this.videoPlayerRef.ff_trim(this.state.videoSource);
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
      
      
    }
    this.pauseScrubber();
    this.setState({startT: this.state.trimmerLeftHandlePosition/1000});
    this.setState({currentT: this.state.trimmerLeftHandlePosition/1000});
  }

  //혹시 제스쳐핸들러가 핸들 위치를 잘못 설정했을 경우 fix
  fixTrimHandle = (leftposition, rightposition) => {
    // leftval = Math.abs(leftposition-this.state.trimmerLeftHandlePosition);
    // rightval = Math.abs(rightposition-this.state.trimmerRightHandlePosition);
    // if(leftval>=rightval){
    //   this.setState({ trimmerLeftHandlePosition: leftposition });
    //   if(leftposition+this.state.TrimUnitSize<=this.state.videoLength){
    //     this.setState({ trimmerRightHandlePosition: leftposition+this.state.TrimUnitSize });
    //   }else{
    //               this.setState({ trimmerLeftHandlePosition: (leftposition+this.state.TrimUnitSize-this.state.videoLength) });
    //               this.setState({ trimmerRightHandlePosition: this.state.trimmerLeftHandlePosition+this.state.TrimUnitSize });
    //   }
    // }else{
      if(rightposition<5000){
        this.setState({ trimmerRightHandlePosition: 5000 });
        this.setState({ trimmerLeftHandlePosition: 0});
      }
      else{
        this.setState({ trimmerRightHandlePosition: rightposition });
        this.setState({ trimmerLeftHandlePosition: rightposition-this.state.TrimUnitSize });
        if(rightposition-this.state.TrimUnitSize<0){
          this.setState({ trimmerRightHandlePosition: 5000 });
          this.setState({ trimmerLeftHandlePosition: 0 });
        }
      }
    // }
    this.setState({ scrubberPosition: this.state.trimmerLeftHandlePosition });
    this.setState({startT: this.state.scrubberPosition/1000+1});
    this.setState({currentT: this.state.scrubberPosition/1000+1});
  } 
  // onChanged (text) {
  //   this.setState({
  //       //leftnumber: text.replace(/[^0-9]/g, ''),
  //       leftnumber: text
  //   });
  // }
  // onChanged2 (text) {
  //   this.setState({
  //       //rightnumber: text.replace(/[^0-9]/g, ''),
  //       rightnumber: text
  //   }); 
  // }
    
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
      FilterUI,
      TrimmerUI,
    } = this.state;

  
  return (
      <View style={styles.container}>
          <View style={styles.videoview}>
            <VideoPlayer
              ref={ref => this.videoPlayerRef = ref}
              startTime={startT}  // seconds
              play={false}     // default false
              replay={false}   // should player play video again if it's ended
              rotate={false}   // use this prop to rotate video if it captured in landscape mode iOS only
              background_Color={'Black'}
              currentTime={currentT}
              source={videoSource}
              resizemode={"AVLayerVideoGravityResizeAspectFill"}
              onChange={({ nativeEvent }) => console.log({ nativeEvent })} // get Current time on every second
            />
          </View>
          <View style={styles.buttonsview}>
            <View style={styles.l_button}>
            {
              FilterUI?
              <Button title="Filter" color="#f638dc" onPress={(this.filterUI)}/> : 
              <Button title="Filter" color="#f638dc" />
            }
            </View>
            <View style={styles.button}>
            {
              playing? 
              <Button title="Pause" color="#f638dc" opacity={0.5} onPress={this.pauseScrubber}/> : 
              <Button title="Play" color="#f638dc" onPress={this.playScrubber}/>
            }
            </View>
            <View style={styles.l_button}>
            {
              TrimmerUI?
              <Button title="Trim" color="#f638dc" onPress={this.trimVideo}/>:
              <Button title="Trimmer" color="#f638dc" onPress={this.trimUI}/>
            }
            </View>
          
          </View>
          <View style={styles.trimmer}>
            {
            TrimmerUI?
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
            />:
            <View></View>
            }
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
      width:65,
      height:40,
      opacity: 50,
      borderRadius: 15,
      backgroundColor:'white'
    },
    l_button:{
      width:120,
      height:40,
      opacity: 50,
      borderRadius: 15,
      backgroundColor:'white'
    }
  })