import React from "react";
import { ImageResponse } from "@vercel/og";
import { getNopeEntityById } from "../src/nopeData.js";

export const config = {
  runtime: "edge",
};

const CARD_SIZE = {
  width: 1200,
  height: 630,
};

function formatDropChance(chance) {
  return `${Number(chance).toFixed(chance < 1 ? 2 : 1).replace(/\.?0+$/, "")}%`;
}

function getBaseUrl(req) {
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "nope-neon.vercel.app";

  return `${protocol}://${host}`;
}

function getDiscoveryTitle(entity) {
  if (!entity) {
    return "NOPE NOT FOUND";
  }

  if (entity.type === "uber") {
    return "UBER NOPE FOUND";
  }

  if (entity.type === "mythic") {
    return "MYTHIC WASTE FOUND";
  }

  if (entity.type === "gif") {
    return "FORBIDDEN LOOP DISCOVERED";
  }

  return "NOPEDEX DISCOVERY";
}

function getRarityAccent(entity) {
  if (!entity) {
    return "#9cff8f";
  }

  const rarityColors = {
    common: "#d8ffe2",
    uncommon: "#39ff14",
    rare: "#0098ea",
    epic: "#ff2bd6",
    forbidden: "#ff3d3d",
    mythic: "#ffd34d",
    uber: "#fff06a",
  };

  return rarityColors[entity.rarity] || "#39ff14";
}

function createCard(req, entity) {
  const baseUrl = getBaseUrl(req);
  const imageUrl = entity ? `${baseUrl}${entity.image}` : `${baseUrl}/images/nopebutton.png`;
  const accent = getRarityAccent(entity);
  const title = getDiscoveryTitle(entity);

  return React.createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020806",
        backgroundImage:
          "linear-gradient(90deg, rgba(0,152,234,0.13) 1px, transparent 1px), linear-gradient(0deg, rgba(57,255,20,0.09) 1px, transparent 1px)",
        backgroundSize: "42px 42px, 42px 42px",
        fontFamily: "Arial Black, Arial, sans-serif",
        color: "#d8ffe2",
        padding: 36,
      },
    },
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: "8px solid #0098ea",
          boxShadow: `0 0 0 6px #001a12, 0 0 48px ${accent}`,
          backgroundColor: "#07120d",
          position: "relative",
          overflow: "hidden",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "100% 8px",
          opacity: 0.38,
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            height: 74,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0098ea",
            color: "#00110a",
            borderBottom: "6px solid #00110a",
            padding: "0 28px",
            fontSize: 31,
            letterSpacing: 0,
          },
        },
        React.createElement("span", null, "NOPEDEX / $NOPE"),
        React.createElement("span", { style: { color: "#39ff14" } }, "VALUE: ZERO")
      ),
      React.createElement(
        "div",
        {
          style: {
            flex: 1,
            display: "flex",
            gap: 34,
            padding: 34,
            position: "relative",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              width: 430,
              height: 430,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#020806",
              border: `8px solid ${accent}`,
              boxShadow: "inset 0 0 0 5px #00110a",
              padding: 16,
            },
          },
          React.createElement("img", {
            src: imageUrl,
            alt: entity ? entity.name : "NOPE",
            style: {
              width: "100%",
              height: "100%",
              objectFit: "contain",
            },
          })
        ),
        React.createElement(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                alignSelf: "flex-start",
                backgroundColor: "#00110a",
                color: accent,
                border: `4px solid ${accent}`,
                padding: "8px 14px",
                fontSize: 27,
                marginBottom: 18,
              },
            },
            title
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "#ffffff",
                fontSize: entity && entity.name.length > 18 ? 58 : 70,
                lineHeight: 0.94,
                textShadow: "5px 5px 0 #00110a, -3px 0 0 #ff2bd6",
                marginBottom: 20,
              },
            },
            entity ? entity.name : "NOPE NOT FOUND"
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                gap: 12,
                marginBottom: 20,
              },
            },
            React.createElement(
              "span",
              {
                style: {
                  backgroundColor: accent,
                  color: "#00110a",
                  padding: "9px 14px",
                  fontSize: 25,
                },
              },
              entity ? entity.rarityLabel : "ERROR GARBAGE"
            ),
            React.createElement(
              "span",
              {
                style: {
                  backgroundColor: "#00110a",
                  color: "#39ff14",
                  border: "3px solid #39ff14",
                  padding: "7px 14px",
                  fontSize: 25,
                },
              },
              entity ? `drop: ${formatDropChance(entity.dropChance)}` : "drop: nope"
            )
          ),
          React.createElement(
            "p",
            {
              style: {
                color: "#d8ffe2",
                fontSize: 32,
                lineHeight: 1.15,
                margin: "0 0 18px",
              },
            },
            entity ? entity.caption : "probably your fault."
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "#9cff8f",
                fontSize: 28,
              },
            },
            entity?.type === "uber"
              ? "probability has been insulted."
              : "value gained: zero."
          )
        )
      )
    )
  );
}

export default function handler(req) {
  const id = new URL(req.url).searchParams.get("id");
  const entity = getNopeEntityById(id);

  return new ImageResponse(createCard(req, entity), CARD_SIZE);
}
