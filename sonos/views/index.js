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

const SonosConnector = require('../javascripts/sonos/connector.js'),
  SonosGlobal = require('../javascripts/sonos/global.js'),
  SonosGroupVolume = require('../javascripts/sonos/groupVolume.js'),
  SonosPlayback = require('../javascripts/sonos/playback.js'),
  SonosPlaybackMetadata = require('../javascripts/sonos/playbackMetadata.js'),
  ipcRenderer = require('electron').ipcRenderer, // Communication to the server
  connection = new SonosConnector(); // SonosConnector manages the connection to a Sonos group

/**
 * This function executes after the connection to the Sonos Player has succeeded
 * and wires the page to the SonosConnector object.
 */
connection.onConnected = function onConnected() {

  // Create the control objects for the new connection
  connection.volume = new SonosGroupVolume(connection);        // Sends volume command and receives volume events
  connection.playback = new SonosPlayback(connection);         // control playback and receive playback events
  connection.metadata = new SonosPlaybackMetadata(connection); // Receives now playing and up next metadata information
  connection.global = new SonosGlobal(connection);             // Receives global notification messages

  // Setting the event callbacks on the Sonos Control Objects once the connection is complete
  connection.volume.subscribe(function(msg) {
    if (msg.header.type === 'groupVolume') {

      const $volumeSlider = $('#volume');

      // If event says fixed volume then disable controls and don't expect any more messages
      $volumeSlider.toggleClass('fixed', msg.body.fixed);

      // Ignore the volume update events when dragging
      if (!$volumeSlider.find('.dragger').hasClass('dragging')) {
        const $dataSlider = $('[data-slider]');
        if ($dataSlider.hasClass('settling')) {
          $dataSlider.data('settle-value', msg.body.volume);
        } else {
          $dataSlider.data('slider-object').setValue(msg.body.volume);
        }
      }
    }
  });

  connection.playback.subscribe(function(msg) {
    if (msg.header.type === 'playbackStatus') {
      console.log('playback status message.');
      const isPlaying = ['PLAYBACK_STATE_PLAYING', 'PLAYBACK_STATE_BUFFERING'].indexOf(msg.body.playbackState) > -1;
      $('#play-controls').find('.play').toggleClass('playing', isPlaying);
    }
  });

  connection.metadata.subscribe(function(msg) {
    if (msg.header.type === 'metadataStatus') {
      try {
        $('.current.song').html(msg.body.currentItem.track.name);
        $('.current.artist').html(msg.body.currentItem.track.artist.name);
        $('#cover-art').attr('src', msg.body.currentItem.track.imageUrl).show();
      } catch (err) {
        $('div.current').html('');
        $('#cover-art').hide();
        console.log('No metadata for current item');
      }

      try {
        $('div.nextup.song').html(msg.body.nextItem.track.name);
        $('div.nextup.artist').html(msg.body.nextItem.track.artist.name);
        $('#nextup-title').show();
      } catch (err) {
        $('#nextup-title').hide();
        $('div.nextup').html('');
        console.log('No metadata for next item');
      }
    }
  });

  connection.global.subscribe(function(msg) {
    if (msg.header.type === 'groupCoordinatorChanged') {
      const $groupName = $('#group-name');
      switch (msg.body.groupStatus) {
        case 'GROUP_STATUS_UPDATED':
          $groupName.html(msg.body.groupName);
          break;
        case 'GROUP_STATUS_GONE':
          $groupName.html('Select A Group');
          $('#cover-art, #nextup-title').hide();
          disconnect();
          break;
        case 'GROUP_STATUS_MOVED':
          disconnect();
          $groupName.html(msg.body.groupName);
          const url = msg.body.websocketUrl.replace('wss://', 'ws://').replace(':1443/websocket', ':1400/websocket');
          connection.connect(msg.header.householdId, msg.header.groupId, url);
          break;
      }
    }
  });

  $('#control-content').removeClass('disconnected');
};

/**
 * Set the enabled or disabled state of the volume slider.
 * NYI.
 * @param {boolean} enable
 */
function enableVolumeSlider(enable) {
}

/**
 * Unsubscribe and disconnect from the Sonos player.
 */
function disconnect() {
  if (connection.volume) {
    connection.volume = connection.volume.unsubscribe();
  }

  if (connection.playback) {
    connection.playback = connection.playback.unsubscribe();
  }

  if (connection.metadata) {
    connection.metadata = connection.metadata.unsubscribe();
  }

  if (connection.global) {
    connection.global = connection.global.unsubscribe();
  }

  $('#play-controls').find('.play').removeClass('playing');
  $('div.song, div.artist').html('');
  $('#control-content').addClass('disconnected');
  connection.disconnect();
}

/**
 * Build the UI elements for the group list.
 * @param {Object[]} list the discovered groups
 * @param {string} list[].householdId the Sonos household ID of the discovered group
 * @param {string} list[].groupId the group ID of the discovered group
 * @param {string} list[].groupName the display name of the discovered group
 * @param {string} list[].address the WebSocket URI of the group coordinator
 */
function buildGroupList(list) {
  $('#group-list').html('');
  list.forEach(function(g) {
    const d = document.createElement('div');
    $(d).addClass('group-item')
      .html(g.groupName)
      .appendTo($('#group-list'))
      .click(function() {
        disconnect();
        connection.connect(g.householdId, g.groupId, g.address);
        $('#group-name').html(g.groupName);
        $('#group-list').slideUp();
      });
  });
}

// When the page is ready then setup the group connection control
$(document).ready(function() {

  // Handle group events from the main service that contain a list of all available players
  ipcRenderer.on('GroupManager:groups', function(event, data) {
    buildGroupList(data);
  });

  // On click slide open/close group list and initiate another search for players
  $('#group-name').on('click', function() {
    $('#group-list').slideToggle();
    ipcRenderer.send('GroupManager:getGroups');
  });

  $('#play-controls').find('.play').on('click', function(event) {
    if (connection.playback) {
      const isPlaying = $(event.target).hasClass('playing');
      if (isPlaying) {
        connection.playback.pause();
      } else {
        connection.playback.play();
      }

      $(event.target).toggleClass('playing', !isPlaying);
    }
  });

  $('#play-controls .previous, #play-controls .next').on('click', function() {
    if (connection.playback) {
      if ($(event.target).hasClass('previous')) {
        connection.playback.previous();
      } else {
        connection.playback.next();
      }
    }
  });

  $('[data-slider]').on('slider:changed', function(event, data) {
    if (connection.volume) {
      connection.volume.setVolume(Math.round(data.value));
      if (data.dragDone) {
        const $dataSlider = $('[data-slider]');
        $dataSlider.data('settle-value', data.value);
        $dataSlider.addClass('settling');
        setTimeout(function() {
          // Make sure we did not start dragging again right away
          if (!$('#volume').find('.dragger').hasClass('dragging')) {
            $dataSlider.data('slider-object').setValue($('[data-slider]').data('settle-value'));
          }

          $dataSlider.removeClass('settling');
        }, 200);
      }
    }
  });
});
