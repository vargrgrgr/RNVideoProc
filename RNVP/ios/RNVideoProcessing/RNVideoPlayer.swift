//
//  RNVideoPlayer.swift
//  RNVideoProcessing
//
//  Created by Shahen Hovhannisyan on 11/14/16.

import Foundation
import AVFoundation
import RNTrim
//import GPUImage


@objc(RNVideoPlayer)
class RNVideoPlayer: RCTView {
    
  //let processingFilters: VideoProcessingGPUFilters = VideoProcessingGPUFilters()
  var playerVolume: NSNumber = 0
  var player: AVPlayer! = nil
  var playerLayer: AVPlayerLayer?
  var playerCurrentTimeObserver: Any! = nil
  var playerItem: AVPlayerItem! = nil
//  var gpuMovie: GPUImageMovie! = nil
//
//  var phantomGpuMovie: GPUImageMovie! = nil
//  var phantomFilterView: GPUImageView = GPUImageView()
//
  //let filterView: GPUImageView = GPUImageView()
  
  var _playerHeight: CGFloat = UIScreen.main.bounds.height
  var _playerWidth: CGFloat = UIScreen.main.bounds.width
  var _moviePathSource: NSString = ""
  var _playerStartTime: CGFloat = 0
  var _playerEndTime: CGFloat = 0
  var _replay: Bool = false
  var _rotate: Bool = false
  var isInitialized = false
  var _resizeMode = AVLayerVideoGravity.resizeAspectFill
  @objc var onChange: RCTBubblingEventBlock?
  
  let LOG_KEY: String = "VIDEO_PROCESSING"
  
  enum QUALITY_ENUM: String {
    case QUALITY_LOW = "low"
    case QUALITY_MEDIUM = "medium"
    case QUALITY_HIGHEST = "highest"
    case QUALITY_640x480 = "640x480"
    case QUALITY_960x540 = "960x540"
    case QUALITY_1280x720 = "1280x720"
    case QUALITY_1920x1080 = "1920x1080"
    case QUALITY_3840x2160 = "3840x2160"
    case QUALITY_PASS_THROUGH = "passthrough"
  }
  
  @objc func setSource(_ val: NSString) {
    source = val
  }
  @objc func setCurrentTime(_ val: NSNumber) {
    currentTime = val
  }
  @objc func setStartTime(_ val: NSNumber) {
    startTime = val
  }
  @objc func setEndTime(_ val: NSNumber) {
    endTime = val
  }
  @objc func setPlayerWidth(_ val: NSNumber) {
    playerWidth = val
  }
  @objc func setPlayerHeight(_ val: NSNumber) {
    playerHeight = val
  }
  @objc func setPlay(_ val: NSNumber) {
    play = val
  }
  @objc func setReplay(_ val: NSNumber) {
    replay = val
  }
  @objc func setRotate(_ val: NSNumber) {
    rotate = val
  }
  @objc func setVolume(_ val: NSNumber) {
    volume = val
  }
  @objc func setResizeMode(_ val: NSString) {
    //resizeMode = val
  }
    
