//
//  RNEncoderWrapper.h
//  RNVP
//
//  Created by apple on 2022/07/20.
//

#import <Foundation/Foundation.h>

@interface RNEncoderWrapper : NSObject
+ (int) encode_frame: (AVCodecContext) *enc_ctx, (AVFrame) *frame, (AVPacket) *packet;
@end
