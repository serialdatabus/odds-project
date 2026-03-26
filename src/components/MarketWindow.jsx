import { useState } from "react";
import OutcomeItem from "./OutComeItem";
import { getOutcomeTitle } from "../helpers";

function MarketWindow({
  market,
  odds,
  oddIds,
  oddsFlags,
  updateOddsFlags,
  teams,
  updateOddSimulationState,
  oddSimulationState,
}) {
  const [showAll, setShowAll] = useState(false);

      console.log({oddsFlagsOutcomeItem: oddsFlags})


  const { outcomes } = market;

  const outcomesIds = Object.keys(outcomes);

  const hasOdds = Object.values(market.outcomes).some((outcome) =>
    outcome.oddsIds.some((oddId) => odds[oddId]),
  );

  if(!hasOdds) return;

  return (
    <div className="market">
      <div className="header-market">
        <span>{market.marketName}</span>
        <span>
          <a onClick={() => setShowAll((prev) => !prev)}>
            {showAll ? "Hide" : "Show All"}
          </a>
        </span>
      </div>
      {outcomesIds.map((outcomeId) => {
        return (
          <OutcomeItem
            key={outcomeId}
            title={getOutcomeTitle(outcomes[outcomeId].outcomeName, teams)}
            showAll={showAll}
            market={market}
            updateOddSimulationState={updateOddSimulationState}
            oddSimulationState={oddSimulationState}
            oddsFlags={oddsFlags}
            updateOddsFlags={updateOddsFlags}
            odds={outcomes[outcomeId].oddsIds
              .filter((item) => odds[item])
              .map((item) => {
                return {
                  ...odds[item],
                  ["id"]: item,
                };
              })}
          />
        );
      })}
    </div>
  );
}

export default MarketWindow;
