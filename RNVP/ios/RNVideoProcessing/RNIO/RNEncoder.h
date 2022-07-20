//
//  RNEecoder.h
//  RNVP
//
//  Created by MIXNUTS on 2022/07/20.
//
#ifndef HEADER_H
# define HEADER_H

#import <Foundation/Foundation.h>
#import <FFmpeg/ffmpeg.h>

int encode_frame(AVCodecContext *codecContext, AVFrame *frame, AVPacket *packet);
#endif
