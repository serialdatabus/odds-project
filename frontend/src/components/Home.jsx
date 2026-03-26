import { useState, useEffect, useRef } from "react";
import SportsFixture from "./SportsFixture";
import "../App.css";
import {
  API_KEY,
  closeConnection,
  EVENT_UPDATE_FIXTURES,
  EVENT_UPDATE_SCORES,
  getResult,
  getUpdateType,
  isSameScore,
} from "../helpers";

function Home() {
  const [count, setCount] = useState(0);
  const [sports, setSports] = useState([]);
  const [scores, setScores] = useState([]);
  const [fixtures, setFixtures] = useState({});
  const socketRef = useRef(null);
  let loaded = useRef(false);

  function normalize(data) {
    setSports(data.sports);
    setFixtures(data.fixtures);
  }

  function updateScores(data) {
    const payload = data.payload;

    const nextScore = getResult(payload.scores);

    if (!nextScore) {
      return;
    }

    setFixtures((prev) => {
      const fixture = prev?.[payload.fixtureId];
      if (!fixture) {
        console.log("fixture not found:", payload.fixtureId);
        return prev;
      }

      const prevScore = fixture.score;

      if (prevScore && isSameScore(prevScore, nextScore)) {
        return prev;
      }

      //console.log("updating scores");

      return {
        ...prev,
        [payload.fixtureId]: {
          ...fixture,
          score: {
            home: nextScore?.participant1Score ?? 0,
            away: nextScore?.participant2Score ?? 0,
            updatedAt: nextScore?.updatedAt ?? 0,
          },
        },
      };
    });
  }

  function updateFixtures(data) {
    console.log("update fixtures", data);
  }

  useEffect(() => {
    if (loaded.current) return;
    console.log("start script");
    loaded.current = true;

    fetch(`http://127.0.0.1:3500/`)
      .then((response) => response.json())
      .then(function (data) {
        normalize(data);

        // websockets conenction
        const socket = new WebSocket("wss://v5.oddspapi.io/ws");
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("Connected");

          const payload = {
            type: "login",
            apiKey: API_KEY,
            channels: ["fixtures", "scores"],
            sportIds: data.sports.map((sport) => sport.sportId),
            fixtureIds: Object.keys(data.fixtures),
          };

          socket.send(JSON.stringify(payload));
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const eventType = data.type;

          console.log(data);

          switch (getUpdateType(data)) {
            case EVENT_UPDATE_SCORES:
              updateScores(data);
              break;

            case EVENT_UPDATE_FIXTURES:
              updateFixtures(data);
              break;

            default:
              break;
          }
        };

        socket.onclose = (event) => {
          console.log("Socket closed", event);
        };
      });

    return () => {
      console.log("closing socket");
      closeConnection(socketRef);
    };
  }, []);

  return (
    <div className="group-sports-fixture">
      {sports &&
        fixtures &&
        sports.map((sport) => {
          if (!sport.fixturesIds) {
            return;
          }

          const sportFixtures = [];
          for (let i = 0; i < sport.fixturesIds.length; i++) {
            sportFixtures.push(fixtures[sport.fixturesIds[i]]);
          }

          return (
            <SportsFixture
              key={sport.sportId}
              data={sport}
              onCloseConnection={() => {
                closeConnection(socketRef);
              }}
              fixtures={sportFixtures}
            />
          );
        })}
    </div>
  );
}

export default Home;
