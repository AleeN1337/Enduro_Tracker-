import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { EnduroSpot, UserLocation } from "../types";

interface OpenStreetMapSimpleProps {
  location: UserLocation | null;
  spots: EnduroSpot[];
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (spot: EnduroSpot) => void;
  onNavigateToSpot?: (destination: {
    latitude: number;
    longitude: number;
    name: string;
  }) => void;
}

const OpenStreetMapSimple: React.FC<OpenStreetMapSimpleProps> = ({
  location,
  spots,
  onMapPress,
  onMarkerPress,
  onNavigateToSpot,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  console.log(
    "OpenStreetMapSimple rendering with location:",
    location,
    "spots count:",
    spots.length
  );

  // Update user location in WebView when location changes
  useEffect(() => {
    if (mapReady && location && webViewRef.current) {
      const script = `
        if (window.updateUserLocation) {
          window.updateUserLocation(${JSON.stringify(location)});
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [location, mapReady]);

  // Generate HTML content for OpenStreetMap with Leaflet
  const generateMapHTML = () => {
    const centerLat = location?.latitude || 50.0755; // Praha default
    const centerLng = location?.longitude || 14.4378;

    const spotsData = spots.map((spot) => ({
      id: spot.id,
      lat: spot.latitude,
      lng: spot.longitude,
      name: spot.name,
      difficulty: spot.difficulty,
      categories: spot.categories,
    }));

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enduro Tracker - OpenStreetMap</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <style>
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                overflow: hidden;
                background: #1a1a1a;
            }
            #map { 
                width: 100%; 
                height: 100vh; 
            }
            
            /* Dark theme dla popupów */
            .leaflet-popup-content-wrapper {
                background: #2a2a2a;
                color: white;
                border-radius: 8px;
                border: 1px solid #444;
            }
            .leaflet-popup-content {
                margin: 12px 16px;
                font-family: Arial, sans-serif;
                font-size: 14px;
            }
            .leaflet-popup-tip {
                background: #2a2a2a;
            }
            
            /* Style dla spotów */
            .spot-name {
                font-weight: bold;
                color: #FF6B35;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .spot-difficulty {
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
                margin-bottom: 8px;
                color: white;
                font-weight: bold;
            }
            .difficulty-easy { background: #4CAF50; }
            .difficulty-moderate { background: #FF9800; }
            .difficulty-hard { background: #F44336; }
            .difficulty-extreme { background: #9C27B0; }
            
            /* Przyciski nawigacji */
            .nav-button {
                background: #FF6B35;
                color: white;
                border: none;
                padding: 12px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                width: 100%;
                margin: 4px 0;
                transition: background 0.2s;
            }
            .nav-button:hover {
                background: #FF8E53;
            }
            .nav-button.gps {
                background: #4CAF50;
            }
            .nav-button.gps:hover {
                background: #66BB6A;
            }
            .nav-button.clear {
                background: #666;
                font-size: 12px;
                padding: 8px 12px;
            }
            .nav-button.clear:hover {
                background: #888;
            }
            
            /* Dark theme dla kontrolek */
            .leaflet-control-attribution {
                background: rgba(42, 42, 42, 0.8);
                color: #ccc;
                font-size: 10px;
            }
            .leaflet-control-zoom a {
                background: #2a2a2a;
                color: #FF6B35;
                border: 1px solid #444;
            }
            .leaflet-control-zoom a:hover {
                background: #FF6B35;
                color: white;
            }
            
            /* Ukryj domyślny routing control UI */
            .leaflet-routing-container {
                display: none !important;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        
        <script>
            console.log('OpenStreetMap Simple loading...');
            let map;
            let routingControl = null;
            let currentRouteMarkers = [];
            let currentRouteLine = null;
            let liveNavigationActive = false;
            let liveNavigationTarget = null;
            let userMarker = null;
            
            // Initialize OpenStreetMap with Leaflet
            function initMap() {
                console.log('Initializing OpenStreetMap...');
                
                // Create map
                map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
                
                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    maxZoom: 17,
                    attribution: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
                }).addTo(map);
                
                // Add user location marker
                ${
                  location
                    ? `
                var userIcon = L.divIcon({
                    html: \`
                        <div style="
                            width: 20px; 
                            height: 20px; 
                            background: #FF6B35; 
                            border: 3px solid white; 
                            border-radius: 50%; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">
                            <div style="
                                width: 6px; 
                                height: 6px; 
                                background: white; 
                                border-radius: 50%; 
                                margin: 4px auto;
                            "></div>
                        </div>\`,
                    className: 'user-location-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                L.marker([${centerLat}, ${centerLng}], {icon: userIcon})
                    .addTo(map)
                    .bindPopup('<b>Twoja lokalizacja</b>');
                `
                    : ""
                }
                
                // Add spot markers
                var spots = ${JSON.stringify(spotsData)};
                var userLocation = ${
                  location ? JSON.stringify(location) : "null"
                };
                
                console.log('Adding', spots.length, 'spots to map');
                spots.forEach(function(spot) {
                    var difficultyColor = getDifficultyColor(spot.difficulty);
                    var categoryIcon = getCategoryIcon(spot.categories[0] || 'climb');
                    
                    var spotIcon = L.divIcon({
                        html: \`
                            <div style="
                                width: 24px; 
                                height: 32px; 
                                background: \${difficultyColor}; 
                                border: 2px solid white; 
                                border-radius: 50% 50% 50% 0; 
                                transform: rotate(-45deg); 
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                position: relative;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 3px;
                                    left: 3px;
                                    width: 14px;
                                    height: 14px;
                                    background: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: \${difficultyColor};
                                    transform: rotate(45deg);
                                ">\${categoryIcon}</div>
                            </div>\`,
                        className: 'spot-marker',
                        iconSize: [24, 32],
                        iconAnchor: [12, 32]
                    });
                    
                    var marker = L.marker([spot.lat, spot.lng], {icon: spotIcon}).addTo(map);
                    
                    // Create popup content with navigation buttons
                    var popupContent = \`
                        <div class="spot-name">\${spot.name}</div>
                        <div class="spot-difficulty difficulty-\${spot.difficulty}">
                            \${getDifficultyLabel(spot.difficulty)}
                        </div>
                        <div style="margin: 8px 0; color: #ccc; font-size: 12px;">
                            Kategorie: \${spot.categories.map(cat => getCategoryLabel(cat)).join(', ')}
                        </div>
                        <button class="nav-button" onclick="showRoute(\${spot.lat}, \${spot.lng}, '\${spot.name}')">
                            🗺️ Pokaż trasę na żywo
                        </button>\`;
                    
                    marker.bindPopup(popupContent);
                    
                    // Handle marker click
                    marker.on('click', function() {
                        console.log('Marker clicked:', spot.name);
                        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'markerPress',
                            spot: spot
                        }));
                    });
                });
                
                // Map click handler
                map.on('click', function(e) {
                    console.log('Map clicked at:', e.latlng.lat, e.latlng.lng);
                    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapPress',
                        coordinate: {
                            latitude: e.latlng.lat,
                            longitude: e.latlng.lng
                        }
                    }));
                });
                
                console.log('OpenStreetMap initialized successfully');
                // Notify React Native that map is ready
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapReady'
                }));
            }
            
            // Utility functions
            function getDifficultyColor(difficulty) {
                switch(difficulty) {
                    case 'easy': return '#4CAF50';
                    case 'moderate': return '#FF9800';
                    case 'hard': return '#F44336';
                    case 'extreme': return '#9C27B0';
                    default: return '#2196F3';
                }
            }
            
            function getDifficultyLabel(difficulty) {
                switch(difficulty) {
                    case 'easy': return 'Łatwy';
                    case 'moderate': return 'Średni';
                    case 'hard': return 'Trudny';
                    case 'extreme': return 'Ekstremalny';
                    default: return 'Nieznany';
                }
            }
            
            function getCategoryIcon(category) {
                switch(category) {
                    case 'climb': return '↗';
                    case 'technical': return '⚙';
                    case 'jump': return '✈';
                    case 'creek': return '≋';
                    case 'rocks': return '◆';
                    case 'mud': return '●';
                    default: return '📍';
                }
            }
            
            function getCategoryLabel(category) {
                switch(category) {
                    case 'climb': return 'Podjazd';
                    case 'technical': return 'Techniczny';
                    case 'jump': return 'Skok';
                    case 'creek': return 'Potok';
                    case 'rocks': return 'Kamienie';
                    case 'mud': return 'Błoto';
                    default: return 'Inne';
                }
            }
            
            // Navigation functions
            function showRoute(lat, lng, name) {
                console.log('Showing live route to:', name, lat, lng);
                
                if (!userLocation) {
                    alert('Nie można określić Twojej lokalizacji');
                    return;
                }
                
                // Clear previous route
                clearRoute();
                
                // Set live navigation target
                liveNavigationActive = true;
                liveNavigationTarget = { lat: lat, lng: lng, name: name };
                
                // Start live navigation
                updateLiveRoute();
                
                // Set up interval for live updates (every 5 seconds)
                if (window.liveNavigationInterval) {
                    clearInterval(window.liveNavigationInterval);
                }
                window.liveNavigationInterval = setInterval(updateLiveRoute, 5000);
            }
            
            function updateLiveRoute() {
                if (!liveNavigationActive || !liveNavigationTarget || !userLocation) {
                    return;
                }
                
                var userLat = userLocation.latitude;
                var userLng = userLocation.longitude;
                var targetLat = liveNavigationTarget.lat;
                var targetLng = liveNavigationTarget.lng;
                var targetName = liveNavigationTarget.name;
                
                console.log('Updating live route from', userLat, userLng, 'to', targetLat, targetLng);
                
                // Clear previous markers and lines
                currentRouteMarkers.forEach(function(marker) {
                    map.removeLayer(marker);
                });
                currentRouteMarkers = [];
                
                if (currentRouteLine) {
                    map.removeLayer(currentRouteLine);
                    currentRouteLine = null;
                }
                
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                }
                
                // Update user marker position
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                userMarker = L.marker([userLat, userLng], {
                    icon: L.divIcon({
                        html: '<div style="background: #4CAF50; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">A</div>',
                        iconSize: [24, 24]
                    })
                }).addTo(map);
                userMarker.bindPopup('Start - Twoja aktualna lokalizacja');
                currentRouteMarkers.push(userMarker);
                
                // Add target marker
                var endMarker = L.marker([targetLat, targetLng], {
                    icon: L.divIcon({
                        html: '<div style="background: #FF6B35; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">B</div>',
                        iconSize: [24, 24]
                    })
                }).addTo(map);
                
                var distance = (map.distance([userLat, userLng], [targetLat, targetLng]) / 1000).toFixed(1);
                endMarker.bindPopup(\`
                    <div>
                        <strong>Cel: \${targetName}</strong><br>
                        <span style="color: #FF6B35;">📍 \${distance} km</span><br>
                        <span style="color: #4CAF50;">🔄 Trasa na żywo</span><br>
                        <button class="nav-button clear" onclick="stopLiveNavigation()">� Zatrzymaj nawigację</button>
                    </div>
                \`);
                currentRouteMarkers.push(endMarker);
                
                // Try to create routing, if fails show straight line
                if (L.Routing && L.Routing.control) {
                    try {
                        routingControl = L.Routing.control({
                            waypoints: [
                                L.latLng(userLat, userLng),
                                L.latLng(targetLat, targetLng)
                            ],
                            router: L.Routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1',
                                profile: 'driving',
                                timeout: 10000
                            }),
                            show: false,
                            addWaypoints: false,
                            routeWhileDragging: false,
                            createMarker: function() { return null; }, // Don't create default markers
                            lineOptions: {
                                styles: [{ 
                                    color: '#FF6B35', 
                                    weight: 6, 
                                    opacity: 0.8
                                }]
                            }
                        }).on('routesfound', function(e) {
                            console.log('Live route updated via OSRM');
                            var route = e.routes[0];
                            var routeDistance = (route.summary.totalDistance / 1000).toFixed(1);
                            var routeTime = Math.round(route.summary.totalTime / 60);
                            
                            endMarker.setPopupContent(\`
                                <div>
                                    <strong>Cel: \${targetName}</strong><br>
                                    <span style="color: #FF6B35;">📍 \${routeDistance} km</span><br>
                                    <span style="color: #4CAF50;">⏱️ \${routeTime} min</span><br>
                                    <span style="color: #2196F3;">🔄 Aktualizacja na żywo</span><br>
                                    <button class="nav-button clear" onclick="stopLiveNavigation()">🛑 Zatrzymaj</button>
                                </div>
                            \`);
                        }).on('routingerror', function() {
                            console.log('OSRM routing failed, showing straight line');
                            showStraightLine(userLat, userLng, targetLat, targetLng);
                        }).addTo(map);
                        
                    } catch (error) {
                        console.log('Routing library error, showing straight line');
                        showStraightLine(userLat, userLng, targetLat, targetLng);
                    }
                } else {
                    console.log('Routing library not available, showing straight line');
                    showStraightLine(userLat, userLng, targetLat, targetLng);
                }
                
                // Open target marker popup
                endMarker.openPopup();
            }
            
            function stopLiveNavigation() {
                console.log('Stopping live navigation...');
                liveNavigationActive = false;
                liveNavigationTarget = null;
                
                if (window.liveNavigationInterval) {
                    clearInterval(window.liveNavigationInterval);
                    window.liveNavigationInterval = null;
                }
                
                clearRoute();
            }
                                profile: 'driving',
                                timeout: 10000
                            }),
                            show: false,
                            addWaypoints: false,
                            routeWhileDragging: false,
                            createMarker: function() { return null; }, // Don't create default markers
                            lineOptions: {
                                styles: [{ 
                                    color: '#FF6B35', 
                                    weight: 6, 
                                    opacity: 0.8
                                }]
                            }
                        }).on('routesfound', function(e) {
                            console.log('Route found via OSRM');
                            var route = e.routes[0];
                            var routeDistance = (route.summary.totalDistance / 1000).toFixed(1);
                            var routeTime = Math.round(route.summary.totalTime / 60);
                            
                            endMarker.setPopupContent(\`
                                <div>
                                    <strong>Cel: \${name}</strong><br>
                                    <span style="color: #FF6B35;">📍 \${routeDistance} km</span><br>
                                    <span style="color: #4CAF50;">⏱️ \${routeTime} min</span><br>
                                    <button class="nav-button clear" onclick="clearRoute()">🗑️ Usuń trasę</button>
                                </div>
                            \`);
                        }).on('routingerror', function() {
                            console.log('OSRM routing failed, showing straight line');
                            showStraightLine(userLat, userLng, lat, lng);
                        }).addTo(map);
                        
                    } catch (error) {
                        console.log('Routing library error, showing straight line');
                        showStraightLine(userLat, userLng, lat, lng);
                    }
                } else {
                    console.log('Routing library not available, showing straight line');
                    showStraightLine(userLat, userLng, lat, lng);
                }
                
                // Fit view to show both markers
                var group = new L.featureGroup(currentRouteMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
                
                // Open end marker popup
                endMarker.openPopup();
            }
            
            function showStraightLine(userLat, userLng, lat, lng) {
                // Add straight line
                currentRouteLine = L.polyline([
                    [userLat, userLng],
                    [lat, lng]
                ], {
                    color: '#FF6B35',
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '10, 10'
                }).addTo(map);
            }
            
            function clearRoute() {
                console.log('Clearing route...');
                
                // Stop live navigation
                liveNavigationActive = false;
                liveNavigationTarget = null;
                
                if (window.liveNavigationInterval) {
                    clearInterval(window.liveNavigationInterval);
                    window.liveNavigationInterval = null;
                }
                
                // Remove routing control
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                }
                
                // Remove markers
                currentRouteMarkers.forEach(function(marker) {
                    map.removeLayer(marker);
                });
                currentRouteMarkers = [];
                
                // Remove user marker
                if (userMarker) {
                    map.removeLayer(userMarker);
                    userMarker = null;
                }
                
                // Remove straight line
                if (currentRouteLine) {
                    map.removeLayer(currentRouteLine);
                    currentRouteLine = null;
                }
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initMap);
            } else {
                initMap();
            }
            
            // Function to update user location from React Native
            window.updateUserLocation = function(newLocation) {
                console.log('Updating user location:', newLocation);
                userLocation = newLocation;
                
                // Update live navigation if active
                if (liveNavigationActive) {
                    updateLiveRoute();
                }
            };
        </script>
    </body>
    </html>`;
  };

  const handleMessage = (event: any) => {
    console.log("OpenStreetMapSimple WebView message:", event.nativeEvent.data);
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "mapReady":
          console.log("OpenStreetMap is ready");
          setMapReady(true);
          break;
        case "mapPress":
          console.log("OpenStreetMap press:", data.coordinate);
          if (onMapPress) {
            onMapPress(data.coordinate);
          }
          break;
        case "markerPress":
          console.log("OpenStreetMap marker press:", data.spot);
          if (onMarkerPress) {
            const spot = spots.find((s) => s.id === data.spot.id);
            if (spot) onMarkerPress(spot);
          }
          break;
        case "navigateToSpot":
          console.log("Navigation requested:", data.destination);
          if (onNavigateToSpot) {
            onNavigateToSpot(data.destination);
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        onError={(error) => console.error("WebView error:", error)}
        onHttpError={(error) => console.error("WebView HTTP error:", error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  webview: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
});

export default OpenStreetMapSimple;
