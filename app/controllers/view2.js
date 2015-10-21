app.controller('view2', function($scope, $modal, $log, $http) {
    $scope.categoryActive = true
    $scope.categories_slide = function(){
        $scope.categoryActive = !$scope.categoryActive;
    }
    $scope.gmapsActive = true;
    $scope.gmaps_slide = function(){
        $scope.gmapsActive = !$scope.gmapsActive;
    }

    var map;
    init = function() {
        console.log("Init");
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 14,
            center: new google.maps.LatLng(63.4174652, 10.4043239),
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            disableDefaultUI: true
        });
        //data = getFaultPoints();
        //path = getPath();
        searchBox = new google.maps.places.SearchBox(input);
        map.addListener('bounds_changed', function() {
            searchBox.setBounds(map.getBounds());
        });
        addSearchBoxListener();
        addClickListener();
        initHeatMap();
        initTripPath();
        console.log("Google Maps and its APIs has been loaded");
    }
    connect();

    /**
     * Checks if current element is active or not
     * @param itemId, id of the link
     * @returns {*} if checked, return icon, else, icon gets removed
     */
    $scope.isChecked = function(itemId) {
        if($scope.currentlySelected == "Heatmap " + itemId) {
            return 'glyphicon glyphicon-ok-sign';
        }return false;
    }

    $scope.selectedHeatmap = function(itemId) {
        if($scope.currentlySelected == "Heatmap " + itemId) {
            $scope.currentlySelected = "";
            toggleHeatmap();
        }
        else {
            if($scope.currentlySelected == "") {
                toggleHeatmap();
            }
            $scope.currentlySelected = "Heatmap " + itemId;


            switch(itemId) {
                case "speedVar":
                    data = getPoints(loadDummyData());
                    break;
                case "popularity":
                    data = getPopularityPoints();
                    break;
                case "Veifeil":
                    data = getFaultPoints();
                    break;
            }
            heatmap.setData(data);
        }
        console.log($scope.currentlySelected);
    }

    $scope.selectedLines = function(itemId) {
        if($scope.currentlySelected == "Linjer " + itemId) {
            $scope.currentlySelected = "";
            togglePath();
        }else{
            $scope.currentlySelected = "Linjer " + itemId;
            path = getPath(loadDummyPath());
            tripPath = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            tripPath.setMap(map);
        }

    }
    function togglePath() {
        tripPath.setMap(tripPath.getMap() ? null : map);
    }


    $scope.pointRadius = 20;
    $scope.clickRadius = 50;

    $scope.fromDate = "";
    $scope.toDate = "";

    $scope.fromTime = "00:00";
    $scope.toTime = "23:59";

    $scope.currentlySelected = "";

    var activeJSONData;
    var data;
    var path;
    var heatmap;
    var pathArray;
    var pointArray;
    var initHeatMap = function() {
        pointArray = new google.maps.MVCArray(data);
        try {
            heatmap = new google.maps.visualization.HeatmapLayer({
                data: pointArray,
                map: map
            });
            heatmap.set('radius', heatmap.get('radius') ? null : $scope.pointRadius);
            toggleHeatmap();
        }catch(e) {
            console.log(e);
            if (!heatmap) {
                console.log("Heatmap is undefined after creation, error with map: map")
            }
        }
    }

    function addHoverListener() {

    }

    function toggleHeatmap() {
        if(!heatmap)
           alert("Error with heatmap, try refreshing the page");
        else
            heatmap.setMap(heatmap.getMap() ? null : map);
    }

