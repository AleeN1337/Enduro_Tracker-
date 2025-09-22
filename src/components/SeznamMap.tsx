import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { EnduroSpot, UserLocation } from "../types";

interface SeznamMapProps {
  location: UserLocation | null;
  spots: EnduroSpot[];
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (spot: EnduroSpot) => void;
}

const SeznamMap: React.FC<SeznamMapProps> = ({
  location,
  spots,
  onMapPress,
  onMarkerPress,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Generate HTML content for Seznam.cz map
  const generateMapHTML = () => {
    const centerLat = location?.latitude || 50.0755; // Praha default
    const centerLng = location?.longitude || 14.4378;

    const spotsData = spots.map((spot) => ({
      id: spot.id,
      lat: spot.latitude,
      lng: spot.longitude,
      name: spot.name,
      difficulty: spot.difficulty,
      category: spot,
    }));

    return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enduro Tracker - Seznam Map</title>
        <script src="https://api.mapy.cz/loader.js"></script>
        <script>Loader.load(null, {suggest: true})</script>
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
            .spot-info {
                background: #2a2a2a;
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                border: 1px solid #444;
                max-width: 200px;
            }
            .spot-name {
                font-weight: bold;
                color: #FF6B35;
                margin-bottom: 4px;
            }
            .spot-difficulty {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
                margin-top: 4px;
            }
            .difficulty-easy { background: #4CAF50; }
            .difficulty-moderate { background: #FF9800; }
            .difficulty-hard { background: #F44336; }
            .difficulty-extreme { background: #9C27B0; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        
        <script>
            let map;
            let layer;
            
            // Initialize Seznam.cz map
            function initMap() {
                var center = SMap.Coords.fromWGS84(${centerLng}, ${centerLat});
                map = new SMap(JAK.gel("map"), center, 13);
                
                // Add controls
                map.addDefaultControls();
                
                // Add layers - terrain for enduro
                var layerTerrain = new SMap.Layer.Terrain();
                map.addLayer(layerTerrain);
                layerTerrain.enable();
                
                // Add hiking layer for trails
                var layerHiking = new SMap.Layer.Hiking();
                map.addLayer(layerHiking);
                layerHiking.enable();
                
                // Create marker layer
                layer = new SMap.Layer.Marker();
                map.addLayer(layer);
                layer.enable();
                
                // Add user location marker
                ${
                  location
                    ? `
                var userCoords = SMap.Coords.fromWGS84(${centerLng}, ${centerLat});
                var userMarker = new SMap.Marker(userCoords, "user-location", {
                    url: "data:image/svg+xml;base64," + btoa(\`
                        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="8" fill="#FF6B35" stroke="white" stroke-width="2"/>
                            <circle cx="10" cy="10" r="3" fill="white"/>
                        </svg>\`),
                    anchor: {left: 10, top: 10}
                });
                layer.addMarker(userMarker);
                `
                    : ""
                }
                
                // Add spot markers
                var spots = ${JSON.stringify(spotsData)};
                spots.forEach(function(spot) {
                    var coords = SMap.Coords.fromWGS84(spot.lng, spot.lat);
                    
                    var difficultyColor = getDifficultyColor(spot.difficulty);
                    var markerSvg = \`
                        <svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12z" 
                                  fill="\${difficultyColor}" stroke="white" stroke-width="2"/>
                            <circle cx="12" cy="12" r="6" fill="white"/>
                            <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="\${difficultyColor}">
                                \${getCategoryIcon(spot.category)}
                            </text>
                        </svg>\`;
                    
                    var marker = new SMap.Marker(coords, spot.id, {
                        url: "data:image/svg+xml;base64," + btoa(markerSvg),
                        anchor: {left: 12, top: 32}
                    });
                    
                    // Add click handler
                    marker.getContainer().onclick = function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'markerPress',
                            spot: spot
                        }));
                    };
                    
                    // Add info popup
                    var infoHtml = \`
                        <div class="spot-info">
                            <div class="spot-name">\${spot.name}</div>
                            <div class="spot-difficulty difficulty-\${spot.difficulty}">
                                \${getDifficultyLabel(spot.difficulty)}
                            </div>
                        </div>\`;
                    
                    var infoCard = new SMap.Card();
                    infoCard.getHeader().innerHTML = infoHtml;
                    infoCard.getBody().style.display = "none";
                    marker.setCard(infoCard);
                    
                    layer.addMarker(marker);
                });
                
                // Map click handler
                map.getSignals().addListener(window, "map-click", function(e) {
                    var coords = e.target.getCoords();
                    var wgs = coords.toWGS84();
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapPress',
                        coordinate: {
                            latitude: wgs[1],
                            longitude: wgs[0]
                        }
                    }));
                });
                
                // Notify React Native that map is ready
                window.ReactNativeWebView.postMessage(JSON.stringify({
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
                    case 'climb': return '⬆';
                    case 'technical': return '⚙';
                    case 'jump': return '✈';
                    case 'creek': return '🌊';
                    case 'rocks': return '◆';
                    case 'mud': return '🌍';
                    default: return '📍';
                }
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
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "mapReady":
          setMapReady(true);
          break;
        case "mapPress":
          if (onMapPress) {
            onMapPress(data.coordinate);
          }
          break;
        case "markerPress":
          if (onMarkerPress) {
            const spot = spots.find((s) => s.id === data.spot.id);
            if (spot) onMarkerPress(spot);
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
        var newCenter = SMap.Coords.fromWGS84(${longitude}, ${latitude});
        map.setCenterZoom(newCenter, 15, true);
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // Expose method to parent component - remove this line as it's causing TypeScript issues
  // React.useImperativeHandle(webViewRef, () => ({
  //   centerOnLocation,
  // }));

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

export default SeznamMap;
