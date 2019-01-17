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

callAPI();

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
        if (driverId === object.gpsMessage[i].vehicleId){
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
        // database.ref().set({
        //     drivers: array
        // });

    }

    $('#search-button').on('click', function (event) {

        event.preventDefault();

        var searchInput = $('#driver-search').val();
        console.log(searchInput);

        var counter = 0;

        for (var i = 0; i < array.length; i++) {

            if (searchInput == array[i].driverId) {
                $('#drivers').empty()

                driverId = array[i].driverId;
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

    for (var i = 0; i < array.length; i++) {

        var driverId = array[i].driverId;
        //Uses driverId to pull the correct driverName from the list
        var driverName = driverList[driverId];

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

        var driverId = array[str].driverId;
        var lat = array[str].latitude;
        var lng = array[str].longitude;

        database.ref().set({
            name: driverId,
            latitude: lat,
            longitude: lng
        });

    })

};

// Google Maps API
function initMap() {

    database.ref().on('value', function (snapshot) {
        var driverChosen = snapshot.val();
        var driverName = driverList[driverChosen.name];

        //var driverName = driverChosen.name;
        var lat = driverChosen.latitude;
        var lng = driverChosen.longitude;

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
var driverList = {
    717682: "Al Burch, VA",
    868716: "Al Fain, NC",
    837619: "Johnny Hyde, GA",
    863025: "Bobby Sheheane, GA",
    837937: "Bryan Ashton, FL",
    900765: "Curtis Doyle, TN",
    876391: "Ellen Copper, CO",
    777730: "Greg Hinton, TX",
    699220: "Henry Roussell, FL",
    840382: "Jim MacDonald, CA",
    900836: "Jeff Lee, TX",
    884808: "Jerry Brooks, MS",
    541592: "Jerry Patterson, NC",
    837928: "Jim Fulford, AL",
    704381: "Jim Jennings, FL",
    535095: "Johnny Houser, GA",
    886933: "Josh Curtis, FL",
    558973: "Kira Stover, AZ",
    615135: "Marc Macias, CA",
    906046: "Mark Glenn, UT",
    639461: "Mark Young, LA",
    784181: "David Truesdell, TX",
    627403: "Mike Flynn, MI",
    362699: "Robert Ramirez, CA",
    894730: "Scott Brilliant, FL",
    930373: "Steve Durban, IN",
    680780: "Steve Schein, WI",
    928176: "Terry Reine, KS",
    927551: "Tim Chapman, SC",
    721340: "Tim Johnson, GA",
    711929: "Todd Hohenwater, IL",
    720829: "Tony Smith, GA",
    853393: "Uninstalled, N/A",
    849829: "Wayne Watkins, AL",
    837892: "Wilbur Darby, SC"
}