    // props
    var playerHeight: NSNumber? {
        set(val) {
            if val != nil {
                self._playerHeight = val as! CGFloat
                self.frame.size.height = self._playerHeight
                self.rotate = self._rotate ? 1 : 0
                print("CHANGED HEIGHT \(val)")
            }
        }
        get {
            return nil
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        playerLayer = AVPlayerLayer.init(player: player)
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    var resizeMode: NSString? {
        set {
            guard let newValue = newValue as String? else {
                return
            }
          self._resizeMode = AVLayerVideoGravity.resizeAspectFill
            self.playerLayer?.videoGravity = self._resizeMode
            self.setNeedsLayout()
        }
        get {
            return nil
        }
    }
    
    var playerWidth: NSNumber? {
        set(val) {
            if val != nil {
                self._playerWidth = val as! CGFloat
                self.frame.size.width = self._playerWidth
                self.rotate = self._rotate ? 1 : 0
                print("CHANGED WIDTH \(val)")
            }
        }
        get {
            return nil
        }
    }
    
    
    // props
    var source: NSString? {
        set(val) {
            if val != nil {
                self._moviePathSource = val!
                print("CHANGED source \(val)")
//                if self.gpuMovie != nil {
//                    self.gpuMovie.endProcessing()
//                }
                self.startPlayer()
            }
        }
        get {
            return nil
        }
    }
    
    // props
    var currentTime: NSNumber? {
        set(val) {
            if val != nil && player != nil {
                let convertedValue = val as! CGFloat
                let floatVal = convertedValue >= 0 ? convertedValue : self._playerStartTime
                print("CHANGED: currentTime \(floatVal)")
                if floatVal <= self._playerEndTime && floatVal >= self._playerStartTime {
                    self.player.seek(to: convertToCMTime(val: floatVal), toleranceBefore: .zero, toleranceAfter: .zero)
                }
            }
        }
        get {
            return nil
        }
    }
    
    // props
    var startTime: NSNumber? {
        set(val) {
            if val == nil {
                return
            }
            let convertedValue = val as! CGFloat
            
            self._playerStartTime = convertedValue
            
            if convertedValue < 0 {
                print("WARNING: startTime is a negative number: \(val)")
                self._playerStartTime = 0.0
            }
            
            let currentTime = CGFloat(CMTimeGetSeconds(player.currentTime()))
            var shouldBeCurrentTime: CGFloat = currentTime;
            
            if self._playerStartTime > currentTime {
                shouldBeCurrentTime = self._playerStartTime
            }
            
            if player != nil {
                player.seek(
                    to: convertToCMTime(val: shouldBeCurrentTime),
                    toleranceBefore: convertToCMTime(val: self._playerStartTime),
                    toleranceAfter: convertToCMTime(val: self._playerEndTime)
                )
            }
            print("CHANGED startTime \(val)")
        }
        get {
            return nil
        }
    }
    
    // props
    var endTime: NSNumber? {
        set(val) {
            if val == nil {
                return
            }
            let convertedValue = val as! CGFloat
            
            self._playerEndTime = convertedValue
            
            if convertedValue < 0.0 {
                print("WARNING: endTime is a negative number: \(val)")
                self._playerEndTime = CGFloat(CMTimeGetSeconds((player.currentItem?.asset.duration)!))
            }
            
            let currentTime = CGFloat(CMTimeGetSeconds(player.currentTime()))
            var shouldBeCurrentTime: CGFloat = currentTime;
            
            if self._playerEndTime < currentTime {
                shouldBeCurrentTime = self._playerStartTime
            }
            
            if player != nil {
                player.seek(
                    to: convertToCMTime(val: shouldBeCurrentTime),
                    toleranceBefore: convertToCMTime(val: self._playerStartTime),
                    toleranceAfter: convertToCMTime(val: self._playerEndTime)
                )
            }
            print("CHANGED endTime \(val)")
        }
        get {
            return nil
        }
    }
    
    var play: NSNumber? {
        set(val) {
            if val == nil || player == nil {
                return
            }
            print("CHANGED play \(val)")
            if val == 1 && player.rate == 0.0 {
                player.play()
            } else if val == 0 && player.rate != 0.0 {
                player.pause()
            }
        }
        get {
            return nil
        }
    }
    
    var replay: NSNumber? {
        set(val) {
            if val != nil  {
                self._replay = RCTConvert.bool(val!)
            }
        }
        get {
            return nil
        }
    }
  
    
    var rotate: NSNumber? {
        set(val) {
            if val != nil {
                self._rotate = RCTConvert.bool(val!)
                var rotationAngle: CGFloat = 0
                if self._rotate {
                    playerLayer?.frame.size.width = self._playerHeight
                    playerLayer?.frame.size.height = self._playerWidth
                    playerLayer?.bounds.size.width = self._playerHeight
                    playerLayer?.bounds.size.height = self._playerWidth
                    rotationAngle = CGFloat.pi / 2
                } else {
                    playerLayer?.frame.size.width = self._playerWidth
                    playerLayer?.frame.size.height = self._playerHeight
                    playerLayer?.bounds.size.width = self._playerWidth
                    playerLayer?.bounds.size.height = self._playerHeight
                }
                playerLayer?.frame.origin = CGPoint.zero
                self.playerLayer?.transform = CATransform3DMakeAffineTransform(CGAffineTransform(rotationAngle: rotationAngle))
                self.setNeedsLayout()
                self.layoutIfNeeded()
            }
        }
        get {
            return nil
        }
    }
    
    var volume: NSNumber? {
        set(val) {
            let minValue: NSNumber = 0
            
            if val == nil {
                return
            }
            if (val?.floatValue)! < minValue.floatValue {
                return
            }
            self.playerVolume = val!
            if player != nil {
                player.volume = self.playerVolume.floatValue
            }
        }
        get {
            return nil
        }
    }
    
//    func generatePreviewImages() -> Void {
//        let hueFilter = self.processingFilters.getFilterByName(name: "hue")
//        gpuMovie.removeAllTargets()
//        gpuMovie.addTarget(hueFilter)
//        hueFilter?.addTarget(self.filterView)
//        gpuMovie.startProcessing()
//        player.play()
//        hueFilter?.useNextFrameForImageCapture()
//
//        let huePreview = hueFilter?.imageFromCurrentFramebuffer()
//        if huePreview != nil {
//            print("CREATED: Preview: Hue: \(toBase64(image: huePreview!))")
//        }
//    }
    func getSourceURL(source: String) -> URL {
      var sourceURL: URL
      if source.contains("assets-library") {
        sourceURL = NSURL(string: source) as! URL
      } else {
        let bundleUrl = Bundle.main.resourceURL!
        sourceURL = URL(string: source, relativeTo: bundleUrl)!
      }
      return sourceURL
    }
    func getAssetInfo(_ source: String, callback: RCTResponseSenderBlock) {
      let sourceURL = getSourceURL(source: source)
      let asset = AVAsset(url: sourceURL)
      var assetInfo: [String: Any] = [
        "duration" : asset.duration.seconds
      ]
      if let track = asset.tracks(withMediaType: .video).first {
        let naturalSize = track.naturalSize
        let t = track.preferredTransform
        let isPortrait = t.a == 0 && abs(t.b) == 1 && t.d == 0
        let size = [
          "width": isPortrait ? naturalSize.height : naturalSize.width,
          "height": isPortrait ? naturalSize.width : naturalSize.height
        ]
        assetInfo["size"] = size
        assetInfo["frameRate"] = Int(round(track.nominalFrameRate))
        assetInfo["bitrate"] = Int(round(track.estimatedDataRate))
      }
      callback( [NSNull(), assetInfo] )
    }
    
    func toBase64(image: UIImage) -> String {
        let imageData:NSData = image.pngData()! as NSData
        return imageData.base64EncodedString(options: .lineLength64Characters)
    }
    
    func convertToCMTime(val: CGFloat) -> CMTime {
        return CMTimeMakeWithSeconds(Float64(val), preferredTimescale: Int32(NSEC_PER_SEC))
    }
    
    func createPlayerObservers() -> Void {
        // TODO: clean obersable when View going to diesappear
        let interval = CMTimeMakeWithSeconds(1.0, preferredTimescale: Int32(NSEC_PER_SEC))
        self.playerCurrentTimeObserver = self.player.addPeriodicTimeObserver(
            forInterval: interval,
            queue: nil,
            using: {(_ time: CMTime) -> Void in
                let currentTime = CGFloat(CMTimeGetSeconds(time))
                self.onVideoCurrentTimeChange(currentTime: currentTime)
                if currentTime >= self._playerEndTime {
                    if self._replay {
                        return self.replayMovie()
                    }
                    self.play = 0
                }
        }
        )
    }
    
    func replayMovie() {
        if player != nil {
            self.player.seek(to: convertToCMTime(val: self._playerStartTime))
            self.player.play()
        }
    }
    
    func onVideoCurrentTimeChange(currentTime: CGFloat) {
        if self.onChange != nil {
            let event = ["currentTime": currentTime]
            self.onChange!(event)
        }
    }
    func getQualityForAsset(quality: String, asset: AVAsset) -> String {
      var useQuality: String

      switch quality {
        case QUALITY_ENUM.QUALITY_LOW.rawValue:
          useQuality = AVAssetExportPresetLowQuality

        case QUALITY_ENUM.QUALITY_MEDIUM.rawValue:
          useQuality = AVAssetExportPresetMediumQuality

        case QUALITY_ENUM.QUALITY_HIGHEST.rawValue:
          useQuality = AVAssetExportPresetHighestQuality

        case QUALITY_ENUM.QUALITY_640x480.rawValue:
          useQuality = AVAssetExportPreset640x480

        case QUALITY_ENUM.QUALITY_960x540.rawValue:
          useQuality = AVAssetExportPreset960x540

        case QUALITY_ENUM.QUALITY_1280x720.rawValue:
          useQuality = AVAssetExportPreset1280x720

        case QUALITY_ENUM.QUALITY_1920x1080.rawValue:
          useQuality = AVAssetExportPreset1920x1080

        case QUALITY_ENUM.QUALITY_3840x2160.rawValue:
          if #available(iOS 9.0, *) {
            useQuality = AVAssetExportPreset3840x2160
          } else {
            useQuality = AVAssetExportPresetPassthrough
          }

        default:
          useQuality = AVAssetExportPresetPassthrough
      }

      let compatiblePresets = AVAssetExportSession.exportPresets(compatibleWith: asset)
      if !compatiblePresets.contains(useQuality) {
        useQuality = AVAssetExportPresetPassthrough
      }
      return useQuality
    }
    func trim(_ source: String, options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
      RNTrim.ffmpeg_trim(source, options, startTime, endTime)
    }
  func randomString() -> String {
    let letters: NSString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let randomString: NSMutableString = NSMutableString(capacity: 20)
    let s:String = "RNTrimmer-Temp-Video"
    for _ in 0...19 {
      randomString.appendFormat("%C", letters.character(at: Int(arc4random_uniform(UInt32(letters.length)))))
    }
    return s.appending(randomString as String)
  }
  func getVideoOrientationFromAsset(asset : AVAsset) -> UIImage.Orientation {
    let videoTrack: AVAssetTrack? = asset.tracks(withMediaType: .video)[0]
    let size = videoTrack!.naturalSize

    let txf: CGAffineTransform = videoTrack!.preferredTransform

    if (size.width == txf.tx && size.height == txf.ty) {
      return .left;
    } else if (txf.tx == 0 && txf.ty == 0) {
      return .right;
    } else if (txf.tx == 0 && txf.ty == size.width) {
      return .down;
    } else {
      return .up;
    }
  }
    // start player
    func startPlayer() {
        
        self.backgroundColor = UIColor.darkGray
        
        let movieURL = NSURL(string: _moviePathSource as String)
        
        if self.player == nil {
            player = AVPlayer()
            player.volume = playerVolume.floatValue
        }
        playerItem = AVPlayerItem(url: movieURL as! URL)
        player.replaceCurrentItem(with: playerItem)
        
        // MARK - Temporary removing playeLayer, it dublicates video if it's in landscape mode
                 playerLayer = AVPlayerLayer(player: player)
                 playerLayer!.videoGravity = self._resizeMode
                 playerLayer!.masksToBounds = true
                 //playerLayer!.removeFromSuperlayer()

      print("CHANGED playerframe \(playerLayer), frameAAA \(playerLayer?.frame)")
        self.setNeedsLayout()
        
        self._playerEndTime = CGFloat(CMTimeGetSeconds((player.currentItem?.asset.duration)!))
        print("CHANGED playerEndTime \(self._playerEndTime)")
      
        
        self.setPlayerWidth(UIScreen.main.bounds.width as NSNumber)
        self.setPlayerHeight(UIScreen.main.bounds.height as NSNumber)
        playerLayer?.bounds=self.bounds
        self.layer.addSublayer(playerLayer!)
        playerLayer!.frame=playerLayer!.bounds
        print("AVLayerVideoGravity \(AVLayerVideoGravity.resizeAspectFill)")
      
//        if self.gpuMovie != nil {
//            gpuMovie.endProcessing()
//        }
//        gpuMovie = GPUImageMovie(playerItem: playerItem)
//        // gpuMovie.runBenchmark = true
//        gpuMovie.playAtActualSpeed = true
//        gpuMovie.startProcessing()
//
//        gpuMovie.addTarget(self.filterView)
//        if !self.isInitialized {
//            self.addSubview(filterView)
//            self.createPlayerObservers()
//        }
//        gpuMovie.playAtActualSpeed = true
        
        self.isInitialized = true
    }
    
    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        if newSuperview == nil {
            
            if let observer = self.playerCurrentTimeObserver {
                self.player.removeTimeObserver(observer)
            }
            if player != nil {
                self.player.pause()
//                self.gpuMovie.cancelProcessing()
                self.player = nil
//                self.gpuMovie = nil
                print("CHANGED: Removing Observer, that can be a cause of memory leak")
            }
        }
    }
    /* @TODO: create Preview images before the next Release
     func createPhantomGPUView() {
     phantomGpuMovie = GPUImageMovie(playerItem: self.playerItem)
     phantomGpuMovie.playAtActualSpeed = true
     
     let hueFilter = self.processingFilters.getFilterByName(name: "saturation")
     phantomGpuMovie.addTarget(hueFilter)
     phantomGpuMovie.startProcessing()
     hueFilter?.addTarget(phantomFilterView)
     hueFilter?.useNextFrameForImageCapture()
     let CGImage = hueFilter?.newCGImageFromCurrentlyProcessedOutput()
     print("CREATED: CGImage \(CGImage)")
     if CGImage != nil {
     print("CREATED: \(UIImage(cgImage: (CGImage?.takeUnretainedValue() )!))")
     }
     // let image = UIImage(cgImage: (hueFilter?.newCGImageFromCurrentlyProcessedOutput().takeRetainedValue())!)
     
     }
     */
}
//ƒ
//  RNVideoPlayer.swift
//  RNVideoProcessing
//
//  Created by Shahen Hovhannisyan on 11/14/16.

