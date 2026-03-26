import { useParams } from "react-router";
import "../App.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useImmer } from "use-immer";
import { useEffect, useState, useRef } from "react";
import { AppContext } from "./AppContext";
import {
  AMERICAN_PRICE_ENABLED,
  API_KEY,
  closeConnection,
  EVENT_UPDATE_FIXTURES,
  EVENT_UPDATE_ODDS,
  EVENT_UPDATE_SCORES,
  getElapsedTime,
  getResult,
  getSimulatedPrice,
  getUpdateType,
  isValidOdd,
  normalizeOdd,
  useOddsValidationEngine,
} from "../helpers";
import MarketWindow from "./MarketWindow";

export default function FixtureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hostname = "http://127.0.0.1:3500";

  const [marketMetadata, setMarketMetadata] = useState({});

  const [snapshotComplete, setSnapshotComplete] = useState(false);
  const [oddSimulationState, updateOddSimulationState] = useImmer({});

  const [odds, updateOdds] = useImmer({});
  const [oddsFlags, updateOddsFlags] = useImmer({});
  const [fixture, updateFixture] = useImmer({});
  const socketRef = useRef(null);
  let loaded = useRef(false);

  const fixtureRef = useRef(fixture);
  const oddsSimulationStateRef = useRef(oddSimulationState);
  const oddsRef = useRef(odds);



  useEffect(() => {
    oddsSimulationStateRef.current = oddSimulationState;
  }, [oddSimulationState]);

    useOddsValidationEngine({
    oddsRef,
    oddsSimulationStateRef,
    updateOddsFlags,
  });

  useEffect(() => {
    oddsRef.current = odds;
  }, [odds]);

  useEffect(() => {
    fixtureRef.current = fixture;
  }, [fixture]);

  useEffect(() => {
    console.log({ oddsFlags });
  }, [oddsFlags]);

  useEffect(() => {}, [oddSimulationState]);

  const handleUpdateOdds = (payload) => {
    const { odds, fixtureId } = payload;
    const fixture = fixtureRef.current;

    const oddSimState = oddsSimulationStateRef.current;

    /**
     * iterate each bookmaker slug to verify if its being use dby the curent fixture
     * and theniterate its repetive ods where the marketid is also eng usable by its fixture and then update it if necessary
     */

    const bookmakerSlugs = Object.keys(odds).filter(
      (slug) => fixture.bookmakers?.[slug],
    );

    // console.log({
    //   bookmakerSlugs,
    // });

    if (bookmakerSlugs.length == 0) {
      console.log("cant add odd because of incompatible bookmaker slug");
      return;
    }

    bookmakerSlugs.forEach((slug) => {
      // filter odds by available markets

      const bookMakerOdds = odds[slug];
      console.log({bookMakerOdds,slug})
      let filteredOddsIds = Object.keys(bookMakerOdds).filter(
        (bookMakerOddId) =>
          fixture.markets[bookMakerOdds[bookMakerOddId].marketId],
      );

      // due to race conditions we filter rundefined values
      filteredOddsIds = filteredOddsIds.filter(Boolean);

      if (filteredOddsIds.length == 0) {
        return;
      }

      console.log({bookMakerOdd2: bookMakerOdds,filteredOddsIds})

      filteredOddsIds.forEach((oddId) => {
        let odd = { ...bookMakerOdds[oddId], ["fixtureId"]: fixtureId };

        updateOdds((draft) => {

             console.log({"step_1_fixture": fixture});

             console.log("step_2_valid_odd",isValidOdd({...bookMakerOdds[oddId],fixtureId},fixture),bookMakerOdds[oddId]);
          if (!isValidOdd(bookMakerOdds[oddId],fixture)) {
            if (draft[oddId]) {
              draft[oddId].isValid = false;
            }
            return;
          }

                       
          odd = normalizeOdd(
            oddId,
            bookMakerOdds[oddId],
            AMERICAN_PRICE_ENABLED,
          );

          console.log({"step_2_odd": odd});

          if (!odd) {
            delete draft[oddId];
            return;
          }

          if (!odd.active) {
            delete draft[oddId];
            return;
          }

          if (!draft[oddId]) {
            draft[oddId] = {
              ...odd,
              id: oddId,
            };
            return;
          }

          const { price, priceAmerican } = odd;

          if (draft[oddId].price !== price) {
            draft[oddId].price = price;
          }
          if (draft[oddId].priceAmerican !== priceAmerican) {
            draft[oddId].priceAmerican = priceAmerican;
          }

          const displayPrice = AMERICAN_PRICE_ENABLED ? odd.priceAmerican : odd.price;

        //   if (displayPrice !== draft[oddId].displayPrice) {
          console.log(+"price-odd-"+oddId+"-"+price);
            draft[oddId].displayPrice = price;
        //   }

          draft[oddId].simulatedPrice = getSimulatedPrice(
            AMERICAN_PRICE_ENABLED ? odd.priceAmerican : odd.price,
            oddSimState?.[oddId],
          );
        });
      });
    });
  };

  const handleUpdateScores = (payload) => {
    const { scores, fixtureId } = payload;
    const { participant1Score, participant2Score } = getResult(scores);

    updateFixture((draft) => {
      draft.score = {
        home: participant1Score,
        away: participant2Score,
      };
    });
  };

  const handleUpdateFixtures = (payload) => {
    const { fixtureId, scores, startTime } = payload;

    updateFixture((draft) => {
      const { participant1Score, participant2Score } = getResult(scores);

      draft.score = {
        home: participant1Score,
        away: participant2Score,
      };

      draft.startTime = startTime;
    });
  };

  useEffect(() => {
    if (loaded.current) return;

    loaded.current = true;

    (async () => {
      // get markets

      const resMarkets = await (await fetch(hostname + "/markets")).json();
      const markets = {};

      // get fixture odds snapshot
      const resFixtureOdds = await (
        await fetch(hostname + `/fixtureodds/${id}`)
      ).json();

      const { odds, ...fixtureWithoutOdds } = resFixtureOdds;

      setMarketMetadata(JSON.parse(JSON.stringify(resMarkets)));

      updateFixture((draft) => {
        Object.assign(draft, fixtureWithoutOdds);
      });

      // in the snapshot e get the raw price
      updateOdds((draft) => {
        const { odds } = resFixtureOdds;

        //normalize odds
        const normalizedOdds = {};

        Object.keys(odds).forEach((oddId) => {
          // in a snapshiot there is no isseu to set the fixture id directly to the object
          // andis needed as well bt the isValidOdd function
          const odd = {
            ...odds[oddId],
            ["fixtureId"]: fixtureWithoutOdds.fixtureId,
          };

          if (isValidOdd(odd, fixtureWithoutOdds)) {
            normalizedOdds[oddId] = normalizeOdd(
              oddId,
              odd,
              AMERICAN_PRICE_ENABLED,
            );
          }
        });

        Object.assign(draft, normalizedOdds);
        console.log({ normalizedOdds, odds, resFixtureOdds });
      });

      setSnapshotComplete(true);

      console.log("resFixtureOdds.odds", resFixtureOdds.odds);

      // end of snapshot

      // websockets conenction
      const socket = new WebSocket("wss://v5.oddspapi.io/ws");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("Connected");

        const { sportId, fixtureId, bookmakers } = fixtureWithoutOdds;

        const payload = {
          type: "login",
          apiKey: API_KEY,
          sportIds: [sportId],
          channels: ["fixtures", "scores", "odds"],
          fixtureIds: [fixtureId],
          bookmakers: Object.keys(bookmakers),
        };

        socket.send(JSON.stringify(payload));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const eventType = data.type;

        console.log(data);

        switch (getUpdateType(data)) {
          case EVENT_UPDATE_SCORES:
            console.log(EVENT_UPDATE_SCORES);
            handleUpdateScores(data.payload);
            break;

          case EVENT_UPDATE_FIXTURES:
            handleUpdateFixtures(data.payload);
            break;

          case EVENT_UPDATE_ODDS:
            console.log(EVENT_UPDATE_ODDS, data);

            handleUpdateOdds(data.payload);
            break;

          default:
            break;
        }
      };

      socket.onclose = (event) => {
        console.log("Socket closed", event);
      };
    })();

    return () => {
      console.log("closing socket");
      closeConnection(socketRef);
    };
  }, []);

  const teamNameHome = fixture?.teams?.home?.name ?? "-";
  const teamNameAway = fixture?.teams?.away?.name ?? "-";
  const teamHomeId = fixture?.teams?.home?.id ?? "-";
  const teamAwayId = fixture?.teams?.away?.id ?? "-";
  const startTime = fixture?.startTime ?? 0;
  const scoreHome = fixture?.score?.home ?? 0;
  const scoreAway = fixture?.score?.away ?? 0;
  const marketsIds = fixture?.markets ? Object.keys(fixture.markets) : [];

  return (
    <AppContext value={{}}>
      <div className="container-fixture-detail">
        <div>
          {/* START HEADER */}
          <div className="header-container">
            <div className="left-container">
              <a className="link-back">
                <IoArrowBackOutline
                  size={40}
                  color="white"
                  onClick={() => {
                    closeConnection(socketRef);
                    navigate("/");
                  }}
                />
              </a>
            </div>
            <div className="fixture-info-container">
              <div className="team-container left-team">
                <span className="team-name">{teamNameHome}</span>
                <span className="team-logo">
                  <img
                    src={`http://127.0.0.1:3500/participantimage/${teamHomeId}`}
                    onError={(e) => {
                      e.target.src = "http://127.0.0.1:3500/static/default.png";
                    }}
                  />
                </span>
              </div>

              <div className="score-container">
                <span className="score-group">
                  {scoreHome} - {scoreAway}{" "}
                </span>
              </div>

              <div className="team-container right-team">
                <span className="team-logo">
                  <img
                    src={`http://127.0.0.1:3500/participantimage/${teamAwayId}`}
                    onError={(e) => {
                      e.target.src = "http://127.0.0.1:3500/static/default.png";
                    }}
                  />
                </span>
                <span className="team-name">{teamNameAway}</span>
              </div>
            </div>
            <div className="right-container">
              <span className="time-fixture">{getElapsedTime(startTime)}</span>
            </div>
          </div>
          {/* END HEADER */}

          <div id="group-markets">
            {marketsIds.map((marketId) => (
              <MarketWindow
                key={marketId}
                market={fixture.markets[marketId]}
                odds={odds}
                oddsFlags={oddsFlags}
                updateOddsFlags={updateOddsFlags}
                teams={fixture.teams}
                oddSimulationState={oddSimulationState}
                updateOddSimulationState={updateOddSimulationState}
              />
            ))}
            {snapshotComplete && marketsIds.length == 0 && (
              <h1 className="no-odds-message">
                <span>No odds to show</span>
              </h1>
            )}
          </div>
        </div>
      </div>
    </AppContext>
  );
}
