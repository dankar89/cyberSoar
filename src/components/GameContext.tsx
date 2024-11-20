import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Game from "../game/game.ts"; // Import the Game class
import * as LittleJS from "littlejsengine"; // Import without full typing
import Debug from "./Debug.tsx";

// Define the shape of the context
interface GameContextType {
  game: Game | null;
  loaded?: boolean;
}

// Create the context
const GameContext = createContext<GameContextType>({ game: null });

// Provider component to initialize and provide the Game instance
export const GameProvider: React.FC<{
  children: React.ReactNode,
  width: number,
  height: number
}> = ({
  children,
  width = 800,
  height = 600
}) => {
    const [gameInstance, setGameInstance] = useState<Game | null>(null);
    const [gameInitialized, setLoaded] = useState(false);

    useEffect(() => {
      const game = new Game();
      setGameInstance(game);

      return () => {
        LittleJS.engineObjectsDestroy();
      };
    }, [height, width]);

    useEffect(() => {
      if (gameInstance) {
        const onLoaded = () => setLoaded(true);
        gameInstance.on("loaded", onLoaded);

        // Trigger the check immediately in case the state is already updated
        if (gameInstance.initialized) {
          onLoaded();
        }

        return () => {
          gameInstance.off("loaded", onLoaded);
        };
      }
    }, [gameInstance]);

    const value = useMemo(
      () => ({
        game: gameInstance,
        loaded: gameInitialized,
      }),
      [gameInstance, gameInitialized]
    );
    return (
      <GameContext.Provider value={value}>
        {children}
      </GameContext.Provider>
    );
  };

// Custom hook to access the Game instance
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return {
    game: context.game,
    loaded: context.loaded,
  };
};
