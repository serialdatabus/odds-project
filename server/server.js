// Require the framework and instantiate it

import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import path from "path";

// key is the fixtureid
let snapshotisUpdating = false;

const TOTAL_FIXTURES_PER_SPORT = 50;
const MARKET_IDS = [101, 104, 1010, 111, 11226, 11434, 121, 1237];
const FIXTURE_STATE_OK = "ok";
const FIXTURE_STATE_SUSPECT = "suspect";
const markets = {};

const API_KEY = "";

function getScores(data) {
  return {
    home: data.p1?.participant1Score ?? data.result?.participant1Score ?? null,
    away: data.p1?.participant1Score ?? data.result?.participant2Score ?? null,
    updatedAt: data.p1?.updatedAt ?? data.result?.updatedAt ?? null,
  };
}

function normalizeOdds(odds) {
  if (!odds) return odds;

  const normalizedOdds = {};
  Object.keys(odds).forEach((item) => {
    Object.keys(odds[item]).forEach((oddId) => {
      normalizedOdds[oddId] = odds[item][oddId];
    });
  });

  return normalizedOdds;
}

function normalizeFixture(data) {
  const state = FIXTURE_STATE_OK;

  const {
    participants,
    fixtureId,
    sport,
    tournament,
    startTime,
    status,
    bookmakers,
    scores,
    odds,
  } = data;

  const teams = {};
  teams.home = {
    id: participants.participant1Id,
    name: participants.participant1Name,
  };

  teams.away = {
    id: participants.participant2Id,
    name: participants.participant2Name,
  };

  return {
    fixtureId,
    teams,
    sportId: sport.sportId,
    tournament: tournament.tournamentName,
    startTime,
    status: status.statusName,
    bookmakers,
    state,
    odds: normalizeOdds(odds),
    markets: {},
    score: getScores(scores),
  };
}

async function getMarkets() {
  const res = await fetch(
    `https://v5.oddspapi.io/en/markets?apiKey=${API_KEY}&marketIds=${MARKET_IDS.join(",")}`,
  );

  const markets = {};
  (await res.json()).forEach((item) => {
    markets[item.marketId] = item;
  });
  return markets;
}


async function getParticipantsImages(participantsIds) {
  const participantsImages = {};

  for (let i = 0; i < participantsIds.length; i++) {
    // const batch = fixtureIds.slice(i, i + concurrency);

    const participantId = participantsIds[i];

    const imageurl = `https://v5.oddspapi.io/en/media/participants/${participantId}?apiKey=${API_KEY}`;

    try {
      const image = await (await fetch(oddurl)).blob;

      participantsImages[participantId] = image;
    } catch (err) {
      console.log("error getting image", err);
    }
  }

  return odds;
}

async function getFixtureOdds(id){

  const res = await fetch(
    `https://v5.oddspapi.io/en/fixtures/odds?apiKey=${API_KEY}&fixtureId=${id}&mainLine=true`,
  );

  const fixture = normalizeFixture(await res.json());

  const markets = await getMarkets();

  const { odds } = fixture;

  const oddsIds = odds ? Object.keys(odds) : [];


   for(let i=0;i<oddsIds.length;i++){
      const oddId = oddsIds[i];
      const odd = odds[oddId];
      const { marketId } = odd;
      const market = markets[marketId];

      // if odd comes with a valid market that will be used in the system
      if(market){

        const {  marketType, handicap , outcomes, marketName } = market;

        if(!fixture.markets[marketId]){

          // build normalized 'outcomes' object

          const normalizedOutcomes = {};

          outcomes.forEach( item => {

           normalizedOutcomes[item.outcomeId] = {
            ...item,
            ["oddsIds"]: []
           }

          })


          fixture.markets[marketId] = {
            marketId,
            marketType,
            handicap,
            marketName,
            outcomes: normalizedOutcomes

          }

        }


 
         const oddsIds = [...fixture.markets[marketId].outcomes[odd.outcomeId].oddsIds, oddId];
         const uniqueOddsIds = [...new Set(oddsIds)];

         fixture.markets[marketId].outcomes[odd.outcomeId].oddsIds = uniqueOddsIds;






      }


      // add odd


   }



  return fixture;
}


const fastify = Fastify({
  logger: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "static"),
  prefix: "/static/", // optional: default '/'
  constraints: {}, // optional: default {}
});

await fastify.register(cors, {
  // put your options here
});

fastify.get("/", async function (request, reply) {
  const snapshot = {
    fixtures: {},
    sports: [],
  };

  //get bookmakers
  try {


    //get sports
    let res = await fetch(`https://v5.oddspapi.io/en/sports?apiKey=${API_KEY}`);
    let data = await res.json();

    snapshot.sports = data;

    for (let i = 0; i < snapshot.sports.length; i++) {
      // get live fixtures by sport id
      const urlFixtures = `https://v5.oddspapi.io/en/fixtures/live?apiKey=${API_KEY}&sportId=${snapshot.sports[i].sportId}`;
      //   console.log("urlFixtures:", urlFixtures);
      res = await fetch(urlFixtures);

      data = await res.json();

      data = data.map((item) => {
        item.state = FIXTURE_STATE_OK;
        return item;
      });


      for (
        let fixtureIndex = 0;
        fixtureIndex < TOTAL_FIXTURES_PER_SPORT;
        fixtureIndex++
      ) {
        if (fixtureIndex > data.length - 1) {
          break;
        }

        const fixture = data[fixtureIndex];
        const fixtureId = fixture.fixtureId;


        snapshot.fixtures[fixture.fixtureId] = normalizeFixture(fixture);

        if (Array.isArray(snapshot.sports[i].fixturesIds)) {
          snapshot.sports[i].fixturesIds.push(fixtureId);
        } else {
          snapshot.sports[i].fixturesIds = [fixtureId];
        }
      }
    }

 

    return reply.send({
      ...snapshot,
    });
  } catch (err) {
    console.log(err);
    reply.status(500).send({ error: "failed to fetch snapshot" });
  }
});

fastify.get("/participantimage/:id", async (request, reply) => {
  const { id } = request.params;

  const url = `https://v5.oddspapi.io/en/media/participants/${id}?apiKey=${API_KEY}`;
  console.log(url);

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    console.log(response);
    return reply.code(500).send("Failed to fetch image");
  }

  // Enviar stream direto
  return reply.send(response.body);
});




fastify.get("/bookmakersimage/:id", async (request, reply) => {
  const { id } = request.params;

  const url = `https://v5.oddspapi.io/en/media/bookmakers/${id}?apiKey=${API_KEY}`;
  console.log(url);

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    console.log(response);
    return reply.code(500).send("Failed to fetch image");
  }

  // Enviar stream direto
  return reply.send(response.body);
});


fastify.get("/markets", async (request, reply) => {
  reply.send(await getMarkets());
});



fastify.get("/fixtureodds/:id", async (request, reply) => {
  const { id } = request.params;
  reply.send(await getFixtureOdds(id));
});

// Run the server!
fastify.listen({ port: 3500 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
