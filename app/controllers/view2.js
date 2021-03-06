app.controller('view2', function($scope, $modal, $log, $http, $timeout) {


    // ================= MODELS ========================
    $scope.loadingFinished = false;
    $scope.categoryActive = true
    $scope.gmapsActive = true;

    $scope.veifeilIcon = false;
    $scope.samePathIcon = false;
    $scope.surveyIcon = false;
    $scope.speedVarIcon = false;


    $scope.pointRadius = 20;
    $scope.clickRadius = 50;
    $scope.intensity = 5;
    $scope.maxIntensity = 20;

    $scope.fromDate = "";
    $scope.toDate = "";

    $scope.fromTime = "00:00";
    $scope.toTime = "23:59";

    $scope.currentlySelected = "";


    $scope.samePathP1;
    $scope.samePathP2;

    $scope.samePathArray = [];
    $scope.surveyPointArray = [];

    $scope.speedVarOpacity = 50;
    $scope.maxSpeed = 5;
    $scope.speedAsHeatmap = false;

    $scope.drawnPath = [];

    $scope.hideFinishPathing = true;


    $scope.selectedCluster = [];
    $scope.enableTooltip = false;
    $scope.enableSamePath = false;
    $scope.enableSurveyPoints = false;


    var samePathPartArray = [];
    var pathId;
    var errors;
    var activeJSONData;
    var heatmapPoitns;
    var trips;
    var path;
    var heatmap;
    var tripPath;
    var pathArray;
    var pointArray;
    var clickedPoint;
    var selectedArea;
    var map;

    // END OF MODELS

    // =============================  START OF CONTROLLER ================================

    // These two toggles between slide in and out between categories and gmaps
    $scope.gmaps_slide = function () {
        $scope.gmapsActive = !$scope.gmapsActive;
    }
    $scope.categories_slide = function () {
        $scope.categoryActive = !$scope.categoryActive;
    }
    /**
     * Initializatioin of requirements google maps need
     */
    init = function () {
        console.log("Init");

        var mapStyle = [
            {
                featureType: "road.arterial",
                elementType: "geometry",
                stylers: [
                    {lightness: 100},
                    {visibility: "simplified"}
                ]
            }, {
                featureType: "poi",
                elementType: "Labels",
                stylers: [
                    {visibility: "off"}
                ]
            }
        ];

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 14,
            center: new google.maps.LatLng(63.4174652, 10.4043239),
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            disableDefaultUI: true
        });
        map.setOptions({styles: mapStyle});
        data = getFaultPoints();
        searchBox = new google.maps.places.SearchBox(input); //Search for addresses and places
        map.addListener('bounds_changed', function () { // Not really necessary, since the searchBox is placed outside the map
            searchBox.setBounds(map.getBounds());
        });

        // Add listeners to the map
        addSearchBoxListener();
        addClickListener();
        addHoverListener();
        var heatMapInit = initHeatMap();
        console.log("Google Maps and its APIs has been loaded");

    }

    /**
     * Connect to the server
     */

    connect();

    /**
     * Checks if current element is active or not
     * @param itemId, id of the link
     * @returns {*} if checked, return icon, else, icon gets removed
     */

    /**Checks if the item is selected, and should have an icon
     *
     * @param id of the given
     * @returns {icon}
     */
    $scope.isChecked = function (itemId) {
        if (itemId == 'Veifeil') {
            if ($scope.veifeilIcon)
                return 'glyphicon glyphicon-ok-sign';
        } else if (itemId == 'samePath') {
            if ($scope.samePathIcon)
                return 'glyphicon glyphicon-ok-sign';
        }else if (itemId == 'surveys') {
            if ($scope.surveyIcon)
                return 'glyphicon glyphicon-ok-sign';
        }else if (itemId == 'speedVar') {
            if ($scope.speedVarIcon)
                return 'glyphicon glyphicon-ok-sign';
        }
        return false;
    }

    /**
     * Sets intensity of the heatmap points
     */
    $scope.changeIntensity = function(){
        console.log("CHANGE INTENSITY: " + $scope.intensity);
        heatmap.set('maxIntensity',$scope.maxIntensity+1- $scope.intensity)
    }

    /**Sets points to be displayed
     *
     * @param itemId id of element pressed
     */
    $scope.selectedHeatmap = function (itemId) {
        if ($scope.veifeilIcon) {
            $scope.currentlySelected = "";
            $scope.enableTooltip = false;
            heatmap.setMap(null);
        }
        else {
            heatmap.setMap(map);
            $scope.currentlySelected = "Heatmap " + itemId;


            switch (itemId) {
                case "speedVar":
                    heatmapPoitns = getPoints(loadDummyData());
                    break;
                case "popularity":
                    heatmapPoitns = getPopularityPoints();
                    break;
                case "Veifeil":
                    heatmapPoitns = getFaultPoints();
                    break;
            }
            heatmap.setData(heatmapPoitns);
        }
        console.log($scope.currentlySelected);
    }
    /** Selects lines which should be displayed, based on itemid
     *
     * @param itemId  id of element selected
     */
    $scope.selectedLines = function (itemId) {
        // Clear heatmaps
        //heatmap.setMap(null);
        togglePath();
        if ($scope.samePathIcon) {
            $scope.currentlySelected = "";
            //TODO: Disable all enabled buttons in corresponding view
        } else if($scope.speedVarIcon){
            $scope.currentlySelected = "";
            //TODO: Disable all enabled buttons in corresponding view
        } else {
            $scope.currentlySelected = "Rute " + itemId;
            switch (itemId) {
                case "speedVar":
                    $scope.loadSpeedVar();
                    break;
                case "samePath":
                    $scope.samePath();
                    break;
            }

        }
    }


    /** Hex is on format: #rrggbb, and this method converts the integers to hex and returns a color code
     *  VERY IMPORTANT
     *  Arguments MUST be integers.
     *  There are no floats in an rgb color.
     *
     * @param cR Red channel
     * @param cG Green channel
     * @param cB Blue channel
     * @returns {string}
     */
    function toHex(cR, cG, cB) {
        hexR = cR.toString(16);
        r =  hexR.length == 1 ? "0" + hexR : hexR;
        hexG = cG.toString(16);
        g =  hexG.length == 1 ? "0" + hexG : hexG;
        hexB = cB.toString(16);
        b =  hexB.length == 1 ? "0" + hexB : hexB;
        return "#"+r+g+b;
    }

    /**Takes in a speed as decimal wich determines the color
     * The higheset speed is decided by user input
     *
     * @param speed
     * @returns {a color of type "#" + hexnum}
     */
    function colorBySpeed(speed){
        r = 255;
        g = 0;
        b = 0;

        if(speed >= $scope.maxSpeed){return toHex(0,255,0)}//supergreen
        else if(speed >= 0.5*$scope.maxSpeed){ // change red channel
            return toHex(parseInt(255*2-255*2*(speed/$scope.maxSpeed)),255,0);
        }
        else if(speed < 0.5*$scope.maxSpeed){  //change green channel
            return toHex(255,parseInt(255*(2*speed/$scope.maxSpeed)),0);
        }
        else{
            return "#FF000";
        }
    }

    /**
     * Prepare the map for calculating speed variation.
     */
    $scope.loadSpeedVar = function() {
        $scope.loadingFinished = false;
        $scope.clearPaths();
        heatmap.setMap(null);
        $timeout(function() {
        calculateSpeedVariation();
            if($scope.speedAsHeatmap){
                heatmap.setData(heatmapPoitns);
                heatmap.setMap(map);
            }
        $scope.loadingFinished = true;
        }, 10);
    }

    /**
     * Calculates the speed in a point, and adds a line between
     * that point and the next in the trip to a list of paths to be drawn
     * trips must be loaded.
     * In addition, a heatmap based on the same concept is made.
     */
    function calculateSpeedVariation(){
        console.log($scope.speedAsHeatmap);
        var curr;
        var prev;
        var currP;
        var prevP;
        var prePrevP;
        heatmapPoitns = [];
        angular.forEach(trips, function(trip){
            curr = null;
            prev = null;;
            currP = null;
            prevP = null;
            prePrevP = null;
            var intervalCounter = 1;
            if (inInterval(dateComparify(trip.startTime), timeComparify(trip.startTime))) {
                angular.forEach(trip.tripData, function (point) {
                    currP = point;
                    curr = new google.maps.LatLng(point.lat, point.lon);
                    if ((prev != null) && !$scope.speedAsHeatmap){
                        strokeColor = colorBySpeed(point.speed);
                        $scope.drawnPath.push(new google.maps.Polyline({
                            path: [prev, curr],
                            geodesic: true,
                            strokeColor: strokeColor,
                            clickable: false,
                            strokeOpacity: $scope.speedVarOpacity/100,
                            strokeWeight: 2,
                            map: map
                        }));
                    }else if((prePrevP != null) && $scope.speedAsHeatmap && intervalCounter == 3){
                        if(prePrevP.speed == null || prevP.speed == null || currP.speed == null){
                            //Points without any speed defined
                        }
                        avgSpeed = (prePrevP.speed + prevP.speed + currP.speed)/3;
                        if(avgSpeed != null && avgSpeed < $scope.maxSpeed/2 ){
                            heatmapPoitns.push(curr);
                        }
                        intervalCounter = 0;
                    }
                    prePrevP = prevP;
                    prevP = currP;

                    prev = curr;
                    intervalCounter++;
                })
            }
        })
        $scope.loadingFinished = true;
    }

    /**
     * Check if paths are within desired filtration, and converts data to google format.
     */
    function calculatePath() {
        path = [];
        pathId = [];
        console.log(trips);
        angular.forEach(trips, function (trip) {
            points = [];
            if (inInterval(dateComparify(trip.startTime), timeComparify(trip.startTime))) {
                angular.forEach(trip.tripData, function (point) {
                    points.push(new google.maps.LatLng(point.lat, point.lon));
                })
            }
            if (points.length > 0) {
                path.push(points);
            pathId.push(trip._id);
            }
        });
        console.log(path);
        //pathArray = new google.maps.MVCArray(path);
    }

    /**
     * Toggle between map visibility.
     * Set map to null or to the actual map view
     */
    function togglePath() {
        angular.forEach($scope.drawnPath, function (trip) {
            trip.setMap(trip.getMap() ? null : map);
        });
    }

    /**
     * Initialize The heatmap variables, so that the view is changed
     * directly based on models set
     * @returns {boolean} Could not be made
     */
    var initHeatMap = function () {
        pointArray = new google.maps.MVCArray(trips);
        try {
            heatmap = new google.maps.visualization.HeatmapLayer({
                data: pointArray,
                maxIntensity: $scope.intensity,
                map: map
            });
            heatmap.set('radius', heatmap.get('radius') ? null : $scope.pointRadius);
            toggleHeatmap();
            return true;
        } catch (e) {
            //location.reload();
            console.log(e);
            if (!heatmap) {
                console.log("Heatmap is undefined after creation, error with map: map")
                return false;
            }
        }
    }

    /**
     * Add a hover listener to the map, which displays areas you can place, or
     * use as a selector for points.
     */
    function addHoverListener() {
        google.maps.event.addListener(map, 'mousemove', function (event) {
            if (selectedArea != null) {
                selectedArea.setMap(null);
            }
            if ($scope.enableSamePath || $scope.enableTooltip || $scope.enableSurveyPoints) {
                if ($scope.enableSamePath) {
                    color = "#0008FF"
                    border = "#0008FF"
                } else if($scope.enableTooltip) {
                    color = "#00FFEE"
                    border = "#8000FF"
                }else if($scope.enableSurveyPoints){
                    color = "#FF00FF"
                    border = "#0000CC"
                }
                selectedArea = new google.maps.Circle({
                    strokeColor: border,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: color,
                    fillOpacity: 0.2,
                    map: map,
                    center: event.latLng,
                    radius: parseInt($scope.clickRadius),
                    clickable: false
                });
            }
        })
    }

    /**
     * Toggle id=enableTooltip pressed
     * @returns {boolean} Toggled hide
     */
    $scope.hideHeatMap = function () {
        if ($scope.veifeilIcon) {
            document.getElementById('enableTooltip').className = "btn btn-primary";
        }
        return !$scope.veifeilIcon;
    }

    /**
     * Toggle id=samePathBtn pressed
     * @returns {boolean} Toggled hide
     */
    $scope.hideSamePathView = function () {
        if ($scope.samePathIcon) {
            //$scope.enableSamePath = false;
            document.getElementById('samePathBtn').className = "btn btn-primary";
        }
        return !$scope.samePathIcon;
    }

    /**
     * Toggle id=enableSurvey pressed
     * @returns {boolean} Toggled hide
     */
    $scope.hideSurvey = function () {
        if($scope.surveyIcon){
            document.getElementById('enableSurvey').className = "btn btn-primary";
        }

        return !$scope.surveyIcon;
    }

    /**
     * Hid the speed variation view
     * @returns {boolean}
     */
    $scope.hideSpeedVarView = function() {
        if ($scope.speedVarIcon) {
            //$scope.enableSamePath = false;
        }
        return !$scope.speedVarIcon;
    }

    /**
     * Drap paths from an array with google latlng points, and set the color of the path
     * @param pathArr Array with google's LatLng points
     * @param strokeColor Desired color
     */
    function drawPaths(pathArr, strokeColor) {
        if(strokeColor==null)
            strokeColor = '#FF0000';
        var index = 0;
        angular.forEach(pathArr, function (trip) {
           var line = new google.maps.Polyline({
                path: trip,
                id: pathId[index],
                geodesic: true,
                strokeColor: strokeColor,
                clickable: true,
                strokeOpacity: .3,
                strokeWeight: 2,
                map: map
            });

            // Remove polyline from map.
            var tmp = google.maps.event.addListener(line, 'click', function (event) {
                if(event.Gb.ctrlKey) {
                    angular.forEach($scope.drawnPath, function (path) {
                        if (path.id == tmp.id) {
                            path.setMap(null);
                        }
                    })
                }
            });
            tmp.id=pathId[index];
            $scope.drawnPath.push(line);
            index++;
        });
    }

    /**
     * Remove all paths in tripview
     */
    $scope.clearPaths = function () {
        console.log("clearing paths");
        while ($scope.drawnPath[0]) {  //Remove circles
            $scope.drawnPath.pop().setMap(null);
        }
        samePathPartArray = [];
    }

    /**
     * Finds the lines which passes through all of the selected areas, samePathArray.
     * After calculation, these lines are drawn on the map
     */
    $scope.finishPathing = function () {
        if ($scope.hideFinishPathing) return;
        $scope.clearPaths();
        $scope.enableSamePath = false;
        var arrayId = [];
        document.getElementById('samePathBtn').className = "btn btn-primary";
        if ($scope.samePathArray.length == 0) {
            return;
        }
        console.log(trips.length);
        angular.forEach(trips, function (trip) {  // For each trip
            var numOfPointsInCircle = 0;
            if (inInterval(dateComparify(trip.startTime), timeComparify(trip.startTime))) {
                angular.forEach($scope.samePathArray, function (pointCircle) { // For each circle marked on the map
                    var cont = true;
                    angular.forEach(trip.tripData, function (point) {         // For each point in the trip
                        if (cont) {
                            gPoint = new google.maps.LatLng(point.lat, point.lon);
                            if (pointInCircle(gPoint, pointCircle.radius, pointCircle.center)) { // If point is in the circle
                                numOfPointsInCircle++;
                                cont = false;
                            }
                        }
                    });
                });
                if (numOfPointsInCircle >= $scope.samePathArray.length) {
                    tmpArr = [];
                    angular.forEach(trip.tripData, function (tripPoint) {
                        tmpArr.push(new google.maps.LatLng(tripPoint.lat, tripPoint.lon));
                    });
                    samePathPartArray.push(tmpArr);
                }
            }
        });
        while ($scope.samePathArray[0]) {  //Remove circles
            $scope.samePathArray.pop().setMap(null);
        }

        drawPaths(samePathPartArray);
        $scope.hideFinishPathing = true;
        console.log(trips);
    }

    /** Toggle heatmap on and off
     *
     */
    function toggleHeatmap() {
        if (!heatmap)
            alert("Error with heatmap, try refreshing the page");
        else
            heatmap.setMap(heatmap.getMap() ? null : map);
    }


    /** Initialize the trips and add their models to the view
     *  Models: pathArray and tripPath
     */
    function initTripPath() {
        pathArray = new google.maps.MVCArray(path);
        tripPath = new google.maps.Polyline({
            path: pathArray,
            clickable: false,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    }

    /**Get road faults as an array of LatLng points
     *
     * @returns {Array} Google LatLng of road faults
     */
    function getFaultPoints() {
        dataPoints = [];
        activeJSONData = [];
        var i = 0;
        angular.forEach(errors, function (data) {
            if (inInterval(dateComparify(data.timestamp), timeComparify(data.timestamp))) {
                dataPoints[i] = new google.maps.LatLng(data.lat, data.lon);
                activeJSONData[i] = data;
                i++;
            }
        })
        console.log(dataPoints.length);
        return dataPoints;
    }

    /** Test dummyData as JSON format
     * Correct headers containing: Date, Time, lat, lon
     * @param dummyData Desired JSON
     *
     * @returns {Array}
     */
    function getPath(dummyData) {
        dataPoints = [];
        var i = 0;
        angular.forEach(dummyData, function (path) {
            if (inInterval(dateComparify(path.Date), path.Time.replace(/:/g, ''))) {
                dataPoints[i] = new google.maps.LatLng(path.lat, path.lon);
                i++;
            }
        })
        console.log(dataPoints.length);
        return dataPoints;
    }

    // Convert from yyyy-MM-dd to yyyymmdd - 2015-10-21T05:15:47.000Z - yyyy-MM-ddThh:mm:ss
    function dateComparify(date) {
        var year = date.substring(0, 4);
        var month = date.substring(5, 7);
        var day = date.substring(8, 10);
        return year + "" + month + "" + day;
    }

    /**Takes in a date and returns it in a easily comparable format YYYYMMDD
     *
     * @param date
     * @returns {string} Format YYYYMMDD
     */
    function timeComparify(date) {
        var hours = date.substring(11, 13);
        var minutes = date.substring(14, 16);
        return hours + "" + minutes;
    }

    /**
     * Refresh models
     */
    $scope.filterData = function () {
        if ($scope.samePathIcon) {
            $scope.clearPaths();
            calculatePath();
            drawPaths(path);
            console.log("HERE");

        }
        if ($scope.veifeilIcon) {
            pointArray = getFaultPoints();
            heatmap.setData(pointArray);
        }
        if($scope.speedVarIcon){
            $scope.clearPaths();
            calculateSpeedVariation();
        }
    }

    /**
     * @desc returns true if the data time is in the interval described by the user
     * @param date the datas date
     * @param time the datas time
     * @returns {boolean} is in chosen interval
     */
    function inInterval(date, time) {
        fromDate = document.getElementById('fromDate').value.replace(/-/g, '');
        toDate = document.getElementById('toDate').value.replace(/-/g, '');

        if (!timeInterval(time))
            return false;


        if (fromDate == "" && toDate == "")
            return true;
        else if (fromDate == "")
            return date <= toDate;
        else if (toDate == "")
            return date >= fromDate;
        else
            return date >= fromDate && date <= toDate;
    }

    /**
     *
     * @param time given time
     * @returns {boolean} time is in selected interval
     */
    function timeInterval(time) {
        var fromTime = document.getElementById('fromTime').value.replace(/:/, '');
        var toTime = document.getElementById('toTime').value.replace(/:/, '');
        if (fromTime == "" && toTime == "")
            return true;
        else if (fromTime == "")
            return time <= toTime;
        else if (toTime == "")
            return time >= fromTime;
        else
            return time >= fromTime && time <= toTime;
    }

    /**
     * Dummy data for testing purposes
     * @returns {*[]}
     */
    function getPopularityPoints() {
        return [
            new google.maps.LatLng(63.41912, 10.39600),
            new google.maps.LatLng(63.41911, 10.39570),
            new google.maps.LatLng(63.41907, 10.39536),
            new google.maps.LatLng(63.41902, 10.39502),
            new google.maps.LatLng(63.41897, 10.39452),
            new google.maps.LatLng(63.41906, 10.39448),

            new google.maps.LatLng(63.41919, 10.39441),
            new google.maps.LatLng(63.41930, 10.39434),
            new google.maps.LatLng(63.41954, 10.39424)

        ]
    };
    /* Google Maps Search Code, Gotten from Google Developers */
    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchField');
    var searchBox;
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    var addSearchBoxListener = function () {
        searchBox.addListener('places_changed', function () {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }

            // Clear out the old markers.
            markers.forEach(function (marker) {
                marker.setMap(null);
            });
            markers = [];

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // Create a marker for each place.
                markers.push(new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                }));

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });
    }
    // END OF GOOGLE DEVELOPER CODE

    /** Change radius of heatmap points
     *
     */
    $scope.changePointRadius = function () {
        console.log($scope.pointRadius);
        heatmap.set('radius', parseInt($scope.pointRadius));
    }

    /**
     * Remove all filtration
     */
    $scope.resetFilter = function () {
        document.getElementById("fromDate").value = "";
        document.getElementById("toDate").value = "";
        document.getElementById("fromTime").value = "";
        document.getElementById("toTime").value = "";
        filterData();
    }

    /**
     * Toggle buttons on and off
     * @param button desired button ID
     */
    $scope.toggleButtons = function(button) {
        if(button == 'enableTooltip'){
            $scope.enableTooltip = !$scope.enableTooltip;
            $scope.enableSamePath = false;
            $scope.enableSurveyPoints = false;
        }else if(button == 'enableSamePath'){
            $scope.enableSamePath = !$scope.enableSamePath;
            $scope.enableTooltip = false;
            $scope.enableSurveyPoints = false;
        }else if(button == 'enableSurveyPoints'){
            $scope.enableSurveyPoints = !$scope.enableSurveyPoints;
            $scope.enableSamePath = false;
            $scope.enableTooltip = false;
        }
        console.log($scope.enableSamePath);
    }

    /**
     * Adds listeners to the map and child objects
     * Objects being listened to are:
     *  surveyPoints, clickedPoint, samePath
     */
    var addClickListener = function () {
        google.maps.event.addListener(map, 'click', function (event) {
            if (selectedArea != null)
                selectedArea.setMap(null);
            if ($scope.enableTooltip) {
                clickedPoint = event.latLng;
                $scope.selectedCluster = proximity();

                if ($scope.selectedCluster.length > 0) {
                    selectedArea = new google.maps.Circle({
                        strokeColor: '#0008FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#0008FF',
                        fillOpacity: 0.2,
                        map: map,
                        center: clickedPoint,
                        radius: parseInt($scope.clickRadius)
                    });

                    $scope.openModal($scope.selectedCluster);

                }
            } else if($scope.enableSurveyPoints) {
                $scope.surveyPointArray.push(new google.maps.Circle({
                    strokeColor: color,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: color,
                    fillOpacity: 0.2,
                    clickable: true,
                    map: map,
                    center: event.latLng,
                    radius: parseInt($scope.clickRadius)
                }));
                google.maps.event.addListener($scope.surveyPointArray[$scope.surveyPointArray.length - 1], 'click', function (ev2) {
                    var i = 0;
                    running = true;
                    angular.forEach($scope.surveyPointArray, function (circle) {
                        if (running) {
                            console.log(ev2.latLng + "," + circle.radius + "," + circle.center)
                            if (pointInCircle(ev2.latLng, circle.radius, circle.center)) {
                                circle.setMap(null);
                                $scope.surveyPointArray.splice(i, 1);
                                running = false;

                            }
                            i++;
                        }
                    });
                });

            } else if ($scope.enableSamePath) {
                console.log("Clicked with enableSamePath")
                    $scope.samePathArray.push(new google.maps.Circle({
                        strokeColor: color,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: color,
                        fillOpacity: 0.2,
                        clickable: true,
                        map: map,
                        center: event.latLng,
                        radius: parseInt($scope.clickRadius)
                    }));
                    //google.maps.event.clearInstanceListeners($scope.samePathArray[$scope.samePathArray.length-1]);
                    google.maps.event.addListener($scope.samePathArray[$scope.samePathArray.length - 1], 'click', function (ev2) {
                        //$scope.samePathArray.pop($scope.samePathArray.length-1).setMap(null);
                        var i = 0;
                        running = true;
                        angular.forEach($scope.samePathArray, function (circle) {
                            if (running) {
                                console.log(ev2.latLng + "," + circle.radius + "," + circle.center)
                                if (pointInCircle(ev2.latLng, circle.radius, circle.center)) {
                                    circle.setMap(null);
                                    $scope.samePathArray.splice(i, 1);
                                    running = false;

                                }
                                i++;
                            }
                        });
                    });
                    $scope.hideFinishPathing = false;

            }

        });
    }

    /**
     * Fault points within the selected area
     * @returns {Array}
     */
    var proximity = function () {
        cluster = [];
        var i = 0;
        angular.forEach(activeJSONData, function (data) {
            point = new google.maps.LatLng(data.lat, data.lon);
            if (pointInCircle(point, $scope.clickRadius, clickedPoint)) {
                //console.log(data);
                cluster[i] = data;
                i++;
            }
        });
        return cluster;
    }

    /**Returns if the point is within a circle, based on center, radius, and a point
     *
     * @param point
     * @param radius
     * @param center
     * @returns {boolean}
     */
    function pointInCircle(point, radius, center) {
        return (google.maps.geometry.spherical.computeDistanceBetween(point, center) <= radius)
    }

    /**
     * Selected samePath, and acts accordingly
     */
    $scope.samePath = function () {
        $scope.clearPaths();
        calculatePath();
        drawPaths(path);
        console.log("checked");
    }

    /**
     * Open road faults modal and its controller
     * @param obj Routing object, errors
     */
    $scope.openModal = function (obj) {
        $scope.enableTooltip = false;
        var modalInstance = $modal.open({
            templateUrl: 'views/infoWindowContent.html',
            controller: 'roadFaults',
            size: 'lg',
            resolve: {
                obj: function () {
                    return obj;
                }
            }
        });
        modalInstance.result.then(function (status) {
            console.log(status);
        }, function () {
            selectedArea.setMap(null);
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    /**
     * Open road survey modal and its controller
     */
    $scope.openSurveyModal = function () {
        if($scope.surveyPointArray.length == 0) return;
        var modalInstance = $modal.open({
            templateUrl: 'views/surveyModalView.html',
            controller: 'surveyController',
            size: 'lg',
            resolve: {

                circles: function () {
                    return $scope.surveyPointArray;
                }
            }
        });
        modalInstance.result.then(function (status) {
            console.log(status);
        }, function () {
            selectedArea.setMap(null);
            while ($scope.surveyPointArray[0]) {  //Remove circles
                $scope.surveyPointArray.pop().setMap(null);
            }
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    /**
     * Open export modal and its controller
     */
    $scope.openExportModal = function () {
        var modalInstance = $modal.open({
            templateUrl: 'views/exportModalView.html',
            controller: 'exportController',
            size: 'lg',
            resolve: {
                dataCollection: function () {
                    return {
                        "errors":errors,
                        "trips":trips,
                        "fromDate":$scope.fromDate,
                        "toDate":$scope.toDate,
                        "fromTime":$scope.fromTime,
                        "toTime":$scope.toTime
                    };
                }
            }
        });
        modalInstance.result.then(function (status) {
            console.log(status);
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    /**
     * Connect to the server and retrieve data
     */
    function connect() {
        var connectionsResolved = 0;

        var service_URL = "https://tf2.sintef.no:8084/smioTest/api/";

        var uid = "sondre"; //TODO: Host the website on the server, and make the user login via username and pw
        var pw = "dabchick402";
        //var userid = "560946d9b2af57c413ac8427";
        //var token = "$2a$10$w1BPdOBqiuaYiKJ6a2qYdewOKOdk7fQ.LE3yjf6fvF5/YLtBi2Q8S";
        $http({
            method: 'POST',
            data: {username: uid, password: pw},
            url: service_URL
        })
            .success(function (data) {
                console.log("Success");
                //console.log(data);
                userid = data['_id']
                token = data['token']
                $http.get(service_URL + 'trips', {params: {uid: userid, token: token}}).
                    success(function (data) {
                        console.log('Loaded trips');
                        //console.log(data)
                        trips = data;
                        console.log(trips);
                        connectionsResolved++;
                        if(connectionsResolved == 2){
                            console.log("Resolved")
                            $scope.loadingFinished = true;
                        }
                    }).
                    error(function () {
                        console.log('GET trips failed');
                    });
                $http.get(service_URL + 'errors', {params: {uid: userid, token: token}}).
                    success(function (data) {
                        console.log('Loaded errors');
                        //console.log(data)
                        errors = data;
                        connectionsResolved++;
                        if(connectionsResolved == 2){
                            console.log("Resolved")
                            $scope.loadingFinished = true;
                        }
                    }).
                    error(function () {
                        console.log('GET error failed');
                    });
            }).error(function () {
                console.log("POST failed");
            });
    }
})
