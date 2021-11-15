import './App.css';
import React, { useState } from 'react';
import axios from 'axios';
import ShakaPlayer from 'shaka-player-react';
import "shaka-player/dist/controls.css";
import { NFTStorage, File, Blob } from "nft.storage";

function App() {
  // livepeer implementation
  const Livepeer = require("livepeer-nodejs");
  const apiKey = process.env.REACT_APP_LIVEPEER_API_KEY;
  const livepeerObject = new Livepeer(apiKey);
  const [data, setData] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [showButton, setShowButton] = useState(false);

  const [nameOfNft, setNameOfNft] = useState("");
  const [descriptionOfNft, setDescriptionOfNft] = useState("");
  const [address, setAddress] = useState("");

  const [nftDeployedUrl, setNftDeployedUrl] = useState("");

  const [covalentData, setCovalentData] = useState(null);

  const [ceramicStream, setCeramicStream] = useState(null);

  const content = {
      "name": "test_stream", 
      "profiles": [
          {
              "name": "720p",
              "bitrate": 2000000,
              "fps": 30,
              "width": 1280,
              "height": 720
          },
          {
              "name": "480p",
              "bitrate": 1000000,
              "fps": 30,
              "width": 854,
              "height": 480
          },
          {
              "name": "360p",
              "bitrate": 500000,
              "fps": 30,
              "width": 640,
              "height": 360
          },
      ],
      "record": true
  };

  const startStream = () => {
      livepeerObject.Stream.create(content).then((res) => {
          setData(res);
          setShowButton(true);
      });
  };

  const getStreamUrl = async () => {
      const url = `https://livepeer.com/api/session?limit=20&parentId=${data.id}`;

      const listOfAllStreams = await axios.get(url, {
          headers: {
              Authorization: `Bearer ${apiKey}`,
          },
      });

      if (listOfAllStreams.data.length === 0) {
          alert("No stream detected");
          return;
      }
      
      setStreamUrl(listOfAllStreams.data[0].mp4Url);

      if (streamUrl === "") alert("stream is currently processing");
  };

  // nftport implementation
  const mintStream = async (e) => {
      e.preventDefault();
      if (streamUrl === "") {
        alert("Stream is currently processing");
        return;
      }
      if (streamUrl === null) {
        alert("No stream detected");
        return;
      }

      alert("Stream is being minted");

      const nftPortApiKey = process.env.REACT_APP_NFT_PORT_API_KEY;
      const urlToMint = "https://api.nftport.xyz/v0/mints/easy/urls"
      const body = {
        "chain": "rinkeby",
        "name": nameOfNft, // update to user's preferred nft name
        "description": descriptionOfNft, // update to user's preferred nft description
        "file_url": streamUrl,
        "mint_to_address": address // update to user's preferred address
      };

      const auth = {
        headers: {
          Authorization: nftPortApiKey
        }
      };

      const res = await axios.post(urlToMint, body, auth);
      
      if (res.status === 200) {
        alert("Successfully minted stream");
        setNameOfNft("");
        setDescriptionOfNft("");
        // setAddress("");
        setNftDeployedUrl(res.data.transaction_external_url);

        // filecoin nft storage implementation
        const client = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY });
        const cid = await client.storeBlob(new Blob([{
          chain: res.data.chain,
          contract_address: res.data.contract_address,
          transaction_hash: res.data.transaction_hash,
          description: res.data.description,
          address: res.data.mint_to_address
        }]));

        // covalent data implementation
        const covalent = "https://api.covalenthq.com/v1/1/address/" + address + "/transactions_v2/?quote-currency=USD&format=JSON&block-signed-at-asc=false&no-logs=false&key=" + process.env.REACT_APP_COVALENT_API_KEY;
        const covalentRes = await axios.get(covalent);
        setCovalentData(covalentRes.data.data);
      } else {
        alert("Error minting stream");
      }
  }

  const copyData = () => {
    navigator.clipboard.writeText(JSON.stringify(covalentData));
  }

  // ceramic reading a stream
  const ceramic = () => {
    import CeramicClient from '@ceramicnetwork/http-client';
    const API_URL = "https://gateway-clay.ceramic.network";
    const ceramic = new CeramicClient(API_URL);

    const stream = await ceramic.loadStream(ceramicStream);
  }

  return (
    <div className="App">
        <div className="stream-url-text-box">
          Stream url: {streamUrl !== "" && streamUrl !== null ? <b>{streamUrl}</b> : streamUrl === "" ? <b>stream currently processing</b> : <b>No streams created</b>}
        </div>

        <br />
        <button onClick={startStream}>Stream Video</button>
        {data ? <p>stream key: {data.streamKey} server: rtmp://rtmp.livepeer.com/live (plug into streaming software)</p> : null}
        {showButton ? <button onClick={getStreamUrl}>Play Stream</button> : null}
        <br /><br />
        <div className="video-container">
          {streamUrl !== "" && streamUrl != null ? <ShakaPlayer src={streamUrl} /> : <h3>video will appear here</h3>}
        </div>
        <br /><br />

        {
          nftDeployedUrl !== "" ? <a href={nftDeployedUrl} target="_blank">View NFT</a> : null
        }

        <br /><br />
        <form>
          <input
            value={nameOfNft}
            type="text"
            placeholder="Name of NFT"
            onChange={(e) => setNameOfNft(e.target.value)}
            name="nameOfNft"
            required
            />
          <input
            value={descriptionOfNft}
            type="text"
            placeholder="Description of NFT"
            onChange={(e) => setDescriptionOfNft(e.target.value)}
            name="descriptionOfNft"
            required
            />
          <input
            value={address}
            type="text"
            placeholder="Wallet Address"
            onChange={(e) => setAddress(e.target.value)}
            name="address"
            required
            />
          <button onClick={mintStream}>Mint Video</button>
        </form>

        {
          covalentData !== null ? <p>{JSON.stringify(covalentData)}</p> : null
        }
        {
          covalentData !== null ? <button onClick={() => copyData()}>Copy Data</button> : null
        }
    </div>
  );
}

export default App;
