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

    // Add geolocate control to the map
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });

    map.current.addControl(geolocate);

    // Trigger geolocation on map load
    map.current.on('load', () => {
      geolocate.trigger();
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
