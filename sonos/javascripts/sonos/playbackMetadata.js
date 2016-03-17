'use strict';

/*
 The MIT License (MIT)

 Copyright (c) 2015 Sonos, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

/**
 * The SonosPlaybackMetadata object handles playbackMetadata namespace commands and events.
 * @param {SonosConnector} connector the {@link SonosConnector} for the current connection
 * @constructor
 */
function SonosPlaybackMetadata(connector) {
  this.namespace = 'playbackMetadata:1';
  this.connector = connector;
}

/**
 * Send a Sonos Control API command in the playbackMetadata namespace to the connected group.
 * @param {string} command the name of the command
 * @param {Object} body the command parameters, or an empty object if none
 */
SonosPlaybackMetadata.prototype.command = function(command, body) {
  const header = {
    namespace: this.namespace,
    householdId: this.connector.householdId,
    groupId: this.connector.groupId,
    command: command
  };
  this.connector.send(JSON.stringify([header, body]));
};

/**
 * Subscribe to Sonos Control API events in the playbackMetadata namespace.
 * @param {function} callback a function to handle incoming playbackMetadata events
 */
SonosPlaybackMetadata.prototype.subscribe = function(callback) {
  this.connector.listen(this.namespace, callback);
  this.command('subscribe', {});
};

/**
 * Unsubscribe from Sonos Control API events in the playbackMetadata namespace.
 */
SonosPlaybackMetadata.prototype.unsubscribe = function() {
  this.connector.listen(this.namespace);
  this.command('unsubscribe', {});
};

module.exports = SonosPlaybackMetadata;
