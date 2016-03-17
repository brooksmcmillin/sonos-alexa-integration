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

require('../util/arrayExt');
const Client = require('node-ssdp').Client;

/**
 * Helper function to parse a player description out of an SSDP advertisement or M-SEARCH response.
 * @param {string} msg the SSDP message data
 * @returns {Object} a representation of a discovered Sonos player
 */
function parsePlayer(msg) {
  let player;

  // You would need to install a custom cert to make the wss:// address work
  function makeInsecure(str) {
    return str.replace('wss://', 'ws://').replace(':1443/websocket', ':1400/websocket');
  }

  if (msg['USN'].match(/uuid:(.*?)::urn:smartspeaker-audio:service:SpeakerGroup:1/)) {
    try {
      const wsAddr = msg['WEBSOCK.SMARTSPEAKER.AUDIO'].trim(),
        isSecure = wsAddr.startsWith('wss://'),
        insecureWSAddr = isSecure ? makeInsecure(wsAddr) : wsAddr,
        secureWSAddr = isSecure ? wsAddr : null;

      player = {
        uuid: msg['USN'].match(/uuid:(.*?)::urn:smartspeaker-audio:service:SpeakerGroup:1/)[1],
        house: msg['HOUSEHOLD.SMARTSPEAKER.AUDIO'].trim(),
        hasSecureWS: isSecure,
        secureAddr: secureWSAddr,
        insecureAddr: insecureWSAddr,
        bootId: parseInt(msg['BOOTID.UPNP.ORG']),
        gc: msg['GROUPINFO.SMARTSPEAKER.AUDIO'].match(/gc=([01]?);/)[1],
        gid: msg['GROUPINFO.SMARTSPEAKER.AUDIO'].match(/gid=(.*?);/)[1],
        gname: msg['GROUPINFO.SMARTSPEAKER.AUDIO'].match(/gname="(.*?)"/)[1],
        acquired: new Date(),
        expires: new Date(Date.now() + parseInt(msg['CACHE-CONTROL'].match(/max-age\s*=\s*([0-9]*)/)[1]) * 1000)
      };
    } catch (err) {
      console.log('Player SSDP message could not be parsed.');
      console.log(err);
    }
  }

  return player;
}

/**
 * The GroupManager is a singleton object which uses SSDP to search for discoverable Sonos groups on the local LAN.
 * @constructor
 */
function GroupManager() {
  const os = require('os'),
    self = this;

  /**
   * @private
   */
  self._players = {};

  /**
   * @private
   */
  self._ssdpClient = new Client({
    logLevel: 'DEBUG',
    reuseAddr: (os.platform() !== 'win32') // reuseAddr does not work as expected on Windows
  });

  /**
   * @private
   */
  self._subscribers = [];

  self._ssdpClient.start(function(msg) {
    console.log('Started SSDP Listener...');
  });

  self._ssdpClient.on('response', function(msg) {
    //console.log('MSEARCH-RESPONSE-- ' + JSON.stringify(msg));
    self.response(msg);
  });

  self._ssdpClient.on('advertise-alive', function(msg) {
    // console.log('ADVERT-ALIVE-- ' + JSON.stringify(msg));
    self.alive(msg);
  });

  self._ssdpClient.on('advertise-bye', function(msg) {
    // console.log('ADVERT-BYEBYE-- ' + JSON.stringify(msg));
    self.byebye(msg);
  });
}

/**
 * Handles player groups coming up.
 * @param {string} msg an SSDP NOTIFY-ALIVE advertisement received by the node-ssdp client
 */
GroupManager.prototype.alive = function(msg) {
  const player = parsePlayer(msg);
  if (player && player.uuid) {
    this._players[player.uuid] = player;
    this.broadcastGroupChange();
  }
};

/**
 * Handles player groups going down.
 * @param {string} msg an SSDP NOTIFY-BYEBYE advertisement received by the node-ssdp client
 */
