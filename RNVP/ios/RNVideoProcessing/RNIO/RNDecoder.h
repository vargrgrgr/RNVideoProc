//
//  RNDecoder.h
//  RNVP
//
//  Created by MIXNUTS on 2022/07/20.
//
#ifndef HEADER_H
# define HEADER_H

#import <Foundation/Foundation.h>
#import <FFmpeg/ffmpeg.h>

extern int *kColorConversion601;
int ffmpeg_decode_frame(AVCodecContext *codecContext, AVPacket *packet, bool *new_packet, AVFrame *frame);
#endif
	
