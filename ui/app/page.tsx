"use client";

import { useCoAgent, useCopilotAction, useLangGraphInterrupt } from "@copilotkit/react-core";
import { CopilotSidebar, Markdown, useCopilotChatSuggestions } from "@copilotkit/react-ui";
import { useState } from "react";

// Define the type for the agent state
// It holds a record of towns with their descriptions
type AgentState = {
  towns: Record<string, string>,
};

export default function Home() {
  return (
    <main>
      <FamousTowns />
      <CopilotSidebar
        defaultOpen={true}
        labels={{
          title: "Popup Assistant",
          initial: "Hi! I'm connected to an agent. How can I help?",
        }}
      />
    </main>
  );
}

function FamousTowns() {
  const { state, setState } = useCoAgent<AgentState>({ 
    name: "sample_agent",
    initialState: {
      towns: {},
    }
  });

  // Configure chat suggestions
  useCopilotChatSuggestions(
    {
      instructions: "Suggest the most relevant next actions.",
      minSuggestions: 1,
      maxSuggestions: 2,
    },
    [state.towns],
  );

  // Define the Copilot action to select famous towns
  useCopilotAction({ 
    name: "getFamousTowns",
    available: "remote",
    description: "Displays a list of famous towns with checkboxes and provides details about selected towns.",
    parameters: [],
    renderAndWaitForResponse: ({ respond }) => {
      const [selectedTowns, setSelectedTowns] = useState<string[]>([]);

      // Define the list of available towns with descriptions
      const towns: Record<string, string> = {
        "Paris": "Eiffel Tower, art, and fashion.",
        "New York": "Times Square, Broadway, and skyline.",
        "Tokyo": "Tech hub with rich culture.",
        "London": "Big Ben, history, and museums.",
        "Dubai": "Skyscrapers, luxury shopping.",
        "Sydney": "Opera House, beaches, and nature.",
        "Rome": "Ancient ruins and the Colosseum.",
        "Cairo": "Pyramids of Giza and history.",
        "Istanbul": "Bridges Europe & Asia, rich culture.",
        "Rio de Janeiro": "Carnival, beaches, and Christ statue."
      };

      // Function to handle checkbox changes
      const handleCheckboxChange = (town: string) => {
        setSelectedTowns((prevSelected) =>
          prevSelected.includes(town)
            ? prevSelected.filter((t) => t !== town) // Remove if already selected
            : [...prevSelected, town] // Add if not selected
        );
      };

      // Function to handle the button click
      const handleSelection = () => {
        const formattedResponse = {
          towns: selectedTowns.map((town) => ({
            name: town,
            details: towns[town]
          }))
        };

        respond?.(JSON.stringify(formattedResponse)); // Send response
      };

      return (
        <div className="p-4 rounded-lg shadow-md bg-white w-96">
          <h3 className="text-lg font-semibold mb-3">Select Famous Towns</h3>
          <div className="space-y-2">
          {Object.entries(towns)
            .filter(([town]) => !(state.towns && state.towns[town])) // Ensure state.towns is defined
            .map(([town, description]) => (
                <div key={town} className="flex items-center gap-3 p-2 border rounded-md shadow-sm">
                  <input 
                    type="checkbox" 
                    id={town} 
                    checked={selectedTowns.includes(town)}
                    onChange={() => handleCheckboxChange(town)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <label htmlFor={town} className="flex-1">
                    <span className="font-medium">{town}</span>  
                    <span className="text-gray-500 text-sm block">{description}</span>
                  </label>
                </div>
              ))}
          </div>

          <button 
            onClick={handleSelection}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full mt-4"
          >
            Add Town
          </button>
        </div>
      );
    },
  });

  return (
    <div className="h-screen w-screen flex flex-col items-center p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {state.towns && Object.entries(state.towns).map(([name, description]) => (
          <div key={name} className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{name}</h2>
            <p className="text-gray-700">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
