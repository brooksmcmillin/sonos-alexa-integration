'use strict';

const assert = require('assert'),
  SonosConnector = require('../../javascripts/sonos/connector.js'),
  SonosGroupVolume = require('../../javascripts/sonos/groupVolume.js'),
  hhid = 'Sonos_ZXmf34mjUz7ghNtdbzy9JlfBzz',
  gid = 'RINCON_B8E937BA5E1E01400:6',
  url = 'ws://192.168.3.94:1400/websocket/api';

/*
 * Test application startup
 */

describe('Test the volume connection', function() {
  const connection = new SonosConnector();

  before(function(done) {
    connection.onConnected = function() {
      connection.volume = new SonosGroupVolume(connection);
      done();
    };

    // Need connection info here for a player or simulator
    connection.connect(hhid, gid, url);
  });

  it('receives getVolume response', function(done) {
    let subscribed = false,
      alldone = false;
    connection.volume.subscribe(function(msg) {
      console.log(msg);
      if (msg.header.response && msg.header.response === 'subscribe') {
        assert(subscribed = true);
      }

      if (msg.header.type === 'groupVolume') {
        // Assert we already received the subscribe response
        assert(subscribed);
        if (!alldone) {
          done();
        }

        alldone = true;
      }
    });

    connection.volume.getVolume();
  });

  it('can setVolume', function() {
    connection.volume.setVolume(35);
  });

  it('can getVolume', function() {
    connection.volume.getVolume();
  });

  after(function() {
    connection.disconnect();
  });
});
