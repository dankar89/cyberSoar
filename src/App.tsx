// src/App.tsx
import React from "react";
import { GameProvider } from "./components/GameContext.tsx";
import Debug from "./components/Debug.tsx";

function App() {
  return (
    <div className="App">
      <GameProvider width={640} height={640}>
          {<Debug />}
      </GameProvider>

    </div >
  );
}

export default App;
