//
//  RNEncoder.m
//  RNVP
//
//  Created by mixnuts on 2022/07/19.
//

#import "RNEncoder.h"
//return value means result
int encode_frame(AVCodecContext *enc_ctx, AVFrame *frame, AVPacket *packet) {
    int ret = -1;
    
   //Sending flush packet for the first time will return success, enter flush mode, call avcodec_receive_packet()
   //Take out the frame (maybe more than one) buffered in the encoder
   //Sending flush packet later will return AVERROR_EOF
    ret = avcodec_send_frame(enc_ctx, frame);
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

    ret = avcodec_receive_packet(enc_ctx, packet);
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

