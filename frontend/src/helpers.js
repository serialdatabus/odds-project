import { useEffect, useRef } from "react";

export const EVENT_UPDATE_FIXTURES = "updatefixtures";
export const EVENT_UPDATE_ODDS = "updateodds";
export const EVENT_UPDATE_SCORES = "updatescores";
export const API_KEY = "";
export const ODD_OK = "odd_ok";
export const ODD_SUSPICIOUS = "odd_suspicious";
export const ODD_FROZEN = "odd_frozen";
export const DEVIATION_THRESHOLD = 0.3;
export const SUSPECT_RATIO = 0.75;
export const ODD_FAULT_THRESHOLD = 15;
export const FAULT_RECOVERY_RATE = 5;
export const FAULT_INCREASE_RATE = 2;
export const AMERICAN_PRICE_ENABLED = false;

export function getElapsedTime(startTime) {
  if (startTime == 0) return "";
  const now = Date.now(); // ms
  const start = startTime * 1000; // converter para ms
  const minutes = Math.floor((now - start) / 60000);
  return (minutes >= 0 ? minutes : 0) + " '";
}

export function getOutcomeTitle(outcomeName, teams) {
  outcomeName = outcomeName.toLowerCase();
  const home = teams?.home?.name ?? outcomeName;
  const away = teams?.away?.name ?? outcomeName;

  const outcomeLabels = {
    x: "DRAW",
    1: home,
    2: away,
  };

  return outcomeLabels[outcomeName] ?? outcomeName;
}

export function getUpdateType(event) {
  return ((event.type ?? "") + (event.channel ?? "")).toLowerCase();
}

export function getResult(scores) {
  if (!scores) return null;

  if (scores.result) {
    return scores.result;
  }

  if (scores.fulltime) {
    return scores.fulltime;
  }

  if (scores["1stHalf"]) {
    return scores["1stHalf"];
  }

  const periods = Object.entries(scores)
    .filter(([key]) => key.startsWith("p"))
    .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)));

  if (periods.length > 0) {
    return periods[periods.length - 1][1];
  }

  return null;
}

export function isSameScore(prev, next) {
  if (!prev || !next) return false;

  return (
    prev.home === next.participant1Score && prev.away === next.participant2Score
  );
}

export function closeConnection(socketRef) {
  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
    socketRef.current.close();
  }
}

export function isValidOdd(odd, fixture) {
    if(!fixture) {
    console.log("step_invalid fixture");
        return;
    }else{
    console.log("step_valid fixture");

    }
  if (!odd || typeof odd !== "object") return false;

  const {
    active,
    price,
    priceAmerican,
    marketId,
    outcomeId,
    bookmaker,
    changedAt,
    fixtureId,
  } = odd;

  if (!active) return false;

  if (!marketId || !outcomeId || !bookmaker) return false;

  if (typeof price !== "number" || price <= 1 || price > 1000) return false;

  if (typeof priceAmerican !== "number") return false;

  if (priceAmerican === 0) return false;

  if (priceAmerican > -100 && priceAmerican < 100) return false;

  console.log({"fixture2": fixture});
  if (fixtureId !== fixture.fixtureId) return false;

  const market = fixture?.markets?.[marketId];
  if (!market) return false;

  if (!market.outcomes?.[outcomeId]) return false;

  if (changedAt && Date.now() - changedAt > 120000) return false;

  return true;
}

export function getSimulatedPrice(basePrice, simState, oddId) {
  let price = basePrice;

  if (!simState) {
    return price;
  }

  if (simState?.["outlier"]) {
    const delta = (Math.random() - 0.5) * 0.1; // ±5%
    price = price * (1 + delta);
  }

  if (simState?.["deviation"]) {
    const min = 0.15;
    const max = 0.8;

    const magnitude = Math.random() * (max - min) + min;
    const direction = Math.random() < 0.5 ? -1 : 1;

    price = price * (1 + magnitude * direction);
  }

  if (simState?.harddeviation) {
    const min = 1.5;
    const max = 3.0;

    const magnitude = Math.random() * (max - min) + min;
    const direction = Math.random() < 0.8 ? 1 : -1;

    price = price * (1 + magnitude * direction);
  }

  price = Math.max(price, 1.01);

  return Number(price.toFixed(3));
}

