//
//  RNDecoderWrapper.m
//  RNVP
//
//  Created by apple on 2022/07/20.
//

#import "RNDecoderWrapper.h"
#import "RNDecoder.h"

@implementation RNDecoderWrapper
+ (int) decode_frame: (AVCodecContext) *codecContext, (AVPacket) *packet, (bool) *new_packet, (AVFrame) *frame
{
  CWrapped::decode_frame((AVCodecContext) *codecContext, (AVPacket) *packet, (bool) *new_packet, (AVFrame) *frame);
}
@end
