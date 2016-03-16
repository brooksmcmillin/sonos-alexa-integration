/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
var https = require('https');

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
        }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("VolumeChangeIntent" === intentName) {
        setVolumeInSession(intent, session, callback);
    } else if ("WhatsMyVolumeIntent" === intentName) {
        getVolumeFromSession(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent " + intentName;
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to We Are Concerts.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please repeat?";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function setVolumeInSession(intent, session, callback) {
    var cardTitle = intent.name;
    //var favoriteColorSlot = intent.slots.Color;
    var volumeChange = intent.slots.VolumeChange;
    var volumeLevel;
    var repromptText = "Say again?";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "Done.";

    if(session.attributes)
    {
        volumeLevel = session.attributes.volumeLevel;
    }

    if (volumeChange) {
        var vChange = volumeChange.value;

        switch(vChange)
        {
            case "up":
                 volumeLevel = volumeLevel+1;
                 break;
            case "down":
                volumeLevel = volumeLevel-1;
                break;
            case "mute":
                volumeLevel = 1;
                break;
            case "unmute":
                volumeLevel = 5;
                break;
        }
        speechOutput = "Certainly.";
        sessionAttributes = createVolumeAttribute(volumeLevel);
        speechOutput = "Done.";
        //sendVolume(volumeLevel);

    } else {
        speechOutput = "I'm not sure";
        repromptText = "I'm not sure";
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function createVolumeAttribute(volumeLevel) {
    return {
        volumeLevel: volumeLevel
    };
}

function getVolumeFromSession(intent, session, callback) {

    var volumeLevel;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

	 if (session.attributes) {
        volumeLevel = session.attributes.volumeLevel;
    }

    if (volumeLevel) {
        speechOutput = "Your volume level is " + volumeLevel + ". Goodbye.";
        shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

function sendVolume(volume) {

  var postheaders = { 'Content-Type' : 'application/json' };
  var parameters = "volume=" + volume;

  var options = {
    hostname: "http://brooksmcmillin.com:8081/weareconcerts/index.php?volume="+volume,
    port: 443,
    path: '/test',
    method: 'POST',
    headers: postheaders
  };

  var reqPost = https.request(options, function (res) {
    var body = '';
    res.setEncoding('utf8');

    res.on('end', function() {
      console.log("successfully sent vol "+volume);

      callback(sessionAttributes,
           buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    })
  })

  /*var xhttp = new XMLHttpRequest();
	xhttp.open("GET",
		"http://brooksmcmillin.com:8081/weareconcerts/index.php?volume="+volume, true);
	xhttp.send();*/

}


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