//************============================================******************


    function initTripPath(){
        pathArray = new google.maps.MVCArray(path);
        var tripPath = new google.maps.Polyline({
            path: pathArray,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    }

    function getPoints(dummyData) {
        dataPoints = [];
        activeJSONData = [];
        var i = 0;
        angular.forEach(dummyData, function(data){
            if(inInterval(dateComparify(data.Date), data.Time.replace(/:/g, ''))) {
                dataPoints[i] = new google.maps.LatLng(data.Latitude, data.Longitude);
                activeJSONData[i] = data;
                i++;
            }
        })
        console.log(dataPoints.length);
        return dataPoints;
    };

    function getPath(dummyData) {
        dataPoints = [];
        var i = 0;
        angular.forEach(dummyData, function(path){
            if(inInterval(dateComparify(path.Date), path.Time.replace(/:/g, ''))) {
                dataPoints[i] = new google.maps.LatLng(path.Latitude, path.Longitude);
                i++;
            }
        })
        console.log(dataPoints.length);
        return dataPoints;
    }

    // Convert from dd/mm/yyyy to yyyymmdd
    function dateComparify(date) {
        var in1 = date.substring(6,10);
        var in2 = date.substring(3,5);
        var in3 = date.substring(0,2);
        return in1+in2+in3;
    }

    $scope.testChange = function() {
        pointArray = getPoints(loadDummyData());
        heatmap.setData(pointArray);
    }

    /**
     * @desc returns true if the data time is in the interval described by the user
     * @param date the datas date
     * @param time the datas time
     * @returns {boolean}
     */
    function inInterval(date, time) {
        fromDate = document.getElementById('fromDate').value.replace(/-/g,'');
        toDate = document.getElementById('toDate').value.replace(/-/g,'');

        if(!timeInterval(time))
            return false;


        if(fromDate == "" && toDate == "")
            return true;
        else if(fromDate == "")
            return date <= toDate;
        else if (toDate == "")
            return date >= fromDate;
        else
            return date >= fromDate && date <= toDate;
    }

    function timeInterval(time) {
        var fromTime = document.getElementById('fromTime').value.replace(/:/,'');
        var toTime = document.getElementById('toTime').value.replace(/:/,'');
        if(fromTime == "" && toTime == "")
            return true;
        else if(fromTime == "")
            return time <= toTime;
        else if (toTime == "")
            return time >= fromTime;
        else
            return time >= fromTime && time <= toTime;
    }



    function getFaultPoints() {
        return [
        new google.maps.LatLng(63.41975, 10.40251),
            new google.maps.LatLng(63.41979, 10.40276),
            new google.maps.LatLng(63.41971, 10.40272),
            new google.maps.LatLng(63.41975, 10.40260),
            new google.maps.LatLng(63.41947, 10.40278)
    ]};


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

        ]};
    /* Google Maps Search Code, Gotten from Google Developers */
    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchField');
    var searchBox;
   // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    var addSearchBoxListener = function() {
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

    $scope.changePointRadius = function() {
        radius = $scope.pointRadius;
        heatmap.set('radius', radius);
    }

    $scope.resetFilter = function() {
        document.getElementById("fromDate").value = "";
        document.getElementById("toDate").value = "";
        document.getElementById("fromTime").value = "";
        document.getElementById("toTime").value = "";
        testChange();
    }

    $scope.selectedCluster = [];
    $scope.enableTooltip = false;
    var clickedPoint;
    var selectedArea;

    var addClickListener = function() {
        google.maps.event.addListener(map, 'click', function (event) {
            if (selectedArea != null)
                selectedArea.setMap(null);
            if ($scope.enableTooltip) {
                clickedPoint = event.latLng;
                $scope.selectedCluster = proximity();

                if ($scope.selectedCluster.length > 0) {
                    console.log("HUEHUE", $scope.clickRadius)
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
            }
        });
    }


    var proximity = function() {
        cluster = [];
        var i = 0;
            angular.forEach(activeJSONData, function (data) {
                point = new google.maps.LatLng(data.Latitude, data.Longitude);
                if (pointInCircle(point, $scope.clickRadius, clickedPoint)) {
                    console.log(data);
                    cluster[i] = data;
                    i++;
                }
            });
        console.log(cluster);
        return cluster;
    }



    function pointInCircle(point, radius, center)
        {
       // console.log("Point: " + point + "   radius " + radius + "     Center: " + center);
        return (google.maps.geometry.spherical.computeDistanceBetween(point, center) <= radius)
    }


    $scope.openModal = function(obj) {
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

    function connect() {
        var service_URL = "https://tf2.sintef.no:8084/smioTest/api/";

        var uid = "sondre";
        var pw = "dabchick402";
        var userid = "560946d9b2af57c413ac8427";
        var token = "$2a$10$w1BPdOBqiuaYiKJ6a2qYdewOKOdk7fQ.LE3yjf6fvF5/YLtBi2Q8S";
        $http({
            method : 'GET',
            data : {uid: uid, token:pw},
            url : service_URL})
            .success(function(data) {
                console.log("Success");
            }).error(function(){
                console.log("Failed");
            });

        /*$http.get(server_url + 'trips', {params: {uid: $scope.uid, token: $scope.token}}).
            success(function(data){
                console.log('Loaded');
                //trips = "Loaded" + data[0];

              /!*  $scope.trips = [];
                for(var i = 0; i < data.length; i++) {
                    $scope.calculateTrip(data[i]);
                    if(data[i].length > 10)
                        $scope.trips.push(data[i]);
                }*!/

                //dialog.close();
            }).
            error(function(){
                //dialog.close();
                console.log('Failed');
                //trips = "Failed to load questions!";
            });*/
    }

    var loadDummyData = function() {
        return [{"Id":1,"Latitude":63.43156118,"Longitude":10.39528644,"Date":"01/09/2015","Time":"10:04:34"},
            {"Id":2,"Latitude":63.42642822,"Longitude":10.38101356,"Date":"02/09/2015","Time":"11:04:34"},
            {"Id":3,"Latitude":63.4183389,"Longitude":10.3854538,"Date":"03/09/2015","Time":"12:04:34"},
            {"Id":4,"Latitude":63.42739703,"Longitude":10.41404947,"Date":"04/09/2015","Time":"13:04:34"},
            {"Id":5,"Latitude":63.43424127,"Longitude":10.37633312,"Date":"05/09/2015","Time":"14:04:34"},
            {"Id":6,"Latitude":63.41257431,"Longitude":10.38090367,"Date":"06/09/2015","Time":"15:04:34"},
            {"Id":7,"Latitude":63.42488054,"Longitude":10.38088117,"Date":"07/09/2015","Time":"16:04:34"},
            {"Id":8,"Latitude":63.42880964,"Longitude":10.41882934,"Date":"08/09/2015","Time":"17:04:34"},
            {"Id":9,"Latitude":63.41890525,"Longitude":10.37946172,"Date":"09/09/2015","Time":"18:04:34"},
            {"Id":10,"Latitude":63.43530533,"Longitude":10.41823263,"Date":"10/09/2015","Time":"19:04:34"},
            {"Id":11,"Latitude":63.42990131,"Longitude":10.41597155,"Date":"11/09/2015","Time":"20:04:34"},
            {"Id":12,"Latitude":63.42778544,"Longitude":10.39207912,"Date":"12/09/2015","Time":"21:04:34"},
            {"Id":13,"Latitude":63.43090294,"Longitude":10.38054982,"Date":"13/09/2015","Time":"22:04:34"},
            {"Id":14,"Latitude":63.41477314,"Longitude":10.37112291,"Date":"14/09/2015","Time":"23:04:34"},
            {"Id":15,"Latitude":63.43100301,"Longitude":10.38121867,"Date":"15/09/2015","Time":"00:04:34"},
            {"Id":16,"Latitude":63.41279281,"Longitude":10.4161252,"Date":"16/09/2015","Time":"01:04:34"},
            {"Id":17,"Latitude":63.43381848,"Longitude":10.39338801,"Date":"17/09/2015","Time":"02:04:34"},
            {"Id":18,"Latitude":63.4211704,"Longitude":10.40454976,"Date":"18/09/2015","Time":"03:04:34"},
            {"Id":19,"Latitude":63.42287673,"Longitude":10.3707216,"Date":"19/09/2015","Time":"04:04:34"},
            {"Id":20,"Latitude":63.42384958,"Longitude":10.42393379,"Date":"20/09/2015","Time":"05:04:34"},
            {"Id":21,"Latitude":63.41428922,"Longitude":10.37872214,"Date":"21/09/2015","Time":"06:04:34"},
            {"Id":22,"Latitude":63.4176788,"Longitude":10.41566668,"Date":"22/09/2015","Time":"07:04:34"},
            {"Id":23,"Latitude":63.42030894,"Longitude":10.40985357,"Date":"23/09/2015","Time":"08:04:34"},
            {"Id":24,"Latitude":63.41991103,"Longitude":10.38090877,"Date":"24/09/2015","Time":"09:04:34"},
            {"Id":25,"Latitude":63.43496265,"Longitude":10.39631824,"Date":"25/09/2015","Time":"10:04:34"},
            {"Id":26,"Latitude":63.4296496,"Longitude":10.386079,"Date":"26/09/2015","Time":"11:04:34"},
            {"Id":27,"Latitude":63.4188998,"Longitude":10.37079232,"Date":"27/09/2015","Time":"12:04:34"},
            {"Id":28,"Latitude":63.42831083,"Longitude":10.40539653,"Date":"28/09/2015","Time":"13:04:34"},
            {"Id":29,"Latitude":63.41368111,"Longitude":10.3705507,"Date":"29/09/2015","Time":"14:04:34"},
            {"Id":30,"Latitude":63.41521126,"Longitude":10.3852955,"Date":"30/09/2015","Time":"15:04:34"},
            {"Id":31,"Latitude":63.42473139,"Longitude":10.41665903,"Date":"01/10/2015","Time":"16:04:34"},
            {"Id":32,"Latitude":63.41543512,"Longitude":10.39842262,"Date":"02/10/2015","Time":"17:04:34"},
            {"Id":33,"Latitude":63.42731523,"Longitude":10.39017407,"Date":"03/10/2015","Time":"18:04:34"},
            {"Id":34,"Latitude":63.41549418,"Longitude":10.39094621,"Date":"04/10/2015","Time":"19:04:34"},
            {"Id":35,"Latitude":63.41733379,"Longitude":10.3886068,"Date":"05/10/2015","Time":"20:04:34"},
            {"Id":36,"Latitude":63.42282738,"Longitude":10.39268486,"Date":"06/10/2015","Time":"21:04:34"},
            {"Id":37,"Latitude":63.42693699,"Longitude":10.42364376,"Date":"07/10/2015","Time":"22:04:34"},
            {"Id":38,"Latitude":63.4142591,"Longitude":10.39407385,"Date":"08/10/2015","Time":"23:04:34"},
            {"Id":39,"Latitude":63.42945947,"Longitude":10.39348956,"Date":"09/10/2015","Time":"00:04:34"},
            {"Id":40,"Latitude":63.42475616,"Longitude":10.37251809,"Date":"10/10/2015","Time":"01:04:34"},
            {"Id":41,"Latitude":63.41278088,"Longitude":10.37702535,"Date":"11/10/2015","Time":"02:04:34"},
            {"Id":42,"Latitude":63.43313073,"Longitude":10.37932243,"Date":"12/10/2015","Time":"03:04:34"},
            {"Id":43,"Latitude":63.41298795,"Longitude":10.37553253,"Date":"13/10/2015","Time":"04:04:34"},
            {"Id":44,"Latitude":63.42939451,"Longitude":10.40310564,"Date":"14/10/2015","Time":"05:04:34"},
            {"Id":45,"Latitude":63.43245151,"Longitude":10.38806427,"Date":"15/10/2015","Time":"06:04:34"},
            {"Id":46,"Latitude":63.41901693,"Longitude":10.40858957,"Date":"16/10/2015","Time":"07:04:34"},
            {"Id":47,"Latitude":63.42957964,"Longitude":10.37275397,"Date":"17/10/2015","Time":"08:04:34"},
            {"Id":48,"Latitude":63.42602146,"Longitude":10.37706535,"Date":"18/10/2015","Time":"09:04:34"},
            {"Id":49,"Latitude":63.43302658,"Longitude":10.37378716,"Date":"19/10/2015","Time":"10:04:34"},
            {"Id":50,"Latitude":63.42981822,"Longitude":10.40665791,"Date":"20/10/2015","Time":"11:04:34"},
            {"Id":51,"Latitude":63.42365949,"Longitude":10.39360056,"Date":"21/10/2015","Time":"12:04:34"},
            {"Id":52,"Latitude":63.41794804,"Longitude":10.41448568,"Date":"22/10/2015","Time":"13:04:34"},
            {"Id":53,"Latitude":63.41374364,"Longitude":10.36845316,"Date":"23/10/2015","Time":"14:04:34"},
            {"Id":54,"Latitude":63.41599391,"Longitude":10.37789903,"Date":"24/10/2015","Time":"15:04:34"},
            {"Id":55,"Latitude":63.42825497,"Longitude":10.42020299,"Date":"25/10/2015","Time":"16:04:34"},
            {"Id":56,"Latitude":63.43459003,"Longitude":10.39027849,"Date":"26/10/2015","Time":"17:04:34"},
            {"Id":57,"Latitude":63.42335707,"Longitude":10.41707122,"Date":"27/10/2015","Time":"18:04:34"},
            {"Id":58,"Latitude":63.41853226,"Longitude":10.41934922,"Date":"28/10/2015","Time":"19:04:34"},
            {"Id":59,"Latitude":63.41530758,"Longitude":10.39372252,"Date":"29/10/2015","Time":"20:04:34"},
            {"Id":60,"Latitude":63.43264085,"Longitude":10.39458387,"Date":"30/10/2015","Time":"21:04:34"},
            {"Id":61,"Latitude":63.41369205,"Longitude":10.4034068,"Date":"31/10/2015","Time":"22:04:34"},
            {"Id":62,"Latitude":63.41685294,"Longitude":10.36848011,"Date":"01/11/2015","Time":"23:04:34"},
            {"Id":63,"Latitude":63.43205553,"Longitude":10.40468077,"Date":"02/11/2015","Time":"00:04:34"},
            {"Id":64,"Latitude":63.4238707,"Longitude":10.38528636,"Date":"03/11/2015","Time":"01:04:34"},
            {"Id":65,"Latitude":63.41315365,"Longitude":10.39725521,"Date":"04/11/2015","Time":"02:04:34"},
            {"Id":66,"Latitude":63.42527649,"Longitude":10.42457793,"Date":"05/11/2015","Time":"03:04:34"},
            {"Id":67,"Latitude":63.41191767,"Longitude":10.36921815,"Date":"06/11/2015","Time":"04:04:34"},
            {"Id":68,"Latitude":63.42173357,"Longitude":10.40790585,"Date":"07/11/2015","Time":"05:04:34"},
            {"Id":69,"Latitude":63.43462098,"Longitude":10.41370506,"Date":"08/11/2015","Time":"06:04:34"},
            {"Id":70,"Latitude":63.43196039,"Longitude":10.37649598,"Date":"09/11/2015","Time":"07:04:34"},
            {"Id":71,"Latitude":63.41767022,"Longitude":10.39330017,"Date":"10/11/2015","Time":"08:04:34"},
            {"Id":72,"Latitude":63.41434009,"Longitude":10.39679458,"Date":"11/11/2015","Time":"09:04:34"},
            {"Id":73,"Latitude":63.43126274,"Longitude":10.37515801,"Date":"12/11/2015","Time":"10:04:34"},
            {"Id":74,"Latitude":63.42291342,"Longitude":10.41947707,"Date":"13/11/2015","Time":"11:04:34"},
            {"Id":75,"Latitude":63.4123821,"Longitude":10.40531293,"Date":"14/11/2015","Time":"12:04:34"},
            {"Id":76,"Latitude":63.41445203,"Longitude":10.40579079,"Date":"15/11/2015","Time":"13:04:34"},
            {"Id":77,"Latitude":63.43060947,"Longitude":10.41374704,"Date":"16/11/2015","Time":"14:04:34"},
            {"Id":78,"Latitude":63.41354752,"Longitude":10.40014355,"Date":"17/11/2015","Time":"15:04:34"},
            {"Id":79,"Latitude":63.41535288,"Longitude":10.39052537,"Date":"18/11/2015","Time":"16:04:34"},
            {"Id":80,"Latitude":63.43207891,"Longitude":10.4201831,"Date":"19/11/2015","Time":"17:04:34"},
            {"Id":81,"Latitude":63.41837819,"Longitude":10.38680287,"Date":"20/11/2015","Time":"18:04:34"},
            {"Id":82,"Latitude":63.43444788,"Longitude":10.41837473,"Date":"21/11/2015","Time":"19:04:34"},
            {"Id":83,"Latitude":63.42463384,"Longitude":10.41093069,"Date":"22/11/2015","Time":"20:04:34"},
            {"Id":84,"Latitude":63.4252625,"Longitude":10.39567069,"Date":"23/11/2015","Time":"21:04:34"},
            {"Id":85,"Latitude":63.43180679,"Longitude":10.37089314,"Date":"24/11/2015","Time":"22:04:34"},
            {"Id":86,"Latitude":63.42625647,"Longitude":10.38453668,"Date":"25/11/2015","Time":"23:04:34"},
            {"Id":87,"Latitude":63.42011084,"Longitude":10.38693568,"Date":"26/11/2015","Time":"00:04:34"},
            {"Id":88,"Latitude":63.41273757,"Longitude":10.40073152,"Date":"27/11/2015","Time":"01:04:34"},
            {"Id":89,"Latitude":63.42171814,"Longitude":10.38431499,"Date":"28/11/2015","Time":"02:04:34"},
            {"Id":90,"Latitude":63.42320328,"Longitude":10.37212116,"Date":"29/11/2015","Time":"03:04:34"},
            {"Id":91,"Latitude":63.43140588,"Longitude":10.40653627,"Date":"30/11/2015","Time":"04:04:34"},
            {"Id":92,"Latitude":63.42355224,"Longitude":10.40713617,"Date":"01/12/2015","Time":"05:04:34"},
            {"Id":93,"Latitude":63.42526151,"Longitude":10.39199509,"Date":"02/12/2015","Time":"06:04:34"},
            {"Id":94,"Latitude":63.4178701,"Longitude":10.3941763,"Date":"03/12/2015","Time":"07:04:34"},
            {"Id":95,"Latitude":63.4337244,"Longitude":10.37202778,"Date":"04/12/2015","Time":"08:04:34"},
            {"Id":96,"Latitude":63.4306478,"Longitude":10.4226114,"Date":"05/12/2015","Time":"09:04:34"},
            {"Id":97,"Latitude":63.42176065,"Longitude":10.41146262,"Date":"06/12/2015","Time":"10:04:34"},
            {"Id":98,"Latitude":63.43399417,"Longitude":10.36721442,"Date":"07/12/2015","Time":"11:04:34"},
            {"Id":99,"Latitude":63.42890773,"Longitude":10.39312577,"Date":"08/12/2015","Time":"12:04:34"},
            {"Id":100,"Latitude":63.42776057,"Longitude":10.42234286,"Date":"09/12/2015","Time":"13:04:34"},
            {"Id":101,"Latitude":63.41669298,"Longitude":10.42202057,"Date":"10/12/2015","Time":"14:04:34"},
            {"Id":102,"Latitude":63.43160826,"Longitude":10.39459525,"Date":"11/12/2015","Time":"15:04:34"},
            {"Id":103,"Latitude":63.42837752,"Longitude":10.4192463,"Date":"12/12/2015","Time":"16:04:34"},
            {"Id":104,"Latitude":63.42341051,"Longitude":10.41187992,"Date":"13/12/2015","Time":"17:04:34"},
            {"Id":105,"Latitude":63.42992486,"Longitude":10.37991563,"Date":"14/12/2015","Time":"18:04:34"},
            {"Id":106,"Latitude":63.41439937,"Longitude":10.40159176,"Date":"15/12/2015","Time":"19:04:34"},
            {"Id":107,"Latitude":63.41983606,"Longitude":10.36970523,"Date":"16/12/2015","Time":"20:04:34"},
            {"Id":108,"Latitude":63.41947346,"Longitude":10.38991174,"Date":"17/12/2015","Time":"21:04:34"},
            {"Id":109,"Latitude":63.42664217,"Longitude":10.36740229,"Date":"18/12/2015","Time":"22:04:34"},
            {"Id":110,"Latitude":63.42732976,"Longitude":10.38768127,"Date":"19/12/2015","Time":"23:04:34"},
            {"Id":111,"Latitude":63.4143586,"Longitude":10.40253759,"Date":"20/12/2015","Time":"00:04:34"},
            {"Id":112,"Latitude":63.43137251,"Longitude":10.39223335,"Date":"21/12/2015","Time":"01:04:34"},
            {"Id":113,"Latitude":63.42741037,"Longitude":10.36871033,"Date":"22/12/2015","Time":"02:04:34"},
            {"Id":114,"Latitude":63.41680825,"Longitude":10.41575286,"Date":"23/12/2015","Time":"03:04:34"},
            {"Id":115,"Latitude":63.42921116,"Longitude":10.40040058,"Date":"24/12/2015","Time":"04:04:34"},
            {"Id":116,"Latitude":63.42449447,"Longitude":10.39177515,"Date":"25/12/2015","Time":"05:04:34"},
            {"Id":117,"Latitude":63.42576426,"Longitude":10.41344244,"Date":"26/12/2015","Time":"06:04:34"},
            {"Id":118,"Latitude":63.41438234,"Longitude":10.41579156,"Date":"27/12/2015","Time":"07:04:34"},
            {"Id":119,"Latitude":63.42073263,"Longitude":10.41311139,"Date":"28/12/2015","Time":"08:04:34"},
            {"Id":120,"Latitude":63.42326871,"Longitude":10.37450296,"Date":"29/12/2015","Time":"09:04:34"},
            {"Id":121,"Latitude":63.42987028,"Longitude":10.40252631,"Date":"30/12/2015","Time":"10:04:34"},
            {"Id":122,"Latitude":63.41967901,"Longitude":10.41619758,"Date":"31/12/2015","Time":"11:04:34"},
            {"Id":123,"Latitude":63.430447,"Longitude":10.40584653,"Date":"01/01/2016","Time":"12:04:34"},
            {"Id":124,"Latitude":63.41792323,"Longitude":10.41196841,"Date":"02/01/2016","Time":"13:04:34"},
            {"Id":125,"Latitude":63.42536792,"Longitude":10.36753767,"Date":"03/01/2016","Time":"14:04:34"},
            {"Id":126,"Latitude":63.42024193,"Longitude":10.40274847,"Date":"04/01/2016","Time":"15:04:34"},
            {"Id":127,"Latitude":63.42171175,"Longitude":10.38976703,"Date":"05/01/2016","Time":"16:04:34"},
            {"Id":128,"Latitude":63.43104665,"Longitude":10.39999949,"Date":"06/01/2016","Time":"17:04:34"},
            {"Id":129,"Latitude":63.41714279,"Longitude":10.37599723,"Date":"07/01/2016","Time":"18:04:34"},
            {"Id":130,"Latitude":63.4228475,"Longitude":10.39083421,"Date":"08/01/2016","Time":"19:04:34"},
            {"Id":131,"Latitude":63.42584958,"Longitude":10.37126083,"Date":"09/01/2016","Time":"20:04:34"},
            {"Id":132,"Latitude":63.43288871,"Longitude":10.37619354,"Date":"10/01/2016","Time":"21:04:34"},
            {"Id":133,"Latitude":63.43300111,"Longitude":10.37596506,"Date":"11/01/2016","Time":"22:04:34"},
            {"Id":134,"Latitude":63.42526403,"Longitude":10.41609943,"Date":"12/01/2016","Time":"23:04:34"},
            {"Id":135,"Latitude":63.42017445,"Longitude":10.39480614,"Date":"13/01/2016","Time":"00:04:34"},
            {"Id":136,"Latitude":63.42340155,"Longitude":10.38698599,"Date":"14/01/2016","Time":"01:04:34"},
            {"Id":137,"Latitude":63.42407816,"Longitude":10.3671426,"Date":"15/01/2016","Time":"02:04:34"},
            {"Id":138,"Latitude":63.41509668,"Longitude":10.3973955,"Date":"16/01/2016","Time":"03:04:34"},
            {"Id":139,"Latitude":63.41656411,"Longitude":10.37096147,"Date":"17/01/2016","Time":"04:04:34"},
            {"Id":140,"Latitude":63.41979342,"Longitude":10.3825559,"Date":"18/01/2016","Time":"05:04:34"},
            {"Id":141,"Latitude":63.42103533,"Longitude":10.41320579,"Date":"19/01/2016","Time":"06:04:34"},
            {"Id":142,"Latitude":63.42525146,"Longitude":10.37354573,"Date":"20/01/2016","Time":"07:04:34"},
            {"Id":143,"Latitude":63.41797112,"Longitude":10.4178252,"Date":"21/01/2016","Time":"08:04:34"},
            {"Id":144,"Latitude":63.43115122,"Longitude":10.4230743,"Date":"22/01/2016","Time":"09:04:34"},
            {"Id":145,"Latitude":63.42309941,"Longitude":10.42067995,"Date":"23/01/2016","Time":"10:04:34"},
            {"Id":146,"Latitude":63.43255624,"Longitude":10.39232677,"Date":"24/01/2016","Time":"11:04:34"},
            {"Id":147,"Latitude":63.42962331,"Longitude":10.40516842,"Date":"25/01/2016","Time":"12:04:34"},
            {"Id":148,"Latitude":63.41735113,"Longitude":10.41830815,"Date":"26/01/2016","Time":"13:04:34"},
            {"Id":149,"Latitude":63.41351297,"Longitude":10.37371875,"Date":"27/01/2016","Time":"14:04:34"},
            {"Id":150,"Latitude":63.4119568,"Longitude":10.41828532,"Date":"28/01/2016","Time":"15:04:34"},
            {"Id":151,"Latitude":63.42285875,"Longitude":10.39250521,"Date":"29/01/2016","Time":"16:04:34"},
            {"Id":152,"Latitude":63.43499062,"Longitude":10.39149498,"Date":"30/01/2016","Time":"17:04:34"},
            {"Id":153,"Latitude":63.4133813,"Longitude":10.37247205,"Date":"31/01/2016","Time":"18:04:34"},
            {"Id":154,"Latitude":63.43420075,"Longitude":10.40486897,"Date":"01/02/2016","Time":"19:04:34"},
            {"Id":155,"Latitude":63.42422177,"Longitude":10.36995746,"Date":"02/02/2016","Time":"20:04:34"},
            {"Id":156,"Latitude":63.42289618,"Longitude":10.37264533,"Date":"03/02/2016","Time":"21:04:34"},
            {"Id":157,"Latitude":63.42018526,"Longitude":10.38366481,"Date":"04/02/2016","Time":"22:04:34"},
            {"Id":158,"Latitude":63.42593099,"Longitude":10.40351201,"Date":"05/02/2016","Time":"23:04:34"},
            {"Id":159,"Latitude":63.43158114,"Longitude":10.37195442,"Date":"06/02/2016","Time":"00:04:34"},
            {"Id":160,"Latitude":63.41915195,"Longitude":10.42391064,"Date":"07/02/2016","Time":"01:04:34"},
            {"Id":161,"Latitude":63.43214987,"Longitude":10.38921711,"Date":"08/02/2016","Time":"02:04:34"},
            {"Id":162,"Latitude":63.42124679,"Longitude":10.4031683,"Date":"09/02/2016","Time":"03:04:34"},
            {"Id":163,"Latitude":63.41504807,"Longitude":10.3711697,"Date":"10/02/2016","Time":"04:04:34"},
            {"Id":164,"Latitude":63.43352622,"Longitude":10.3860235,"Date":"11/02/2016","Time":"05:04:34"},
            {"Id":165,"Latitude":63.42330351,"Longitude":10.38430985,"Date":"12/02/2016","Time":"06:04:34"},
            {"Id":166,"Latitude":63.42466874,"Longitude":10.40497879,"Date":"13/02/2016","Time":"07:04:34"},
            {"Id":167,"Latitude":63.41295689,"Longitude":10.42123346,"Date":"14/02/2016","Time":"08:04:34"},
            {"Id":168,"Latitude":63.43466568,"Longitude":10.36718894,"Date":"15/02/2016","Time":"09:04:34"},
            {"Id":169,"Latitude":63.4333808,"Longitude":10.41516503,"Date":"16/02/2016","Time":"10:04:34"},
            {"Id":170,"Latitude":63.41878219,"Longitude":10.39122981,"Date":"17/02/2016","Time":"11:04:34"},
            {"Id":171,"Latitude":63.42670705,"Longitude":10.40442651,"Date":"18/02/2016","Time":"12:04:34"},
            {"Id":172,"Latitude":63.42550825,"Longitude":10.37032598,"Date":"19/02/2016","Time":"13:04:34"},
            {"Id":173,"Latitude":63.4140621,"Longitude":10.36956159,"Date":"20/02/2016","Time":"14:04:34"},
            {"Id":174,"Latitude":63.42547416,"Longitude":10.38429091,"Date":"21/02/2016","Time":"15:04:34"},
            {"Id":175,"Latitude":63.42261212,"Longitude":10.39750487,"Date":"22/02/2016","Time":"16:04:34"},
            {"Id":176,"Latitude":63.43245542,"Longitude":10.40028213,"Date":"23/02/2016","Time":"17:04:34"},
            {"Id":177,"Latitude":63.429141,"Longitude":10.41027218,"Date":"24/02/2016","Time":"18:04:34"},
            {"Id":178,"Latitude":63.43381539,"Longitude":10.39036009,"Date":"25/02/2016","Time":"19:04:34"},
            {"Id":179,"Latitude":63.41460817,"Longitude":10.40445349,"Date":"26/02/2016","Time":"20:04:34"},
            {"Id":180,"Latitude":63.42450216,"Longitude":10.41143818,"Date":"27/02/2016","Time":"21:04:34"},
            {"Id":181,"Latitude":63.41752567,"Longitude":10.39970139,"Date":"28/02/2016","Time":"22:04:34"},
            {"Id":182,"Latitude":63.43433587,"Longitude":10.38046954,"Date":"29/02/2016","Time":"23:04:34"},
            {"Id":183,"Latitude":63.41764332,"Longitude":10.36880926,"Date":"01/03/2016","Time":"00:04:34"},
            {"Id":184,"Latitude":63.4292742,"Longitude":10.37868756,"Date":"02/03/2016","Time":"01:04:34"},
            {"Id":185,"Latitude":63.42559387,"Longitude":10.40362973,"Date":"03/03/2016","Time":"02:04:34"},
            {"Id":186,"Latitude":63.42702662,"Longitude":10.37818756,"Date":"04/03/2016","Time":"03:04:34"},
            {"Id":187,"Latitude":63.42718415,"Longitude":10.39593007,"Date":"05/03/2016","Time":"04:04:34"},
            {"Id":188,"Latitude":63.42629926,"Longitude":10.3952734,"Date":"06/03/2016","Time":"05:04:34"},
            {"Id":189,"Latitude":63.43438352,"Longitude":10.3817998,"Date":"07/03/2016","Time":"06:04:34"},
            {"Id":190,"Latitude":63.4311324,"Longitude":10.36703202,"Date":"08/03/2016","Time":"07:04:34"},
            {"Id":191,"Latitude":63.43154051,"Longitude":10.41730587,"Date":"09/03/2016","Time":"08:04:34"},
            {"Id":192,"Latitude":63.42242017,"Longitude":10.41037252,"Date":"10/03/2016","Time":"09:04:34"},
            {"Id":193,"Latitude":63.42624751,"Longitude":10.42314206,"Date":"11/03/2016","Time":"10:04:34"},
            {"Id":194,"Latitude":63.42476416,"Longitude":10.41820461,"Date":"12/03/2016","Time":"11:04:34"},
            {"Id":195,"Latitude":63.42682574,"Longitude":10.40233914,"Date":"13/03/2016","Time":"12:04:34"},
            {"Id":196,"Latitude":63.41732167,"Longitude":10.37363273,"Date":"14/03/2016","Time":"13:04:34"},
            {"Id":197,"Latitude":63.42502497,"Longitude":10.39464092,"Date":"15/03/2016","Time":"14:04:34"},
            {"Id":198,"Latitude":63.43198078,"Longitude":10.38786449,"Date":"16/03/2016","Time":"15:04:34"},
            {"Id":199,"Latitude":63.42185856,"Longitude":10.37427442,"Date":"17/03/2016","Time":"16:04:34"},
            {"Id":200,"Latitude":63.43327941,"Longitude":10.38215158,"Date":"18/03/2016","Time":"17:04:34"},
            {"Id":201,"Latitude":63.41964595,"Longitude":10.36965417,"Date":"19/03/2016","Time":"18:04:34"},
            {"Id":202,"Latitude":63.43098282,"Longitude":10.38466544,"Date":"20/03/2016","Time":"19:04:34"},
            {"Id":203,"Latitude":63.4340632,"Longitude":10.42159655,"Date":"21/03/2016","Time":"20:04:34"},
            {"Id":204,"Latitude":63.42068613,"Longitude":10.42086006,"Date":"22/03/2016","Time":"21:04:34"},
            {"Id":205,"Latitude":63.42052788,"Longitude":10.38656496,"Date":"23/03/2016","Time":"22:04:34"},
            {"Id":206,"Latitude":63.42746804,"Longitude":10.38510741,"Date":"24/03/2016","Time":"23:04:34"},
            {"Id":207,"Latitude":63.41767458,"Longitude":10.38298114,"Date":"25/03/2016","Time":"00:04:34"},
            {"Id":208,"Latitude":63.43325107,"Longitude":10.37925315,"Date":"26/03/2016","Time":"01:04:34"},
            {"Id":209,"Latitude":63.42530316,"Longitude":10.38234668,"Date":"27/03/2016","Time":"02:04:34"},
            {"Id":210,"Latitude":63.4244304,"Longitude":10.39124156,"Date":"28/03/2016","Time":"03:04:34"},
            {"Id":211,"Latitude":63.42346174,"Longitude":10.39707445,"Date":"29/03/2016","Time":"04:04:34"},
            {"Id":212,"Latitude":63.41944543,"Longitude":10.40490562,"Date":"30/03/2016","Time":"05:04:34"},
            {"Id":213,"Latitude":63.42093192,"Longitude":10.40624071,"Date":"31/03/2016","Time":"06:04:34"},
            {"Id":214,"Latitude":63.42295104,"Longitude":10.37706881,"Date":"01/04/2016","Time":"07:04:34"},
            {"Id":215,"Latitude":63.41368819,"Longitude":10.39160552,"Date":"02/04/2016","Time":"08:04:34"},
            {"Id":216,"Latitude":63.42226351,"Longitude":10.37533155,"Date":"03/04/2016","Time":"09:04:34"},
            {"Id":217,"Latitude":63.41836828,"Longitude":10.39979898,"Date":"04/04/2016","Time":"10:04:34"},
            {"Id":218,"Latitude":63.4163018,"Longitude":10.39823477,"Date":"05/04/2016","Time":"11:04:34"},
            {"Id":219,"Latitude":63.41443319,"Longitude":10.39953598,"Date":"06/04/2016","Time":"12:04:34"},
            {"Id":220,"Latitude":63.41700621,"Longitude":10.3684971,"Date":"07/04/2016","Time":"13:04:34"},
            {"Id":221,"Latitude":63.42908343,"Longitude":10.41439707,"Date":"08/04/2016","Time":"14:04:34"},
            {"Id":222,"Latitude":63.42496795,"Longitude":10.37406635,"Date":"09/04/2016","Time":"15:04:34"},
            {"Id":223,"Latitude":63.42798182,"Longitude":10.38648093,"Date":"10/04/2016","Time":"16:04:34"},
            {"Id":224,"Latitude":63.42149244,"Longitude":10.40968025,"Date":"11/04/2016","Time":"17:04:34"},
            {"Id":225,"Latitude":63.43116307,"Longitude":10.42040726,"Date":"12/04/2016","Time":"18:04:34"},
            {"Id":226,"Latitude":63.43378027,"Longitude":10.4037945,"Date":"13/04/2016","Time":"19:04:34"},
            {"Id":227,"Latitude":63.43271869,"Longitude":10.40228111,"Date":"14/04/2016","Time":"20:04:34"},
            {"Id":228,"Latitude":63.4163611,"Longitude":10.37223879,"Date":"15/04/2016","Time":"21:04:34"},
            {"Id":229,"Latitude":63.43486071,"Longitude":10.37551239,"Date":"16/04/2016","Time":"22:04:34"},
            {"Id":230,"Latitude":63.41454851,"Longitude":10.39251322,"Date":"17/04/2016","Time":"23:04:34"},
            {"Id":231,"Latitude":63.43491315,"Longitude":10.36989213,"Date":"18/04/2016","Time":"00:04:34"},
            {"Id":232,"Latitude":63.41211914,"Longitude":10.40076508,"Date":"19/04/2016","Time":"01:04:34"},
            {"Id":233,"Latitude":63.41631705,"Longitude":10.38094347,"Date":"20/04/2016","Time":"02:04:34"}]};


    var loadDummyPath = function() {
        return [{"Id":1,"Latitude":63.41716241,"Longitude":10.40317688,"Date":"01/10/2015","Time":"10:04:34"},
            {"Id":1,"Latitude":63.41714442,"Longitude":10.40308844,"Date":"01/10/2015","Time":"10:04:35"},
            {"Id":1,"Latitude":63.41717771,"Longitude":10.40312403,"Date":"01/10/2015","Time":"10:04:36"},
            {"Id":1,"Latitude":63.41706055,"Longitude":10.40318504,"Date":"01/10/2015","Time":"10:04:37"},
            {"Id":1,"Latitude":63.41706468,"Longitude":10.40307434,"Date":"01/10/2015","Time":"10:04:38"},
            {"Id":1,"Latitude":63.41712092,"Longitude":10.40315298,"Date":"01/10/2015","Time":"10:04:39"},
            {"Id":1,"Latitude":63.41709071,"Longitude":10.40316451,"Date":"01/10/2015","Time":"10:04:40"},
            {"Id":1,"Latitude":63.41712077,"Longitude":10.40282002,"Date":"01/10/2015","Time":"10:04:41"},
            {"Id":1,"Latitude":63.41713666,"Longitude":10.40287106,"Date":"01/10/2015","Time":"10:04:42"},
            {"Id":1,"Latitude":63.41709859,"Longitude":10.40295472,"Date":"01/10/2015","Time":"10:04:43"}]};



});