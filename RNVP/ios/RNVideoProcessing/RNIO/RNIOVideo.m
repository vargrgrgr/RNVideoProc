//
//  RNIOVideo.m
//  RNVP
//
//  Created by apple on 2022/07/20.
//
#import "RNIOVideo.h"

@interface RNIOVideo : NSObject
{
 
};

@end

@implementation RNIOVideo
+ (int)encode_frame:(AVCodecContext*)codecContext frame:(AVFrame*)frame packet:(AVPacket*)packet{
  int ret = -1;
  
 //Sending flush packet for the first time will return success, enter flush mode, call avcodec_receive_packet()
 //Take out the frame (maybe more than one) buffered in the encoder
 //Sending flush packet later will return AVERROR_EOF
  ret = avcodec_send_frame(codecContext, frame);
  if (ret == AVERROR_EOF)
  {
     //av_log(NULL, AV_LOG_INFO, "avcodec_send_frame() encoder flushed\n");
  }
  else if (ret == AVERROR(EAGAIN))
  {
     //av_log(NULL, AV_LOG_INFO, "avcodec_send_frame() need output read out\n");
  }
  else if (ret <0)
  {
     //av_log(NULL, AV_LOG_INFO, "avcodec_send_frame() error %d\n", ret);
      return ret;
  }

  ret = avcodec_receive_packet		(	codecContext, packet);
  if (ret == AVERROR_EOF)
  {
      av_log(NULL, AV_LOG_INFO, "avcodec_recieve_packet() encoder flushed\n");
  }
  else if (ret == AVERROR(EAGAIN))
  {
     //av_log(NULL, AV_LOG_INFO, "avcodec_recieve_packet() need more input\n");
  }
  return ret;
}
+ (int)decode_frame:(AVCodecContext*)codecContext packet:(AVPacket*)packet new_packet:(bool*)new_packet frame:(AVFrame*)frame{
  int ret = AVERROR(EAGAIN);

  while (true)
  {
     //Receive frame from decoder
      if (codecContext->codec_type == AVMEDIA_TYPE_VIDEO)//for decode video stream
      {
         //A video packet may contains part of a video frame(usually one frame per one packet)
         //Only after the decoder caches a certain number of packets, the decoded frame will be output
         //The frame output order is in the order of pts, such as IBBPBBP
         //frame->pkt_pos variable is the offset address of the packet corresponding to this frame in the video file, and the value is the same as pkt.pos
          ret = avcodec_receive_frame(codecContext, frame);
          if (ret >= 0)
          {
              if (frame->pts == AV_NOPTS_VALUE)
              {
                  frame->pts = frame->best_effort_timestamp;
                  printf("set video pts %d\n", frame->pts);
              }
          }
      }
      else if (codecContext->codec_type == AVMEDIA_TYPE_AUDIO)
      {
         //An audio packet contains one or more audio frames. Each time avcodec_receive_frame() returns a frame, this function returns.
         //Next time you enter this function, continue to get a frame until avcodec_receive_frame() returns AVERROR(EAGAIN),
         //Indicates that the decoder needs to fill in a new audio packet
          ret = avcodec_receive_frame(codecContext, frame);
          if (ret >= 0)
          {
              if (frame->pts == AV_NOPTS_VALUE)
              {
                  frame->pts = frame->best_effort_timestamp;
                  printf("set audio pts %d\n", frame->pts);
              }
          }
      }

      if (ret >= 0)//If a video frame or an audio frame is successfully decoded, return
      {
          return ret;
      }
      else if (ret == AVERROR_EOF)//The decoder has been flushed, and all frames during decoding have been taken out
      {
          avcodec_flush_buffers(codecContext);
          return ret;
      }
      else if (ret == AVERROR(EAGAIN))//The decoder needs to feed data
      {
          if (!(*new_packet))//This function has already fed data to the decoder, so new data needs to be read from the file
          {
             //av_log(NULL, AV_LOG_INFO, "decoder need more packet\n");
              return ret;
          }
      }
      else//error
      {
          av_log(NULL, AV_LOG_ERROR, "decoder error %d\n", ret);
          return ret;
      }

     /*
      if (packet == NULL || (packet->data == NULL && packet->size == 0))
      {
         //Reset the internal state of the decoder/refresh the internal buffer. This function should be called when seek operation or switching stream.
          avcodec_flush_buffers(codecContext);
      }
      */

     //Send the packet to the decoder
     //Sending packets is in the order by dts size ex) IPBBPBB
     //pkt.pos = address offset of AVPacket
     //Sending the first flush packet will return success, and the subsequent flush packet will return AVERROR_EOF
      ret = avcodec_send_packet(codecContext, packet);
      *new_packet = false;
      
      if (ret != 0)
      {
          av_log(NULL, AV_LOG_ERROR, "avcodec_send_packet() error, return %d\n", ret);
          return ret;
      }
  }

  return -1;
}
	
@end

