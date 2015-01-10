/***************************************************************************************************
 *			Image Player
 * * * * * * * * * * * * * * * * * * * * * *
 *		Author:		Daniel Bergmann
 **************************************************************************************************/
// Check for the com object, throw an error if it exists and is not an object.
var com;
if (!com) com = {};
else if (typeof com != "object")
	throw new Error("com already exists and is not an object!");

// Check for the danbergmann object on com, throw an error if it exists and is not an object
if (!com.danbergmann) com.danbergmann = {};
else if (typeof com.danbergmann != "object")
	throw new Error("com.danbergmann already exists and is not an object!");

// Check for the imagePlayer object on com.danbergmann, throw an error if it exists.
if (com.danbergmann.imagePlayer)
	throw new Error("com.danbergmann.imagePlayer already exists!");

/***************************************************************************************************
 *			EXTERNAL - PUBLIC CLASS VARIABLES
 **************************************************************************************************/
//=====================================================
//	Wrappers
//=====================================================
com.danbergmann.imagePlayer			= {};			// Defines the mediaPlayer Object. If we don't do this, then nothing will work.
com.danbergmann.imagePlayer.style	= {};			// Defines the style object, used for holding the style variables.
com.danbergmann.imagePlayer.data	= new Array();	// Defines the data object. Very important as it holds all the data for our videos.
com.danbergmann.imagePlayer.video	= new Array();	// Defines the video object, just a shortcut to the data object but videos can be accessed by their names in here, not ids.

//=====================================================
//	Public variables which should not be edited.
//=====================================================
com.danbergmann.imagePlayer.version			= "2.2";				// Image Player version
com.danbergmann.imagePlayer.author			= "Daniel Bergmann";	// Me the author
com.danbergmann.imagePlayer.videoFocus		= false;				// Which video currently has focus. Very important.
com.danbergmann.imagePlayer.playlistLength	= 0;					// How long the playlist is.

//=====================================================
//	Public variables which are available to be edited
//=====================================================
// Note that these values are the default variable values for the Image Player. You only need to specify those which you want to change
// as all unspecified values will default to those written here.
com.danbergmann.imagePlayer.fadeSpeed					= 1000;		// The fade speed of all frames that fade. In ms
com.danbergmann.imagePlayer.useSeekBar					= false;	// Use the seek bar? If false the user is still able to play and pause the video by clicking on it.
com.danbergmann.imagePlayer.playOnLoad					= true;		// Should the player start playing immediately after loading a video?
com.danbergmann.imagePlayer.immediateLoad				= true;		// Should the player load the first video immediately? If false then the splash logo will be shown
																	// and the playlist bar will be available. Note that this value is overriden to true if there is only
																	// one video.
com.danbergmann.imagePlayer.singleLoop					= true;		// Whether we are to loop the single video
com.danbergmann.imagePlayer.loadingTimeOut				= 30;		// The loading timeout in seconds. If while loading no image has loaded after this number of seconds,
																	// then loading of that video is cancelled and an error is shown for 3 seconds.
com.danbergmann.imagePlayer.writeCaptionTarget			= false;	// Optinally specify the id of an element in which the player should write the caption of
																	// the video.

//=====================================================
//	Public variables which are used to style the player
//=====================================================
// Note that these values are the default styling values for the Image Player. You only need to specify those which you want to change
// as all unspecified values will default to those written here.
com.danbergmann.imagePlayer.style.playerWidth			= 300;			// Outer Player Width in pixels
com.danbergmann.imagePlayer.style.playerHeight			= 200;			// Outer Player Height in pixels

com.danbergmann.imagePlayer.style.borderWidth			= 1;			// Border Width in pixels
com.danbergmann.imagePlayer.style.borderColour			= "#444444";	// Border Colour, 6 digit hexadecimal number preceded by a hash.
																		// Format is #rrggbb with 0x00 being none of that colour and 0xff being fully turned on.
																		// So #ff0000 is fully red, #00ff00 is fully green, #ffffff is white, #000000 black etc.
com.danbergmann.imagePlayer.style.borderStyle			= "solid";		// Border style

// The splash logo url. Change this to the url of a logo you want to be displayed as the splash image
com.danbergmann.imagePlayer.style.splashLogo			= "../imageplayer/graphics/logo.png";
// The player background colour. Change this to the colour you want the background to be where the splash is displayed. See border colour for details on hex colour.
com.danbergmann.imagePlayer.style.backgroundColour		= "#ffffff";
// The background image on the splash screen. This image will be repeated horizontally along the bottom of the player.
// Use something like a simple gradient.
com.danbergmann.imagePlayer.style.backgroundImage		= "../imageplayer/graphics/player-bg.png";

/***************************************************************************************************
 *			INTERNAL - PRIVATE CLASS VARIABLES
 **************************************************************************************************/
