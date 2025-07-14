import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { EnduroSpot, UserLocation } from "../types";

interface OpenStreetMapProps {
  location: UserLocation | null;
  spots: EnduroSpot[];
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (spot: EnduroSpot) => void;
  onNavigateToSpot?: (destination: {
    latitude: number;
    longitude: number;
    name: string;
  }) => void;
  onStartGPSNavigation?: (destination: {
    latitude: number;
    longitude: number;
    name: string;
  }) => void;
  autoNavigateToSpot?: EnduroSpot | null; // Automatycznie nawiguj do tego miejsca
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  location,
  spots,
  onMapPress,
  onMarkerPress,
  onNavigateToSpot,
  onStartGPSNavigation,
  autoNavigateToSpot,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  console.log(
    "OpenStreetMap rendering with location:",
    location,
    "spots count:",
    spots.length
  );

  // Automatyczna nawigacja gdy jest ustawiony cel
  useEffect(() => {
    if (autoNavigateToSpot && mapReady && webViewRef.current) {
      console.log("Auto-navigating to:", autoNavigateToSpot.name);
      const script = `navigateToSpot(${autoNavigateToSpot.latitude}, ${autoNavigateToSpot.longitude}, '${autoNavigateToSpot.name}');`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [autoNavigateToSpot, mapReady]);

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
            .leaflet-popup-content-wrapper {
                background: #2a2a2a;
                color: white;
                border-radius: 8px;
            }
            .leaflet-popup-content {
                margin: 8px 12px;
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
            .spot-name {
                font-weight: bold;
                color: #FF6B35;
                margin-bottom: 4px;
                font-size: 14px;
            }
            .spot-difficulty {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
                margin-top: 4px;
                color: white;
                font-weight: bold;
            }
            .difficulty-easy { background: #4CAF50; }
            .difficulty-moderate { background: #FF9800; }
            .difficulty-hard { background: #F44336; }
            .difficulty-extreme { background: #9C27B0; }
            .leaflet-popup-tip {
                background: #2a2a2a;
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
            /* Style dla routing control */
            .leaflet-routing-container {
                background: rgba(42, 42, 42, 0.95) !important;
                color: white !important;
                border-radius: 8px !important;
                border: 1px solid #444 !important;
            }
            .leaflet-routing-container h2,
            .leaflet-routing-container h3 {
                color: #FF6B35 !important;
            }
            .leaflet-routing-alt {
                background: rgba(26, 26, 26, 0.8) !important;
                border: 1px solid #555 !important;
                margin: 4px 0 !important;
            }
            .leaflet-routing-alt:hover {
                background: rgba(255, 107, 53, 0.2) !important;
            }
            /* Przycisk do czyszczenia trasy */
            .clear-route-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(102, 102, 102, 0.9) !important;
                color: white !important;
                border: none !important;
                padding: 10px 15px !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                font-weight: bold !important;
                font-size: 12px !important;
                z-index: 1000 !important;
                display: none;
            }
            .clear-route-btn.show {
                display: block;
            }
            .clear-route-btn:hover {
                background: rgba(102, 102, 102, 1) !important;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <button id="clearRouteBtn" class="clear-route-btn" onclick="clearRoute()">
            🗑️ Usuń trasę
        </button>
        
        <script>
            console.log('OpenStreetMap HTML loading...');
            let map;
            let routingControl = null;
            
            // Initialize OpenStreetMap with Leaflet
            function initMap() {
                console.log('Initializing OpenStreetMap...');
                // Create map
                map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
                
                // Add OpenStreetMap tiles - terrain style
                L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    maxZoom: 17,
                    attribution: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
                }).addTo(map);
                
                // Alternative: Standard OSM tiles
                // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                //     maxZoom: 19,
                //     attribution: '© OpenStreetMap contributors'
                // }).addTo(map);
                
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
                    var categoryIcon = getCategoryIcon(spot.categories[0] || 'climb'); // Używamy pierwszej kategorii dla ikony
                    
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
                    
                    var marker = L.marker([spot.lat, spot.lng], {icon: spotIcon})
                        .addTo(map);
                    
                    // Add popup with spot info
                    var popupContent = \`
                        <div class="spot-name">\${spot.name}</div>
                        <div class="spot-difficulty difficulty-\${spot.difficulty}">
                            \${getDifficultyLabel(spot.difficulty)}
                        </div>
                        <div style="margin-top: 8px; color: #ccc; font-size: 11px;">
                            Kategorie: \${spot.categories.map(cat => getCategoryLabel(cat)).join(', ')}
                        </div>
                        <button 
                            onclick="navigateToSpot(\${spot.lat}, \${spot.lng}, '\${spot.name}')" 
                            style="
                                background: #FF6B35; 
                                color: white; 
                                border: none; 
                                padding: 8px 16px; 
                                border-radius: 8px; 
                                margin-top: 12px; 
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 12px;
                                width: 100%;
                                margin-bottom: 8px;
                            ">
                            🗺️ Wyznacz trasę
                        </button>
                        <button 
                            onclick="startGPSNavigation(\${spot.lat}, \${spot.lng}, '\${spot.name}')" 
                            style="
                                background: #4CAF50; 
                                color: white; 
                                border: none; 
                                padding: 8px 16px; 
                                border-radius: 8px; 
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 12px;
                                width: 100%;
                            ">
                            🧭 Nawigacja GPS
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
            
            function navigateToSpot(lat, lng, name) {
                console.log('Navigation requested to:', name, lat, lng);
                
                // Pokaż trasę na mapie jeśli mamy lokalizację użytkownika
                const userLoc = userLocation;
                if (userLoc && routingControl === null) {
                    console.log('Adding route on map...');
                    routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(userLoc.latitude, userLoc.longitude),
                            L.latLng(lat, lng)
                        ],
                        routeWhileDragging: false,
                        addWaypoints: false,
                        lineOptions: {
                            styles: [{ color: '#FF6B35', weight: 6, opacity: 0.7 }]
                        },
                        createMarker: function() { return null; }, // Nie dodawaj markerów trasy
                        router: L.Routing.osrmv1({
                            serviceUrl: 'https://router.project-osrm.org/route/v1'
                        })
                    }).addTo(map);
                    
                    // Pokaż przycisk do usuwania trasy
                    document.getElementById('clearRouteBtn').classList.add('show');
                    
                    // Dopasuj widok do trasy
                    setTimeout(() => {
                        if (routingControl && routingControl.getWaypoints().length > 0) {
                            const group = new L.featureGroup(routingControl.getWaypoints().map(wp => 
                                L.marker(wp.latLng)
                            ));
                            map.fitBounds(group.getBounds().pad(0.1));
                        }
                    }, 1000);
                } else if (routingControl) {
                    // Usuń poprzednią trasę
                    map.removeControl(routingControl);
                    routingControl = null;
                    
                    // Dodaj nową trasę
                    if (userLoc) {
                        routingControl = L.Routing.control({
                            waypoints: [
                                L.latLng(userLoc.latitude, userLoc.longitude),
                                L.latLng(lat, lng)
                            ],
                            routeWhileDragging: false,
                            addWaypoints: false,
                            lineOptions: {
                                styles: [{ color: '#FF6B35', weight: 6, opacity: 0.7 }]
                            },
                            createMarker: function() { return null; },
                            router: L.Routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1'
                            })
                        }).addTo(map);
                        
                        // Pokaż przycisk do usuwania trasy
                        document.getElementById('clearRouteBtn').classList.add('show');
                        
                        setTimeout(() => {
                            if (routingControl && routingControl.getWaypoints().length > 0) {
                                const group = new L.featureGroup(routingControl.getWaypoints().map(wp => 
                                    L.marker(wp.latLng)
                                ));
                                map.fitBounds(group.getBounds().pad(0.1));
                            }
                        }, 1000);
                    }
                }
                
                // Nie otwieraj zewnętrznej aplikacji - nawigacja jest w aplikacji
                console.log('Trasa wygenerowana w aplikacji');
            }
            
            function clearRoute() {
                console.log('Clearing route...');
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                    
                    // Ukryj przycisk do usuwania trasy
                    document.getElementById('clearRouteBtn').classList.remove('show');
                }
            }
            
            function startGPSNavigation(lat, lng, name) {
                console.log('GPS Navigation requested to:', name, lat, lng);
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'startGPSNavigation',
                    destination: {
                        latitude: lat,
                        longitude: lng,
                        name: name
                    }
                }));
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initMap);
            } else {
                initMap();
            }
        </script>
    </body>
    </html>`;
  };

  const handleMessage = (event: any) => {
    console.log("OpenStreetMap WebView message:", event.nativeEvent.data);
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
        case "startGPSNavigation":
          console.log("GPS Navigation requested:", data.destination);
          if (onStartGPSNavigation) {
            onStartGPSNavigation(data.destination);
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const centerOnLocation = (latitude: number, longitude: number) => {
    if (webViewRef.current && mapReady) {
      const script = `
        if (map) {
          map.setView([${latitude}, ${longitude}], 15);
        }
      `;
      webViewRef.current.injectJavaScript(script);
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

export default OpenStreetMap;
