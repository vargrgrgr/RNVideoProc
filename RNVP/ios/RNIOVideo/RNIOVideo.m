//
//  RNIOVideo.m
//  RNVP
//
//  Created by apple on 2022/07/20.
//
#import "RNIOVideo.h"

@implementation RNIOVideo

+ (void) ff_log_callback:(void*)avcl level:(int)level format:(const char*)fmt valist:(va_list)vl
{
    printf(fmt, vl);
}

+ (void) close_file: (FILE*) file
{
    fclose(file);
}

+ (FILE*) open_file_write:(const char*)file
{
    FILE *packt_file = NULL;

    packt_file = fopen(file, "wb+");

    return packt_file;
}

+ (FILE*) open_file_read:(const char*)file
{
    FILE *packt_file = NULL;

    packt_file = fopen(file, "rb+");

    return packt_file;
}

+ (void) read_packt_from_file:(AVPacket*)packet file:(FILE*)file
{
    size_t ret = 0;
    
    
    ret = fread(packet, sizeof(AVPacket), 1, file);
    packet->data = malloc(packet->size);
    ret = fread(packet->data, packet->size, 1, file);
    if (packet->buf) {
        int buf_size = packet->buf->size;
        packet->buf = malloc(sizeof(AVBufferRef));
        packet->buf->size = buf_size;
        packet->buf->data = malloc(packet->buf->size);
        ret = fread(packet->buf->data, packet->buf->size, 1, file);
    }
    return;
}

+ (void) write_packt_to_file:(AVPacket*) packet file:(FILE*) file
{
    size_t ret = 0;
    ret = fwrite(packet, sizeof(AVPacket), 1, file);
    ret = fwrite(packet->data, packet->size, 1, file);
    if (packet->buf) {
        fwrite(packet->buf->data, packet->buf->size, 1, file);
    }
    fflush(file);
  return;
}

+ (int) ffmpeg_trim:(const char *)input output:(const char *)output
{
    AVOutputFormat *ofmt = NULL;
    AVFormatContext *ifmt_ctx = NULL, *ofmt_ctx = NULL;
    AVPacket pkt;
    AVPacket read_packet;
    const char *in_filename, *out_filename;
    int ret, i;


    in_filename  = input;
    out_filename = output;


    if ((ret = avformat_open_input(&ifmt_ctx, in_filename, 0, 0)) < 0) {
        fprintf(stderr, "Could not open input file '%s'", in_filename);
        goto end;
    }

    if ((ret = avformat_find_stream_info(ifmt_ctx, 0)) < 0) {
        fprintf(stderr, "Failed to retrieve input stream information");
        goto end;
    }

    av_log_set_level(48);
    //av_log_set_callback(ff_log_callback);

    av_dump_format(ifmt_ctx, 0, in_filename, 0);

    avformat_alloc_output_context2(&ofmt_ctx, NULL, NULL, out_filename);
    if (!ofmt_ctx) {
        fprintf(stderr, "Could not create output context\n");
        ret = AVERROR_UNKNOWN;
        goto end;
    }

    ofmt = ofmt_ctx->oformat;

    for (i = 0; i < ifmt_ctx->nb_streams; i++) {
        AVStream *in_stream = ifmt_ctx->streams[i];
        AVStream *out_stream = avformat_new_stream(ofmt_ctx, in_stream->codec->codec);
        if (!out_stream) {
            fprintf(stderr, "Failed allocating output stream\n");
            ret = AVERROR_UNKNOWN;
            goto end;
        }

        ret = avcodec_copy_context(out_stream->codec, in_stream->codec);
        if (ret < 0) {
            fprintf(stderr, "Failed to copy context from input to output stream codec context\n");
            goto end;
        }
        out_stream->codec->codec_tag = 0;
        if (ofmt_ctx->oformat->flags & AVFMT_GLOBALHEADER)
            out_stream->codec->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
    }
    av_dump_format(ofmt_ctx, 0, out_filename, 1);

    if (!(ofmt->flags & AVFMT_NOFILE)) {
        ret = avio_open(&ofmt_ctx->pb, out_filename, AVIO_FLAG_WRITE);
        if (ret < 0) {
            fprintf(stderr, "Could not open output file '%s'", out_filename);
            goto end;
        }
    }

    ret = avformat_write_header(ofmt_ctx, NULL);
    if (ret < 0) {
        fprintf(stderr, "Error occurred when opening output file\n");
        goto end;
    }

    FILE* file_write = [RNIOVideo open_file_write:out_filename];
    FILE* file_read = [RNIOVideo open_file_write:in_filename];
    
    size_t filesize;
    size_t packetsize;

    while (1) {
      AVStream *in_stream, *out_stream;

      ret = av_read_frame(ifmt_ctx, &pkt);
      if (ret < 0)
        break;

      filesize = [RNIOVideo write_packt_to_file:&pkt file:file_write];
      packetsize = [RNIOVideo read_packt_from_file:&read_packet file:file_read];
        
        in_stream  = ifmt_ctx->streams[read_packet.stream_index];
        out_stream = ofmt_ctx->streams[read_packet.stream_index];


        /* copy packet */

        read_packet.pts = av_rescale_q_rnd(read_packet.pts, in_stream->time_base, out_stream->time_base, AV_ROUND_NEAR_INF|AV_ROUND_PASS_MINMAX);
        read_packet.dts = av_rescale_q_rnd(read_packet.dts, in_stream->time_base, out_stream->time_base, AV_ROUND_NEAR_INF|AV_ROUND_PASS_MINMAX);
        read_packet.duration = (int)av_rescale_q(read_packet.duration, in_stream->time_base, out_stream->time_base);
        read_packet.pos = -1;
        ret = av_interleaved_write_frame(ofmt_ctx, &read_packet);
          if (ret < 0) {
              fprintf(stderr, "Error muxing packet\n");
              break;
          }

        av_free_packet(&read_packet);
        av_free_packet(&pkt);
    }
    
    av_write_trailer(ofmt_ctx);
   [RNIOVideo close_file:file_write];
   [RNIOVideo close_file:file_read];;
end:

    avformat_close_input(&ifmt_ctx);

    /* close output */
    if (ofmt_ctx && !(ofmt->flags & AVFMT_NOFILE))
        avio_closep(&ofmt_ctx->pb);
    avformat_free_context(ofmt_ctx);

    if (ret < 0 && ret != AVERROR_EOF) {
        fprintf(stderr, "Error occurred: %s\n", av_err2str(ret));
        return 1;
    }

    return 0;
}

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

  ret = avcodec_receive_packet    (  codecContext, packet);
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


//
//AVFrame * frame;
//AVPicture destinyPictureYUV;
//
//avpicture_alloc(&destinyPictureYUV, codecContext->pix_fmt, newCodecContext->width, newCodecContext->height);
//
//// THIS is what you want probably
//*reinterpret_cast<AVPicture *>(frame) = destinyPictureYUV;
