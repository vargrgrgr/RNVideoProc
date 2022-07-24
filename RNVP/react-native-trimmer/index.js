import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  Dimensions,
  PanResponder,
  Animated,
  TouchableHighlight,
} from 'react-native';

import * as Arrow from './Arrow';

const { width: screenWidth, height: screenHeight} = Dimensions.get('window');

//ToDO : 트림유닛사이즈 연동+ fixtrim 스테이트 가져와서 트림핸들조작 이원화  +  이니셜 줌 밸류 연동
const TrimUnitSize =5000; //VideoProcScreen과 연동
const MINIMUM_TRIM_DURATION = 5000;
const MAXIMUM_TRIM_DURATION = 5000;
const MAXIMUM_SCALE_VALUE = 50;
const ZOOM_MULTIPLIER = 5;
const INITIAL_ZOOM = 0.8;
const SCALE_ON_INIT_TYPE = 'trim-duration'
const SHOW_SCROLL_INDICATOR = true
const CENTER_ON_LAYOUT = true
const TRACK_PADDING_OFFSET = 10;
const HANDLE_WIDTHS = 10;

const MARKER_INCREMENT = 5000;
const SPECIAL_MARKER_INCREMEMNT = 5;

const TRACK_BACKGROUND_COLOR = '#f2f6f5';
const TRACK_BORDER_COLOR = '#c8dad3';
const MARKER_COLOR = '#c8dad3';
const TINT_COLOR = '#93b5b3';
const SCRUBBER_COLOR = '#63707e'

export default class Trimmer extends React.Component {
  constructor(props) {
    super(props);

    let trackScale = props.initialZoomValue || INITIAL_ZOOM
    if(props.scaleInOnInit) {
      const { 
        maxTrimDuration = MAXIMUM_TRIM_DURATION,
        scaleInOnInitType = SCALE_ON_INIT_TYPE,
        trimmerRightHandlePosition,
        trimmerLeftHandlePosition
      } = this.props;
      const isMaxDuration = scaleInOnInitType === 'max-duration';
      const trimDuration = isMaxDuration ? maxTrimDuration : (trimmerRightHandlePosition - trimmerLeftHandlePosition);
      const smartScaleDivider = isMaxDuration ? 3 : 5; // Based on testing, 3 works better when the goal is to have the entire trimmer fit in the visible area
      const percentTrimmed = trimDuration / props.totalDuration;
      //const smartScaleValue = (2 / percentTrimmed) / smartScaleDivider;
      const smartScaleValue = 1;//Testing scale value
      //trackScale = this.clamp({ value: smartScaleValue, min: 0.8, max: props.maximumZoomLevel || MAXIMUM_SCALE_VALUE})
    }

    this.initiateAnimator();
    this.state = {
      scrubbing: false,                                       // this value means scrubbing is currently happening
      trimming: false,                                        // this value means the handles are being moved
      trackScale,                                             // the scale factor for the track
      trimmingLeftHandleValue: 0,
      trimmingRightHandleValue: 0,
      internalScrubbingPosition: 0,
      panResponderEnabled: true,
    }
  }
  
  clamp = ({ value, min, max }) => Math.min(Math.max(value, min), max);

  initiateAnimator = () => {
    
    this.scaleTrackValue = new Animated.Value(0);
    this.lastDy = 0;
    this.trackPanResponder = this.createTrackPanResponder()
    this.leftHandlePanResponder = this.createLeftHandlePanResponder()
    this.rightHandlePanResponder = this.createRightHandlePanResponder()
    this.scrubHandlePanResponder = this.createScrubHandlePanResponder()
    this.TrimmerMovePanResponder = this.createTrimmerMovePanResponder()
  }


  createScrubHandlePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      this.setState({
        scrubbing: true,
        internalScrubbingPosition: this.props.scrubberPosition,
      })
      this.handleScrubberPressIn()
    },
    onPanResponderMove: (evt, gestureState) => {
      const { trackScale } = this.state;
      const {
        scrubberPosition,
        trimmerLeftHandlePosition,
        trimmerRightHandlePosition,
        totalDuration,
      } = this.props;
      
      const trackWidth = (screenWidth) * trackScale
      const calculatedScrubberPosition = (scrubberPosition / totalDuration) * trackWidth;
      
      //const newScrubberPosition = ((calculatedScrubberPosition + gestureState.dx) / trackWidth ) * totalDuration
      const newScrubberPosition = ((calculatedScrubberPosition) / trackWidth ) * totalDuration
      
      const lowerBound = Math.max(0, trimmerLeftHandlePosition)
      const upperBound = trimmerRightHandlePosition

      const newBoundedScrubberPosition = this.clamp({
        value: newScrubberPosition,
        min: lowerBound,
        max: upperBound
      })
      
      this.setState({ internalScrubbingPosition: newBoundedScrubberPosition })
    },
    onPanResponderRelease: (evt, gestureState) => {
      this.handleScrubbingValueChange(this.state.trimmingLeftHandleValue)
      this.setState({ scrubbing: false })
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => true
  })

  createTrimmerMovePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      this.setState({
        trimming: true,
        trimmingRightHandleValue: this.props.trimmerRightHandlePosition,
        trimmingLeftHandleValue: this.props.trimmerLeftHandlePosition,
      })
      this.handleRightHandlePressIn()
    },



    onPanResponderMove: (evt, gestureState) => {
      const { trackScale } = this.state;
      const { 
        trimmerRightHandlePosition,
        trimmerLeftHandlePosition,
        totalDuration,
        minimumTrimDuration = MINIMUM_TRIM_DURATION,
        maxTrimDuration = MAXIMUM_TRIM_DURATION,
        
      } = this.props;
      const trackWidth = screenWidth * trackScale
      const calculatedTrimmerRightHandlePosition = (trimmerRightHandlePosition / totalDuration) * trackWidth;

      const newTrimmerRightHandlePosition = ((calculatedTrimmerRightHandlePosition + gestureState.dx) / trackWidth ) * totalDuration

      if (newTrimmerRightHandlePosition<minimumTrimDuration){
        this.setState({
          trimmingRightHandleValue: minimumTrimDuration,
          trimmingLeftHandleValue: 0,
          panResponderEnabled: false,
        })
      }
      if (this.state.panResponderEnabled==true){
        const lowerBound = minimumTrimDuration
        const upperBound = totalDuration
        const trimmersize = trimmerRightHandlePosition - trimmerLeftHandlePosition
        const newBoundedTrimmerRightHandlePosition = this.clamp({
          value: newTrimmerRightHandlePosition,
          min: lowerBound,
          max: upperBound
        })
        const newTrimmerLeftHandlePosition = newBoundedTrimmerRightHandlePosition -5000

        const newBoundedTrimmerLeftHandlePosition = this.clamp({
          value: newTrimmerLeftHandlePosition,
          min: 0,
          max: upperBound-5000,
        })
        
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition,
          trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition,
        })
      }
      

      
    },



    onPanResponderRelease: (evt, gestureState) => {
      console.log(this.state.trimmingLeftHandleValue)
      console.log(this.state.trimmingRightHandleValue)
      if(this.state.trimmingRightHandleValue<5000){
        console.log('this.state.trimmingRightHandleValue')
        this.setState({trimmerRightHandleValue: 5000})
        console.log(this.state.trimmingRightHandleValue)
      }
      console.log(this.state.trimmingRightHandleValue)
      this.handleHandleSizeChange()
      console.log(this.state.trimmingRightHandleValue)
      this.setState({ trimming: false,  panResponderEnabled: true, })
      console.log(this.state.trimmingRightHandleValue)
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => true
  })
 
 
  createRightHandlePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      this.setState({
        trimming: true,
        trimmingRightHandleValue: this.props.trimmerRightHandlePosition,
        trimmingLeftHandleValue: this.props.trimmerLeftHandlePosition,
      })
      this.handleRightHandlePressIn()
    },
    onPanResponderMove: (evt, gestureState) => {
      const { trackScale } = this.state;
      const { 
        trimmerRightHandlePosition,
        totalDuration,
        minimumTrimDuration = MINIMUM_TRIM_DURATION,
        maxTrimDuration = MAXIMUM_TRIM_DURATION,
      } = this.props;
      
      const trackWidth = screenWidth * trackScale
      const calculatedTrimmerRightHandlePosition = (trimmerRightHandlePosition / totalDuration) * trackWidth;

      const newTrimmerRightHandlePosition = ((calculatedTrimmerRightHandlePosition + gestureState.dx) / trackWidth ) * totalDuration
    
      const lowerBound = minimumTrimDuration-1
      const upperBound = totalDuration-1

      const newBoundedTrimmerRightHandlePosition = this.clamp({
        value: newTrimmerRightHandlePosition,
        min: lowerBound,
        max: upperBound
      })
      if(newBoundedTrimmerRightHandlePosition - maxTrimDuration < 0){
        this.setState({newBoundedTrimmerRightHandlePosition: maxTrimDuration});
        this.setState({newBoundedTrimmerLeftHandlePosition: 0});
      }
      if(newBoundedTrimmerRightHandlePosition - minimumTrimDuration < 0){
        this.setState({newBoundedTrimmerRightHandlePosition: maxTrimDuration});
        this.setState({newBoundedTrimmerLeftHandlePosition: 0});
      }
      if (newBoundedTrimmerRightHandlePosition - this.state.trimmingLeftHandleValue >= maxTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition,
          trimmingLeftHandleValue: newBoundedTrimmerRightHandlePosition - maxTrimDuration,
        })
      } else if (newBoundedTrimmerRightHandlePosition - this.state.trimmingLeftHandleValue <= minimumTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition,
          trimmingLeftHandleValue: newBoundedTrimmerRightHandlePosition - minimumTrimDuration,
        })
      } else {
        this.setState({ trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition })
        this.setState({ trimmingLeftHandleValue: newBoundedTrimmerRightHandlePosition-TrimUnitSize }) //left handle 같이 이동
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      this.handleHandleSizeChange()
      this.setState({ trimming: false })
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => true
  })

  createLeftHandlePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      this.setState({
        trimming: true,
        trimmingRightHandleValue: this.props.trimmerRightHandlePosition,
        trimmingLeftHandleValue: this.props.trimmerLeftHandlePosition,
      })
      this.handleLeftHandlePressIn()
    },
    onPanResponderMove: (evt, gestureState) => {
      const { trackScale } = this.state;
      const {
        trimmerLeftHandlePosition,
        trimmerRightHandlePosition,
        totalDuration,
        minimumTrimDuration = MINIMUM_TRIM_DURATION,
        maxTrimDuration = MAXIMUM_TRIM_DURATION,
      } = this.props;
      
      const trackWidth = (screenWidth) * trackScale
      const calculatedTrimmerLeftHandlePosition = (trimmerLeftHandlePosition / totalDuration) * trackWidth;
      
      const newTrimmerLeftHandlePosition = ((calculatedTrimmerLeftHandlePosition + gestureState.dx) / trackWidth ) * totalDuration
      const lowerBound = 1
      const upperBound = totalDuration - minimumTrimDuration-1

      const newBoundedTrimmerLeftHandlePosition = this.clamp({
        value: newTrimmerLeftHandlePosition,
        min: lowerBound,
        max: upperBound
      })

      if (this.state.trimmingRightHandleValue - newBoundedTrimmerLeftHandlePosition >= maxTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerLeftHandlePosition + maxTrimDuration,
          trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition,
        })
      } else if (this.state.trimmingRightHandleValue - newBoundedTrimmerLeftHandlePosition <= minimumTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerLeftHandlePosition,
          trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition - minimumTrimDuration,
        })
      } else {
        this.setState({ trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition })
        this.setState({ trimmingRightHandleValue: newBoundedTrimmerLeftHandlePosition +TrimUnitSize}) //RightHandle 같이 무빙

      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      this.handleHandleSizeChange()
      this.setState({ trimming: false })
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => true
  })

  calculatePinchDistance = (x1, y1, x2, y2) => {
    let dx = Math.abs(x1 - x2)
    let dy = Math.abs(y1 - y2)
    const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return distance
  }
  
  createTrackPanResponder = () => PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => !this.state.scrubbing && !this.state.trimming,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => !this.state.scrubbing && !this.state.trimming,
      onMoveShouldSetPanResponder: (evt, gestureState) => !this.state.scrubbing && !this.state.trimming,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => !this.state.scrubbing && !this.state.trimming,
      onPanResponderGrant: (evt, gestureState) => {
        this.lastScaleDy = 0;
        const touches = evt.nativeEvent.touches || {};

        if (touches.length == 2) {
          const pinchDistance = this.calculatePinchDistance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);

          this.lastScalePinchDist = pinchDistance;
        } 
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        const { maximumZoomLevel = MAXIMUM_SCALE_VALUE, zoomMultiplier = ZOOM_MULTIPLIER } = this.props;

        if (touches.length == 2) {
          const pinchDistance = this.calculatePinchDistance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);

          if(this.lastScalePinchDist === undefined) {
            this.lastScalePinchDist = pinchDistance
          }

          const stepValue = pinchDistance - this.lastScalePinchDist;
          this.lastScalePinchDist = pinchDistance
  
          const scaleStep = (stepValue * zoomMultiplier) / screenHeight
          const { trackScale } = this.state;
  
          const newTrackScaleValue = trackScale + scaleStep;
          const newBoundedTrackScaleValue = Math.max(Math.min(newTrackScaleValue, maximumZoomLevel), 1)
  
          //this.setState({trackScale: newBoundedTrackScaleValue})
          this.setState({trackScale: 1})
        } else {
          const stepValue = (gestureState.dy - this.lastScaleDy);
          this.lastScaleDy = gestureState.dy
  
          const scaleStep = (stepValue * zoomMultiplier) / screenHeight
          const { trackScale } = this.state;
  
          const newTrackScaleValue = trackScale + scaleStep;
          const newBoundedTrackScaleValue = Math.max(Math.min(newTrackScaleValue, maximumZoomLevel), 1)
  
          //this.setState({trackScale: newBoundedTrackScaleValue})
          this.setState({trackScale: 0.8})
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onShouldBlockNativeResponder: (evt, gestureState) => true
  })

  handleScrubbingValueChange = (newScrubPosition) => {
    const { onScrubbingComplete } = this.props;
    onScrubbingComplete && onScrubbingComplete(newScrubPosition | 0)
  }

  handleHandleSizeChange = () => {
    const { onHandleChange } = this.props;
    const { trimmingLeftHandleValue, trimmingRightHandleValue } = this.state;
    onHandleChange && onHandleChange({
      leftPosition: trimmingLeftHandleValue | 0,
      rightPosition: trimmingRightHandleValue | 0,
    });
    this.handleScrubbingValueChange(trimmingLeftHandleValue);
  }

  handleLeftHandlePressIn = () => {
    const { onLeftHandlePressIn } = this.props;
    onLeftHandlePressIn && onLeftHandlePressIn()
  }

  handleRightHandlePressIn = () => {
    const { onRightHandlePressIn } = this.props;
    onRightHandlePressIn && onRightHandlePressIn()
  }

  handleScrubberPressIn = () => {
    const { onScrubberPressIn } = this.props;
    onScrubberPressIn && onScrubberPressIn()
  }

  render() {
    const {
      maxTrimDuration,
      minimumTrimDuration,
      totalDuration,
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
      scrubberPosition,
      trackBackgroundColor = TRACK_BACKGROUND_COLOR,
      trackBorderColor = TRACK_BORDER_COLOR,
      markerColor = MARKER_COLOR,
      tintColor = TINT_COLOR,
      scrubberColor = SCRUBBER_COLOR,
      centerOnLayout = CENTER_ON_LAYOUT,
      showScrollIndicator = SHOW_SCROLL_INDICATOR,
    } = this.props;

    // if(maxTrimDuration < trimmerRightHandlePosition - trimmerLeftHandlePosition) {
    //   console.error('maxTrimDuration is less than trimRightHandlePosition minus trimmerLeftHandlePosition', {
    //     minimumTrimDuration, trimmerRightHandlePosition, trimmerLeftHandlePosition
    //   })
    //   return null
    // }

    if(minimumTrimDuration > trimmerRightHandlePosition - trimmerLeftHandlePosition) {
      console.error('minimumTrimDuration is less than trimRightHandlePosition minus trimmerLeftHandlePosition', {
        minimumTrimDuration, trimmerRightHandlePosition, trimmerLeftHandlePosition
      })
      this.setState({trimmingRightHandleValue: minimumTrimDuration+trimmerLeftHandlePosition});
      this.setState({trimmingLeftHandleValue: trimmerLeftHandlePosition-1000});
    }

    const {
      trimming,
      scrubbing,
      internalScrubbingPosition,
      trackScale,
      trimmingLeftHandleValue,
      trimmingRightHandleValue
    } = this.state;

    const trackWidth = screenWidth * trackScale
    if(isNaN(trackWidth)) {
      console.log('ERROR render() trackWidth !== number. screenWidth', screenWidth, ', trackScale', trackScale, ', ', trackWidth)
    }
    const trackBackgroundStyles = [
      styles.trackBackground,
      { width: trackWidth, backgroundColor: trackBackgroundColor, borderColor: trackBorderColor
    }];
        
    const leftPosition = trimming ? trimmingLeftHandleValue : trimmerLeftHandlePosition
    const rightPosition = trimming ? trimmingRightHandleValue : trimmerRightHandlePosition
    const scrubPosition = scrubbing ? internalScrubbingPosition : scrubberPosition

    const boundedLeftPosition = Math.max(leftPosition, 0)
    const boundedScrubPosition = this.clamp({ value: scrubPosition, min: boundedLeftPosition, max: rightPosition })
    const boundedTrimTime = Math.max(rightPosition - boundedLeftPosition, 0)

    const actualTrimmerWidth = (boundedTrimTime / totalDuration) * trackWidth;
    const actualTrimmerOffset = ((boundedLeftPosition / totalDuration) * trackWidth) + TRACK_PADDING_OFFSET + HANDLE_WIDTHS;
    const actualScrubPosition = ((boundedScrubPosition / totalDuration) * trackWidth) + TRACK_PADDING_OFFSET + HANDLE_WIDTHS;
 
    const onLayoutHandler = centerOnLayout
        ? {
            onLayout: () => {
            const centerOffset = actualTrimmerOffset + (actualTrimmerWidth / 2) - (screenWidth / 2);
            this.scrollView.scrollTo({x: centerOffset, y: 0, animated: false});
            }
        }
        : null

    if(isNaN(actualTrimmerWidth)) {
      console.log('ERROR render() actualTrimmerWidth !== number. boundedTrimTime', boundedTrimTime, ', totalDuration', totalDuration, ', trackWidth', trackWidth)
    }

    const markers = new Array((totalDuration / MARKER_INCREMENT) | 0).fill(0) || [];

    return (
      <View style={styles.root}>
        <ScrollView 
          ref={scrollView => this.scrollView = scrollView}
          scrollEnabled={false}
          style={[
            styles.horizontalScrollView,
            { transform: [{ scaleX: 1.0 }] },
          ]} 
          horizontal
          showsHorizontalScrollIndicator={showScrollIndicator}
          {...{...this.trackPanResponder.panHandlers, ...onLayoutHandler}}
        >
          <View style={trackBackgroundStyles}>
            <View style={styles.markersContainer}>
              {
                markers.map((m,i) => (
                  <View 
                    key={`marker-${i}`} 
                    style={[
                      styles.marker,
                      i % SPECIAL_MARKER_INCREMEMNT ? {} : styles.specialMarker,
                      i === 0 || i === markers.length - 1 ? styles.hiddenMarker : {},
                      { backgroundColor: markerColor }
                    ]}/>
                ))
              }
            </View>
          </View>
          {
            typeof scrubberPosition === 'number'
              ? (
                <View style={[
                    styles.scrubberContainer,
                    { left: actualScrubPosition },
                  ]} 
                >

                  <View style={[styles.scrubberTail, { backgroundColor: scrubberColor }]} />
                </View>
              )
              : null
          }
          <View  style={[
            styles.handle, 
            styles.leftHandle,
            { backgroundColor: tintColor, left: actualTrimmerOffset - HANDLE_WIDTHS }
          ]}>
            <Arrow.Left />
          </View>
          <View {...this.TrimmerMovePanResponder.panHandlers} style={[
            styles.trimmer,
            { width: actualTrimmerWidth, left: actualTrimmerOffset },
            { borderColor: tintColor }
          ]}>
            <View style={[styles.selection, { backgroundColor: tintColor }]}/>
          </View>
          <View style={[
            styles.handle,
            styles.rightHandle,
            { backgroundColor: tintColor, left: actualTrimmerOffset + actualTrimmerWidth }
          ]} >
            <Arrow.Right />
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    height: 140,
  },
  horizontalScrollView: {
    height: 140,
    overflow: 'hidden',
    position: 'relative',
  },
  trackBackground: {
    overflow: 'hidden',
    marginVertical: 39,
    backgroundColor: TRACK_BACKGROUND_COLOR,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: TRACK_BORDER_COLOR,
    height: 50,
    marginHorizontal: HANDLE_WIDTHS + TRACK_PADDING_OFFSET,
  },
  trimmer: {
    position: 'absolute',
    left: TRACK_PADDING_OFFSET,
    top: 37,
    borderColor: TINT_COLOR,
    borderWidth: 3,
    height: 53,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_WIDTHS,
    height: 53,
    backgroundColor: TINT_COLOR,
    top: 37,
    right: 10,
  },
  leftHandle: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rightHandle: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    right: 120,
  },
  selection: {
    opacity: 0.2,
    backgroundColor: TINT_COLOR,
    width: '100%',
    height: '100%',
  },
  markersContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marker: {
    backgroundColor: MARKER_COLOR, // marker color,
    width: 2,
    height: 8,
    borderRadius: 2,
  },
  specialMarker: {
    height: 22,
  },
  hiddenMarker: {
    opacity: 0
  },
  scrubberContainer: {
    zIndex: 1,
    position: 'absolute',
    width: 14,
    height: "100%",
    // justifyContent: 'center',
    alignItems: 'center',
  },
  scrubberHead: {
    position: 'absolute',
    backgroundColor: SCRUBBER_COLOR,
    opacity: 100,
    width: 14,
    height: 14,
    borderRadius: 14,
  },
  scrubberTail: {
    backgroundColor: SCRUBBER_COLOR,
    height: 49,
    width: 3,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    top: 38,
  },
});