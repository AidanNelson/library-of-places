// API Key for MapboxGL. Get one here:
// https://www.mapbox.com/studio/account/tokens/
const key = 'pk.eyJ1Ijoid29vZGVud2Fnb24iLCJhIjoiY2swemNpY2diMG5qOTNjbzVtZmVycHd4dSJ9.TjuESz4lrhkcIP2cALvp4w';

// Options for map
const options = {
  lat: 38,
  lng: -95,
  zoom: 3.5,
  style: 'mapbox://styles/mapbox/traffic-night-v2',
  // pitch: 50,
};

// Create an instance of MapboxGL
const mappa = new Mappa('MapboxGL', key);
let myMap;
let canvas;

// have we set the route yet?
let routeSet = false;

// for use with routing
let origin = null;
let destination = null;

// html centerColumn div
let centerCol;

let renderedElements = [];

// current route lat/lng coordinates
let currRoute = [];


function setup() {
  centerCol = select("#centerCol");
  // createP('Click on any two points to define a route.').parent(centerCol);
  canvas = createCanvas(1000, 600).parent('canvasContainer');
  canvas.mouseClicked(clickOnMap);
  
  

  // Create a tile map and overlay the canvas on top.
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);
  myMap.onChange(drawCurrentRoute);
  
  createElement('br').parent(centerCol);

  let button = createButton('Reset');
  button.parent(centerCol);
  button.mousePressed(clearRoutes);
  button.addClass('resetButton');
  
  createElement('hr').parent(centerCol);

}



function clearRoutes(){
  clear(); // clear canvas of route
  
  // reset
  currRoute = [];
  origin=null;
  destination=null;
  routeSet = false;
  
  // remove dom elements
  removeRenderedElements();

}




function clickOnMap(){
  // get lat/lng for current mouse position
  let coord = myMap.fromPointToLatLng(mouseX,mouseY);
  
  if (routeSet){
    // route already set
  } else {
    // if we already have the origin:
    if (origin){
      // if we have already drawn a route:
      if (routeSet){
        // clearRoutes();
        // centerCol.remove();
      } else {
        destination = coord;
        drawCurrentRoute();

        searchByRoute();
        routeSet=true;
          
        // origin = null;
        // destination = null;
      }
    } else {
      origin = coord;
      drawCurrentRoute();
    }
  }
}


function searchByRoute(){
  // query for navigation:
  let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng}%2C${origin.lat}%3B${destination.lng}%2C${destination.lat}?access_token=${key}&geometries=geojson`;
  loadJSON(url,function(resp){
    // console.log(resp); 
    createElement('hr').parent(centerCol);
    if (resp.routes[0]){ // if such a route exists!
      console.log('Route found!');
      let route = resp.routes[0].geometry.coordinates;
      currRoute = route;
      drawCurrentRoute();
      getLocationInfo(route);
    } else {
      console.log('No Route found between ' + origin + ' and ' + destination);
    }
  });
}


// this function takes an array of coordinates in lat,lng and draws them to the map
function drawCurrentRoute(){
  clear();
  
  // draw origin and destination
  let col = color(255,100,150);
  fill(col);
  stroke(col);
  strokeWeight(2);
  
  if (origin) {
    let originXY = myMap.latLngToPixel(origin.lat, origin.lng);
    ellipse(originXY.x,originXY.y,10,10);
  }
  
  if (destination) {
    let destinationXY = myMap.latLngToPixel(destination.lat, destination.lng);
    ellipse(destinationXY.x,destinationXY.y,10,10);
  }
  
  
  let coords = currRoute;
  for (let i = 1; i < coords.length; i++){
    let c1 = coords[i-1];
    let c2 = coords[i];
    let p1 = myMap.latLngToPixel(c1[1],c1[0]);
    let p2 = myMap.latLngToPixel(c2[1],c2[0]);


    // make it look ok then draw the route
    let col = color(255,100,150);

    fill(col);
    stroke(col);
    strokeWeight(2);

    ellipse(p1.x,p1.y,5,5);
    line(p1.x,p1.y,p2.x,p2.y);   
  }
}



function getLocationInfo(coords){
   for (let i = 1; i < coords.length; i++){
    let coord = coords[i];
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coord[0]}%2C${coord[1]}.json?access_token=${key}`;
      loadJSON(url, function(resp){
        // console.log(resp.features[0].context);
        let id = resp.features[0].context[1].id;
        // if 'id' contains 'place,' then id is a city name
        if (match(id, 'place')){
          let cityName = resp.features[0].context[1].text;
          let stateName = resp.features[0].context[2].text

          findRandomImage(cityName,stateName);
        } else {
          // try the next one
         id = resp.features[0].context[2].id; 
          if (match(id, 'place')){
          let cityName = resp.features[0].context[2].text;
          let stateName = resp.features[0].context[3].text

          findRandomImage(cityName,stateName);
        }
        }
      });
   }
}




function findRandomImage(cityName, stateName){
  let query = cityName + '%2C+' + stateName;
  // let url = `https://www.loc.gov/photos/?q=${query}&fo=json`;
  let url = `https://www.loc.gov/photos/?fa=location:${cityName}%7Clocation:${stateName}&fo=json`;
  loadJSON(url, function(resp){
      console.log(resp);
      if (resp.results.length > 0){
      let i = floor(random(resp.results.length));
      let imageURLs = resp.results[i].image_url;
      if (imageURLs.length <= 1){
        // only one img, thumbnail
        // let imageURL = "https:" + imageURLs[imageURLs.length];
      } else {
        let imageURL = "https:" + imageURLs[imageURLs.length-1];

        let date = resp.results[i].date;
        let nameElement;
        if (date){
          nameElement = createP(cityName + ", " + stateName + "  (" + date + ")").parent(centerCol);
        } else {
          nameElement = createP(cityName + ", " + stateName).parent(centerCol);
        }
        let link = createA(resp.results[i].id, "").parent(centerCol);

        imgElement = createImg(imageURL); 
        imgElement.parent(link);
        imgElement.style('maxWidth:800px;');

        // add a horizontal bar for styling purposes
        let hr = createElement('hr').parent(centerCol);
        
        // add all rendered p5 dom elements to this list, so we can reset them
        renderedElements.push(nameElement);
        renderedElements.push(link);
        renderedElements.push(imgElement);
        renderedElements.push(hr);
      }
    }
  });
}

function removeRenderedElements(){
 for (let i = 0; i < renderedElements.length; i++) {
  renderedElements[i].remove();
 }
}