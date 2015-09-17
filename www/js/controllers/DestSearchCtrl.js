/**
 * Created by jupiterli on 17/09/2015.
 */

trails_app.controller('DestSearchCtrl', function(
    $scope,
    googleMapsService,
    searchService,
    cacheDataService,
    loadingService,
    $ionicActionSheet,
    weatherService,
    geolocationService) {

    // collect user input for search, des address
    $scope.keyword = {};

    // hide function buttons like get weather before user searched something
    $('#buttons-panel-dest').hide("fast");

    // initialize google map
    var google_map = googleMapsService.createAGoogleMapByName("dest_search_map");

    $scope.doSearch = function() {
        $('#buttons-panel-dest').show(100);
        console.log("starting search on des");
        searchService.searchOnDestination(google_map, $scope.keyword.address, googleMapsService, cacheDataService, loadingService);
    };

    // used to show direction from current location to a trail
    // it first show every trail's name, user choose one, then
    // a route will display
    $scope.googleDirection = function () {
        var searchResult = cacheDataService.getRes();
        var buttons = [];
        for (var i = 0; i < searchResult.length; i++){
            buttons.push(
                {text : searchResult[i].IndividualTrail}
            );
        }

        $ionicActionSheet.show({
            buttons: buttons,
            titleText: 'Choose a trail',
            cancelText: 'Cancel',
            cancel: function() {
            },
            buttonClicked: function(index) {
                googleDirection(buttons[index].text);

            }
        });
    };


    var googleDirection = function (trailName){
        loadingService.startLoading();
        var trail = cacheDataService.getTrailsByName(trailName);
        if (trail.length != 1){
            // error occurs, more than one trail matched or no trail matched
            // both are not allowed
            // some error msg must be shown
            return;
        }
        geolocationService.getLocation().then(function(result) {
            var start = new google.maps.LatLng(result.lat, result.lng);
            var end = trail[0].google_poly[0].getPath().getAt(0);
            googleMapsService.calculateAndDisplayRoute(start, end, google_map);
            loadingService.finishLoading();
        });

    };

    var isWatchingOn = false;
    $scope.watchOn = function() {
        if (isWatchingOn) {
            isWatchingOn = false;
            stop_watchlocation();
        } else {
            isWatchingOn = true;
            initiate_watchlocation();
        }
    };

    var watchProcess = null;
    function initiate_watchlocation() {
        if (watchProcess == null) {
            loadingService.startLoading();
            watchProcess = navigator.geolocation.watchPosition(handle_geolocation_query, handle_errors);
        }
    }
    function stop_watchlocation() {
        if (watchProcess != null)
        {
            navigator.geolocation.clearWatch(watchProcess);
            watchProcess = null;
        }
    }
    function handle_errors(error)
    {
        switch(error.code)
        {
            case error.PERMISSION_DENIED: alert("user did not share geolocation data");
                break;
            case error.POSITION_UNAVAILABLE: alert("could not detect current position");
                break;
            case error.TIMEOUT: alert("retrieving position timedout");
                break;
            default: alert("unknown error");
                break;
        }
    }
    // for collect marker watch and erase previous one
    var marker_watch = null;
    function handle_geolocation_query(position) {
        if (marker_watch != null){
            marker_watch.setMap(null);
        }

        marker_watch = new google.maps.Marker({
            position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
            map: google_map
        });
        google_map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        loadingService.finishLoading();
    }

    $scope.display_weather = function() {
        loadingService.startLoading();
        var trails = cacheDataService.getRes();
        var map = cacheDataService.getMap();
        for (var i = 0; i < trails.length; i++){
            // get weather condition
            weatherService.getWeather( map, trails[i], loadingService);

        }

    };

    $scope.partialMatchedAddresses = [];
    $scope.getAddress = function() {
        googleMapsService.getAddressByAddress($scope.keyword.address).then(function(results) {
            $scope.partialMatchedAddresses = results;
        });
    };

    $scope.input_changed = function() {
        // for debugging
        console.log("des search input changed to " + $scope.keyword.address);
        if ($scope.keyword.address.trim(' ').length == 0) {
            $scope.partialMatchedAddresses = [];
            $('#suggestion_des').hide("fast");
            return;
        }
        $scope.getAddress();

        $('#suggestion_des').show(100);

        $('#dest_search_map').click(function() {
            $('#suggestion_des').hide("fast");
        });
    };

    $scope.suggestSearch = function(address) {
        $scope.keyword.address = address;
        $('#suggestion_des').hide("fast");
        $scope.doSearch();
    }

});
