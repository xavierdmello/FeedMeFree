import { DAppKitProvider } from "@vechain/dapp-kit-react";
import {
  ChakraProvider,
  Container,
  Flex,
  Box,
  Heading,
} from "@chakra-ui/react";
import {
  Dropzone,
  Footer,
  InfoCard,
  Instructions,
  Navbar,
  SubmissionModal,
} from "./components";
import { lightTheme } from "./theme";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import { useEffect, useRef, useState } from "react";

// Sample data points in San Francisco
const sampleData = [
  {
    type: "Feature",
    properties: {
      title: "Golden Gate Bridge",
      description: "Iconic suspension bridge and San Francisco landmark"
    },
    geometry: {
      type: "Point",
      coordinates: [-122.4783, 37.8199]
    }
  },
  {
    type: "Feature",
    properties: {
      title: "Fisherman's Wharf",
      description: "Popular waterfront neighborhood and tourist attraction"
    },
    geometry: {
      type: "Point",
      coordinates: [-122.4169, 37.8080]
    }
  },
  {
    type: "Feature",
    properties: {
      title: "Alcatraz Island",
      description: "Former prison and now a national historic landmark"
    },
    geometry: {
      type: "Point",
      coordinates: [-122.4229, 37.8267]
    }
  }
];

function App() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoidGFjb2NhdDQ2NDIiLCJhIjoiY2x5MHU3dGliMHNleTJsb2lheTJqeDdnZiJ9.D0_LMnUu36qWkg6pscuK2Q";
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-122.431297);
  const [lat, setLat] = useState(37.773972);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once and when container is available
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Add the sample data as a source
      map.current.addSource("places", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: sampleData
        }
      });

      // Add a layer to display the points
      map.current.addLayer({
        id: "places",
        type: "circle",
        source: "places",
        paint: {
          "circle-color": "#4264fb",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      // Add click event to show popups
      map.current.on("click", "places", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const { title, description } = feature.properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<h3>${title}</h3><p>${description}</p>`)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on("mouseenter", "places", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "places", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });
    });

    map.current.on("move", () => {
      if (map.current) {
        setLng(Number(map.current.getCenter().lng.toFixed(4)));
        setLat(Number(map.current.getCenter().lat.toFixed(4)));
        setZoom(Number(map.current.getZoom().toFixed(2)));
      }
    });
  }, []);

  return (
    <ChakraProvider theme={lightTheme}>
      <DAppKitProvider
        usePersistence
        requireCertificate={false}
        genesis="test"
        nodeUrl="https://testnet.vechain.org/"
        logLevel={"DEBUG"}
      >
    
        <Box h={"100vh"} p="20px" margin="0" backgroundColor={"black"}>
          <Box
            rounded={"20px"}
            backgroundColor={"white"}
            w="50%"
            h="100%"
            mx="auto"
            maxWidth={"800px"}
            position="relative"
            overflow="hidden"
          >
            <Box 
              ref={mapContainer} 
              className="map-container" 
              position="absolute"
              top="0"
              bottom="0"
              left="0"
              right="0"
            />
            <Box
              position="absolute"
              top="12px"
              left="12px"
              zIndex="1"
              bg="rgba(35, 55, 75, 0.9)"
              color="white"
              p="6px 12px"
              borderRadius="4px"
              fontFamily="monospace"
            >
              Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </Box>
          </Box>
        </Box>

        {/* MODALS  */}
        <SubmissionModal />
      </DAppKitProvider>
    </ChakraProvider>
  );
}

export default App;
