var timeout = null;
var displayState = 0;
var accel_watch_id;
var current_view = null;
var current_menu = null;
var myAudio = null;

if (typeof $ == 'undefined') {
	$ = function (el) {
		if (typeof el == 'string')
			return document.getElementById(el);
		else
			return el;
	}
}

var changeView = function (e) {
	try {
		// Hide previous view if its visible
		if (current_view) {
			emile(current_view, 'height:0px', {duration: 800});
		}
		var menuId = e.currentTarget.id;
		
		// If we've rehit the visible view, we're just hiding so return
		if (menuId == current_menu) {
			current_view = current_menu = null;
			return;
		}
		var menu = $(menuId);
		
		// The next element after the menu item is the view
		var nextSib = menu.nextSibling;
		while (nextSib.nodeType != 1) {
			nextSib = nextSib.nextSibling;
		}
		var viewId = nextSib.id;
		
		$("spacer").style.display = "block";
		window.location = "#" + menuId;
		$(viewId).style.display = "block";
		emile(viewId, 'height:400px', {duration: 800});
		setTimeout('$("spacer").style.display = "none";', 800);
		current_menu = menuId;
		current_view = viewId;
	} catch (ex) { debug.log(ex.name + ": " + ex.message) }
}

function back() {
	if (current_view) {
		emile(current_view, 'height:0px', {duration: 800});
	}
	current_view = null;
}

function getLocation() {
	var options = new Object();
	options.frequency = 5000;
	timeout = setInterval("animate()", 500);
	navigator.geolocation.watchPosition(updateLocation, function(){
	}, options);
}

function updateLocation(position) {
	clearTimeout(timeout);
	//pt.latitude, pt.longitude, pt.altitude, pt.accuracy, pt.heading, pt.speed
	var pt = position.coords;
	document.getElementById('latitude').innerHTML = pt.latitude;
	document.getElementById('longitude').innerHTML = pt.longitude;
	document.getElementById('altitude').innerHTML = pt.altitude;
	document.getElementById('heading').innerHTML = pt.heading;
	document.getElementById('speed').innerHTML = pt.speed;
	var dt = new Date();
	dt.setTime(position.timestamp);
	document.getElementById('timestamp').innerHTML = dt.toLocaleTimeString();
}

function watchAccel() {
	var options = new Object();
	options.frequency = 1000;
	accel_watch_id = navigator.accelerometer.watchAcceleration(updateAcceleration, function(ex){
		navigator.accelerometer.clearWatch(accel_watch_id);
		alert("accel fail (" + ex.name + ": " + ex.message + ")");
	}, options);
}

function updateAcceleration(accel) {
	document.getElementById('accel_x').innerHTML = ("" + accel.x).substring(0,8);
	document.getElementById('accel_y').innerHTML = ("" + accel.y).substring(0,8);
	document.getElementById('accel_z').innerHTML = ("" + accel.z).substring(0,8);
}

function watchOrientation() {
	var options = new Object();
	options.frequency = 1000;
	navigator.orientation.watchOrientation(updateOrientation, function (ex) { debug.log(ex.name + ": " + ex.message) }, options);
}

function updateOrientation(orientation) {
	var output = "";
	switch (orientation) {
		case DisplayOrientation.PORTRAIT: output = "portrait"; break;
		case DisplayOrientation.REVERSE_PORTRAIT: output = "reverse portrait"; break;
		case DisplayOrientation.LANDSCAPE_LEFT_UP: output = "landscape left up"; break;
		case DisplayOrientation.LANDSCAPE_RIGHT_UP: output = "landscape right up"; break;
		case DisplayOrientation.FACE_UP: output = "face up"; break;
		case DisplayOrientation.FACE_DOWN: output = "face down"; break;
	}
	document.getElementById("orientation").innerHTML = output;
}

function getContacts() {
	var filter = document.getElementById("contact-filter").value;
	navigator.contacts.find({ name: filter }, displayContacts, function(error){
		document.getElementById('contacts_list').innerHTML = "<p>" + error.message + "</p>";
	}, { limit:200, page:1 });
}

