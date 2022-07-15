
#import "FFDecoder.h"
#import "FFHeader.h"
#import "avformat.h"
#import "FFSeekContext.h"
#import "FFStreamParser.h"
#import "FFVideoDecoder.h"
#import "FFAudioDecoder.h"
#import "FFOptionsContext.h"

AVPacket flush_packet;

void FFmepgLog(void * context, int level, const char * format, va_list args)
{
#if DEBUG
	NSString * message = [[NSString alloc] initWithFormat:[NSString stringWithUTF8String:format] arguments:args];
	NSLog(@"FFmepgLog : %@", message);
#endif
}

NSError* FFCheckErrorCode(int result, NSUInteger errorCode)
{
	if (result < 0) {
		char * error_string_buffer = malloc(256);
		av_strerror(result, error_string_buffer, 256);
		NSString * error_string = [NSString stringWithFormat:@"ffmpeg code : %d, ffmpeg msg : %s", result, error_string_buffer];
		NSError * error = [NSError errorWithDomain:error_string code:errorCode userInfo:nil];
		return error;
	}
	return nil;
}

static int ffmpeg_interrupt_callback(void* ctx)
{
	FFDecoder* obj = (__bridge FFDecoder*)ctx;
	double timeout = fabs(CFAbsoluteTimeGetCurrent() - obj.interrupt_timeout);

	float maxInterruptTimeout = [FFOptionsContext defaultOptions].maxInterruptTimeout;
	if(timeout >= maxInterruptTimeout)
	{
		LOG_INFO(@"ffmpeg_interrupt_callback, timeout : %f",timeout);

		if(obj.didInterruptCallback)
		{
			obj.didInterruptCallback();
		}

		return 1;
	}

	return 0;
}

@interface FFDecoder()
{
@public
	AVFormatContext * _format_context;
	AVCodecContext * _video_codec_context;
	AVCodecContext * _audio_codec_context;
}

@property(nonatomic,strong) NSOperationQueue * ffmpegOperationQueue;
@property(nonatomic,strong) NSInvocationOperation * openFileOperation;
@property(nonatomic,strong) NSInvocationOperation * readPacketOperation;
@property(nonatomic,strong) NSInvocationOperation * decodeVideoFrameOperation;
@property(nonatomic,strong) NSInvocationOperation * decodeAudioFrameOperation;

@property(nonatomic,strong) NSString* contentURL;

@property(nonatomic,assign) int videoStreamIndex;
//@property(nonatomic,assign) int audioStreamIndex;

@property(nonatomic,assign) NSTimeInterval videoTimebase;
@property(nonatomic,assign) NSTimeInterval videoFPS;
@property(nonatomic,assign) CGFloat videoAspect;
@property(nonatomic,assign) int videoFormat;
@property(nonatomic,assign) int rotate;
@property(nonatomic,assign) float videoDuration;
//@property(nonatomic,assign) NSTimeInterval audioTimebase;
//@property(nonatomic,assign) int audioFormat;

//@property(nonatomic,assign) UInt32  numOutputChannels;
//@property(nonatomic,assign) Float64 sampleRate;
//@property(nonatomic,assign) float audioDuration;

//seek
@property(nonatomic,assign) float seekToTime;
@property(nonatomic,copy) void(^seekToCompleteHandler)(BOOL);
@end

@implementation FFDecoder

- (instancetype)initWithContentURL:(NSString *)contentURL
						   channel:(UInt32)numOutputChannels
						sampleRate:(Float64)sampleRate
{
	self = [super init];

	if(self)
	{
		self.contentURL = contentURL;
		self.state = [[FFState alloc]init];
        self.state.readyToDecode = 0;

		static dispatch_once_t onceToken;
		dispatch_once(&onceToken, ^{
//            av_log_set_callback(FFmepgLog);
			av_register_all();
			avformat_network_init();

			av_init_packet(&flush_packet);
			flush_packet.data = (uint8_t *)&flush_packet;
			flush_packet.duration = 0;
		});

		self.videoStreamIndex = -1;
		self.audioStreamIndex = -1;

		self.numOutputChannels = numOutputChannels;
		self.sampleRate = sampleRate;

		self.duration = 0;

		self.didErrorCallback = ^{
			LOG_DEBUG(@"failed to load asset...");
		};

        [self setupOperationQueue];
	}

	return self;
}

- (void)seekToTimeByRatio:(float)ratio
{
    if(!self.state.readyToDecode) return;
    
	if(ratio <= 0) ratio = 0;
	if(ratio >= 1) ratio = 1;
	
	[self seekToTimeByRatio:ratio completeHandler:nil];
}

- (void)seekToTimeByRatio:(float)ratio completeHandler:(void (^)(BOOL finished))completeHandler
{
    if(!self.state.readyToDecode) return;
    
	float time = ratio * self.duration;
	[self seekToTime:time completeHandler:completeHandler];
}

