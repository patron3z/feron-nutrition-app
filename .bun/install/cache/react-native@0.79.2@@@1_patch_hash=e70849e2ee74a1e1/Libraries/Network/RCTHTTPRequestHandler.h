/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInvalidating.h>
#import <React/RCTURLRequestHandler.h>

typedef NSURLSessionConfiguration * (^NSURLSessionConfigurationProvider)(void);
/**
 *  The block provided via this function will provide the NSURLSessionConfiguration for all HTTP requests made by the
 * app.
 */
RCT_EXTERN void RCTSetCustomNSURLSessionConfigurationProvider(NSURLSessionConfigurationProvider);

/**
 * Set proxy credentials for HTTP requests.
 */
RCT_EXTERN void RCTSetProxyCredentials(NSString *username, NSString *password);

/**
 * Set proxy host for HTTP requests.
 */
RCT_EXTERN void RCTSetProxyHost(NSString *host);

/**
 * Set proxied domains for HTTP requests.
 */
RCT_EXTERN void RCTSetProxiedDomains(NSArray<NSString *> *domains);

/**
 * This is the default RCTURLRequestHandler implementation for HTTP requests.
 */
@interface RCTHTTPRequestHandler : NSObject <RCTURLRequestHandler, RCTInvalidating>

@end
