////
////  RNTrim.swift
////  RNVP
////
////  Created by MIXNUTS on 2022/07/20.
////
//
import Foundation
import AVFoundation
import UIKit
import FFmpeg
import "RNIOVideo.h"

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

@objc(RNVideoTrimmer)
class RNVideoTrimmer: NSObject {
  @objc func ffmpeg_trim(_ source: String, options: NSDictionary, startTime: NSNumber, endTime: NSNumber) {

        var sTime:Float?
        var eTime:Float?
        if let num = options.object(forKey: "startTime") as? NSNumber {
            sTime = num.floatValue
        }
        if let num = options.object(forKey: "endTime") as? NSNumber {
            eTime = num.floatValue
        }

        let quality = ((options.object(forKey: "quality") as? String) != nil) ? options.object(forKey: "quality") as! String : ""
        let saveToCameraRoll = options.object(forKey: "saveToCameraRoll") as? Bool ?? false
        let saveWithCurrentDate = options.object(forKey: "saveWithCurrentDate") as? Bool ?? false


        //let sourceURL = getSourceURL(source: source)
        //let asset = AVAsset(url: sourceURL as URL)
  //---------------------FFmpeg video decode initiation----------------------
      

        var vformatContext: UnsafeMutablePointer<AVFormatContext>?
        vformatContext = nil
        if avformat_open_input(&vformatContext, source, nil, nil) != 0 {
            print("Couldn't open file")
            return
        }
        avformat_find_stream_info(vformatContext, nil)
        var vCodec: UnsafeMutablePointer<AVCodec>?
        vCodec = nil
        let video_stream_index : Int32 = av_find_best_stream(vformatContext, AVMEDIA_TYPE_VIDEO, -1, -1, &vCodec, 0) //find right video channel in file
        var vcodecContext: UnsafeMutablePointer<AVCodecContext>?
        vcodecContext=nil
        vcodecContext = avcodec_alloc_context3(nil)
        var copar: UnsafeMutablePointer<AVCodecParameters>?
        copar = vformatContext?.pointee.streams[Int(video_stream_index)]?.pointee.codecpar
        avcodec_parameters_to_context(vcodecContext, copar)
        avcodec_open2(vcodecContext, vCodec, nil);
       //if we need audio stream, repeat with AVMEDIA_TYPE_AUDIO and aCodec, audiostream, acodecContext
       //decode init done
        
  //---------------------FFmpeg video decode initiation----------------------
          asset.loadValuesAsynchronously(forKeys: [ "exportable", "tracks" ]) {
          precondition(asset.statusOfValue(forKey: "exportable", error: nil) == .loaded)
          precondition(asset.statusOfValue(forKey: "tracks", error: nil) == .loaded)
          precondition(asset.isExportable)

          if eTime == nil {
              eTime = Float(asset.duration.seconds)
          }
          if sTime == nil {
              sTime = 0
          }

          let startTime = CMTime(seconds: Double(sTime!), preferredTimescale: 1000)
          let endTime = CMTime(seconds: Double(eTime!), preferredTimescale: 1000)
          let timeRange = CMTimeRange(start: startTime, end: endTime)
          
  //---------------------FFmpeg trimming start----------------------
          let timestamp_target = sTime
          av_seek_frame(vformatContext, video_stream_index, timestamp_target.value, AVSEEK_FLAG_FRAME) //seek cutting point by tim
          // or av_seek_frame(fmt_ctx, video_stream_index, timestamp_target, AVSEEK_FLAG_ANY)
          // try AVSEEK_FLAG_BACKWARD
          var vFrame: UnsafeMutablePointer<AVFrame>?
          vFrame = nil
          vFrame=av_frame_alloc()
          var vPacket : UnsafeMutablePointer<AVPacket>?
          vPacket = nil
          var got_frame : Int32
          var frame_decoded : Int
          frame_decoded = 0
          let second_needed = endTime-startTime
          var vStream: UnsafeMutablePointer<AVStream>?
          vStream = nil
          var encodeContext: UnsafeMutablePointer<AVCodecContext>?
          encodeContext=nil
          let fps: Double = av_q2d(av_guess_frame_rate(vformatContext, vStream, vFrame))
          var ret: Int
          while (av_read_frame(vformatContext, vPacket) >= 0 && Double(frame_decoded) < Double(second_needed.value) * fps) {
            if (vPacket?.pointee.stream_index == video_stream_index) {
                  got_frame = 0;
                ret = Int(decode_frame(vcodecContext, vPacket, &got_frame, vFrame));
                  // avcodec_decode_audio4  if using audio
                if ((got_frame) != 0) {
                  ret = Int(Encode_frame(vcodecContext, vFrame, vPacket));
                  
                      // encode frame here
                }
            }
          }
          av_frame_free(vFrame)
          
          
  //---------------------FFmpeg trimming end----------------------
          do {
            try composition.insertTimeRange(timeRange, of: asset, at: CMTime.zero)
          } catch {
            callback(["Error inserting time range", NSNull()])
            // Error handling code here
            return
          }

          var outputURL = documentDirectory.appendingPathComponent("output")
          do {
              try manager.createDirectory(at: outputURL, withIntermediateDirectories: true, attributes: nil)
            let name = self.randomString()
              outputURL = outputURL.appendingPathComponent("\(name).mp4")
          } catch {
              callback([error.localizedDescription, NSNull()])
              print(error)
          }

          //Remove existing file
          _ = try? manager.removeItem(at: outputURL)

          let finalComposition = composition.copy() as! AVComposition
          let useQuality = self.getQualityForAsset(quality: quality, asset: asset)
          print("RNVideoTrimmer passed quality: \(quality). useQuality: \(useQuality)")


          exportSession.outputURL = NSURL.fileURL(withPath: outputURL.path)
          exportSession.outputFileType = .mp4
          exportSession.shouldOptimizeForNetworkUse = true

          if saveToCameraRoll && saveWithCurrentDate {
            let metaItem = AVMutableMetadataItem()
            metaItem.key = AVMetadataKey.commonKeyCreationDate as (NSCopying & NSObjectProtocol)
            metaItem.keySpace = .common
            metaItem.value = NSDate()
            exportSession.metadata = [metaItem]
          }

        }
  //-----------FFmpeg Trimming end-------------
      vformatContext?.deallocate()
      vCodec?.deallocate()
      vcodecContext?.deallocate()
  //-----------Memory Deallocation -------------
    }
}
