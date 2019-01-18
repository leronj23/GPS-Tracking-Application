var object;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyDHsDtXHobDvK-Ja0rwoaU23rF1HEK44CE",
    authDomain: "gps-tracking-app-43247.firebaseapp.com",
    databaseURL: "https://gps-tracking-app-43247.firebaseio.com",
    projectId: "gps-tracking-app-43247",
    storageBucket: "gps-tracking-app-43247.appspot.com",
    messagingSenderId: "534735139379"
};
firebase.initializeApp(config);

var database = firebase.database();

var message = firebase.functions().httpsCallable('getVehicleData');

//callAPI();

function callAPI() {
    // When you dont want to send arguments to CF. Use '()'
    message().then(function (result) {

        object = JSON.parse(result.data);
        runCode();

    }).catch(function (error) {

        console.log('error', error)
    });
}

//Refresh handler
$('#refresh').on('click', function () {
    //Requires API, refreshes every 1-2 minutes, a refresh called before then "doesn't update" because the required data is the same as previous data
    callAPI();

    var driverId;
    var newLat;
    var newLng;

    //Grabs snapshot of name data
    database.ref().on('value', function (snapshot) {
        driverId = snapshot.val().name;
        console.log(driverId);

    })

    //Looks for a match in data, sets newLat and newLng, this should always find a match
    for (var i = 0; i < object.gpsMessage.length; i++) {
        if (driverId === object.gpsMessage[i].vehicleId) {
            console.log("match found");
            newLat = object.gpsMessage[i].latitude;
            newLng = object.gpsMessage[i].longitude;

            database.ref().set({
                name: driverId,
                latitude: newLat,
                longitude: newLng
            });
        }
    }
})

function runCode() {

    var array = [];

    driverArray();

    function driverArray() {

        for (var i = 0; i < object.gpsMessage.length; i++) {
            var driverInfo = {
                'driverId': object.gpsMessage[i].vehicleId,
                'keyOn': object.gpsMessage[i].keyOn,
                'lastSpeed': object.gpsMessage[i].lastSpeed,
                'latitude': object.gpsMessage[i].latitude,
                'longitude': object.gpsMessage[i].longitude
            }

            array.push(driverInfo);
        }
    }

    var sortArr = [];
    alphabeticalOrder(driverList);

    function alphabeticalOrder(driverList) {

        sortArr = driverList.sort();

    }

    $('#search-button').on('click', function (event) {

        event.preventDefault();

        var searchInput = $('#driver-search').val();
        var lowerCaseInput = searchInput.toLowerCase();

        var counter = 0;

        for (var i = 0; i < array.length; i++) {

            var str = sortArr[i];
            var lowerCase = str.toLowerCase();

            if (lowerCase.includes(lowerCaseInput)) {

                if (counter === 0) {
                    $('#drivers').empty()
                }

                driverId = sortArr[i];
                var movement = $('<p>');
                var movementIndicator = $('<span>');
                if (object.gpsMessage[i].keyOn === false) {
                    movement.text('Stopped').attr('class', 'movement');
                    movementIndicator.attr('class', 'redDot')
                } else if (object.gpsMessage[i].keyOn === true && object.gpsMessage[i].lastSpeed === 0) {
                    movement.text('Idle').attr('class', 'movement');
                    movementIndicator.attr('class', 'blueDot')
                } else {
                    movement.text('Active').attr('class', 'movement');
                    movementIndicator.attr('class', 'greenDot')
                }

                var driverLink = $('<a>').attr('href', 'driver-snapshot.html');
                var driverDiv = $('<div>').attr('class', 'driver').attr('id', `driver-${i}`);
                var driver = $('<p>').text(driverId).attr('class', 'driverID');

                driverDiv.append(driver);
                driverDiv.append(movementIndicator);
                driverDiv.append(movement);
                driverLink.append(driverDiv);


                $('#drivers').append(driverLink);
                counter++;
            }

            if (i === 34 && counter === 0) {
                $('#drivers').empty();

                var errorMessage = $('<span>').attr('id', 'errorMessage');
                errorMessage.text('Driver does not exist :(');

                $('#drivers').append(errorMessage);
            }

        }
    })

    $('#clear-search').on('click', function () {
        $('#drivers').empty();
        $('#driver-search').val('');
        runCode();
    })

    for (var i = 0; i < array.length; i++) {

        var driverId = array[i].driverId;
        //Uses driverId to pull the correct driverName from the list
        var driverName = driverList[i];

        var movement = $('<p>');
        var movementIndicator = $('<span>');

        if (object.gpsMessage[i].keyOn === false) {
            movement.text('Stopped').attr('class', 'movement');
            movementIndicator.attr('class', 'redDot')
        } else if (object.gpsMessage[i].keyOn === true && object.gpsMessage[i].lastSpeed === 0) {
            movement.text('Idle').attr('class', 'movement');
            movementIndicator.attr('class', 'blueDot')
        } else {
            movement.text('Active').attr('class', 'movement');
            movementIndicator.attr('class', 'greenDot')
        }

        var driverLink = $('<a>').attr('href', 'driver-snapshot.html');
        var driverDiv = $('<div>').attr('class', 'driver').attr('id', `driver-${i}`);
        //Now passes Driver Name instead of Driver ID
        var driver = $('<p>').text(driverName).attr('class', 'driverID');

        driverDiv.append(driver);
        driverDiv.append(movementIndicator);
        driverDiv.append(movement);
        driverLink.append(driverDiv);


        $('#drivers').append(driverLink);

    }

    console.log(array);

    $('#drivers').on('click', '.driver', function () {
        var driver = $(this).attr('id');

        extractNumber(driver);

        function extractNumber(value) {
            var split;

            if (value.includes("-") > 0) {
                split = value.split("-")
            }
            console.log(split);

            str = split[1];

            return str;
        };

        var driverName = sortArr[str];
        var driverId = array[str].driverId;
        var lat = array[str].latitude;
        var lng = array[str].longitude;

        console.log(driverName);

        database.ref().set({
            name: driverName,
            Id: driverId,
            latitude: lat,
            longitude: lng
        });

    })

};

