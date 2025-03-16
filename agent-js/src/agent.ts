import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Command, END, MemorySaver, StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { convertActionsToDynamicStructuredTools, CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph";
import { SystemMessage } from "@langchain/core/messages";

// Initialize the LLM with configuration
const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    apiKey: "",
});

// Define graph state with message annotations
const AgentStateAnnotation = Annotation.Root({
    ...CopilotKitStateAnnotation.spec,
    towns: Annotation<Record<string, string>>(),
});

export type AgentState = typeof AgentStateAnnotation.State;


// Chat Node handling LLM interaction
const chatNode = async (state: AgentState) => {
    const staticTools = llm.bindTools([...convertActionsToDynamicStructuredTools(state.copilotkit?.actions || [])]);
    const response = await staticTools.invoke(state.messages);

    if (response.tool_calls?.length) {
        const toolCall = response.tool_calls[0];
        
        if (toolCall.name === "getFamousTowns") {
            return new Command({
                goto: "getFeedback",
                update: { messages: [...state.messages, response] }, // Preserve message history
            });
        }
    } else {
        return new Command({
            goto: END,
            update: { messages: [...state.messages, response] },
        });
    }
};

// Placeholder for external modifications before handling feedback
const getFeedback = async (state: AgentState) => {
    return state;
};

const handleFeedback = async (state: AgentState) => {
    let newState: Partial<AgentState> = { ...state, towns: state.towns || {} };

    try {
        const userResponse = state.messages[state.messages.length - 1]?.content || "{}";
        const parsedData = JSON.parse(userResponse);

        if (parsedData.towns && Array.isArray(parsedData.towns)) {
            parsedData.towns.forEach((town: { name: string; details: string }) => {
                newState.towns![town.name] = town.details;
            });
        }
    } catch (error) {
        return {
            ...newState,
            messages: [...state.messages, new SystemMessage("Failed to process town data.")],
        };
    }

    const informativeMessage =
        Object.keys(newState.towns || {}).length > 0
            ? "Ask user do you want to add more towns"
            : "Ask user do you want any other details";

    return {
        ...newState,
        messages: [...state.messages, new SystemMessage(informativeMessage)],
    };
};

// Define the graph and compile it
export const graph = new StateGraph(AgentStateAnnotation)
    .addNode("chatNode", chatNode, { ends: ["getFeedback"] })
    .addNode("getFeedback", getFeedback)
    .addNode("handleFeedback", handleFeedback)
    .addEdge("__start__", "chatNode")
    .addEdge("getFeedback", "handleFeedback")
    .addEdge("handleFeedback", "chatNode")
    .compile({
        checkpointer: new MemorySaver(),
        interruptAfter: ["getFeedback"], // Interrupt after getFeedback for external intervention
    });