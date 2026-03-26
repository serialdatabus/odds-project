import { useState, useEffect, useRef } from "react";
import { BrowserRouter } from "react-router";
import Home from "./components/Home";

const API_KEY = "82f3a97d9b393012e75b2ceb9d9fcb2e";

function snapshotInitialPage() {
  fetch(`https://v5.oddspapi.io/de/sports?apiKey=${API_KEY}`)
    .then((response) => response.json())
    .then((data) => console.log(data));
}

function App() {
  const [count, setCount] = useState(0);
  const [sports, setSports] = useState([]);
  const [currentPage, setCurrentPage] = useState("");

  let loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      console.log("start script");
      loaded.current = true;
    }

    return () => {};
  }, []);

  return (
    <Router>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
      <Switch>
        <Route exact path="/" component={Home} />
      </Switch>
    </Router>
  );
}

export default App;
