//
//  RNIOVideo.h
//  RNVP
//
//  Created by apple on 2022/07/20.
//

#ifndef RNIOVideo_h
#define RNIOVideo_h
#import <Foundation/Foundation.h>
#import <FFmpeg/ffmpeg.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>

@interface RNIOVideo : NSObject

+ (int)encode_frame:(AVCodecContext*)codecContext frame:(AVFrame*)frame packet:(AVPacket*)packet;
+ (int)decode_frame:(AVCodecContext*)codecContext packet:(AVPacket*)packet new_packet:(bool*)new_packet frame:(AVFrame*)frame;
@end
#endif /* RNIOVideo_h */