- (void)seekToTime:(NSTimeInterval)time
{
    if(!self.state.readyToDecode) return;
    [self seekToTime:time completeHandler:nil];
}

- (void)seekToTime:(NSTimeInterval)time completeHandler:(void (^)(BOOL finished))completeHandler
{
    if(!self.state.readyToDecode) return;
    
    self.seekToTime = time;
    self.seekToCompleteHandler = completeHandler;

	LOG_DEBUG(@"start seek to time at : %f",self.seekToTime);

	self.state.seeking = 1;

    if(self.state.endOfFile)
    {
		[self.state clearAllSates];
		self.state.seeking = 1;

        [self setupReadPacketOperation];
    }
}

- (void)startDecoder
{
	self.state.playing = 1;
	[self setupReadPacketOperation]; 
}

- (void)pause
{
	self.state.paused = 1;
}




- (void)openVideoTrack
{
	if (self.videoStreamIndex != -1
		&& (_format_context->streams[self.videoStreamIndex]->disposition & AV_DISPOSITION_ATTACHED_PIC) == 0)
	{
		AVCodecContext * codec_context = NULL;
		[self openStreamWithTrackIndex:self.videoStreamIndex codecContext:&codec_context domain:@"video"];
		if(self.state.error) return;

		self.videoEnable = YES;
		self.videoTimebase = FFStreamGetTimebase(_format_context->streams[self.videoStreamIndex], 0.00004);
		self.videoFPS    = FFStreamGetFPS(_format_context->streams[self.videoStreamIndex], self.videoTimebase);
		self.videoAspect = (CGFloat)codec_context->width / (CGFloat)codec_context->height;
		self.videoFormat = _format_context->streams[self.videoStreamIndex]->codecpar->format;
		self.rotate      = FFStreamGetRotate(_format_context->streams[self.videoStreamIndex]);
		self.videoDuration = FFStreamGetDuration(_format_context->streams[self.videoStreamIndex],self.videoTimebase,self.duration);

		self->_video_codec_context = codec_context;
	}
	else
	{
		self.videoEnable = NO;
	}
}




- (BOOL)isBufferEmtpy
{
	if(self.videoEnable && ![self.videoDecoder emtpy])
	{
		return NO;
	}

	if(self.audioEnable && ![self.audioDecoder emtpy])
	{
		return NO;
	}

	return YES;
}

- (BOOL)isEndOfFile
{
	return self.state.endOfFile && [self isBufferEmtpy];
}

- (float)duration
{
	if(!_format_context) return 0.0;
	int64_t duration = self->_format_context->duration;
	if(duration <= 0)
	{
		return 0;
	}

	return (float)duration / AV_TIME_BASE;
}

- (float)startTime
{
	if(AV_NOPTS_VALUE != _format_context->start_time)
	{
		return (float)_format_context->start_time / AV_TIME_BASE;
	}

	if(self.videoEnable)
	{
		AVStream* st = self->_format_context->streams[self->_videoStreamIndex];
		if(AV_NOPTS_VALUE != st->start_time)
		{
			return st->start_time * self.videoTimebase;
		}

		return 0;
	}

	if(self.audioEnable)
	{
		AVStream* st = self->_format_context->streams[self->_audioStreamIndex];
		if(AV_NOPTS_VALUE != st->start_time)
		{
			return st->start_time * self.audioTimebase;
		}

		return 0;
	}

	return 0;
}

- (void)destroy
{
    if(!self.state.destroyed)
    {
        self.state.destroyed = 1;
        
        if(self.videoEnable)
		{
			[self.videoDecoder destroy];
		}

		if(self.audioEnable)
		{
			[self.audioDecoder destroy];
		}

        self.videoDecoder = NULL;
        self.audioDecoder = NULL;

		[self closeOperations];
    }
}

- (void)closeOperations
{
	[self.ffmpegOperationQueue cancelAllOperations];
//	[self.ffmpegOperationQueue waitUntilAllOperationsAreFinished];

	self.openFileOperation = nil;
	self.readPacketOperation = nil;
	self.decodeVideoFrameOperation = nil;
	self.decodeAudioFrameOperation = nil;
}

- (void)dealloc
{
    [self destroy];

	if(_video_codec_context)
	{
		avcodec_close(_video_codec_context);
		_video_codec_context = NULL;
	}

	if(_audio_codec_context)
	{
		avcodec_close(_audio_codec_context);
		_audio_codec_context = NULL;
	}

	if(_format_context)
	{
		avformat_close_input(&_format_context);
		_format_context = NULL;
	}
	
	LOG_DEBUG(@"%@ release...",[self class]);
}

@end
