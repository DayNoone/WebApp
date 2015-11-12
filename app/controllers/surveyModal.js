/* Modal used for creating a survey */

app.controller("surveyController", function($scope, $http, circles) {
    $scope.responseText = true;
    var service_URL = "https://tf2.sintef.no:8084/smioTest/api/";
    var uid = "sondre";
    var pw = "dabchick402";

    $scope.surveyPointArray = circles;
    console.log(circles[0].center.lat());

    $scope.controller = this;
    $scope.controller.uid = '';
    $scope.controller.token = '';
    $scope.controller.model = {
        type: 'text'
    };

    /* Function for saving information about a newly created survey. */

    $scope.save = function (question){

        var circlePoints = [];

        angular.forEach(circles, function(circle){
            tmpArr = {
                lat : circle.center.lat() + "",
                lon : circle.center.lng() + "",
                radius : circle.radius + ""
            }
            circlePoints.push(tmpArr);
        })

        console.log(circlePoints);
        if(!question.title){
            console.log("Please enter a title!");
            console.log("date: " + question.expirationDate);
            return;
        }

        if(question.type !== 'text' && question.type !== 'link'){
            if(!question.options || question.options.split('\n').length < 2){
                console.log("Please enter at least two options (one option per line) for this question type.");
                return;
            }
        }

        if(question.expirationDate !== null){
            //TODO: Expiration date on server side is one day earlier than what is sent - need to fix this(if we are going to use expiration date.
        }

        var finalQuestion = {
            expirationTimestamp: question.expirationDate,
            title: question.title,
            type: question.type,
            question: question.question,
            alternatives: question.options && question.type !== 'text' ? question.options.split('\n') : [],
            userIds: question.userIds? question.userIds.split(',') : [],
            anonymous: question.anonymous ? true : false,
            circles: circlePoints
        };

        for (var i = 0; i < finalQuestion.alternatives.length; i++)
            finalQuestion.alternatives[i] = finalQuestion.alternatives[i].trim();
        for (var i = 0; i < finalQuestion.userIds.length; i++)
            finalQuestion.userIds[i] = finalQuestion.userIds[i].trim();

        console.log("spørsmål: " + question);
        console.log(finalQuestion);

        /* Function for posting newly created surve to database */

        $http({
            method : 'POST',
            data : {username: uid, password:pw},
            url : service_URL})
            .success(function(data) {
                console.log("Success");
                console.log(data);
                userid = data['_id']
                token = data['token']
                $http.post(service_URL + 'questions', finalQuestion, {params: {uid: userid, token: token}}).
                    success(function(data){
                        console.log('Posted');
                        console.log(data)
                        $scope.controller.model = {
                            type: 'text'
                        };
                        //$rootScope.$emit('QuestionController.questionAdded', {});
                    }).
                    error(function(){
                        console.log('POST question failed');
                    });
            }).error(function(){
                console.log("POST failed");
            });
    };
});