function displayContacts(contacts) {
	var output = "";
	for (var i=0; i<contacts.length; i++) {
		var phone = getNonEmptyNumber(contacts[i]);
		output += 	"<div class='list-item'>" + contacts[i].name.formatted +
					"<span class='list-item-small'> Phone(" + phone.type + "): " + phone.number +
					"</div>";
	}
	document.getElementById('contacts_list').innerHTML = output;
}

function getNonEmptyNumber(contact) {
	for (var i=0; i<contact.phones.length; i++) {
		if (contact.phones[i].number != undefined && contact.phones[i].number != "")
			return contact.phones[i];
	}
	return contact.phones[0];
}

function notify(type) {
	switch (type) {
		case 'vib1':navigator.notification.vibrate(2000,100); break;
		case 'vib2':navigator.notification.vibrate(5000,10); break;
		case 'alert':navigator.notification.alert("This is a custom message.", "Custom title", "Custom OK");break;
		case 'beep':navigator.notification.beep();break;
	}
}

function animate() {
	switch (displayState) {
		case 0:
			displayStatus('finding satellites.');
			displayState = 1;
			break;
		case 1:
			displayStatus('finding satellites..');
			displayState = 2;
			break;
		case 2:
			displayStatus('finding satellites...');
			displayState = 3;
			break;
		case 3:
			displayStatus('finding satellites');
			displayState = 0;
			break;
	}
}

function displayStatus(status) {
	document.getElementById('latitude').innerHTML = status;
	document.getElementById('longitude').innerHTML = status;
	document.getElementById('altitude').innerHTML = status;
	document.getElementById('heading').innerHTML = status;
	document.getElementById('speed').innerHTML = status;
}

function sendSMS() {
	try{
	var number = document.getElementById('sms_number').value;
	var msg = document.getElementById('sms_message').value;
	navigator.sms.send(number, msg, smsSuccess, smsFailure);
} catch (ex) { debug.log(ex.name + ": " + ex.message); }
}

function smsSuccess() {
	document.getElementById("sms_status").innerHTML = "success";
}

function smsFailure() {
	document.getElementById("sms_status").innerHTML = "failed";
}

function call() {
	var number = document.getElementById("phone_number").value;
	if (isNaN(number))
		navigator.notification.alert("", "Invalid Number", "OK");
	else
		navigator.telephony.send(number);
}

function takePicture() {
	navigator.camera.getPicture(cameraSuccess, cameraFailure, null);
}

function cameraSuccess(imageUrls) {
	//this is an array of all the photos taken while the camera app was open
	debug.log(imageUrls[0]);
	document.getElementById("preview").innerHTML = "<img src='" + imageUrls[0]  + "' class='preview'/>";
}

function cameraFailure() {
	document.getElementById("preview").innerHTML = "camera error";
}

function soundCommand(cmd) {
	try {
	if (myAudio == null)
		myAudio = new Audio("assets/beep.mp3");
	if (cmd == "play") {
		myAudio.play();
	} else if (cmd == "pause") {
		myAudio.pause();
	} else if (cmd == "stop") {
		myAudio.stop();
	}
} catch (ex) { debug.log(ex.name + ": " + ex.message) }
}

function checkStorage() {
	var store = navigator.storage.getItem("store_test");
	if (store != null) {
		document.getElementById("storage_output").innerHTML = "Found in data store: " + store;
	} else {
		document.getElementById("storage_output").innerHTML = "Nothing in data store.";
	}
}

function testStorage(mode) {
	try {
		if (mode == 'store') {
			var val = document.getElementById("storage_string").value;
			navigator.storage.setItem("store_test", val);
			document.getElementById("storage_output").innerHTML = "You stored: " + val;
		}
		else {
			navigator.storage.removeItem("store_test");
			document.getElementById("storage_output").innerHTML = "Storage cleared.";
		}
	} catch (ex) {
		alert(ex.name + ": " + ex.message);
	}
}

function showMap() {
	navigator.geolocation.getCurrentPosition( function(position) {
		navigator.map.show(position);
	}, function () { debug.log("mapping error"); })
}
