/** Created by Erlend Dahl, SMiO*/


$scope.calculateTrip = function(trip, smoothingMode){

    if(!smoothingMode) smoothingMode = 0;

    if (trip && trip.tripData) {
        trip.coords = [];
        trip.originalCoords = [];
        trip.smoothedCoords = [];
        trip.bounds = new google.maps.LatLngBounds();
        trip.modes = [];
        trip.purposes = [];
        trip.gpsAccuracies = [];
        trip.connections = [];

        var currentMode = {first: true};
        var currentPurpose = {first: true};
        var currentGpsAccuracy = {first: true};
        var currentConnection = {first: true};

        trip.purposeNice = $rootScope.Language[trip.purpose];
        trip.smoothingMode = smoothingMode;
        trip.smoothingModeName = ["Original coordinates", "Smoothed coordinates"][smoothingMode];

        var prev = null;
        for (var i = 0; i < trip.tripData.length; i++) {
            var c = new google.maps.LatLng(trip.tripData[i].lat, trip.tripData[i].lon);

            var curr = {pos: c, time: trip.tripData[i].time};
            if(!$scope.smoothCoordinates(smoothingMode, prev, curr, i === trip.tripData.length - 1)) {
                console.log("Skipping point!");
                continue;
            }

            prev = curr;

            trip.coords.push(c);
            trip.bounds.extend(c);

            currentMode.end = trip.tripData[i].time;
            if(currentMode.type != trip.tripData[i].mode){
                if(!currentMode.first) trip.modes.push(currentMode);
                currentMode = {
                    type: trip.tripData[i].mode,
                    start: trip.tripData[i].time
                };
            }

            currentPurpose.end = trip.tripData[i].time;
            if(currentPurpose.type != trip.tripData[i].purpose){
                if(!currentPurpose.first) trip.purposes.push(currentPurpose);
                currentPurpose = {
                    type: trip.tripData[i].purpose,
                    start: trip.tripData[i].time
                };
            }

            currentGpsAccuracy.end = trip.tripData[i].time;
            if(currentGpsAccuracy.type != trip.tripData[i].accuracy){
                if(!currentGpsAccuracy.first) trip.gpsAccuracies.push(currentGpsAccuracy);
                currentGpsAccuracy = {
                    type: trip.tripData[i].accuracy,
                    start: trip.tripData[i].time
                };
            }

            currentConnection.end = trip.tripData[i].time;
            if(currentConnection.type != trip.tripData[i].connection){
                if(!currentConnection.first) trip.connections.push(currentConnection);
                currentConnection = {
                    type: trip.tripData[i].connection,
                    start: trip.tripData[i].time
                };
            }
        }

        if(currentMode != null) trip.modes.push(currentMode);
        if(currentPurpose != null) trip.purposes.push(currentPurpose);
        if(currentGpsAccuracy != null) trip.gpsAccuracies.push(currentGpsAccuracy);
        if(currentConnection != null) trip.connections.push(currentConnection);

        controller.calculateLine(trip.modes, {
            mode_walking: '#00ff00',
            mode_cycling: '#33ff00',
            mode_bus: '#66ff00',
            mode_car: '#99ff00',
            mode_train: '#ccff00',
            mode_tram: '#ffff00',
            mode_subway: '#ffcc00',
            mode_skateboard: '#ff9900',
            mode_segway: '#ff6600',
            mode_boat: '#ff3300',
            mode_other: '##ff0000'
        });

        controller.calculateLine(trip.connections, {
            'wifi': '#00ff00',
            'ethernet': '#33ff00',
            '4g': '#ff9900',
            '3g': '#ff6600',
            '2g': '#ff3300',
            'cellular': '#ffff00',
            'unknown': '#ffcc00',
            'none': '#ff0000',
            'None': '#ff0000'
        });

        controller.calculateLine(trip.gpsAccuracies, ['#00ff00', '#33ff00', '#66ff00', '#99ff00', '#ccff00', '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000'],
            function(x){
                if(x < 5) return 0;
                if(x < 10) return 1;
                if(x < 15) return 2;
                if(x < 20) return 3;
                if(x < 25) return 4;
                if(x < 30) return 5;
                if(x < 40) return 6;
                if(x < 50) return 7;
                if(x < 70) return 8;
                if(x < 100) return 9;
                return 10;
            });

        if(trip.polyline)
            trip.polyline.setMap(null);
        trip.polyline = new google.maps.Polyline({
            path: trip.coords,
            strokeColor: '#ff0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        trip.length = google.maps.geometry.spherical.computeLength(trip.polyline.getPath());
        trip.duration = controller.millisToTime(moment(trip.endTime).unix() - moment(trip.startTime).unix());
        trip.avgSpeed = trip.length / (trip.duration.totalSecs / 60 / 60) / 1000;
        trip.hasCalculations = true;
    } else {
        if (!trip.hasCalculations) {
            trip.length = 0;
            trip.avgSpeed = 0;
            trip.hasCalculations = true;
        }
    }
};


$scope.switchSmoothingMode = function(mode){
    //0: None
    //1: Simple

    $scope.calculateTrip($scope.currentTrip, mode);
    $scope.setCurrentTrip($scope.currentTrip);
};

$scope.smoothCoordinates = function(mode, prev, curr, isFinalPoint){
    switch(mode){
        case 0:
            return true;
        case 1:
            if(prev === null) return true;
            var distDiff = google.maps.geometry.spherical.computeDistanceBetween(prev.pos, curr.pos);
            var timeDiff = moment(curr.time).unix() - moment(prev.time).unix();
            return distDiff < 30 * timeDiff || isFinalPoint;
        case 2:
            //Calculate running average of the speed of the last 5 (?) points
            //which passes the rules for mode 1, and use this running average
            //as limit instead of 30.
            return true;
    }
};

$scope.setCurrentTrip = function(trip) {
    if(!$scope.map) $scope.initializeMap();

    if($scope.currentTrip && $scope.currentTrip.polyline)
        $scope.currentTrip.polyline.setMap(null);

    if($scope.currentTrip && $scope.currentTrip.favoriteMarkers){
        for(var i = 0; i < $scope.currentTrip.favoriteMarkers.length; i++){
            $scope.currentTrip.favoriteMarkers[i].setMap(null);
        }
    }

    if($scope.currentLineMarker) {
        $scope.currentLineMarker.setMap(null);
        $scope.currentLineMarker = null;
    }
    $scope.cursorX = 0;

    $scope.currentTrip = trip;
    $scope.selectedMode = null;
    $scope.selectedPurpose = null;
    $scope.selectedConnection = null;
    $scope.selectedAccuracy = null;

    if (!trip.hasCalculations) {
        $scope.calculateTrip(trip);
    }

    if(trip.polyline){
        trip.polyline.setMap($scope.map);
        $scope.map.fitBounds(trip.bounds);
    }

    if(!trip.favorites){
        $http.get(ServiceUrl + 'favorites', {params: {uid: $scope.uid, token: $scope.token, fuid: trip._userId}}).
            success(function(data){
                $scope.setFavorites(trip._userId, data);
                $scope.plotFavorites(trip);
            });
    }else{
        $scope.plotFavorites(trip);
    }
};

$scope.reload = function() {
    var dialog = dialogs.wait(undefined, "Downloading statistics ...", undefined);

    $http.get(ServiceUrl + 'trips', {params: {uid: $scope.uid, token: $scope.token}}).
        success(function(data){

            $scope.trips = [];
            for(var i = 0; i < data.length; i++) {
                $scope.calculateTrip(data[i]);
                if(data[i].length > 10)
                    $scope.trips.push(data[i]);
            }

            dialog.close();

            $http.get(ServiceUrl + 'users/animalMapping', {params: {uid: $scope.uid, token: $scope.token}}).
                success(function(data){
                    var animals = {};
                    for(var i = 0; i < data.length; i++) {
                        animals[data[i]._id] = data[i].animal;
                    }
                    for(var i = 0; i < $scope.trips.length; i++) {
                        $scope.trips[i].animal = animals[$scope.trips[i]._userId];
                    }
                });
        }).
        error(function(){
            dialog.close();
            $scope.trips = [{title: "Failed to load questions!"}];
        });
};