GroupManager.prototype.byebye = function(msg) {
  const player = parsePlayer(msg);
  if (player && player.uuid) {
    delete this._players[player.uuid];
    this.broadcastGroupChange();
  }
};

/**
 * Handles SSDP M-SEARCH responses.
 * @param {string} msg an SSDP M-SEARCH response messagereceived by the node-ssdp client
 */
GroupManager.prototype.response = function(msg) {
  const player = parsePlayer(msg);
  if (player && player.uuid) {
    this._players[player.uuid] = player;
  }
};

/**
 * Returns the available groups based on the discovered Sonos players.
 * @returns {Object[]} a list of Sonos groups
 */
GroupManager.prototype.groups = function() {
  const list = [];
  for (const key in this._players) {
    if (!this._players.hasOwnProperty(key)) {
      continue;
    }

    const player = this._players[key];
    if (player.gc === '1') {
      list.push({
        groupName: player.gname,
        address: (player.hasSecureWS ? player.secureAddr : player.insecureAddr),
        householdId: player.house,
        groupId: player.gid
      });
    }
  }

  // Sort the groups names, because its nice when they dont move around in the list.
  list.sort(function(a, b) {
    return a.groupName.localeCompare(b.groupName);
  });

  return list;
};

/**
 * Clears expired entries out of the list of discovered Sonos players and sends a fresh SSDP M-SEARCH.
 */
GroupManager.prototype.refreshGroups = function() {
  this.expirePlayers();
  this.msearch();
};

/**
 * Removes players which have lived beyond their cache timeout from the master list.
 */
GroupManager.prototype.expirePlayers = function() {
  const now = Date.now();
  for (const key in this._players) {
    if (!this._players.hasOwnProperty(key)) {
      continue;
    }

    if (this._players[key].expires.valueOf() < now) {
      console.log('EXPIRING');
      delete this._players[key];
    }
  }
};

/**
 * Removes players which did not respond to the latest M-SEARCH in a timely manner from the master list.
 * @param {Date} searchTime the oldest allowed response time
 */
GroupManager.prototype.removeUnresponsivePlayers = function(searchTime) {
  for (const key in this._players) {
    if (!this._players.hasOwnProperty(key)) {
      continue;
    }

    if (this._players[key].acquired.valueOf() < searchTime) {
      console.log('REMOVING');
      delete this._players[key];
    }
  }
};

/**
 * Searches for players on the network with UDP multicast SSDP M-SEARCH messages.
 * New players are added to the list of discovered players, and any known players which do not respond within 5 seconds
 * are deemed unresponsive and removed from the list.
 */
GroupManager.prototype.msearch = function() {
  const now = Date.now(),
    self = this;

  this._ssdpClient.search('urn:smartspeaker-audio:service:SpeakerGroup:1');
  setTimeout(function() {
    self.broadcastGroupChange();
    self._ssdpClient.search('urn:smartspeaker-audio:service:SpeakerGroup:1');
  }, 1000);

  setTimeout(function() {
    self.broadcastGroupChange();
    self._ssdpClient.search('urn:smartspeaker-audio:service:SpeakerGroup:1');
  }, 2000);

  // Remove any players from the list that did not respond promptly
  setTimeout(function() {
    self.removeUnresponsivePlayers(now);
    self.broadcastGroupChange();
  }, 7000);
};

/**
 * Adds a subscriber for internal events (used to notify the app window of group changes).
 * @param {Object} subscriber an object with a send() method to receive events
 */
GroupManager.prototype.subscribe = function(subscriber) {
  if (this._subscribers.indexOf(subscriber) === -1) {
    this._subscribers.push(subscriber);
  }
};

/**
 * Notifies subscribers of a change in the list of discovered groups.
 */
GroupManager.prototype.broadcastGroupChange = function() {
  this._subscribers.forEach(function(subscriber) {
    subscriber.send('GroupManager:groups', this.groups());
  }, this);
};

const singleton = new GroupManager();

singleton.msearch();

module.exports = {
  getInstance: function() {
    return singleton;
  }
};
