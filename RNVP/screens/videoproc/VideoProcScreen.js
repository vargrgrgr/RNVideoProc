import React, {Component} from 'react';
import {
  View, Button, Dimensions, PixelRatio, TextInput, Text
} from 'react-native';
import {VideoPlayer} from '../../RNVP_module';
import Trimmer from 'react-native-trimmer'

const maxTrimDuration = 60000;
const minimumTrimDuration = 1000;
const initialTotalDuration = 10000
const initialLeftHandlePosition = 0;
const initialRightHandlePosition = 10000;
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
    this.setState({ playing: true });
    this.scrubberInterval = setInterval(() => {
      this.setState({ scrubberPosition: this.state.scrubberPosition + scrubInterval })

      if(this.state.scrubberPosition+ scrubInterval>this.state.trimmerRightHandlePosition){
        clearInterval(this.scrubberInterval)
        this.setState({ playing: false });
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
  compressVideo = () => {
      const options = {
          width: 720,
          height: 1280,
          bitrateMultiplier: 3,
          saveToCameraRoll: true, // default is false, iOS only
          saveWithCurrentDate: true, // default is false, iOS only
          minimumBitrate: 300000,
          removeAudio: true, // default is false
      };
      this.videoPlayerRef.compress(options)
          .then((newSource) => console.log(newSource))
          .catch(console.warn);
  }

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
      fixedleftposition = this.fixTrimHandle(leftPosition);
      fixedrightposition = this.fixTrimHandle(rightPosition);
      console.log("position fixed."+fixedleftposition+","+fixedrightposition);
      this.setState({ trimmerRightHandlePosition: fixedrightposition });
      this.setState({ trimmerLeftHandlePosition: fixedleftposition });
      this.setState({startT: this.state.trimmerLeftHandlePosition});
      this.forceUpdate();
    }else{
      this.setState({ trimmerRightHandlePosition: rightPosition });
      this.setState({ trimmerLeftHandlePosition: leftPosition });
    }
  }

  
  fixTrimHandle = (position) => {
    if(position<=0){
      return 0;
    }
    fixedPosition = Math.round(position/this.state.TrimUnitSize);
    //console.log(fixedPosition);
    if(fixedPosition*this.state.TrimUnitSize>=this.state.videoLength){
      return this.state.videoLength;
    }
    return fixedPosition*this.state.TrimUnitSize;
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
    console.log(this.state.scrubberPosition);
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
          <View style={{ 
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
                <View style= {{
                    padding: 20,
                    flex: 0.8
                }}>    
                    <VideoPlayer
                        ref={ref => this.videoPlayerRef = ref}
                        startTime={this.state.startT/1000}  // seconds
                        play={playing}     // default false
                        replay={false}   // should player play video again if it's ended
                        rotate={false}   // use this prop to rotate video if it captured in landscape mode iOS only
                        currentTime={scrubberPosition/1000}
                        source={videoSource}
                        playerWidth={Dimensions.get('window').width * PixelRatio.get()/3-40}// iOS only 
                        resizeMode={VideoPlayer.Constants.resizeMode.CONTAIN}
                        onChange={({ nativeEvent }) => console.log({ nativeEvent })} // get Current time on every second
                    />
                </View>
                <View style={{ 
                    flex: 0.2,
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <View style={{
                        flex: 1,
                    }}>
                    </View>
                    <View style={{
                        flex: 1,
                    }}>
                        {
                        playing
                            ? <Button title="Pause" color="#f638dc" onPress={this.pauseScrubber}/>
                            : <Button title="Play" color="#f638dc" onPress={this.playScrubber}/>
                        }
                    </View>
                    <View style={{
                        flex: 1,
                    }}>
                        {
                        <Button title="Trim" color="#f638dc" onPress={this.trimVideo}/>
                        }
                    </View>
                    
                </View>
                <View>
                    <Trimmer
                        onHandleChange= {this.onHandleChange}
                        totalDuration={videoLength}
                        trimmerLeftHandlePosition={trimmerLeftHandlePosition}
                        trimmerRightHandlePosition={trimmerRightHandlePosition}
                        minimumTrimDuration={minimumTrimDuration}
                        maxTrimDuration={maxTrimDuration}
                        maximumZoomLevel={200}
                        zoomMultiplier={20}
                        initialZoomValue={2}
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