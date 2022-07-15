
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "avformat.h"
@class FFVideoDecoderModel;

@interface FFVideoCodecSelector: NSObject

+ (instancetype)decoderWithModel:(FFVideoDecoderModel*)model;

- (void)flushPacket:(AVPacket)packet;
- (BOOL)sendPacket:(AVPacket)packet needFlush:(BOOL *)needFlush;
- (CVImageBufferRef)imageBuffer;
- (BOOL)trySetupVTSession;
- (void)flush;
@end