(function(){
/***************************************************************************************************
 *		Configures the internal and external objects
 **************************************************************************************************/
// Configures the internal and external objects. The internal object holds all private members of the mediaPlayer, as they are defined within the local scope of the
// anonymous function. The external object is a shortcut to our available namespace object. Any references to external are the same as referencing com.danbergmann.imagePlayer.
var internal = {};							// The internal object. Not accessable from the global scope.
var external = com.danbergmann.imagePlayer;	// The external object. Accessable from the global scope. Note that this is just a shortcut.

// Event Wrapper. Just groups all the event methods and memebers in one object for organisation.
internal.event	= {};						// Object which stores all the events which are to be watched for.

//=====================================================
//	Image Player hard coded configuration limits.
//=====================================================
// Things like max fps and min width go here. These are hard coded for technical reasons and should not be changed.
internal.maxFps				= 25;	// Maximum fps that a video can have. Any higher fps rates specified will default to this fps rate. In frames per second
internal.minWidth			= 300;	// Minimum width that the player can have. Any smaller specified widths will default to this value. In pixels
internal.minHeight			= 200;	// Minimum height that the player can have. Any smaller specified heights will default to this value. In pixels
internal.maxLoadingTimeOut	= 60;	// Maximum loading timeout in seconds. Any longer specified timeout values will default to this value. In seconds

internal.playlistSlideTime	= 400;	// Playlist sliding time. How long it takes the playlist bar to slide in and out. In ms.

//=====================================================
//	Image Player private variables.
//=====================================================
// These variables are used in the internal workings of the Image Player. It is very important that they are not changed.

// Loading Vars
internal.pageLoaded			= false;	// Set to true when the page has fully loaded.
internal.fullyLoaded		= false;	// Are our images all loaded? True they are, false they are not. They are not loaded initially, so this is false.
internal.mediaLoaded		= 0;		// How many media items have loaded. Gets changed during onLoad events firing during the loading period.
internal.mediaLoadedRatio	= 0;		// The ratio of loaded media to total media. Used for the loading bar to calculate its width.
internal.mediaLoadedPercent	= 0;		// The percentage of media loaded. Just the media loaded ratio x 100. Used for the loaded percentage.

// Temporary Image Storage Wrappers, for loading
internal.tmpImages			= new Array();	// The wrapper which contains the JavaScript image objects. Used for preloading.
internal.tmpSystemImages	= new Array();	// Wrapper containing all the system image objects. Used for preloading.

// Video Object
internal.video;		// Short cut to the current video. Optimisation point. Saves on searching the video array each time during frame animation.

// Counting and Iteration Vars, used in frame animation.
internal.loopIteration		= 0;							// The current loop iteration during our slideshow animation. Leave at 0 to start at the first picture.
//internal.nextLoopIteration	= internal.loopIteration + 1;	// The next loop iteration during slideshow animation. Needed to preload media to frames before they are shown.
internal.endOfVideo			= false;						// Gets set to true at the end of the video.
internal.mediaCount			= 0;							// How many media items we have. Gets changed during the media count.
internal.dataLength			= 0;							// Shortcut for .mediaCount - 1, as we use this value in every animation loop, we assign it to a variable to save
															// time.


// Time Keeping Vars
internal.startTime			= 0;	// The time when the video was started.
internal.currentTime		= 0;	// Time so far in to the media
internal.timeStopped		= 0;	// The time when the video was stopped.

// Playback state information. Stores information on the current state that various settings and objects are in.
internal.currentFrame		= true;		// The currently visible frame. True for frame 2, false for frame 1.
internal.isPlaying			= false;	// Boolean as to whether the player is playing or not.

// Timer Wrappers, used to store a handle to our timers.
internal.interval;		// The slideShow interval object holder. The window interval is stored here. Used to clear and reset it later
internal.loadingTimer;	// The loading timeout handle. The timeout

/***************************************************************************************************
 *		DOM and jQuery Object Handles
 **************************************************************************************************/
// Sets up the internal objects which hold our DOM and jQuery Objects
internal.dom = {}	// DOM Objects holder
internal.jqr = {}	// jQuery Objects Holder

//=====================================================
//	Main Wrapper
//=====================================================
// DOM Objects
internal.dom.mainWrapper;	// DOM object to the main mediaPlayer wrapper.
// jQuery Objects
internal.jqr.root;			// The jQuery root for the com.danbergmann.imagePlayer. This is used to reduce searching times by providing a local context to search in.

//=====================================================
//	Message Wrapper
//=====================================================
// DOM Objects
internal.dom.messageWrapper;	// Object to the message wrapper. Used to dynamically write messages to it.
// jQuery Objects
internal.jqr.messageWrapper;	// Object to the message wrapper. Used to animate the message wrapper (as it is a jQuery object).

//=====================================================
//	Frames, Frame Wrapper and Frame Event Catchers
//=====================================================
// DOM Objects
internal.dom.frameWrapper;			// Object to the frame wrapper
internal.dom.frameEvent;			// Object to the interactive frame interface. Used for catching click events etc.
internal.dom.frameEventGraphics;	// Object to the frame event graphics. Contains the play and pause icons that appear over the video
internal.dom.frame1;				// Object handle to frame1. Used for basic DOM access
internal.dom.frame2;				// Object handle to frame2. Used for basic DOM access
// jQuery Object
internal.jqr.frame1;				// Frame 1 object. Used when we want to fade to/from frame1.
internal.jqr.frame2;				// Frame 2 object. used when we want to fade to/from frame2.
internal.jqr.frameEventGraphics;	// Frame Event Graphics Object.

//=====================================================
//	Seek Bar and Controls with associated Wrappers
//=====================================================
// DOM Objects
internal.dom.seekWrapper;	// DOM object handle to the controls. In HTML this is called the "seek-bar-wrapper".
internal.dom.seekBar;		// DOM object handle to the seek bar.
internal.dom.btPlayPause;	// DOM object handle to the play/pause button
// jQuery Objects
internal.jqr.seekBar;			// The jQuery seek bar object. Used for smooth animation of it.

//=====================================================
//	Playlist Objects
//=====================================================
// DOM Objects
internal.dom.playlistContentWrapper;	// Wrapper for the contents of the playlist side bar.
internal.dom.playlistContent;			// The actual element which the contents of the playlist side bar goes in. Used to write content too.
internal.dom.playlistTab;				// The actual playlist tab element.
internal.dom.playlistTabWrapper;		// The wrapper for the playlist tab element.
// jQuery Objects
internal.jqr.playlistContentWrapper;	// Playlist content wrapper jQuery access
internal.jqr.playlistTab;				// Playlist tab for jQuery access. Used for animation
internal.jqr.playlistTabWrapper;		// Playlist tab wrapper for jQuery access. Used for animation

//=====================================================
//	Video Loading Page
//=====================================================
// DOM Objects
internal.dom.loadWrapper;	// Object to the loading wrapper
internal.dom.progressBar;	// Object for the progress bar.
internal.dom.loadedPercent;	// Object for the text holding the currently loaded percentage.
// jQuery Objects
internal.jqr.progressBar;	// The jQuery progress bar object. Used to animate the loading.

//=====================================================
//	mediaPlayer Loading Page - Pre-JavaScript
//=====================================================
// DOM Objects
internal.dom.logo;			// DOM object to the logo.

/***************************************************************************************************
 *			FUNCTIONS
 **************************************************************************************************/
/***************************************************************************************************
 *		Starting Player Formatting. Building the playlist and formatting the player.
 **************************************************************************************************/
// Here we do the initial player formatting. Looks lengthy, but most of the code in here is just setting all the players elements to the desired width and height,
// also there are a few event registrations as well.
internal.playerInitialFormat = function()
	{
		// Formats the outer border to be the correct width, style and colour.
		internal.dom.mainWrapper.style.border	= external.style.borderWidth +"px "+ external.style.borderStyle +" "+ external.style.borderColour;

		// Formats the main player wrappers width and height.
		internal.dom.mainWrapper.style.width	= external.style.playerWidth+"px";
		internal.dom.mainWrapper.style.height	= external.style.playerHeight+"px";

		// Formats the players background colour, and image along with the splash logo image.
		internal.dom.mainWrapper.style.backgroundColor = external.style.backgroundColour;
		internal.dom.mainWrapper.style.backgroundImage = (external.style.backgroundImage != false) ? "url('"+external.style.backgroundImage+"')" : 'none';
		internal.dom.logo.style.backgroundImage = "url('"+external.style.splashLogo+"')";

		// Centers the splash logo in the middle of the player.
		internal.dom.logo.style.width	= external.style.playerWidth+"px";
		internal.dom.logo.style.height	= external.style.playerHeight+"px";

		// Formats the frame wrappers width and height.
		internal.dom.frameWrapper.style.width	= external.style.playerWidth+"px";
		internal.dom.frameWrapper.style.height	= external.style.playerHeight+"px";

		// Formats the frames width and height.
		internal.dom.frame1.style.width			= external.style.playerWidth+"px";
		internal.dom.frame2.style.width			= external.style.playerWidth+"px";
		internal.dom.frame1.style.height		= external.style.playerHeight+"px";
		internal.dom.frame2.style.height		= external.style.playerHeight+"px";

		// Formats the loading wrappers width and height.
		internal.dom.loadWrapper.style.width	= external.style.playerWidth+"px";
		internal.dom.loadWrapper.style.height	= external.style.playerHeight+"px";

		// Formats the seek bars width and centers the loaded percentage
		internal.dom.loadedPercent.style.width			= external.style.playerWidth+"px";
		internal.dom.seekWrapper.style.width		= external.style.playerWidth+"px";

		// Formats the progress bar wrappers width
		document.getElementById("imageplayer-progress-bar-wrapper").style.width	= external.style.playerWidth+"px";

		// Formats the frame events width and height.
		internal.dom.frameEvent.style.width		= external.style.playerWidth+"px";
		internal.dom.frameEvent.style.height	= (external.style.playerHeight - 20)+"px";

		// Formats the frame event graphics wrappers width
		internal.dom.frameEventGraphics.style.width		= external.style.playerWidth+"px";
		internal.dom.frameEventGraphics.style.height	= external.style.playerHeight+"px";

		// Adds an event handler for the frame event when the user clicks on it, or the mouse goes over and out.
		internal.dom.frameEvent.onclick = internal.event.playPauseClick;
		internal.dom.frameEvent.onmouseover = internal.event.frameEventMouseOver;
		internal.dom.frameEvent.onmouseout = internal.event.frameEventMouseOut;

		// Formats the playlist content wrappers width and height to be half the width of the player and as heigh, and then sets it so it is hidden.
		internal.dom.playlistContentWrapper.style.width		= parseInt((external.style.playerWidth / 2),10)+"px";
		internal.dom.playlistContentWrapper.style.height	= external.style.playerHeight+"px";
		internal.dom.playlistContentWrapper.style.right		= -internal.jqr.playlistContentWrapper.outerWidth()+"px";

		// Formats the playlist contents height.
		internal.dom.playlistContent.style.height = external.style.playerHeight+"px";

		// Adds an event handler to the playlist tab button, so when it is clicked the playlist will show/hide itself.
		internal.dom.playlistTab.onclick = internal.event.playlistTabExpandCollapse;
	}

// This function builds the playlist bar and assignes all event handers to when a user clicks on a specific video.
internal.buildPlaylistBar = function()
	{
		// First chech that we have more than one video/media sequence. If not then there is no point in creating the playlist bar as it is not going to be used.
		if (external.data.length > 1)
			{
				// First we loop through our data and append an entry to the content container giving the name and a number for the video. This is what the used
				// will actually see when they look at the playlist.
				for (i = 0; i < external.data.length; i++)
					{
						// We just check if the current video we have chosen has focus, if it does, we give it the now playing class to identify it.
						var currentlyPlayingClass = (external.videoFocus == i) ? ' class="imageplayer-now-playing"' : '';
						// Append to our content.
						internal.dom.playlistContent.innerHTML += "<span id=\"imageplayer-playlist-list-item"+i+"\">"+(i+1)+". "+external.data[i].fullName+"</span>";
					}

				// Next we have to loop through and assign event handlers to them all.
				for (i = 0; i < external.data.length; i++)
					{
						// First we create the id of the element we want to give the event handler too.
						uid = 'imageplayer-playlist-list-item'+i;

						// Next we assign an anonymous function to the onclick event for our element.
						document.getElementById(uid).onclick = function()
							{
								// When a user clicks on the link, we first unload the current video.
								external.unloadVideo();
								// Then we hide the playlist bar, as they will want to watch the video.
								internal.event.playlistTabExpandCollapse();

								// Now we have to get the video ID AGAIN! As we cannot pass the id to this function for some odd reason.
								var id = parseInt(this.getAttribute("id").replace("imageplayer-playlist-list-item",""),10);
								// Now we just check that we have a video focused on, if we do we remove the focus class from that videos entry in the
								// playlist. We check to see if the .data[external.videoFocus] is an object, if it is then it should be a valid video
								// entry, if not then it's not defined or something and not a valid video.
								if (typeof(external.data[external.videoFocus]) == "object")
									{
										// Just use the simple removeAttribute DOM method for this, nice and fast.
										document.getElementById('imageplayer-playlist-list-item'+external.videoFocus).removeAttribute("class");
									}
								// Set the attribute of the clicked on video entry to "now playing"
								this.setAttribute("class","imageplayer-now-playing");

								// Set a timeout to another anonymous function which will start playing our video. We set a timeout to give the playlist
								// a chance to hide itself. Keeps things smooth.
								setTimeout(function()
									{
										// Swap our video using the concise swapVideo(id) function. And we just pass the id that we set earlier as it is our
										// desired video id.
										external.swapVideo(id);
									},(internal.playlistSlideTime+20)); // And we want this function to execute 20ms after the tab bar has shut. Just to give
																		// some time for the animation to finish.
							}
					}
			}
		// If we get here, then we have only one (or 0) videos. So then we just hide the playlist completely and initiate loading of the first video.
		else
			{
				document.getElementById('imageplayer-playlist-wrapper').style.display = "none";
				external.immediateLoad = true;
			}
	}

/***************************************************************************************************
 *		Animation functions - These handle the animation and animation initialisation
 **************************************************************************************************/
//=====================================================
//	initialiseAnimate
//=====================================================
// Initialises the animation. Hides the loading screen and sets the update interval.
internal.initialiseAnimation = function()
	{
		// Create the shortcut to our videos data. We do this to save accessing time during animation.
		internal.video = external.data[external.videoFocus];

		// Set the frames background colour to that of the videos defined background colour. Helps if the video frames are smaller
		// than that of the player.
		internal.dom.frameWrapper.style.backgroundColor = internal.video.bgColour;
		// Show our frames
		internal.dom.frameWrapper.style.display = "block";

		// Hides the loading page
		document.getElementById('imageplayer-loading-wrapper').style.display="none";

		// Show our event graphics and frame event catcher
		internal.dom.frameEventGraphics.style.display = "block";
		internal.dom.frameEvent.style.display = "block";

		// Set the background image of frame 2 which is showing to that of the first frame.
		internal.dom.frame2.style.background="transparent url('" + internal.video.frame[internal.loopIteration][0] + "') center center no-repeat";
		internal.currentFrame = false;

		// Check to see if we should play on load. If yes then we start animation right away. If not then we just have to wait until the user fires a play event.
		if (external.playOnLoad == true)
			{
				document.getElementById('imageplayer-playlist-list-item'+external.videoFocus).setAttribute("class","imageplayer-now-playing");

				// Set the isPlaying variable to true so other functions know we are currently playing.
				internal.isPlaying = true;

				// Sets the start time of the video.
				var d = new Date();
				internal.startTime		= d.getTime();

				// We call the animation function to start the animation.
				// If we use the seekbar then we use the animation function tuned for updating the seekbar
				if (com.danbergmann.imagePlayer.useSeekBar == true)
					{
						com.danbergmann.imagePlayer.animationWithSeek();
					}
				// Otherwise we use the animation function tuned for not updating the seekbar. These are just for optimisation of high fps videos.
				else
					{
						com.danbergmann.imagePlayer.animationNoSeek();
					}
			}
	}

//=====================================================
//	animateWithSeek
//=====================================================
// Initialises the animation. Hides the loading screen and sets the update interval.
//  - the animation function to be called when we do want to use the seek bar
com.danbergmann.imagePlayer.animationWithSeek = function()
	{
		// Now we see if we have come to the end of the video.
		if (internal.endOfVideo == true)
			{
				internal.endOfVideo = false;
				// If we have and we want to loop, then
				if (external.singleLoop == true || external.playlistLength < 2)
					{
						var d = new Date();
						internal.startTime		= d.getTime();
					}
				else
					{
						nextVideo = typeof(external.data[(external.videoFocus+1)]) == "object" ? external.videoFocus + 1 : 0;
						external.swapVideo(nextVideo);
					}

				return;
			}

		var _frame = internal.video.frame[internal.loopIteration];
		//=================================
		//	Hide the old frame, and update our current frame value
		//=================================
		// Check which frame is the visible one. We need to do this so we can swap the frames over. If the current frame is frame2 then we handle hiding frame2.
		if (internal.currentFrame == true)
			{
				// Check if the next frame is to be faded too. If it is, then we fade to it.
				if (_frame[2] == true)
					{
						// Get jQuery to do the fading. Use the fade Speed
						internal.jqr.frame2.fadeOut( com.danbergmann.imagePlayer.fadeSpeed );
					}
				else
					{
						// If we get here, then we do not want to fade to our next image. So we skip jQuery and its overhead and just set frame 2s display to none, revealing
						// frame 1.
						internal.dom.frame2.style.display = "none";
					}
				// Set the current frame variable to false, signifying that it is currently frame 1 that is visible (frame 2 is not visible, false)
				internal.currentFrame = false;
			}
		// Obviously it is frame 1 that is visible, so lets handle frame 2 appearing instead.
		else
			{
				// Check if our next frame wants to be faded in. If it does, lets handle the animation for fading.
				if (_frame[2] == true)
					{
						// Let jQuery handle the fading animation. Use the default fade Speed.
						internal.jqr.frame2.fadeIn( com.danbergmann.imagePlayer.fadeSpeed );
					}
				else
					{
						// We don't want to fade, so just display frame 2 isntantly. Don't use jQuery as it is a waste of time and resources for this task.
						internal.dom.frame2.style.display = "block";
					}
				// Set the current frame to true, indicating that it is frame 2 that is visible.
				internal.currentFrame = true;
			}


		//=================================
		//	Reset the timeout to call this animate function again.
		//=================================
		// Resets the timeout function which will call the animation again. Note that we use the media duration for the next slide as our timeout duration, as we have changed
		// to the next slide but not updated our loop iteration counters yet! This is to maximise our performance.
		//window.clearTimeout(internal.interval);
		// We call this function again as it is the function which handles all the animations.
		internal.interval = setTimeout("com.danbergmann.imagePlayer.animationWithSeek()", _frame[1]);


		// Now we check if we are starting at the beginning of the video (after a loop or just starting generally). If so then we set the seekbar width to 0px.
		if (internal.loopIteration == 0)
			{
				// Also clear the animation queue.
				internal.jqr.seekBar.clearQueue();
				// Set width to 0px.
				internal.dom.seekBar.style.width = "0px";
			}

		// Now we add the frames duration to the current time. For timekeeping.
		internal.currentTime += _frame[1];
		// Clear the animation queue on the seekbar, just incase the previous animation didn't quite finish.
		internal.jqr.seekBar.clearQueue();
		// Now we animate the seek bar to go to the next frames entry time along the timeline in the frames duration. Result is a smooth scroll.
		internal.jqr.seekBar.animate(
			{
				width: (((parseInt(external.style.playerWidth, 10) - 20) * internal.currentTime) / internal.video.fullDuration)
			}, _frame[1], "linear");

		//=================================
		//	Redraw the currently hidden frame
		//=================================
		// Here we actually change the background image of each frame. Since the frames have just swapped, we can change the background of the hidden frame in confidence that it
		// will be ready for the next change over.
		// If the current frame is frame2, we want to update frame 1 for the next cycle.
		if (internal.currentFrame == true)
			{
				// Simple DOM access to the background style of frame 1. Setting the URL to the next loop iteration image as that is what that frame will display.
				internal.dom.frame2.style.background="transparent url('" + _frame[0] + "') center center no-repeat";
			}
		// If the current frame is frame1, we want to update frame 2 for the next cycle.
		else
			{
				// Simple DOM access to the background style of frame 2. Setting the URL to the next loop iteration image as that is what that frame will display.
				internal.dom.frame1.style.background="transparent url('" + _frame[0] + "') center center no-repeat";
			}

		//=================================
		//	Update our loop iteration values
		//=================================
		// Increase the loop iteration counter by one. We have to check though that it is less than the length of the array of media data. If it is higher, we want to
		// loop back to the beginning. Note that length returns the array length with inded(1) while our loop iteration counter has index(0).
		if (internal.loopIteration < internal.dataLength)
			{
				internal.loopIteration++;
			}
		else
			{
				internal.loopIteration	= 0;
				internal.currentTime	= 0;
				internal.endOfVideo		= true;
			}

		// Increases the next loop iteration counter by one. We want this so we know what the next media is so we can update the frame which is currently hidden from view.
		// Note that length returns the array length with inded(1) while our next loop iteration counter has index(0). Plus its the next loop iteration.
		//internal.nextLoopIteration = internal.loopIteration < (internal.dataLength + 2) ? internal.loopIteration + 1 : 0;
	}

//=====================================================
//	animateNoSeek
//=====================================================
// This animation function works exactly the same as the withSeek variant above, except that all code to do with handling the seek bar has been removed. This is to optimise
// this animation so that it does not have to do any length checking, which could otherwise slow down the animation progress. Therefore it can run at shorter intervals/faster
// frame rates.
// The animation function which is called when we don't use the seek bar.
com.danbergmann.imagePlayer.animationNoSeek = function()
	{
		// Now we see if we have come to the end of the video.
		if (internal.endOfVideo == true)
			{
				internal.endOfVideo = false;
				// If we have and we want to loop, then
				if (external.singleLoop == true || external.playlistLength < 2)
					{
						var d = new Date();
						internal.startTime		= d.getTime();
					}
				else
					{
						nextVideo = typeof(external.data[(external.videoFocus+1)]) == "object" ? external.videoFocus + 1 : 0;
						external.swapVideo(nextVideo);
					}

				return;
			}

		var _frame = internal.video.frame[internal.loopIteration];
		//=================================
		//	Hide the old frame, and update our current frame value
		//=================================
		// Check which frame is the visible one. We need to do this so we can swap the frames over. If the current frame is frame2 then we handle hiding frame2.
		if (internal.currentFrame == true)
			{
				// Check if the next frame is to be faded too. If it is, then we fade to it.
				if (_frame[2] == true)
					{
						// Get jQuery to do the fading. Use the fade Speed
						internal.jqr.frame2.fadeOut( com.danbergmann.imagePlayer.fadeSpeed );
					}
				else
					{
						// If we get here, then we do not want to fade to our next image. So we skip jQuery and its overhead and just set frame 2s display to none, revealing
						// frame 1.
						internal.dom.frame2.style.display = "none";
					}
				// Set the current frame variable to false, signifying that it is currently frame 1 that is visible (frame 2 is not visible, false)
				internal.currentFrame = false;
			}
		// Obviously it is frame 1 that is visible, so lets handle frame 2 appearing instead.
		else
			{
				// Check if our next frame wants to be faded in. If it does, lets handle the animation for fading.
				if (_frame[2] == true)
					{
						// Let jQuery handle the fading animation. Use the default fade Speed.
						internal.jqr.frame2.fadeIn( com.danbergmann.imagePlayer.fadeSpeed );
					}
				else
					{
						// We don't want to fade, so just display frame 2 isntantly. Don't use jQuery as it is a waste of time and resources for this task.
						internal.dom.frame2.style.display = "block";
					}
				// Set the current frame to true, indicating that it is frame 2 that is visible.
				internal.currentFrame = true;
			}


		//=================================
		//	Reset the timeout to call this animate function again.
		//=================================
		// Resets the timeout function which will call the animation again. Note that we use the media duration for the next slide as our timeout duration, as we have changed
		// to the next slide but not updated our loop iteration counters yet! This is to maximise our performance.
		//window.clearTimeout(internal.interval);
		// We call this function again as it is the function which handles all the animations.
		internal.interval = setTimeout("com.danbergmann.imagePlayer.animationNoSeek()", _frame[1]);

		//=================================
		//	Redraw the currently hidden frame
		//=================================
		// Here we actually change the background image of each frame. Since the frames have just swapped, we can change the background of the hidden frame in confidence that it
		// will be ready for the next change over.
		// If the current frame is frame2, we want to update frame 1 for the next cycle.
		if (internal.currentFrame == true)
			{
				// Simple DOM access to the background style of frame 1. Setting the URL to the next loop iteration image as that is what that frame will display.
				internal.dom.frame2.style.background="transparent url('" + _frame[0] + "') center center no-repeat";
			}
		// If the current frame is frame1, we want to update frame 2 for the next cycle.
		else
			{
				// Simple DOM access to the background style of frame 2. Setting the URL to the next loop iteration image as that is what that frame will display.
				internal.dom.frame1.style.background="transparent url('" + _frame[0] + "') center center no-repeat";
			}


		//=================================
		//	Update our loop iteration values
		//=================================
		// Increase the loop iteration counter by one. We have to check though that it is less than the length of the array of media data. If it is higher, we want to
		// loop back to the beginning. Note that length returns the array length with index(1) while our loop iteration counter has index(0).
		if (internal.loopIteration < internal.dataLength)
			{
				internal.loopIteration++;
			}
		else
			{
				internal.loopIteration	= 0;
				internal.currentTime	= 0;
				internal.endOfVideo		= true;
			}

		// Increases the next loop iteration counter by one. We want this so we know what the next media is so we can update the frame which is currently hidden from view.
		// Note that length returns the array length with inded(1) while our next loop iteration counter has index(0).
		//internal.nextLoopIteration = internal.loopIteration < (internal.dataLength + 2) ? internal.loopIteration + 1 : 0;
	}

/***************************************************************************************************
 *		User accessable functions. Used for setting up the video objects
 **************************************************************************************************/
//=====================================================
//	addVideo
//=====================================================
// Adds a new video to the media playlist.
com.danbergmann.imagePlayer.addVideo = function(name, ifps, fullName, description)
	{
		if (typeof(name) == "undefined")
			{
				return false;
			}
		fullName = (typeof(fullName) != "undefined") ? fullName : name;
		fps = (typeof(ifps) != "undefined" && ifps <= internal.maxFps) ? ifps : internal.maxFps;
		description = (typeof(description) == "string") ? description : false;


		external.data[external.playlistLength]				= {};

		external.video[name] = external.data[external.playlistLength];

		external.data[external.playlistLength].id			= external.playlistLength;
		external.data[external.playlistLength].name			= name;
		external.data[external.playlistLength].fullName		= fullName;
		external.data[external.playlistLength].description	= description;
		external.data[external.playlistLength].fps			= fps;
		external.data[external.playlistLength].frame		= new Array();
		external.data[external.playlistLength].frameCount	= 0;
		external.data[external.playlistLength].fullDuration	= 0;
		external.data[external.playlistLength].bgColour		= "transparent";
		external.data[external.playlistLength].loaded		= false;

		external.playlistLength = external.data.length;

		external.setVideo(name);
		return true;

	}

// Sets the focus of the media player API functions to a specific video. Enter the name of the video in video and then all functions
// such as appendFrame will be working on that video. Note that .addVideo automatically focuses the API on the video it has just created,
// so there is no need to call setVideo directly after .addVideo.
com.danbergmann.imagePlayer.setVideo = function(video)
	{
		if (typeof(video) == "string")
			{
				if (typeof(external.data[external.videoFocus]) == "object")
					{
						if (internal.pageLoaded == true) document.getElementById('imageplayer-playlist-list-item'+external.videoFocus).removeAttribute("class");
					}
				external.videoFocus = external.video[video].id;
				internal.video = external.data[external.videoFocus];

				return true;
			}
		else if (typeof(video) == "number")
			{
				if (typeof(external.data[external.videoFocus]) == "object")
					{
						if (internal.pageLoaded == true) document.getElementById('imageplayer-playlist-list-item'+external.videoFocus).removeAttribute("class");
					}

				external.videoFocus = video;
				internal.video = external.data[external.videoFocus];

				return true;
			}
		else
			{
				return false;
			}
	}

// Appends a new frame to the currently selected video. Select a video using the .setVideo(video) function
com.danbergmann.imagePlayer.appendFrame = function(url, duration, fade)
	{
		if (typeof(url) == "undefined")
			{
				return false;
			}
		vid = external.videoFocus;

		duration	= (typeof(duration) != "undefined" && duration >= parseInt((1000 / internal.maxFps), 10)) ? duration : parseInt((1000 / external.data[vid].fps), 10);
		fade		= (typeof(fade) != "undefined") ? true : false;

		fid = external.data[vid].frame.length;

		external.data[vid].frameCount++;
		external.data[vid].frame[fid] = new Array(url,duration,fade,external.data[vid].fullDuration);
		external.data[vid].fullDuration += duration;
		return true;
	}

// Appends a new sequence of frames to the currently selected video. Select a video using the .setVideo(video) function.
com.danbergmann.imagePlayer.appendFrameSequence = function(pathPattern,start,stop,counterLength)
	{
		var i;
		var pathArr = new Array();

		counterLength = (typeof(counterLength) == "integer" || counterLength === false) ? counterLength : stop.toString().length;
		pathArr = pathPattern.split("<counter>",2);


		for (i = start; i <= stop; i++)
			{
				num = counterLength === false ? i : external.padZeros(i,counterLength);
				player.appendFrame(pathArr[0] + num + pathArr[1]);
			}
	}

// Function is used to pad a number with leading zeros. So the sequence 1, 2, 3... 11, 12, 13... 105, 106, 107 can be turned in to
// 001, 002, 003... 011, 012, 013... 105, 106, 107.
external.padZeros = function(n,digits)
	{
		n = (typeof(n) != "string") ? n.toString() : n;
		var difference = digits - n.length;
		var zerosToAdd = difference > 0 ? difference : 0;
		var num = "";

		for (i = difference; i > 0; i--)
			{
				num += "0";
			}
		num += n;

		return num;
	}

// Sets one of the video attributes.
com.danbergmann.imagePlayer.videoAttr = function(name,value)
	{
		if (typeof(name) != "string")
			{
				return false;
			}
		if (typeof(value) == "undefined")
			{
				return false;
			}
		else
			{
				switch (name)
					{
						case "bgColour":
							external.data[external.videoFocus].bgColour = (typeof(value) == "string") ? value : "transparent";
							return true;
							break;
						case "fps":
							external.data[external.videoFocus].fps = (typeof(value) != "undefined" && value <= internal.maxFps) ? value : internal.maxFps;
							return true;
							break;
						case "frameDuration":
							external.data[external.videoFocus].fps = (typeof(value) != "undefined" && (1000 / value) <= internal.maxFps) ? (1000 / value) : internal.maxFps;
							return true;
							break;
						case "description":
							external.data[external.videoFocus].description = (typeof(value) != "undefined") ? value : "";
							return true;
							break;
						case "title":
							external.data[external.videoFocus].fullName = (typeof(value) == "string") ? value : "Invalid Title for video["+external.videoFocus+"]!";
							return true;
							break;

						// The name parameter did not match any available attributes.
						default:
							return false;
							break;
					}
			}
	}

/***************************************************************************************************
 *		Loading functions
 **************************************************************************************************/
com.danbergmann.imagePlayer.loadVideo = function()
	{
		internal.video = external.data[external.videoFocus];

		internal.dom.loadWrapper.style.display	= "block";

		if (typeof(external.writeCaptionTarget) == "object")
			{
				external.writeCaptionTarget.innerHTML = internal.videovideo.description;
			}
		else if (typeof(external.writeCaptionTarget) == "string")
			{
				document.getElementById(external.writeCaptionTarget).innerHTML = internal.video.description;
			}

		if (external.useSeekBar == true)
			{
				internal.dom.seekWrapper.style.display = "block";
				internal.dom.btPlayPause.onmouseover = internal.event.btPlayPauseMouseOver;
				internal.dom.btPlayPause.onmouseout = internal.event.btPlayPauseMouseOut;
				internal.dom.btPlayPause.onclick = internal.event.playPauseClick;

				internal.dom.frameEvent.style.height = (external.style.playerHeight - 20);
				internal.dom.frameEventGraphics.style.height = (external.style.playerHeight - 20);
			}
		else
			{
				internal.dom.frameEvent.style.height = external.style.playerHeight;
				internal.dom.frameEventGraphics.style.height = external.style.playerHeight;
			}

		internal.dataLength = internal.video.frameCount - 1;

		internal.mediaCount = internal.video.frameCount;

		internal.tmpImages[external.videoFocus] = new Array();

		// Loop through the returned images.
		for (i = 0; i < internal.video.frame.length; i++)
			{
				// Creates a new temporary image object.
				internal.tmpImages[external.videoFocus][i] = new Image();

				// Sets the onload event to the function that handles when a new images has loaded.
				internal.tmpImages[external.videoFocus][i].onload = internal.event.imageLoad;

				// Sets the source for the temporary image object to that of the image we are looping over.
				internal.tmpImages[external.videoFocus][i].src = internal.video.frame[i][0];
			}

		// Defines the data length as the media count - 1. This just helps save on arithemetic during the fast executing loops which use the media count - 1 several times.
		internal.dataLength = internal.mediaCount - 1;

		// Update our loading progress dialogue to say how many images there are in total and how many have loaded so far.
		document.getElementById('imageplayer-loaded-images').innerHTML = internal.mediaLoaded + " of " + internal.mediaCount + " images loaded.";

		internal.loadingTimer = setTimeout("com.danbergmann.imagePlayer.loadingTimeOutWatchDog()", (external.loadingTimeOut * 1000));
	}

com.danbergmann.imagePlayer.unloadVideo = function()
	{
		window.clearTimeout(internal.interval);

		internal.dom.loadedPercent.innerHTML = "0&#37;"

		internal.dom.frameWrapper.style.display = "none";
		internal.dom.frameEvent.style.display = "none";
		internal.dom.frameEventGraphics.style.display = "none";
		internal.dom.seekWrapper.style.display = "none";
		internal.dom.loadWrapper.style.display = "none";
		internal.dom.frame2.style.display = "block";
		internal.dom.frame2.style.background="transparent center center no-repeat";
		internal.dom.frame1.style.background="transparent center center no-repeat";

		internal.dom.seekBar.style.width = 0;
		internal.dom.progressBar.style.width = 0;

		internal.fullyLoaded		= false;
		internal.loopIteration		= 0;
		//internal.nextLoopIteration	= internal.loopIteration + 1;
		internal.mediaCount			= 0;
		internal.mediaLoaded		= 0;
		internal.mediaLoadedRatio	= 0;
		internal.mediaLoadedPercent	= 0;
		internal.currentFrame		= true;
		internal.interval;
		internal.tmpImages			= new Array();
		internal.dataLength			= 0;

		internal.video				= {};
		internal.currentTime		= 0;
		internal.timeStopped		= 0;
		internal.isPlaying			= false;

		return true;
	}

com.danbergmann.imagePlayer.swapVideo = function(videoName)
	{
		if (external.unloadVideo() == true)
			{
				external.setVideo(videoName);
				external.loadVideo();
			}
	}

com.danbergmann.imagePlayer.loadingTimeOutWatchDog = function()
	{
		external.unloadVideo();

		internal.dom.messageWrapper.innerHTML = "<span>Error 101:</span> <span>The image sequence selected timed out while loading!</span>";
		internal.dom.messageWrapper.style.display = "block";

		internal.loadingTimer = setTimeout(function(){ internal.jqr.messageWrapper.slideUp(500); }, 3000);
	}
/***************************************************************************************************
 *		Event handler functions
 **************************************************************************************************/
/***************************************************************************************************
 *	imageLoad
 **************************************************************************************************/
 // onLoad event function handler for when an image has finished loading
internal.event.imageLoad = function()
	{
		// Increment our count of the number of loaded images.
		internal.mediaLoaded++;

		// Calculate the percentage of images.
		internal.mediaLoadedRatio = (internal.mediaLoaded / internal.mediaCount);	// This variable contains the ratio of images loaded. So between 0 and 1. Decimal
		internal.mediaLoadedPercent = Math.floor( internal.mediaLoadedRatio * 100 );		// This variable contains the percentage of images loaded. Between 0 and 100. Integer.

		// First clear the animation queue on the progress bar. We want to make sure that we are working with a non animated progress bar.
		internal.jqr.progressBar.clearQueue();

		internal.dom.progressBar.style.width = internal.mediaLoadedRatio * com.danbergmann.imagePlayer.style.playerWidth + "px";

		// Update our loading progress dialogue to say how many images there are in total and how many have loaded so far.
		document.getElementById('imageplayer-loaded-images').innerHTML = internal.mediaLoaded + " of " + internal.mediaCount + " images loaded.";

		// Updates the loading percentage for the
		internal.dom.loadedPercent.innerHTML = internal.mediaLoadedPercent + "&#37;";

		clearTimeout(internal.loadingTimer);

		if (internal.mediaLoaded === internal.mediaCount)
			{
				internal.event.imagesFullyLoaded();
			}
		else
			{
				internal.loadingTimer = setTimeout("com.danbergmann.imagePlayer.loadingTimeOutWatchDog()", (external.loadingTimeOut * 1000));
			}
	}

internal.event.imagesFullyLoaded = function()
	{
		external.data[external.videoFocus].loaded = true;
		internal.initialiseAnimation();
	}

/***************************************************************************************************
 *	playlistExpandCollapse
 **************************************************************************************************/
internal.event.playlistTabExpandCollapse = function()
	{
		pos = parseInt(internal.jqr.playlistContentWrapper.css('right'),10);

		internal.jqr.playlistContentWrapper.animate({ right: pos == 0 ? -internal.jqr.playlistContentWrapper.outerWidth() : 0 }, internal.playlistSlideTime);
		internal.jqr.playlistTab.animate({ right: pos == 0 ? 0 : internal.jqr.playlistContentWrapper.outerWidth() }, internal.playlistSlideTime);

		internal.dom.playlistTab.style.backgroundPosition = (pos == 0) ? "0px 0px" : "-14px 0px";
	}

/***************************************************************************************************
 *	frameEventMouseOver
 **************************************************************************************************/
internal.event.frameEventMouseOver = function()
	{
		if (internal.isPlaying == true)
			{
				internal.dom.frameEventGraphics.style.backgroundImage = "url('../imageplayer/graphics/controls/frame-overlay-pause.png')";
			}
		else
			{
				internal.dom.frameEventGraphics.style.backgroundImage = "url('../imageplayer/graphics/controls/frame-overlay-play.png')";
			}
		internal.jqr.frameEventGraphics.animate({ opacity: 0.5 },300);
	}

/***************************************************************************************************
 *	frameEventMouseOut
 **************************************************************************************************/
internal.event.frameEventMouseOut = function()
	{
		if (internal.isPlaying == true)
			{
				internal.dom.frameEventGraphics.style.backgroundImage = "url('../imageplayer/graphics/controls/frame-overlay-pause.png')";
			}
		else
			{
				internal.dom.frameEventGraphics.style.backgroundImage = "url('../imageplayer/graphics/controls/frame-overlay-play.png')";
			}
		internal.jqr.frameEventGraphics.animate({ opacity: 0.0 },0);
	}

/***************************************************************************************************
 *	btPlayPauseMouseOver
 **************************************************************************************************/
internal.event.btPlayPauseMouseOver = function()
	{
		if (internal.isPlaying == true)
			{
				this.style.backgroundPosition = "0px -57px";
			}
		else
			{
				this.style.backgroundPosition = "0px -19px";
			}
	}

/***************************************************************************************************
 *	btPlayPauseMouseOut
 **************************************************************************************************/
internal.event.btPlayPauseMouseOut = function()
	{
		if (internal.isPlaying == true)
			{
				this.style.backgroundPosition = "0px -38px";
			}
		else
			{
				this.style.backgroundPosition = "0px 0px";
			}
	}

/***************************************************************************************************
 *	PlayPauseClick
 **************************************************************************************************/
internal.event.playPauseClick = function()
	{
		if (internal.isPlaying == true)
			{
				internal.event.pause(this);
			}
		else
			{
				internal.event.play(this);
			}
	}

/***************************************************************************************************
 *	play event
 **************************************************************************************************/
// This function is called when we want to play our media. It requires one argument which is a reference
// to the object which fired the event.
internal.event.play = function(event)
	{
		internal.jqr.playlistContentWrapper.animate({ right: -internal.jqr.playlistContentWrapper.outerWidth() },400);
		internal.jqr.playlistTab.animate({ right: 0 },400);
		internal.dom.playlistTab.style.backgroundPosition = "0px 0px";

		// Sets a new timeout for the up coming frame, with a time of the frames entry time - stopped time.
		if (internal.loopIteration == 0 && internal.timeStopped > internal.video.frame[0][3])
			{
				if (external.useSeekBar == true)
					{
						internal.interval = setTimeout("com.danbergmann.imagePlayer.animationWithSeek()", (internal.video.fullDuration - internal.timeStopped));

						alert(internal.video.fullDuration);

						alert(internal.timeStopped);

						internal.jqr.seekBar.animate(
							{
								width: (parseInt(external.style.playerWidth, 10) - 29)
							}, (internal.video.fullDuration - internal.timeStopped), "linear");
					}
				else
					{
						internal.interval = setTimeout("com.danbergmann.imagePlayer.animationNoSeek()", (internal.video.fullDuration - internal.timeStopped));
					}
			}
		else
			{
				if (external.useSeekBar == true)
					{
						internal.interval = setTimeout("com.danbergmann.imagePlayer.animationWithSeek()", (internal.video.frame[internal.loopIteration][3] - internal.timeStopped));
						internal.jqr.seekBar.animate(
							{
								width: (((parseInt(external.style.playerWidth, 10) - 29) * internal.currentTime) / internal.video.fullDuration)
							}, (internal.video.frame[internal.loopIteration][3] - internal.timeStopped), "linear");
					}
				else
					{
						internal.interval = setTimeout("com.danbergmann.imagePlayer.animationNoSeek()", (internal.video.frame[internal.loopIteration][3] - internal.timeStopped));
					}
			}
		// Inverts the icon on the play/pause button
		// Checks to see if the element that the event was registered on is the play/pause button. If it is, we want to keep it highlighted.
		if (event == internal.dom.btPlayPause)
			{
				internal.dom.btPlayPause.style.backgroundPosition = "0px -57px";
			}
		// Otherwise keep it non-highlighted.
		else
			{
				internal.dom.btPlayPause.style.backgroundPosition = "0px -38px";
			}

		internal.dom.frameEventGraphics.style.backgroundImage = "url('../imageplayer/graphics/controls/frame-overlay-pause.png')";

		// Sets the isPlaying variable to true, as we are now playing the media.
		internal.isPlaying = true;
	}

/***************************************************************************************************
 *	pause event
 **************************************************************************************************/
// This function is called when we want to pause our media. It requires one argument which is a reference
// to the object which fired the event.
internal.event.pause = function(event)
	{
		var d = new Date();
		internal.timeStopped = d.getTime() - internal.startTime;
		// Sets the isPlaying variable to false. As the media is no longer playing.
		internal.isPlaying = false;
		// Stop the timeout to update the next frame. This is what actually stops the video or sequence of images from playing
		window.clearTimeout(internal.interval);

		// Freezes the seek bar to where it is.
		internal.jqr.seekBar.stop(true);

		// Inverts the icon on the play/pause button
		// Checks to see if the element that the event was registered on is the play/pause button. If it is, we want to keep it highlighted.
		if (event == internal.dom.btPlayPause)
			{
				internal.dom.btPlayPause.style.backgroundPosition = "0px -19px";
			}
		// Otherwise keep it non-highlighted.
		else
			{
				internal.dom.btPlayPause.style.backgroundPosition = "0px 0px";
			}

		internal.dom.frameEventGraphics.style.backgroundImage = "url('../imageplayer/graphics/controls/frame-overlay-play.png')";
	}

/***************************************************************************************************
 *	$(document).ready
 **************************************************************************************************/
// When our document has loaded, we are ready to begin.
$(document).ready(function(){

		internal.pageLoaded = true;
		external.loadingTimeOut = external.loadingTimeOut > internal.maxLoadingTimeOut ? internal.maxLoadingTimeOut : external.loadingTimeOut;

		//=====================================================
		//	Write The Image Player Structure.
		//=====================================================
		document.getElementById('imageplayer-wrapper').innerHTML = '<div id="imageplayer-logo"></div><div id="imageplayer-message"></div><div id="imageplayer-display"><div id="imageplayer-frame1"></div><div id="imageplayer-frame2"></div></div><div id="imageplayer-frame-event-graphics"></div><div id="imageplayer-frame-event-catch-layer"></div><div id="imageplayer-seek-bar-wrapper"><img id="imageplayer-bt-play-pause" src="imageplayer/graphics/spacer.png" alt="" /><div id="imageplayer-seek-bar"><div id="imageplayer-seek-bar-head"></div></div></div><div id="imageplayer-loading-wrapper"><div id="imageplayer-loading-message">Loading...</div><div id="imageplayer-loaded-images">0 of 0 images loaded</div><div id="imageplayer-progress-bar-wrapper"><div id="imageplayer-progress-bar"></div></div><div id="imageplayer-loaded-percent">0%</div><div id="imageplayer-watermark"></div></div><div id="imageplayer-playlist-wrapper"><div id="imageplayer-playlist-tab"></div><div id="imageplayer-playlist-content-wrapper"><div id="imageplayer-playlist-content"><div class="title">Play A Sequence</div></div></div></div>';

		//=============================================================================================
		// Start loading our object handles that we need.
		//=====================================================
		//	Main Wrapper
		//=====================================================
		// DOM Objects
		internal.dom.mainWrapper	= document.getElementById("imageplayer-wrapper");	// The main mediaPlayer wrapper. This element holds all HTML for mediaPlayer
		// jQuery Objects
		internal.jqr.root			= jQuery('#imageplayer-wrapper');					// jQuery object, the root of the mediaPlayer. Used to save searching times.

		//=====================================================
		//	Message Wrapper
		//=====================================================
		// DOM Objects
		internal.dom.messageWrapper	= document.getElementById('imageplayer-message');
		// jQuery Objects
		internal.jqr.messageWrapper = internal.jqr.root.find('#imageplayer-message');

		//=====================================================
		//	Frames, Frame Wrapper and Frame Event Catchers
		//=====================================================
		// DOM Objects
		internal.dom.frameWrapper	= document.getElementById("imageplayer-display");			// Frame wrapper. This elements holds both frames
		internal.dom.frame1			= document.getElementById('imageplayer-frame1');			// DOM element frame one. Gets used a lot during the fast exec loops
		internal.dom.frame2			= document.getElementById('imageplayer-frame2');			// DOM element frame two. Probably the most accessed DOM element in fast exec loops
		internal.dom.frameEvent		= document.getElementById('imageplayer-frame-event-catch-layer');	// DOM element to catch events sent to the frames.
		internal.dom.frameEventGraphics = document.getElementById('imageplayer-frame-event-graphics');
		// jQuery Object
		internal.jqr.frame1		= internal.jqr.root.find('#imageplayer-frame1');				// jQuery object, frame one. Not used at the moment but may be.
		internal.jqr.frame2		= internal.jqr.root.find('#imageplayer-frame2');				// jQuery object, frame two. Used for fading transitions mainly.
		internal.jqr.frameEventGraphics = internal.jqr.root.find('#imageplayer-frame-event-graphics');

		//=====================================================
		//	Seek Bar and Controls with associated Wrappers
		//=====================================================
		// DOM Objects
		internal.dom.seekWrapper	= document.getElementById("imageplayer-seek-bar-wrapper");// This element holds the seek bar and the controls.
		internal.dom.seekBar		= document.getElementById('imageplayer-seek-bar');		// DOM element seek bar. Used to update the seek bars position.
		internal.dom.btPlayPause	= document.getElementById('imageplayer-bt-play-pause');	// DOM element for play/pause button.
		// jQuery Objects
		internal.jqr.seekBar		= internal.jqr.root.find('#imageplayer-seek-bar');			// jQuery object, seek bar. Used for smooth sliding of the seek bar.

		//=====================================================
		//	Playlist Objects
		//=====================================================
		// DOM Objects
		internal.dom.playlistTab			= document.getElementById('imageplayer-playlist-tab');
		internal.dom.playlistContentWrapper	= document.getElementById('imageplayer-playlist-content-wrapper');
		internal.dom.playlistContent		= document.getElementById('imageplayer-playlist-content');
		// jQuery Objects
		internal.jqr.playlistTab			= internal.jqr.root.find('#imageplayer-playlist-tab');
		internal.jqr.playlistContentWrapper	= internal.jqr.root.find('#imageplayer-playlist-content-wrapper');

		//=====================================================
		//	Video Loading Page
		//=====================================================
		// DOM Objects
		internal.dom.loadWrapper	= document.getElementById("imageplayer-loading-wrapper");	// Loading wrapper.
		internal.dom.progressBar	= document.getElementById("imageplayer-progress-bar");	// This element holds the progress bar on the loading screen.
		internal.dom.loadedPercent	= document.getElementById('imageplayer-loaded-percent');
		// jQuery Objects
		internal.jqr.progressBar	= internal.jqr.root.find('#imageplayer-progress-bar');		// jQuery object, the progress bar. See above.

		//=====================================================
		//	mediaPlayer Loading Page - Pre-JavaScript
		//=====================================================
		// DOM Objects
		internal.dom.logo		= document.getElementById("imageplayer-logo");
		//=============================================================================================

		//================================================
		// Call the playerFormat function, which formats
		// the player according to our formatting variables.
		//================================================
		// Format the media player according to how they want it formatted.
		internal.playerInitialFormat();
		internal.buildPlaylistBar();

		// Adds a preload image for the frame overlay graphic. This one is of the play button. Note that we will have to load, but
		internal.tmpSystemImages[0] = new Image();
		internal.tmpSystemImages[0].src = "../imageplayer/graphics/control/frame-overlay-play.png";
		internal.tmpSystemImages[1] = new Image();
		internal.tmpSystemImages[1].src = "../imageplayer/graphics/control/frame-overlay-pause.png";
		internal.tmpSystemImages[2] = new Image();
		internal.tmpSystemImages[2].src = "../imageplayer/graphics/loading/progress-bar-bg.png";


		if (document.addEventListener)
			{
				document.addEventListener("keydown", function(event)
					{
						e = event ? event : window.event;
						kcode = e.keyCode ? e.keyCode : e.charCode;
						if (kcode == 32)
							{
								internal.dom.frameEventGraphics.style.opacity = "0.5";
								internal.jqr.frameEventGraphics.animate({ opacity: 0.0 },500);
								internal.event.playPauseClick();
							}
					}, false);
			}
		else if (document.attachEvent)
			{
				document.attachEvent("onkeydown", function(event)
					{
						e = event ? event : window.event;
						kcode = e.keyCode ? e.keyCode : e.charCode;
						if (kcode == 32)
							{
								internal.dom.frameEventGraphics.style.opacity = "0.5";
								internal.jqr.frameEventGraphics.animate({ opacity: 0.0 },500);
								internal.event.playPauseClick();
							}
					});
			}
		else
			{
				document.onkeydown = function(event)
					{
						e = event ? event : window.event;
						kcode = e.keyCode ? e.keyCode : e.charCode;
						if (kcode == 32)
							{
								internal.dom.frameEventGraphics.style.opacity = "0.5";
								internal.jqr.frameEventGraphics.animate({ opacity: 0.0 },500);
								internal.dom.frameEventGraphics.style.opacity = "0.0";
								internal.event.playPauseClick();
							}
					};
			}


		if (external.immediateLoad == true)
			{
				external.loadVideo();
			}
		else
			{
				internal.event.playlistTabExpandCollapse();
			}
	});
})();
