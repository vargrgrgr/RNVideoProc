

#import <Foundation/Foundation.h>
#import "FFFrame.h"
#import "avformat.h"
#import "FFHeader.h"

@interface FFVideoDecoderModel : NSObject
@property(nonatomic,assign) AVCodecContext *codecContex;
@property(nonatomic,assign) NSTimeInterval timebase;
@property(nonatomic,assign) float fps;


@property(nonatomic,assign) int format;

@property(nonatomic,assign) int rotate;
@property(nonatomic,assign) float duration;
@property(nonatomic,assign) BOOL videoToolBoxEnable;
@end

@interface FFVideoDecoder : NSObject
+ (instancetype)decoderWithModel:(FFVideoDecoderModel*)model;
- (FFVideoFrame *)getFrameAsync;
- (FFVideoFrame *)topFrame;
- (void)putPacket:(AVPacket)packet;

- (int)bufferSize;
- (int)bufferCount;
- (double)bufferDuration;
- (BOOL)emtpy;
- (void)flush;
- (void)seek;
- (void)destroy;
- (void)startDecodeThread;
@property(nonatomic,strong) FFState* state;
@end



