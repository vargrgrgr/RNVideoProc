//
//  RNIOVideo.h
//  RNVP
//
//  Created by apple on 2022/07/20.
//

#import <Foundation/Foundation.h>
#import <FFmpeg/ffmpeg.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>

@interface RNIOVideo : NSObject{}
+ (FILE*) open_file_write:(const char*)file;
+ (FILE*) open_file_read:(const char*)file;
+ (size_t) write_packt_to_file:(AVPacket*)packet file:(FILE*)file;
+ (size_t) read_packt_from_file:(AVPacket*)packet file:(FILE*)file;
+ (void) close_file:(FILE*)file;
+ (void) ff_log_callback:(void*)avcl level:(int)level format:(const char*)fmt valist:(va_list)vl;
+ (int) ffmpeg_trim:(const char*)input outputP:(const char*)output startTime:(CGFloat)startT endTime:(CGFloat)endT;
+ (int) encode_frame:(AVCodecContext*)codecContext frame:(AVFrame*)frame packet:(AVPacket*)packet;
+ (int) decode_frame:(AVCodecContext*)codecContext packet:(AVPacket*)packet new_packet:(bool*)new_packet frame:(AVFrame*)frame;
@end
