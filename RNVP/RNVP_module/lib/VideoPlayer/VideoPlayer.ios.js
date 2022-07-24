import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, ViewPropTypes, requireNativeComponent, NativeModules, UIManager } from 'react-native';
import { getActualSource } from '../utils';
const PLAYER_COMPONENT_NAME = 'RNVideoProcessing';

const { RNVideoTrimmer } = NativeModules;

const ProcessingUI = UIManager.getViewManagerConfig('RNVideoProcessing');
export class VideoPlayer extends Component {
  static propTypes = {
    source: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    play: PropTypes.bool,
    replay: PropTypes.bool,
    rotate: PropTypes.bool,
    currentTime: PropTypes.number,
    volume: PropTypes.number,
    startTime: PropTypes.number,
    background_Color: PropTypes.string,
    endTime: PropTypes.number,
    playerWidth: PropTypes.number,
    playerHeight: PropTypes.number,
    onChange: PropTypes.func,
    resizeMode: PropTypes.string,
    FilterUI: PropTypes.bool,
    TrimmerUI: PropTypes.bool,
    ...ViewPropTypes
  };

  static defaultProps = {
    play: false,
    replay: false,
    rotate: false,
    volume: 0.0,
    currentTime: 0,
    resizeMode: ProcessingUI.Constants.ScaleNone,
    startTime: 0,
  };
  

  static Constants = {
    quality: {
      QUALITY_LOW: 'low',
      QUALITY_MEDIUM: 'medium',
      QUALITY_HIGHEST: 'highest',
      QUALITY_640x480: '640x480',
      QUALITY_960x540: '960x540',
      QUALITY_1280x720: '1280x720',
      QUALITY_1920x1080: '1920x1080',
      QUALITY_3840x2160: '3840x2160', // available in iOS 9
      QUALITY_PASS_THROUGH: 'passthrough', // does not change quality
    },
    resizeMode: {
      CONTAIN: ProcessingUI.Constants.ScaleAspectFit,
      COVER: ProcessingUI.Constants.ScaleAspectFill,
      STRETCH: ProcessingUI.Constants.ScaleToFill,
      NONE: ProcessingUI.Constants.ScaleNone
    }
  };

  constructor(...args) {
    super(...args);
    this.state = {};
    this.trim = this.trim.bind(this);
    //this.compress = this.compress.bind(this);
    //this.getPreviewForSecond = this.getPreviewForSecond.bind(this);
    this.getVideoInfo = this.getVideoInfo.bind(this);
    this._onChange = this._onChange.bind(this);
  }
  
  // getPreviewForSecond(forSecond = 0, maximumSize, format = 'base64') {
  //   //const actualSource = getActualSource(this.props.source);
  //   return new Promise((resolve, reject) => {
  //     RNVideoTrimmer.getPreviewImageAtPosition(this.props.source, forSecond, maximumSize, format,
  //       (err, base64) => {
  //         if (err) {
  //           return reject(err);
  //         }
  //         return resolve(base64);
  //       });
  //   });
  // }

   getVideoInfo() {
    //const actualSource = getActualSource(this.props.source);
    return new Promise((resolve, reject) => {
      RNVideoProc.getAssetInfo(this.props.source, (err, info) => {
        if (err) {
          return reject(err);
        }
        return resolve(info);
      });
    });
  }

  _onChange(event) {
    if (!this.props.onChange) {
      return;
    }
    this.props.onChange(event);
  }

  trim(options = {}) {
    const availableQualities = Object.values(VideoPlayer.Constants.quality);
    if (!options.hasOwnProperty('startTime')) {
      // eslint-disable-next-line no-console
      console.warn('Start time is not specified');
    }
    if (!options.hasOwnProperty('endTime')) {
      // eslint-disable-next-line no-console
      console.warn('End time is not specified');
    }
    if (options.hasOwnProperty('quality') && !availableQualities.includes(options.quality)) {
      // eslint-disable-next-line no-console
      console.warn('Quality is wrong, Please use VideoPlayer.Constants.quality');
    }
    const actualSource = getActualSource(this.props.source);
    console.log("actualsource");
    console.log(actualSource);  
    return new Promise((resolve, reject) => {
      console.log("trim native")
      console.log(options)
      RNVideoTrimmer.trim(actualSource, options, (err, output) => {
        if (err) {
          console.log(err)
          return reject(err);
        }
        console.log("saved")
        console.log(output)
        return resolve(output);
      });
      console.log("end")
    });
  }
  ff_trim(source) {
    console.log(source)

    RNVideoTrimmer.ff_trim(source)
    return;
  }

  // compress(_options = {}) {
  //   const options = { ..._options };
  //   // const options = {
  //   // 	height: 1080, // output video's height
  //   // 	width: 720, // output video's width
  //   // 	bitrateMultiplier: 10 // divide video's bitrate to this value
  //   // };
  //   if (options.hasOwnProperty('bitrateMultiplier') && options.bitrateMultiplier <= 0) {
  //     options.bitrateMultiplier = 1;
  //     // eslint-disable-next-line no-console
  //     console.warn('bitrateMultiplier cannot be less than zero');
  //   }
  //   if (options.hasOwnProperty('height') && options.height <= 0) {
  //     delete options.height;
  //     // eslint-disable-next-line no-console
  //     console.warn('height cannot be less than zero');
  //   }
  //   if (options.hasOwnProperty('width') && options.width <= 0) {
  //     delete options.width;
  //     // eslint-disable-next-line no-console
  //     console.warn('width cannot be less than zero');
  //   }
  //   if (options.hasOwnProperty('minimumBitrate') && options.minimumBitrate <= 0) {
  //     delete options.minimumBitrate;
  //     // eslint-disable-next-line no-console
  //     console.warn('minimumBitrate cannot be less than zero');
  //   }
  //   const actualSource = getActualSource(this.props.source);
  //   return new Promise((resolve, reject) => {
  //     RNVideoTrimmer.compress(actualSource, options, (err, output) => {
  //       if (err) {
  //         return reject(err);
  //       }
  //       return resolve(output);
  //     });
  //   });
  // }

  render() {
    const {
      source,
      play,
      replay,
      rotate,
      currentTime,
      backgroundColor,
      startTime,
      endTime,
      playerWidth,
      playerHeight,
      volume,
      resizeMode,
      ...viewProps
    } = this.props;
    console.log(playerWidth)
    console.log(playerHeight)

    //const actualSource = getActualSource(source);
    return (
      <RNVideoProc  
        source={source}
        play={play}
        replay={replay}
        rotate={rotate}
        volume={volume}
        playerWidth={playerWidth}
        playerHeight={playerHeight}
        currentTime={currentTime}ƒ
        background_Color={backgroundColor}
        startTime={startTime}
        endTime={endTime}
        resizeMode={"AVLayerVideoGravityResizeAspect"}
        onChange={this._onChange}
        {...viewProps}
      />
    );
  }
}

const RNVideoProc = requireNativeComponent(PLAYER_COMPONENT_NAME, VideoPlayer);
