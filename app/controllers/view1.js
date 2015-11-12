app.controller('surveyView', function($scope, $http) {
    $scope.surveys = null;

    function connect() {
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
                $http.get(service_URL + 'questionsAll', {params: {uid: userid, token: token}}).
                    success(function (data) {
                        console.log('Loaded surveys');
                        console.log(data)
                        $scope.surveys = data;
                    }).
                    error(function () {
                        console.log('GET surveys failed');
                    });
            }).error(function () {
                console.log("POST failed");
            });
    }

    connect()


/**
* Function called when choosing a survey from the infoWindowContent.
*
* */
    $scope.setSurvey = function (survey) {
        $scope.emptySurvey = false;
        $scope.boolSurvey = false;
        if (survey.answers.length == 0) {
            $scope.emptySurvey = true;
        }
        console.log("emptysur" + $scope.emptySurvey)
        if (survey.type == 'check' || survey.type == 'radio') {
            $scope.boolSurvey = true;
            $scope.yesCount = 0;
            $scope.noCount = 0;

            angular.forEach(survey.answers, function (answer) {
                if (answer == 'Ja') {
                    $scope.yesCount++;
                } else {
                    $scope.noCount++;
                }
            });
        }
        $scope.survey = survey;
    }
});