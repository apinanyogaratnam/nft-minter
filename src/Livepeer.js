import React, { useState } from 'react';
import axios from 'axios';
import ShakaPlayer from 'shaka-player-react';
import "shaka-player/dist/controls.css";

const Livepeer = () => {
    const Livepeer = require("livepeer-nodejs");
    const apiKey = process.env.REACT_APP_LIVEPEER_API_KEY;
    console.log(apiKey);
    const livepeerObject = new Livepeer(apiKey);
    const [data, setData] = useState(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [showButton, setShowButton] = useState(false);

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
            console.log(res);
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
        
        console.log(listOfAllStreams);
        setStreamUrl(listOfAllStreams.data[0].mp4Url);

        if (streamUrl === "") alert("stream is currently processing");
    };

    return (
        <div>
            <button onClick={startStream}>Stream Video</button>
            {data ? <p>stream key: {data.streamKey} server: rtmp://rtmp.livepeer.com/live (plug into streaming software)</p> : null}
            {showButton ? <button onClick={getStreamUrl}>Play Stream</button> : null}
            {streamUrl !== "" && streamUrl != null ? <ShakaPlayer src={streamUrl} /> : null}
        </div>
    );
}

export default Livepeer;
