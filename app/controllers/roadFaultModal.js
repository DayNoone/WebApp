app.controller("roadFaults", function($scope, obj) {
    $scope.selectedCluster= obj;
    console.log(obj);

    $scope.error;

    $scope.image = new Image();

    $scope.setError = function(error) {
        $scope.error = error;
        $scope.image.src = 'data:image/png;base64,'+error.image;
        if($scope.image.src == "data:image/png;base64,undefined"){
            $scope.image.src = 'resources/noimage.png';
        }
        console.log($scope.image.src);
    }

    $scope.dataClicked = {"userId":39,"lat":63.42945947,"lon":10.39348956,"timestamp":"09/10/2015/00:04:34", "image": 'resources/voldemort.png', "description":"Problem description: He who's face must have an error of 404: nose not found."};


    $scope.hasImage = function(error){
        if(error.image != null) {
            var image = 'glyphicon glyphicon-ok-sign center-block'
            return image;
        }else return false;
    }

});