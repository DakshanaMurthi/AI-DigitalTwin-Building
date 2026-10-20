import { createContext, useEffect, useState } from "react";

export const BuildingContext = createContext(null);

const DEFAULT_BUILDINGS = [
    {
        building_id: "Building-A",
        building_name: "Main Building",
        building_type: "physical",
    },
    {
        building_id: "Building-Virtual",
        building_name: "Virtual Building",
        building_type: "virtual",
    },
];

export function BuildingProvider({ children }) {
    const [buildings, setBuildings] =
        useState(DEFAULT_BUILDINGS);

    const [selectedBuildingId, setSelectedBuildingId] =
        useState(() => {
            return (
                localStorage.getItem("selectedBuildingId") ||
                "Building-Virtual"
            );
        });

    useEffect(() => {
        localStorage.setItem(
            "selectedBuildingId",
            selectedBuildingId
        );
    }, [selectedBuildingId]);

    const value = {
        buildings,
        setBuildings,
        selectedBuildingId,
        setSelectedBuildingId,
    };

    return (
        <BuildingContext.Provider value={value}>
            {children}
        </BuildingContext.Provider>
    );
}