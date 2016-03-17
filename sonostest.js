// ////////////////////////////////////////////////////
// Household Config until I get discovery implemented
// ////////////////////////////////////////////////////
// update these by hitting ws://IP:1400/info and grabbing the values

var householdID = '12345';
//var cmdID = '222BBBCCC-3';
var groupID = '	ABCDEFG:1';
var speakerIP = "192.168.0.167";
var backgroundAlbumArt = "true";


// ////////////////////////////////////////////////////
// create the initial connection and set up event handlers
// ////////////////////////////////////////////////////

var socket = new WebSocket("ws://" + speakerIP + ":2001/websocket/api?key=00000000-0000-0000-0000-000000000000", "v1.api.smartspeaker.audio");

console.log("Built Socket");

socket.onerror = function(error) {
    console.log('WebSocket Error: ' + error);
  };

socket.onopen = function(event) {
    //console.log('Connected to Sonos');
    playbackMetaData('subscribe');
    groupVolumeSubscribe();
  };

socket.onmessage = function(event) {

	// grab the value of the message sent in the event
  var message = event.data;
  //console.log(message);

    // parse the response into an array
	var arr = $.parseJSON(message);

	// create a header and body variable
  console.log(arr);
	var parsedHeader = arr[0];
 	var parsedBody = arr[1];

 	// display in console to debug  (delete this later)
    //for (var i = 0, len = message.length; i < len; i++) {
    //    console.log(arr[i]);
    //}

    // set metadata and album art
    console.log("49: The header is " + parsedHeader.namespace);

    if (parsedHeader.namespace == "groupVolume:1"){
      console.log("inside group volume");
    }

/* 	  if (parsedHeader.namespace == "playbackMetadata:1"){
    console.log(parsedBody.currentItem);
		//console.log(parsedBody.currentItem.track.name);
 		console.log(parsedBody.currentItem.track.imageUrl);
 		document.getElementById('songName').innerHTML = parsedBody.currentItem.track.name;
 		document.getElementById('albumArt').innerHTML = '<img src="' + parsedBody.currentItem.track.imageUrl + '" height="0" width="0">';



 		document.getElementById('artistName').innerHTML = parsedBody.currentItem.track.artist.name;
 		document.getElementById('albumName').innerHTML = parsedBody.currentItem.track.album.name;

 		if (backgroundAlbumArt == "true"){
	 		document.body.style.backgroundImage = "url('" + parsedBody.currentItem.track.imageUrl + "')";
 			document.getElementById('blurred').style.backgroundImage = "url('" + parsedBody.currentItem.track.imageUrl + "')";

 		}



 	} */

   }; 
   
   
   // ////////////////////////////////////////////////////
// Play/Pause state
// ////////////////////////////////////////////////////
var playState = "Paused";

function isPlayPause(){
		if (playState == "Play"){
			playState = "Paused";
			var pause = '[{ "namespace": "playback:1", "command": "pause", "householdId": "' + householdID + '", "groupId": "' + groupID + '"},{}]';
			socket.send(pause);
			//document.getElementById("playerPlayPause").childNodes[0].nodeValue="Paused";
			document.getElementById("playerPlayPause").style.backgroundImage = "url('/images/pause.png')";
		} else {
			playState = "Play";
			var play = '[{ "namespace": "playback:1", "command": "play", "householdId": "' + householdID + '", "groupId": "' + groupID + '"},{}]';
			socket.send(play);
			//document.getElementById("playerPlayPause").childNodes[0].nodeValue="Play";
			document.getElementById("playerPlayPause").style.backgroundImage = "url('/images/play.png')";

		}
	}


// close the socket connection
socket.onclose = function(event) {
    socketStatus.value += 'Disconnected from WebSocket.';
    socketStatus.className = 'closed';
  };


// ////////////////////////////////////////////////////
// Control functions
// ////////////////////////////////////////////////////


// this sends any message passed in to the open socket
function sendMessage(message){
	socket.send(jsonMsg.value); // not taking the argument currently
}

// used to clear the text in the MESSAGE RECEIVED box
function clearText() {
	socketStatus.value = "";
}

// close the socket connection to the speaker
function closeSocket(){
socket.close();
}



// this is the playback namespace all wrapped into one
// since you can just pass a command, it's a simple call
function playback(command){
	var playPackage = '[{  "namespace": "playback:1",  "command": "' + command + '",  "householdId": "' + householdID + '", "groupId": "' + groupID + '"},{ }]';
	socket.send(playPackage);
}

function playbackMetaData(command){
	var playPackage = '[{  "namespace": "playbackMetadata:1",  "command": "' + command + '",  "householdId": "' + householdID + '", "groupId": "' + groupID + '"},{ }]';
  //console.log('playpage log is : '+ playPackage);
	socket.send(playPackage);
}



//metadata subscribe/unsubscribe
function playbackMD(command){
	var playbackMDPackage = '[{  "namespace": "playbackMetadata:1",  "command": "' + command + '",  "householdId": "' + householdID + '",  "groupId": "' + groupID + '"},{ }]';
	socket.send(playbackMDPackage);
}

// ////////////////////////////////////////////////////
// Volume functions - IN WORK
// ////////////////////////////////////////////////////

function groupVolumeSubscribe(){
  var volSubscribePackage = '[{  "namespace": "groupVolume:1",  "command": "subscribe",  "householdId": "' + householdID + '",  "groupId": "' + groupID + '"},{}]';
  console.log('Volpackage:' + volSubscribePackage);
  socket.send(volSubscribePackage);
  console.log('subscribed to group volume');

}

// set the volume based on an integer passed in
// [ ] I would like to move all messaging commands out to the send function to wrap them properly
function setVolume(vol){
	var volPackage = '[{  "namespace": "groupVolume:1",  "command": "setVolume",  "householdId": "' + householdID + '",  "groupId": "' + groupID + '"},{ "volume": "' + vol + '" }]';
	socket.send(volPackage);
}

// this was to grab the current volume level and display it
// not used yet
// [ ] needs fixing to update display
function getVolume(){
	var volPackage = '[{  "namespace": "groupVolume:1",  "command": "' + "getVolume" + '",  "householdId": "' + householdID + '", "groupId": "' + groupID + '"},{ }]';
	socket.send(volPackage);
}

// event to change volume when the slider changes.
// [ ] add in display functionality to update volume number display
function volumeSliderChanged(vol){
	setVolume(vol);
}
