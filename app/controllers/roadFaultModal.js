app.controller("roadFaults", function ($scope,$modalInstance, obj) {
    $scope.selectedCluster = obj;
    console.log(obj);

    $scope.error;

    $scope.image = new Image();

/**
 * Function called when choosing an error from the error table. The parameter error will be the selected error.
 * Image is here converted from the bas64 format to a presentable format for web-browsers.
 * @param error The error selected
*/
    $scope.setError = function (error) {
        if(error.description.length < 5) {error.desscription = "Ingen beskrivelse tilgjengelig"}
        $scope.error = error;
        $scope.image.src = 'data:image/png;base64,' + error.image;
        if ($scope.image.src == "data:image/png;base64,undefined") {
            $scope.image.src = 'resources/noimage.png';
        }
        console.log($scope.image.src);
    }

    $scope.dataClicked = {
        "userId": 39,
        "lat": 63.42945947,
        "lon": 10.39348956,
        "timestamp": "09/10/2015/00:04:34",
        "image": 'resources/voldemort.png',
        "description": "Problem description: He who's face must have an error of 404: nose not found."
    };

    /** Returns icon if error has image
     *
     * @param error Current error
     * @returns {*}
     */
    $scope.hasImage = function (error) {
        if (error.image != null) {
            var image = 'glyphicon glyphicon-ok-sign'
            return image;
        } else return false;
    }

    $scope.close = function() {
        $modalInstance.dismiss('cancel')
    }
});