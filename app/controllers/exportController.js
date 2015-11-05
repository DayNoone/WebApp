app.controller("exportController", function ($scope,$modalInstance, dataCollection) {

    $scope.selectedExports = [];
    $scope.idFilter = "";


    $scope.exportTypes = ['Veifeil', 'Ruter', 'Tur'];


    $scope.isSelected = function(id) {
        if($scope.selectedExports.indexOf(id) >-1) {
            return 'glyphicon glyphicon-ok-sign';
        }
        return false;
    }

    $scope.selectAll = function() {
        $scope.selectedExports = $scope.exportTypes.slice(0); //Clone array
    }
    $scope.unselectAll = function() {
        $scope.idFilter = "";
        $scope.selectedExports = [];
    }

    $scope.select = function(id) {
        if(id == 'Tur')
            $scope.idFilter = "";
        if($scope.selectedExports.indexOf(id) >-1) {
            $scope.selectedExports.splice($scope.selectedExports.indexOf(id),1);
        }else
        $scope.selectedExports.push(id);
    }

    $scope.close = function() {
        $modalInstance.dismiss('cancel')
    }

    var getHeaders = function(objEntries) {
        header = [];
        for (var key in objEntries) { //For each entry
            header.push(key);
        }
        if(header.indexOf('OS'))
            header.push('gender');

        return header;
    }

    $scope.finishAndExport = function() {
        angular.forEach($scope.selectedExports, function(type) {
            switch(type) {
                case 'Veifeil':
                    console.log('Eksporterer veifeil som csv');
                    csvStr = exportCSV(dataCollection.errors);
                    saveTextFile(csvStr);
                    break;
                case 'Ruter':
                    console.log('Eksporterer turer som csv');
                    csvStr = exportCSV(dataCollection.trips);
                    saveTextFile(csvStr);
                    break;
                case 'Tur':
                    console.log('Eksporterer 1 tur som csv');
                    trip = getTripByKey(dataCollection.trips, $scope.idFilter);
                    console.log(trip);
                    if(trip != null || trip.length == 0) {
                        csvStr = exportCSV(trip[0].tripData);
                        saveTextFile(csvStr);
                    }
                    break;
            }
        });

    }

    var saveTextFile = function(str) {
        window.open("data:text/csv;charset=utf-8," + encodeURIComponent(str));//should create file
    }

    var exportCSV = function(obj) {
        header = getHeaders(obj[0]);
        csvStr = '';
        angular.forEach(header, function(key){
            if(csvStr != '')
                csvStr+=',';
            csvStr+=key;
        })
        csvStr += '\r\n';
        angular.forEach(obj, function(entry){
            line = '';
            angular.forEach(header, function(key) {
                if(line != '')
                    line += ',';
                entryObj = entry[key];
                if(entryObj == null || entryObj == "")
                    entryObj = ""
                if(isJson(key))
                    line += "Inneholder turer";
                else
                    line += entryObj
            })
            csvStr += line + '\r\n';

        })
        return csvStr;
    }

    function isJson(str) {
        switch(str){
            case "tripData":
                return true;
        }
    }

    function getTripByKey(data, key) {
        return data.filter(
            function(data) {
                return data._id == key
            }
        );
    }


});