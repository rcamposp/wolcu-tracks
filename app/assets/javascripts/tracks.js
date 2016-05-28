var d3 = require('d3')
require('mapbox.js')
require('mapbox-surface.js')

//Some global variables I'll need to keep the Mapbox Surface api calls in sync.
var parts , partData, partialData, i;
var surfaceAPIResponses = {results:[],attribution:''};
surfaceAPIResponses.attribution = "<a href='https://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox</a>";

var app = angular.module('tracks', []);

app.controller('TracksCtrl', ['$scope', '$http', function($scope, $http) { 
  
  $scope.loading = false;
  $scope.track = {markers:[]}
  $scope.track.markers.push({lon:"",lat:"",title:"",description:""})    

  L.mapbox.accessToken = 'pk.eyJ1IjoiYm9iYnlzdWQiLCJhIjoiZlY0VElqTSJ9.gGJetUgdQKj64oeS5j9kzQ'
  map  = L.mapbox.map('map', 'bobbysud.iia43k9m')

  $scope.init = function(track_data, markers_data, showMarkersControls){        
    $scope.track = angular.fromJson(track_data)    
    console.log(markers_data)
    $scope.track.markers = angular.fromJson(markers_data)  
    if($scope.track.gpx != null){         
      d3.text('/uploads/'+$scope.track.gpx, function(str) {        
        $scope.loadTrack(str, showMarkersControls);
      })
    }
  }

  $scope.loadTrack = function(data, showMarkersControls){
    $scope.loading = true;
    var dom = (new DOMParser()).parseFromString(data, 'text/xml');    
    var gpx2geojson = require('togeojson').gpx;
    var geojson = gpx2geojson(dom)
    
    var data = geojson.features[0].geometry.coordinates;
    
    for(i=0;i<data.length;i++){
        data[i].splice(2,1);
        data[i].reverse();
    } 

    map.setView([-33.3688920,-70.5972950], 14)

    var surface = L.mapbox.surface();

    var surfaceOptions = {
        mapid: 'mapbox.mapbox-terrain-v1',
        layer: 'contour',
        fields: ['ele', 'index']
    }; 
    

    /*Where the magic happens: This recursive function splits the array of coordinates so that I can query 
    the surface API the times needed to get the elevation of all the points. This function is called further down around line 125*/
    partialData = function partialDataCall(parts, i){
        partData = data.splice(0,300);         
        surface.getData(surfaceOptions, partData, function(error, response) {                        
            if (error) throw new Error(error);                                    
                        
            //Store the current response on a global array so I can graph all the data together
            for(j=0;j<response.results.length;j++){
                response.results[j].id=(i*299)+j
                if(i>0){                    
                    response.results[j].distance += surfaceAPIResponses.results[i*299].distance              
                }
                surfaceAPIResponses.results.push(response.results[j])           
            }

            //If im still missing some queries, call the function again recursively.
            if(i<parts){partialDataCall(parts,i+1)}
            //Else, Im done quering the surface API and now I can graph the data =D
            else{                                             
                var elevationChart = L.mapbox.surface.chart({
                    position: 'topright',
                    chartType: 'area',
                    yAxis: {
                        data: 'ele',
                        units: 'm',
                    }
                }, surfaceAPIResponses).addTo(map);
                
                L.mapbox.surface.line({
                    chart: elevationChart,
                    color: 'orange',
                    weight: 2
                }, surfaceAPIResponses.results).addTo(map);    
                $scope.$apply(function(){
                  $scope.loading = false;
                });                                            
                return 1
            }
        });        
    }

    //Init the counter and in how many parts the data will be splited to be able to make the API calls
    i=0
    parts = parseInt(data.length/299)
    partialData(parts,i=0)    
    console.log($scope.track.markers)
    for(index=0;index<$scope.track.markers.length;index++){
      var marker = [[parseFloat($scope.track.markers[index].lat),parseFloat($scope.track.markers[index].lon)]]      
      console.log(marker)
      if(marker[0][0] != null && marker[0][1] != null){        
        surface.getData(surfaceOptions, marker, function(error, response) {
            if (error) throw new Error(error);
            console.log(response)
            L.marker(response.results[0].latlng)
                .bindPopup("Hydration point 1 " + response.results[0].ele)
                .addTo(map);
        });        
      }      
    }
    
    //Show controls to pin markers on map
    if(showMarkersControls){
      $scope.drawMarkers()
    }
  }

  //All the markers store in map._layers (map._layers[68]._shadow.className)
  $scope.drawMarkers = function(){
    var featureGroup = L.featureGroup().addTo(map);
    // Define polyline options
    // http://leafletjs.com/reference.html#polyline
    var polyline_options = {
        color: '#000'
    };

    var drawControl = new L.Control.Draw({
      edit: {
          featureGroup: featureGroup,
          edit: true
      },
      draw: {
          polyline: false,
          circle: false,
          polygon: false,
          rectangle: false,        
      }
    }).addTo(map);

    //Do something after creating a marker
    map.on('draw:created', function(e) {
        featureGroup.addLayer(e.layer);
        console.log(e)
        var data = e.layer._latlng;
        if (data) {
          console.log(data)
          //allData.push([data.lat, data.lng]);
        }
    });  
  }

  $scope.saveTrack = function(event){
    $scope.track.markers = []
    for (var key in map._layers) {
      if (map._layers.hasOwnProperty(key) && map._layers[key].hasOwnProperty("_icon")) {        
          if(angular.element(map._layers[key]._icon).hasClass('leaflet-marker-icon')){              
            $scope.track.markers.push({lon:map._layers[key]._latlng.lng,lat:map._layers[key]._latlng.lat,title:"",description:""})                        
          }
      }
    }
    for(i=0;i<map._layers.length; i++){
      console.log(map._layers[i]._shadow)
    }
    //event.preventDefault();
    return true;

  }
}]);



app.directive('fileReader', function() {
  return {
    scope: {
      fileReader:"="      
    },
    link: function(scope, element) {            
      $(element).on('change', function(changeEvent) {                 
        scope.$apply(function () {
              scope.fileReader = true;
            });
        var files = changeEvent.target.files;
        if (files.length) {
          var r = new FileReader();                    
          r.onload = function(e) {              
              var contents = e.target.result;
              scope.$apply(function () {
                scope.fileReader = contents;
                scope.$parent.loadTrack(contents,true)
              });
          };
          
          r.readAsText(files[0]);
        }
      });
    }
  };
});