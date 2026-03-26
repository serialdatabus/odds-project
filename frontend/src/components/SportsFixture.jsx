import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getElapsedTime } from "../helpers";


function SportsFixture({ data, fixtures, onCloseConnection }) {
    const navigate = useNavigate();

  return (
    <div>
      <h3 className="header-sport-fixture">{data.sportName}</h3>

      {fixtures.map((fixture, i) => (
        <div
        onClick={() =>{
            onCloseConnection();
            navigate(`/fixture/${fixture.fixtureId}`)
        }}
          key={fixture.fixtureId}
          className={"fixture " + (i == fixtures.length - 1 ? "last" : "")}
        >
          <div className="logo-fixture">
            <img
              onError={(e) => {
                e.target.src = "http://127.0.0.1:3500/static/default.png";
              }}
              src={
                "http://127.0.0.1:3500/participantimage/" +
                fixture.teams.home.id
              }
            />
          </div>
          <span className="description-fixture">
            <span className="home-team">{fixture.teams.home.name}</span>
            <span className="versus">
              <span className="result">{fixture?.score.home ?? "0"}</span>
              <span className="time">{getElapsedTime(fixture.startTime)}</span>
              <span className="result">{fixture?.score.away ?? "0"}</span>
            </span>
            <span className="away-team">{fixture.teams.away.name}</span>
          </span>
          <div className="logo-fixture">
            <img
              onError={(e) => {
                e.target.src = "http://127.0.0.1:3500/static/default.png";
              }}
              src={
                "http://127.0.0.1:3500/participantimage/" +
                fixture.teams.away.id
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SportsFixture;
