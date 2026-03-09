# Management/Judgement — Game Rules ♠️ ♥️ ♣️ ♦️

## Overview

Management/Judgement is a trick-taking card game for **3–6 players**. Players predict how many tricks they'll win each round. This app tracks bids, results, and scores across all rounds.

## Seating Order

Before the first play, arrange players in **clockwise seating order** using the ← → arrows.

This matters because:

- The **dealer** rotates clockwise each round
- The dealer bids last and has a restricted bid (total bids ≠ card count)
- Wrong seating order means the wrong player gets the dealer disadvantage

## Rounds & Cards

Cards per round go from max down to 1, then back up to max.

Max cards = floor(52 ÷ players)

| Players | Max Cards | Total Rounds |
|---------|-----------|--------------|
| 3       | 17        | 33           |
| 4       | 13        | 25           |
| 5       | 10        | 19           |
| 6       | 8         | 15           |

## Trump Rotation

Trump suit cycles each round:

♠️ Spades → ♥️ Hearts → ♣️ Clubs → ♦️ Diamonds → repeat

## Bidding Rules

- Predict tricks you'll win (0 to card count)
- Dealer bids last — total bids **cannot** equal the card count

## Scoring

| Situation          | Points    | Example                |
|--------------------|-----------|------------------------|
| Bid met (bid > 0)  | bid × 10  | Bid 3, won 3 → **30** |
| Bid zero met       | 10        | Bid 0, won 0 → **10** |
| Bid missed         | 0         | Bid 3, won 5 → **0**  |

## Reading the Scoreboard

- Large number = **score** for that round
- Small colored badges: blue = bid, green = result
- Green cell background = bid met, red cell = missed
- Header shows cumulative scores, 👑 for the leader

## Winning

Highest total score after all rounds wins.