// Google Maps API
function initMap() {

    database.ref().on('value', function (snapshot) {
        var driverChosen = snapshot.val();
        var driverName = driverChosen.name;

        //var driverName = driverChosen.name;
        var lat = driverChosen.latitude;
        var lng = driverChosen.longitude;

        console.log(lat, lng);

        $('#driverName').text(driverName);

        var myLatLng = { lat: lat, lng: lng };

        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: myLatLng
        });

        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: 'Hello World!'
        });

        $('body').attr('style', 'visibility: show;')

    })
}

//Driver List, must be manually updated
// var driverList = {
//     717682: "Al Burch, VA",
//     868716: "Al Fain, NC",
//     837619: "Johnny Hyde, GA",
//     863025: "Bobby Sheheane, GA",
//     837937: "Bryan Ashton, FL",
//     900765: "Curtis Doyle, TN",
//     876391: "Ellen Copper, CO",
//     777730: "Greg Hinton, TX",
//     699220: "Henry Roussell, FL",
//     840382: "Jim MacDonald, CA",
//     900836: "Jeff Lee, TX",
//     884808: "Jerry Brooks, MS",
//     541592: "Jerry Patterson, NC",
//     837928: "Jim Fulford, AL",
//     704381: "Jim Jennings, FL",
//     535095: "Johnny Houser, GA",
//     886933: "Josh Curtis, FL",
//     558973: "Kira Stover, AZ",
//     615135: "Marc Macias, CA",
//     906046: "Mark Glenn, UT",
//     639461: "Mark Young, LA",
//     784181: "David Truesdell, TX",
//     627403: "Mike Flynn, MI",
//     362699: "Robert Ramirez, CA",
//     894730: "Scott Brilliant, FL",
//     930373: "Steve Durban, IN",
//     680780: "Steve Schein, WI",
//     928176: "Terry Reine, KS",
//     927551: "Tim Chapman, SC",
//     721340: "Tim Johnson, GA",
//     711929: "Todd Hohenwater, IL",
//     720829: "Tony Smith, GA",
//     853393: "Uninstalled, N/A",
//     849829: "Wayne Watkins, AL",
//     837892: "Wilbur Darby, SC"
// }

var driverList = [
    "Al Burch, VA",
    "Al Fain, NC",
    "Johnny Hyde, GA",
    "Bobby Sheheane, GA",
    "Bryan Ashton, FL",
    "Curtis Doyle, TN",
    "Ellen Copper, CO",
    "Greg Hinton, TX",
    "Henry Roussell, FL",
    "Jim MacDonald, CA",
    "Jeff Lee, TX",
    "Jerry Brooks, MS",
    "Jerry Patterson, NC",
    "Jim Fulford, AL",
    "Jim Jennings, FL",
    "Johnny Houser, GA",
    "Josh Curtis, FL",
    "Kira Stover, AZ",
    "Marc Macias, CA",
    "Mark Glenn, UT",
    "Mark Young, LA",
    "David Truesdell, TX",
    "Mike Flynn, MI",
    "Robert Ramirez, CA",
    "Scott Brilliant, FL",
    "Steve Durban, IN",
    "Steve Schein, WI",
    "Terry Reine, KS",
    "Tim Chapman, SC",
    "Tim Johnson, GA",
    "Todd Hohenwater, IL",
    "Tony Smith, GA",
    "Uninstalled, N/A",
    "Wayne Watkins, AL",
    "Wilbur Darby, SC"
];


// Login 
$('#login-button').on('click', function () {

    event.preventDefault();

    const email = $('#username').val();
    const password = $('#password').val();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (result) {

            // console.log(result)

            window.location.href = "home-screen.html";
        })
        .catch(function (error) {

            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;

            alert("Please enter a user name and password!")
        })
});


// Register 
$('#register-button').on('click', function () {

    event.preventDefault();

    const email = $('#username').val();
    const password = $('#password').val();

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (result) {

            // console.log(result)

            window.location.href = "home-screen.html";
        })
        .catch(function (error) {

            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;

            alert("Please enter a user name and password!")
        })
});


// Check if logged in
function checkifLoggedIn() {

    // Check when user hit the page
    firebase.auth().onAuthStateChanged(function (user) {

        if (user) {

            callAPI();

            // User is signed in.
            //   var displayName = user.displayName;
            //   var email = user.email;
            //   var emailVerified = user.emailVerified;
            //   var photoURL = user.photoURL;
            //   var isAnonymous = user.isAnonymous;
            //   var uid = user.uid;
            //   var providerData = user.providerData;

            // ...
        } else {

            // User is signed out.
            // ...
        }
    });
}


// Sign Out
function signOut(){

    firebase.auth().signOut().then(function() {

        console.log('Signed Out');
      }, function(error) {
    
        console.error('Sign Out Error', error);
      });
}