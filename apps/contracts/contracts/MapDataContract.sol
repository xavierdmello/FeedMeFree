import { DAppKitProvider, useWallet, useConnex } from "@vechain/dapp-kit-react";
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Heading,
  Portal,
} from "@chakra-ui/react";
import { SubmissionModal, ConnectWalletButton } from "./components";
import { lightTheme } from "./theme";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { GeolocateControl } from 'mapbox-gl';
import { config } from "@repo/config-contract";

// Define the MapDataPoint interface
interface MapDataPoint {
  poster: string;
  longitude: number;
  latitude: number;
  name: string;
  description: string;
  image: string;
  count: number;
  timePosted: number;
}

const App = () => {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-122.4783);
  const [lat, setLat] = useState(37.8199);
  const [zoom, setZoom] = useState(11);
  const [mapDataPoints, setMapDataPoints] = useState<MapDataPoint[]>([]);

  const { account } = useWallet();
  const { thor } = useConnex();

  useEffect(() => {
    if (account) {
      fetchMapDataPoints();
    }
  }, [account]);

  const fetchMapDataPoints = async () => {
    if (!thor) return;

    const contractABI = {
      constant: true,
      inputs: [],
      name: "getLocations",
      outputs: [
        {
          components: [
            { name: "poster", type: "address" },
            { name: "longitude", type: "int256" },
            { name: "latitude", type: "int256" },
            { name: "name", type: "string" },
            { name: "description", type: "string" },
            { name: "image", type: "string" },
            { name: "count", type: "uint256" },
            { name: "timePosted", type: "uint256" },
          ],
          name: "",
          type: "tuple[]",
        },
        { name: "", type: "uint256" },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    };

    const method = thor.account(config.CONTRACT_ADDRESS).method(contractABI);
    const result = await method.call();

    if (result.decoded) {
      const points: MapDataPoint[] = result.decoded[0].map((point: any) => ({
        poster: point[0],
        longitude: parseInt(point[1]) / 1e6,
        latitude: parseInt(point[2]) / 1e6,
        name: point[3],
        description: point[4],
        image: point[5],
        count: parseInt(point[6]),
        timePosted: parseInt(point[7]),
      }));
      setMapDataPoints(points);
    }
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('move', () => {
      if (!map.current) return;
      setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
      setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
      setZoom(parseFloat(map.current.getZoom().toFixed(2)));
    });

    const geolocate = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });

    map.current.addControl(geolocate);

    geolocate.on('geolocate', () => {
      console.log('A geolocate event has occurred.');
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || mapDataPoints.length === 0) return;

    mapDataPoints.forEach((point) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h3>${point.name}</h3><p>${point.description}</p>`
      );

      new mapboxgl.Marker()
        .setLngLat([point.longitude, point.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [mapDataPoints]);

  return (
    <ChakraProvider theme={lightTheme}>
      <Box>
        <VStack spacing={4} align="stretch">
        hii
          <Box position="absolute" top={4} right={4} zIndex={1}>
          hi
            <ConnectWalletButton />
          </Box>
          <Box position="absolute" top={4} left={4} zIndex={1} bg="rgba(35, 55, 75, 0.9)" color="white" padding="6px 12px" borderRadius="4px">
            Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
          </Box>
          <Box ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
        </VStack>
        <Portal>
          <SubmissionModal />
        </Portal>
      </Box>
    </ChakraProvider>
  );
};

export default App;