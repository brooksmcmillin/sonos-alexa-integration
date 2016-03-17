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
 * The SonosGroupVolume object handles groupVolume namespace commands and events.
 * @param {SonosConnector} connector the {@link SonosConnector} for the current connection
 * @constructor
 */
function SonosGroupVolume(connector) {
  this.namespace = 'groupVolume:1';
  this.connector = connector;
}

/**
 * Send a Sonos Control API command in the groupVolume namespace to the connected group.
 * @param {string} command the name of the command
 * @param {Object} body the command parameters, or an empty object if none
 */
SonosGroupVolume.prototype.command = function(command, body) {
  const header = {
    namespace: this.namespace,
    householdId: this.connector.householdId,
    groupId: this.connector.groupId,
    command: command
  };
  this.connector.send(JSON.stringify([header, body]));
};

/**
 * Send a getVolume command to the connected group.
 */
SonosGroupVolume.prototype.getVolume = function() {
  this.command('getVolume', {});
};

/**
 * Set the group volume of the connected group.
 * @param {number} value the desired average volume level for the group (an integer from 0 to 100)
 */
SonosGroupVolume.prototype.setVolume = function(value) {
  this.command('setVolume', {
    volume: value
  });
};

/**
 * Adjust the group volume by the specified amount.
 * @param {number} value the delta to apply to the average group volume (an integer from -100 to 100)
 */
SonosGroupVolume.prototype.setRelativeVolume = function(value) {
  this.command('setRelativeVolume', {
    volumeDelta: value
  });
};

/**
 * Set the group mute state.
 * @param {boolean} value if true, mute all players in the group; if false, unmute all players
 */
SonosGroupVolume.prototype.setMute = function(value) {
  this.command('setMute', {
    muted: value
  });
};

/**
 * Subscribe to Sonos Control API events in the groupVolume namespace.
 * @param {function} callback a function to handle incoming groupVolume events
 */
SonosGroupVolume.prototype.subscribe = function(callback) {
  this.connector.listen(this.namespace, callback);
  this.command('subscribe', {});
};

/**
 * Unsubscribe from Sonos Control API events in the groupVolume namespace.
 */
SonosGroupVolume.prototype.unsubscribe = function() {
  this.connector.listen(this.namespace);
  this.command('unsubscribe', {});
};

module.exports = SonosGroupVolume;
