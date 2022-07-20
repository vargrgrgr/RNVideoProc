//
//  RNDecoderWrapper.m
//  RNVP
//
//  Created by apple on 2022/07/20.
//

#import <Foundation/Foundation.h>

@interface RNDecoderWrapper : NSObject
+ (int) decode_frame: (AVCodecContext) *codecContext, (AVPacket) *packet, (bool) *new_packet, (AVFrame) *frame;
@end
