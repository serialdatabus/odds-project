import { useContext, useEffect, useState } from "react";
import { MdOutlineWarning } from "react-icons/md";
import { AlertIcon } from "./AlertIcon";
import { CheckIcon } from "./CheckIcon";
import { FrozenIcon } from "./FrozenIcon";
import { LightningIcon } from "./LightningIcon";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { CloseIcon } from "./CloseIcon";
import {
    AMERICAN_PRICE_ENABLED,
  DEVIATION_THRESHOLD,
  FAULT_INCREASE_RATE,
  FAULT_RECOVERY_RATE,
  getOddStatus,
  getSimulatedPrice,
  ODD_FAULT_THRESHOLD,
} from "../helpers";
import { AppContext } from "./AppContext";
import { ODD_OK, ODD_SUSPICIOUS, ODD_FROZEN } from "../helpers";

function OutcomeItem({
  title,
  odds,
  oddsFlags,
  updateOddsFlags,
  bestodd,
  showAll,
  oddSimulationState,
  updateOddSimulationState,
}) {
  const [hiddenImages, setHiddemImages] = useState({});
  const appContext = useContext(AppContext);
  const filteredOdds = [...odds]
    .sort((a, b) => b.displayPrice - a.displayPrice)
    .slice(0, showAll ? odds.length : 1);


  useEffect(() => {}, []);

  const computedOdds = filteredOdds
    // .map((odd) => {
    //   const sim = oddSimulationState?.[odd.id];
    //   const displayPrice = getSimulatedPrice(AMERICAN_PRICE_ENABLED ? odd.priceAmerican : odd.price, sim);

    //   return {
    //     ...odd,
    //     displayPrice,
    //   };
    // })
    .sort((a, b) => b.displayPrice - a.displayPrice);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const enrichedOdds = computedOdds.map((odd) => {
//         const sim = oddSimulationState?.[odd.id];
//         const displayPrice = getSimulatedPrice(odd.price, sim);

//         return { ...odd, displayPrice };
//       });

//       const prices = enrichedOdds
//         .map((o) => o.displayPrice)
//         .sort((a, b) => a - b);

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
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [filteredOdds, oddSimulationState]);





  return (
    <div className="outcome-container">
      {computedOdds.map((odd, index) => (
        <div key={odd.id}>
          <div className="outcome-name">{index == 0 ? `${title}` : ""}</div>
          <div className="odd-info-container">
            <PopupWindow
              oddSimulationState={oddSimulationState}
              updateOddSimulationState={updateOddSimulationState}
              oddId={odd.id}
              updateOddsFlags={updateOddsFlags}
            />
            <div
              className={`price-outcome ${getOddStatus(odd.id, oddsFlags) == ODD_FROZEN ? "frozen" : ""}`}
            >
              {odd.displayPrice}
            </div>
            <div
              className={`bookmaker-image ${getOddStatus(odd.id, oddsFlags) == ODD_FROZEN ? "frozen" : ""}`}
            >
              {hiddenImages?.[odd.bookmaker] ? (
                <span>{odd.bookmaker}</span>
              ) : (
                <img
                  src={`http://127.0.0.1:3500/bookmakersimage/${odd.bookmaker}`}
                  onError={(e) => {
                    setHiddemImages((prev) => {
                      return {
                        ...prev,
                        [odd.bookmaker]: true,
                      };
                    });
                  }}
                />
              )}
            </div>
            <span className="icon">
              {getOddStatus(odd.id, oddsFlags) == ODD_OK && (
                <CheckIcon size={33} />
              )}

              {getOddStatus(odd.id, oddsFlags) == ODD_SUSPICIOUS && (
                <AlertIcon size={33} />
              )}

              {getOddStatus(odd.id, oddsFlags) == ODD_FROZEN && (
                <FrozenIcon size={33} />
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const PopupWindow = ({
  oddId,
  oddSimulationState,
  updateOddSimulationState,
  updateOddsFlags,
}) => {
  const simulationSchema = {
    outlier: false,
    deviation: false,
    harddeviation: false,
  };
  const { outlier, deviation, harddeviation } = oddSimulationState?.[oddId] ?? {
    ...simulationSchema,
  };

  const isOddSimulationEnabled = outlier || deviation || harddeviation;

  function toggleOutlier() {
    updateOddSimulationState((draft) => {
      if (!draft[oddId]) {
        draft[oddId] = { ...simulationSchema };
      }

      draft[oddId].outlier = !draft[oddId].outlier;
    });
  }

  function toggleDeviation() {
    updateOddSimulationState((draft) => {
      if (!draft[oddId]) {
        draft[oddId] = { ...simulationSchema };
      }

      draft[oddId].deviation = !draft[oddId].deviation;
    });
  }

  function toggleHardDeviation() {
    updateOddSimulationState((draft) => {
      if (!draft[oddId]) {
        draft[oddId] = { ...simulationSchema };
      }

      draft[oddId].harddeviation = !draft[oddId].harddeviation;
    });
  }

  function resetSimulation() {
    updateOddSimulationState((draft) => {
      delete draft[oddId];
    });

    updateOddsFlags((draft) => {
      draft[oddId] = {
        faultsCount: 0,
        threshold: ODD_FAULT_THRESHOLD,
      };
    });
  }

  return (
    <Popup
      modal={true}
      trigger={
        <span
          className={isOddSimulationEnabled ? "odd-simulation-btn-enabled" : ""}
          style={{ cursor: "pointer" }}
        >
          <LightningIcon size={30} />
        </span>
      }
    >
      {(close) => (
        <div id="popup-error-simulation">
          <div className="header-title">
            <span className="title-label">
              Select an error simulation to test the odds
            </span>
            <span onClick={() => close()} className="btn-close">
              <CloseIcon size={45} />
            </span>
          </div>

          <div className="simulation-group">
            <div
              onClick={() => {
                toggleOutlier();
              }}
              className={`simulation-item ${outlier ? " selected" : " "}`}
            >
              Apply Outlier
            </div>

            <div
              onClick={() => {
                toggleDeviation();
              }}
              className={`simulation-item ${deviation ? " selected" : " "}`}
            >
              Simulate Deviation
            </div>

            <div
              onClick={() => {
                toggleHardDeviation();
              }}
              className={`simulation-item ${harddeviation ? " selected" : " "}`}
            >
              Simulate Hard Deviation
            </div>

            <div
              onClick={() => {
                resetSimulation();
              }}
              className={`simulation-item`}
            >
              Reset to Normal
            </div>
          </div>
        </div>
      )}
    </Popup>
  );
};

export default OutcomeItem;
