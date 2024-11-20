import React, { useEffect, useMemo } from "react";
import { WeightsEnum } from "../game/boids/types.ts";
import { useGame } from "./GameContext.tsx";
import "./debug.css";

const SliderComp = ({
  value,
  min,
  max,
  step,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
}) => {
  return (
    <div className="slider">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span>{value}</span>
    </div>
  );
};

const ToggleComp = ({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => {
  return (
    <div className="toggle">
      <label>{label}</label>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
};

const Debug: React.FC = () => {
  const { game, loaded } = useGame();

  useEffect(() => {
    console.log("Debug component mounted");
    return () => {
      console.log("Debug component unmounted");
    };
  }, []);

  const renderWeights = useMemo(() => {
    if (!game?.boidManager) return null;

    return (
      <>
        <SliderComp
          value={game.boidManager.getWeight(WeightsEnum.alignment)}
          min={0.1}
          max={3}
          step={0.1}
          onChange={(value) => game.boidManager.setWeight(WeightsEnum.alignment, value)}
          label="Alignment"
        />
        <SliderComp
          value={game.boidManager.getWeight(WeightsEnum.cohesion)}
          min={0.1}
          max={3}
          step={0.1}
          onChange={(value) => game.boidManager.setWeight(WeightsEnum.cohesion, value)}
          label="Cohesion"
        />
        <SliderComp
          value={game.boidManager.getWeight(WeightsEnum.separation)}
          min={0.1}
          max={6}
          step={0.1}
          onChange={(value) => game.boidManager.setWeight(WeightsEnum.separation, value)}
          label="Separation"
        />
        <SliderComp
          value={game.boidManager.getWeight(WeightsEnum.attraction)}
          min={0.1}
          max={3}
          step={0.1}
          onChange={(value) => game.boidManager.setWeight(WeightsEnum.attraction, value)}
          label="Attraction"
        />
      </>
    );
  }, [game?.boidManager]);

  const renderPostProcessSettings = () => {
    if (!game?.postProcessLayer?.initialized) return null;

    return (
      <>
        <ToggleComp
          value={game.postProcessEnabled || false}
          onChange={(value) => (game.postProcessEnabled = value)}
          label="Post Process"
        />
        {game.postProcessEnabled && (
          <>
            <SliderComp
              value={game.postProcessLayer.bloomThreshold}
              min={0.1}
              max={1}
              step={0.1}
              onChange={(value) => (game.postProcessLayer.bloomThreshold = value)}
              label="Bloom Threshold"
            />
            <SliderComp
              value={game.postProcessLayer.bloomIntensity}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(value) => (game.postProcessLayer.bloomIntensity = value)}
              label="Bloom Intensity"
            />
          </>
        )}
      </>
    );
  };

  console.log("####### Debug Render #######", {
    loaded,
    game
  });
  return (
    <div className="debugOverlay">
      {loaded && renderWeights}
      {loaded && renderPostProcessSettings()}
    </div>
  );
};

export default Debug;
