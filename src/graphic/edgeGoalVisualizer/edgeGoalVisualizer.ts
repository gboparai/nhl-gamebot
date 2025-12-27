import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import {createCanvas, Image, loadImage} from "canvas";
import GIFEncoder from "gif-encoder-2";

/** Single player or puck entity on the ice */
export interface OnIceEntity {
    /** Internal tracking ID (string key mirrors this) */
    id: number;

    /** NHL player ID (empty string for puck) */
    playerId: number | "";

    /** X coordinate on rink (NHL EDGE coordinate space) */
    x: number;

    /** Y coordinate on rink (NHL EDGE coordinate space) */
    y: number;

    /** Jersey number (empty string for puck) */
    sweaterNumber: number | "";

    /** NHL team ID (empty string for puck) */
    teamId: number | "";

    /** Team abbreviation (empty string for puck) */
    teamAbbrev: string;
}

/** On-ice snapshot at a specific moment */
export interface TrackingFrame {

    /** Timestamp in NHL EDGE clock units */
    timeStamp: number;

    /**
     * All entities on ice, keyed by tracking ID.
     * Includes players + puck (id === 1).
     */
    onIce: Record<string, OnIceEntity>;
}

/** Full file payload */
export type TrackingData = TrackingFrame[];

