import { describe, expect, it } from "vitest";
import { backPanel, closePanel, createPanelRouterState, hasPreviousPanel, openPanel } from "./panelRouter";
import type { PanelEntry } from "./panelTypes";

const profile: PanelEntry = { view: "Mi perfil", props: {} };
const incidents: PanelEntry = { view: "Incidentes", props: {} };
const incidentA: PanelEntry = { view: "Detalle Incidente", props: { reporteId: "a" } };
const incidentB: PanelEntry = { view: "Detalle Incidente", props: { reporteId: "b" } };

describe("panelRouter", () => {
    it("opens panels and restores the previous entry", () => {
        const first = openPanel(createPanelRouterState(), profile);
        const second = openPanel(first, incidents);

        expect(second.current).toEqual(incidents);
        expect(second.history).toEqual([profile]);
        expect(hasPreviousPanel(second)).toBe(true);

        const previous = backPanel(second);
        expect(previous.current).toEqual(profile);
        expect(previous.history).toEqual([]);
        expect(hasPreviousPanel(previous)).toBe(false);
    });

    it("keeps history entries distinct when their props differ", () => {
        const state = openPanel(openPanel(openPanel(createPanelRouterState(), incidentA), incidents), incidentB);

        expect(state.history).toEqual([incidentA, incidents]);
        expect(backPanel(state).current).toEqual(incidents);
        expect(backPanel(backPanel(state)).current).toEqual(incidentA);
    });

    it("replaces the current panel without adding it to history", () => {
        const state = openPanel(openPanel(createPanelRouterState(), profile), incidents);
        const replaced = openPanel(state, incidentA, { replace: true });

        expect(replaced.current).toEqual(incidentA);
        expect(replaced.history).toEqual([profile]);
    });

    it("removes a replaced destination from history", () => {
        const state = openPanel(openPanel(openPanel(createPanelRouterState(), profile), incidents), profile);
        const replaced = openPanel(state, incidents, { replace: true });

        expect(replaced.current).toEqual(incidents);
        expect(replaced.history).toEqual([profile]);
    });

    it("does not add duplicate current entries", () => {
        const state = openPanel(createPanelRouterState(), incidentA);

        expect(openPanel(state, incidentA)).toBe(state);
    });

    it("does not change state when there is no previous panel", () => {
        const state = openPanel(createPanelRouterState(), profile);

        expect(backPanel(state)).toBe(state);
    });

    it("clears the current panel and history when closed", () => {
        const state = openPanel(openPanel(createPanelRouterState(), profile), incidents);

        expect(closePanel(state)).toEqual({ current: null, history: [] });
        expect(state.history).toEqual([profile]);
    });
});
