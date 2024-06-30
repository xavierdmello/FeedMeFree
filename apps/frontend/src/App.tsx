import { DAppKitProvider } from "@vechain/dapp-kit-react";
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Heading,
  Portal,
} from "@chakra-ui/react";
import { SubmissionModal } from "./components";
import { lightTheme } from "./theme";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { GeolocateControl } from 'mapbox-gl';

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

const mapDataContractAddress = "0x11a22411c13da184d1c0bf9cc49853978ccdfb5f";
const mapDataAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

interface PopupProps {
  title: string;
  description: string;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ title, description, onClose }) => {
  return (
    <Box
      bg="white"
      borderRadius="md"
      boxShadow="lg"
      p={3}
      maxWidth="200px"
      position="relative"
    >
      <VStack align="start" spacing={2}>
        <Heading size="sm">{title}</Heading>
        <Text fontSize="sm">{description}</Text>
      </VStack>
      <Box
        position="absolute"
        top={2}
        right={2}
        cursor="pointer"
        onClick={onClose}
      >
        ✕
      </Box>
    </Box>
  );
};

function App() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoidGFjb2NhdDQ2NDIiLCJhIjoiY2x5MHU3dGliMHNleTJsb2lheTJqeDdnZiJ9.D0_LMnUu36qWkg6pscuK2Q";
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-122.431297);
  const [lat, setLat] = useState(37.773972);
  const [zoom, setZoom] = useState(12);
  const [popupInfo, setPopupInfo] = useState<PopupProps | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once and when container is available
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    // Add geolocate control to the map
    const geolocate = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });

    map.current.addControl(geolocate);

    map.current.on("load", () => {
      if (!map.current) return;

      // Trigger geolocation on map load
      geolocate.trigger();

      // Add the sample data as a source
      map.current.addSource("places", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: sampleData.map(feature => ({
            type: "Feature",
            properties: feature.properties,
            geometry: {
              type: "Point",
              coordinates: feature.geometry.coordinates
            }
          }))
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
        const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates.slice() : [];
        const title = feature.properties?.title as string | undefined;
        const description = feature.properties?.description as string | undefined;

        setPopupInfo({
          title: title || 'Unknown',
          description: description || '',
          onClose: () => setPopupInfo(null),
        });

        // Ensure the popup is positioned correctly
        map.current!.flyTo({
          center: coordinates as [number, number],
          zoom: 14,
        });
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

        {popupInfo && (
          <Portal>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -100%)"
              zIndex="tooltip"
            >
              <Popup {...popupInfo} />
            </Box>
          </Portal>
        )}

        <SubmissionModal />
      </DAppKitProvider>
    </ChakraProvider>
  );
}

export default App;
