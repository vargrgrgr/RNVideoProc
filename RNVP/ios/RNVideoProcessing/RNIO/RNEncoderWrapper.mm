//
//  RNEncoderWrapper.m
//  RNVP
//
//  Created by apple on 2022/07/20.
//

#import "RNEncoderWrapper.h"
#import "RNEncoder.h"

@implementation RNEncoderWrapper
+ (int) encode_frame:(AVCodecContext) *enc_ctx, (AVFrame) *frame, (AVPacket) *packet
{
  CWrapped::encode_frame((AVCodecContext) *enc_ctx, (AVFrame) *frame, (AVPacket) *packet);
}
@end
