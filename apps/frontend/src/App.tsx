import { DAppKitProvider } from "@vechain/dapp-kit-react";
import { ChakraProvider, Container, Flex , Box} from "@chakra-ui/react";
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
import mapboxgl from 'mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { useEffect, useRef, useState } from "react";

function App() {
  mapboxgl.accessToken = 'pk.eyJ1IjoidGFjb2NhdDQ2NDIiLCJhIjoiY2x5MHU3dGliMHNleTJsb2lheTJqeDdnZiJ9.D0_LMnUu36qWkg6pscuK2Q';
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });
  });

  return (
    <ChakraProvider theme={lightTheme}>
      <DAppKitProvider
        usePersistence
        requireCertificate={false}
        genesis="test"
        nodeUrl="https://testnet.vechain.org/"
        logLevel={"DEBUG"}
      >
        <Box h={"500px"}>
    <Box ref={mapContainer} className="map-container" h={"500px"} />
        </Box>
  
        {/* MODALS  */}
        <SubmissionModal />
      </DAppKitProvider>
    </ChakraProvider>
  );
}

export default App;
