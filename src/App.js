import { Outlet, Link } from "react-router-dom";
import './App.css';
function App() {
  return (
    <div className="App">
      <header className="App-background">

        <p id="welcome">
          Welcome to DJ Don Diablo - Promo Delivery System
        </p>
      </header>


        <div className="App-header">
          <nav id="mainMenu">
            <Link to="/Login">Login</Link>
            <Link to="/Registratie">Registratie</Link>
            <Link to="/Profiel">Profiel</Link>
            <Link to="/Demo-drop">Demo-drop</Link>
          </nav>
          <Outlet />
        </div>
    </div>
  );
}

export default App;