export function getOddStatus(oddId, oddsFlags) {
  const flag = oddsFlags?.[oddId];

  if (!flag) return ODD_OK;

  const { faultsCount, threshold } = flag;

  if (faultsCount >= threshold) {
    return ODD_FROZEN;
  }

  if (faultsCount >= threshold * SUSPECT_RATIO) {
    return ODD_SUSPICIOUS;
  }

  return ODD_OK;
}

export function normalizeOdd(oddId, odd, americanPriceEnabled = false) {
  const { price, priceAmerican } = odd;

  return {
    oddId: oddId,
    price: price,
    priceAmerican: priceAmerican,
    displayPrice: americanPriceEnabled ? priceAmerican : price,
    simulatedPrice: 0,
    marketId: odd.marketId,
    outcomeId: odd.outcomeId,
    bookmaker: odd.bookmaker,
    changedAt: odd.changedAt,
    limit: odd.limit,
    fixtureId: odd.fixtureId,
    mainLine: odd.mainLine,
    isValid: true,
  };
}

export function useOddsValidationEngine({
  oddsRef,
  oddsSimulationStateRef,
  updateOddsFlags,
}) {

  const odds = oddsRef.current;
  const oddSimulationState = oddsSimulationStateRef.current;

  console.log({updateOddsFlagsEngine: oddSimulationState});



  useEffect(() => {
    const interval = setInterval(() => {
      const oddsMap = odds;
      const oddsList = Object.keys(oddsMap).map((key) => {
        return { ...oddsMap[key], ["id"]: key };
      });



      // 👉 agrupar por outcome

      //   oddsList.forEach((odd) => {
      //     if (!grouped[odd.outcomeId]) {
      //       grouped[odd.outcomeId] = [];
      //     }
      //     grouped[odd.outcomeId].push(odd);
      //   });

      const oddsByMarketOutcome = {};

      Object.keys(oddsMap).forEach((oddId) => {
        const odd = oddsMap[oddId];
        const { marketId, outcomeId } = odd;

        const marketOutcomeIndex = marketId.toString() + outcomeId.toString();
        if (!oddsByMarketOutcome?.[marketOutcomeIndex]) {
          oddsByMarketOutcome[marketOutcomeIndex] = [];
        }

        oddsByMarketOutcome[marketOutcomeIndex].push({ ...odd, ["id"]: oddId });
      });

      console.log({ oddsByMarketOutcome });
       const oddsByMarketOutcomeIds =  Object.keys(oddsByMarketOutcome);
      for (let i = 0; i < oddsByMarketOutcomeIds.length; i++) {
        
        //current market

        const marketOutcomeOdds = oddsByMarketOutcome[oddsByMarketOutcomeIds[i]];





        console.log({marketOutcomeOdds});
        
   
      }

      // group odds by same market and outcome id
      //so they can be compared













      //       enrichedOdds.forEach((odd) => {
//         let reference;

//         if (prices.length <= 2) {
//           const mid = Math.floor(prices.length / 2);

//           reference =
//             prices.length % 2 === 0
//               ? (prices[mid - 1] + prices[mid]) / 2
//               : prices[mid];
//         } else {
//           const trimmed = prices.slice(1, prices.length - 1);

//           const mid = Math.floor(trimmed.length / 2);

//           reference =
//             trimmed.length % 2 === 0
//               ? (trimmed[mid - 1] + trimmed[mid]) / 2
//               : trimmed[mid];
//         }

//         const deviation = Math.abs(odd.displayPrice - reference) / reference;


//         updateOddsFlags((draft) => {
//           const current = draft?.[odd.id] || {
//             faultsCount: 0,
//             threshold: ODD_FAULT_THRESHOLD,
//             lastPrice: 0
//           };

//           let faultsCount = current.faultsCount;

//           if (deviation > DEVIATION_THRESHOLD) {
//             faultsCount += FAULT_INCREASE_RATE;
//           } else {
//             faultsCount = Math.max(faultsCount - FAULT_RECOVERY_RATE, 0);
//           }

//           draft[odd.id] = {
//             faultsCount,
//             threshold: current.threshold,
//             lastPrice: odd.price
//           };
//         });



    }, 2000);

    return () => clearInterval(interval);
  }, []);
}
