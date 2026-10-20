import { useContext } from "react";
import { BuildingContext } from "./BuildingContext";

export function useBuilding() {
    const context = useContext(BuildingContext);

    if (!context) {
        throw new Error(
            "useBuilding must be used inside a BuildingProvider"
        );
    }

    return context;
}