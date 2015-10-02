app.controller('view2', function($scope) {
    var mapOptions = {
        zoom: 14,
        center: new google.maps.LatLng(63.4174652, 10.4043239),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    }

    $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
});