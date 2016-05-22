require('mapbox.js')
require('mapbox-surface.js')

//Some global variables I'll need to keep the Mapbox Surface api calls in sync.
var parts , partData, partialData, i;
var surfaceAPIResponses = {results:[],attribution:''};
surfaceAPIResponses.attribution = "<a href='https://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox</a>";

var app = angular.module('tracks', []);

app.controller('TracksCtrl', function($scope) {
  $scope.loading = false;

  L.mapbox.accessToken = 'pk.eyJ1IjoiYm9iYnlzdWQiLCJhIjoiZlY0VElqTSJ9.gGJetUgdQKj64oeS5j9kzQ'
  map  = L.mapbox.map('map', 'bobbysud.iia43k9m')

  $scope.loadTrack = function(data){
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
                return 1
            }
        });        
    }

    //Init the counter and in how many parts the data will be splited to be able to make the API calls
    i=0
    parts = parseInt(data.length/299)
    partialData(parts,i=0)

    // Now lets create some markers ;)

    var hydrationPoint1 = [[-33.3613950, -70.5985090]];
    var hydrationPoint2 = [[-33.385845, -70.60188]];
    surface.getData(surfaceOptions, hydrationPoint1, function(error, response) {
        if (error) throw new Error(error);
        L.marker(response.results[0].latlng)
            .bindPopup("Hydration point 1 " + response.results[0].ele)
            .addTo(map);
    });

  }

});



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
                scope.$parent.loadTrack(contents)
              });
          };
          
          r.readAsText(files[0]);
        }
      });
    }
  };
});