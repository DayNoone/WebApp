app.controller('view2', function($scope, $modal, $log, $http, $timeout) {
    $scope.loadingFinished = false;
    $scope.categoryActive = true
    $scope.categories_slide = function () {
        $scope.categoryActive = !$scope.categoryActive;
    }
    $scope.gmapsActive = true;
    $scope.gmaps_slide = function () {
        $scope.gmapsActive = !$scope.gmapsActive;
    }

    var map;
    init = function () {
        console.log("Init");

        var mapStyle = [
        /**
         {
             stylers: [
                 { hue: "#00ffe6" },
                 { saturation: 0 }
             ]
         }, */
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
        //path = getPath();
        searchBox = new google.maps.places.SearchBox(input);
        map.addListener('bounds_changed', function () {
            searchBox.setBounds(map.getBounds());
        });
        addSearchBoxListener();
        addClickListener();
        addHoverListener();
        var heatMapInit = initHeatMap();
        //while(!heatMapInit){
        //    heatMapInit = initHeatMap();
        //}
        // initTripPath();
        console.log("Google Maps and its APIs has been loaded");

    }

    function connect() {/*


     $http.get(service_URL + 'trips', {params: {uid: uid, token: pw}})
     */
        var service_URL = "https://tf2.sintef.no:8084/smioTest/api/";
        var uid = 'kristhus';
        var pw = 'pigeon790';
        $http({
            method: 'GET',
            data: {uid: uid, token: pw},
            url: service_URL + 'trips'
        })
            .success(function (data) {
                console.log("Success");
            }).error(function () {
                console.log("Failed");
            });

    }

    connect();

    /**
     * Checks if current element is active or not
     * @param itemId, id of the link
     * @returns {*} if checked, return icon, else, icon gets removed
     */

    $scope.veifeilIcon = false;
    $scope.samePathIcon = false;
    $scope.surveyIcon = false;
    $scope.speedVarIcon = false;

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

    function cleanHeatMap() {
        //heatmap.setMap(null);
    }

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
     * @param cR
     * @param cG
     * @param cB
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
        // 255,0,0 == 0/maxSpeed
        // 255,255,0 == 0.5*maxSpeed/maxSpeed
        // 0,255,0 = maxSpeed/maxSpeed

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

    $scope.loadSpeedVar = function() {
        $scope.loadingFinished = false;
        $scope.clearPaths();
        $timeout(function() {
        calculateSpeedVariation();
        $scope.loadingFinished = true;
        }, 10);
    }

    function calculateSpeedVariation(){
        var curr;
        var prev;
        angular.forEach(trips, function(trip){
            curr = null;
            prev = null;;
            if (inInterval(dateComparify(trip.startTime), timeComparify(trip.startTime))) {
                angular.forEach(trip.tripData, function (point) {
                    curr = new google.maps.LatLng(point.lat, point.lon);
                    if (prev != null) {
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
                    }
                    prev = curr;
                })
            }
        })
        $scope.loadingFinished = true;
    }

    function calculatePath() {
        path = [];
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
            }
        });
        console.log(path);
        //pathArray = new google.maps.MVCArray(path);
    }

    function togglePath() {
        angular.forEach($scope.drawnPath, function (trip) {
            trip.setMap(trip.getMap() ? null : map);
        });
    }


    $scope.pointRadius = 20;
    $scope.clickRadius = 50;

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


    var errors;
    var activeJSONData;
    var heatmapPoitns;
    var trips;
    var path;
    var heatmap;
    var tripPath;
    var pathArray;
    var pointArray;
    var initHeatMap = function () {
        pointArray = new google.maps.MVCArray(trips);
        try {
            heatmap = new google.maps.visualization.HeatmapLayer({
                data: pointArray,
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


    $scope.hideHeatMap = function () {
        if ($scope.veifeilIcon) {
            document.getElementById('enableTooltip').className = "btn btn-primary";
        }
        return !$scope.veifeilIcon;
    }

    $scope.hideSamePathView = function () {
        if ($scope.samePathIcon) {
            //$scope.enableSamePath = false;
            document.getElementById('samePathBtn').className = "btn btn-primary";
        }
        return !$scope.samePathIcon;
    }

    $scope.hideSurvey = function () {
        if($scope.surveyIcon){
            document.getElementById('enableSurvey').className = "btn btn-primary";
        }

        return !$scope.surveyIcon;
    }
    $scope.hideSpeedVarView = function() {
        if ($scope.speedVarIcon) {
            //$scope.enableSamePath = false;
        }
        return !$scope.speedVarIcon;
    }

    $scope.drawnPath = [];
    var samePathPartArray = [];

    function drawPaths(pathArr, strokeColor) {
        if(strokeColor==null)
            strokeColor = '#FF0000';
        console.log("Drawing path");
        angular.forEach(pathArr, function (trip) {
            $scope.drawnPath.push(new google.maps.Polyline({
                path: trip,
                geodesic: true,
                strokeColor: strokeColor,
                clickable: false,
                strokeOpacity: .3,
                strokeWeight: 2,
                map: map
            }));
            //  $scope.drawnPath[$scope.drawnPath.length-1].setMap(map); // replaced with map:map
        });
    }

    $scope.clearPaths = function () {
        console.log("clearing paths");
        while ($scope.drawnPath[0]) {  //Remove circles
            $scope.drawnPath.pop().setMap(null);
        }
        samePathPartArray = [];
    }

    $scope.finishPathing = function () {
        if ($scope.hideFinishPathing) return;
        $scope.clearPaths();
        $scope.enableSamePath = false;
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

        /** Disabled because of long calculation time
         angular.forEach(pathArray, function(trip){
            console.log(trip);
            angular.forEach(trip, function(point)
            {
                if (i != 0) {
                    if (smoothCoordinates(trip[i - 1], trip[i], i == trip.length)) {
                        trip.splice(i, 1);
                        console.log("SPLICED");
                    }
                }
                i++;
            });
        });

         */
        //selectedArea.setMap(null);
        if (samePathPartArray)
            drawPaths(samePathPartArray);

        $scope.hideFinishPathing = true;
    }

    $scope.hideFinishPathing = true;

    function toggleHeatmap() {
        if (!heatmap)
            alert("Error with heatmap, try refreshing the page");
        else
            heatmap.setMap(heatmap.getMap() ? null : map);
    }

    /** Takk til Erlend Dahl @smio*/
    var smoothCoordinates = function (prev, curr, isFinalPoint) {
        prevTime = timeComparify(prev.time);
        currTime = timeComparify(curr.time);
        var distDiff = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(prev.lat, prev.lon), new google.maps.LatLng(curr.lat, curr.lon));
        var timeDiff = moment(curr.time).unix() - moment(prev.time).unix();
        //var timeDiff = currTime-prevTime;
        console.log(timeDiff + "_____" + distDiff);
        return distDiff < 10 * timeDiff || isFinalPoint;
    }


//************============================================******************


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

    function getPoints() {
        console.log("getPoints");
    };

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


    function timeComparify(date) {
        var hours = date.substring(11, 13);
        var minutes = date.substring(14, 16);
        return hours + "" + minutes;
    }

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
     * @returns {boolean}
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


    /*
     function getFaultPoints() {
     return [
     new google.maps.LatLng(63.41975, 10.40251),
     new google.maps.LatLng(63.41979, 10.40276),
     new google.maps.LatLng(63.41971, 10.40272),
     new google.maps.LatLng(63.41975, 10.40260),
     new google.maps.LatLng(63.41947, 10.40278)
     ]};
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

    $scope.changePointRadius = function () {
        radius = $scope.pointRadius;
        heatmap.set('radius', radius);
    }

    $scope.resetFilter = function () {
        document.getElementById("fromDate").value = "";
        document.getElementById("toDate").value = "";
        document.getElementById("fromTime").value = "";
        document.getElementById("toTime").value = "";
        filterData();
    }

    $scope.selectedCluster = [];
    $scope.enableTooltip = false;
    var clickedPoint;
    var selectedArea;

    $scope.enableSamePath = false;
    $scope.enableSurveyPoints = false;

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


    function pointInCircle(point, radius, center) {
        return (google.maps.geometry.spherical.computeDistanceBetween(point, center) <= radius)
    }

    $scope.samePath = function () {
        $scope.clearPaths();
        calculatePath();
        drawPaths(path);
        console.log("checked");
    }


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

    function connect() {
        var connectionsResolved = 0;

        var service_URL = "https://tf2.sintef.no:8084/smioTest/api/";

        var uid = "sondre";
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
