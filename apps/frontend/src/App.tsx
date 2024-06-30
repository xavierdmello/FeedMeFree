import { DAppKitProvider, useWallet, useConnex } from "@vechain/dapp-kit-react";
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Heading,
  Portal,
  Input,
  Textarea,
  Button,
  HStack,
  Image as ChakraImage, // Rename to avoid conflicts
} from "@chakra-ui/react";
import { SubmissionModal, ConnectWalletButton } from "./components";
import { lightTheme } from "./theme";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { GeolocateControl } from "mapbox-gl";
import { config } from "@repo/config-contract";
import logo from "./assets/logo.png"; // Adjust the path as needed
import { clauseBuilder, unitsUtils } from "@vechain/sdk-core";

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

const App = () => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoidGFjb2NhdDQ2NDIiLCJhIjoiY2x5MHU3dGliMHNleTJsb2lheTJqeDdnZiJ9.D0_LMnUu36qWkg6pscuK2Q";
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-122.431297);
  const [lat, setLat] = useState(37.773972);
  const [zoom, setZoom] = useState(12);
  const [popupInfo, setPopupInfo] = useState<PopupProps | null>(null);
  const [mapDataPoints, setMapDataPoints] = useState<MapDataPoint[]>([]);

  // New state variables for the input fields
  const [newLong, setNewLong] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("");

  const { account } = useWallet();
  const { thor } = useConnex();

  const [txId, setTxId] = useState<string>("");
  const [error, setError] = useState<string>("");

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
    console.log("Result: ", result);

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

  const handlePostLocation = async () => {
    if (!thor || !account) {
      console.error("Thor or account not available");
      return;
    }

    try {
      setError("");

      const clauses = [
        clauseBuilder.functionInteraction(
          config.CONTRACT_ADDRESS,
          {
            inputs: [
              { name: "_long", type: "int256" },
              { name: "_lat", type: "int256" },
              { name: "_name", type: "string" },
              { name: "_description", type: "string" },
              { name: "_image", type: "string" },
            ],
            name: "postLocation",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          [
            Math.round(parseFloat(newLong) * 1e6),
            Math.round(parseFloat(newLat) * 1e6),
            newName,
            newDescription,
            newImage,
          ]
        ),
      ];

      const tx = thor.vendor.sign("tx", clauses).signer(account);

      const { txid } = await tx.request();
      setTxId(txid);

      // Wait for the transaction to be confirmed
      const receipt = await thor.transaction(txid).getReceipt();
      console.log("Transaction confirmed:", receipt);

      // Refresh map data points after successful transaction
      await fetchMapDataPoints();
    } catch (err) {
      setError(String(err));
      console.error("Error posting location:", err);
    }
  };

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
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.current.addControl(geolocate);

    map.current.on("load", () => {
      if (!map.current) return;

      // Trigger geolocation on map load
      geolocate.trigger();

      // Add the mapDataPoints as a source
      map.current.addSource("places", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: mapDataPoints.map((point) => ({
            type: "Feature",
            properties: {
              title: point.name,
              description: point.description,
            },
            geometry: {
              type: "Point",
              coordinates: [point.longitude, point.latitude],
            },
          })),
        },
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
          "circle-stroke-color": "#ffffff",
        },
      });

      // Add click event to show popups
      map.current.on("click", "places", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates =
          feature.geometry.type === "Point"
            ? feature.geometry.coordinates.slice()
            : [];
        const title = feature.properties?.title as string | undefined;
        const description = feature.properties?.description as
          | string
          | undefined;

        setPopupInfo({
          title: title || "Unknown",
          description: description || "",
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
  }, [mapDataPoints]);

  return (
    <ChakraProvider theme={lightTheme}>
      <Box
        h="100vh"
        w="100vw"
        display="flex"
        flexDirection="column" // Add this to stack logo above the content
        alignItems="center"
        justifyContent="center"
        backgroundColor="black"
      >
        <ChakraImage src="./logo2.png" alt="Logo" width="100px" />
        <Box width="100%" maxWidth="1200px" height="90vh">
          <HStack
            h="100%"
            p="20px"
            backgroundColor="black"
            spacing={4}
            justifyContent="center"
          >
            <Box
              rounded="20px"
              backgroundColor="white"
              w={["100%", "100%", "60%"]}
              h="100%"
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
              <Box position="absolute" top={4} right={4} zIndex={1}>
                <ConnectWalletButton />
              </Box>
            </Box>

            <VStack
              rounded="20px"
              backgroundColor="white"
              w={["100%", "100%", "40%"]}
              h="100%"
              p={4}
              spacing={4}
              align="stretch"
            >
              <Heading size="md">Post New Location</Heading>
              <Input
                placeholder="Longitude"
                value={newLong}
                onChange={(e) => setNewLong(e.target.value)}
              />
              <Input
                placeholder="Latitude"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
              />
              <Input
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Textarea
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <Input
                placeholder="Image URL"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
              <Button colorScheme="blue" onClick={handlePostLocation}>
                Post Location
              </Button>
              {Boolean(error) && (
                <Text color="red.500">
                  Error: {error}
                </Text>
              )}
              {Boolean(txId) && !error && (
                <Text color="green.500">
                  Transaction sent successfully! ID: {txId}
                </Text>
              )}
            </VStack>
          </HStack>

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
        </Box>
      </Box>
    </ChakraProvider>
  );
};

const AppWrapper = () => {
  return (
    <DAppKitProvider
      usePersistence
      requireCertificate={false}
      genesis="test"
      nodeUrl="https://testnet.vechain.org/"
      logLevel={"DEBUG"}
    >
      <App />
    </DAppKitProvider>
  );
};

export default AppWrapper;
