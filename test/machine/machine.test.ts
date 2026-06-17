import { beforeEach, describe, expect, it } from "vitest";
import { interpret, InterpreterFrom } from "xstate";
import { GameMachine, GameModel, makeGame } from "../../src/machine/GameMachine";
import { canDropGuard } from "../../src/machine/guards";
import { GameContext, PlayerColor, GameStates} from "../../src/types";

describe("machine/GameMachine", () => {
  describe("join", () => {
    let machine: InterpreterFrom<typeof GameMachine>;

    beforeEach(() => {
      machine = interpret(GameMachine).start();
    });
    it("should let a player join", () => {
      expect(machine.send(GameModel.events.join("1", "1")).changed).toBe(true);
      expect(machine.state.context.players).toHaveLength(1);
      expect(machine.send(GameModel.events.join("2", "2")).changed).toBe(true);
      expect(machine.state.context.players).toHaveLength(2);
    });
    it("should not let me join a game twice", () => {
      expect(machine.send(GameModel.events.join("1", "1")).changed).toBe(true);
      expect(machine.send(GameModel.events.join("1", "1")).changed).toBe(false);
    });
  });
  describe("dropToken", () => {


    let machine: InterpreterFrom<typeof GameMachine>

    beforeEach(() => {
      machine = makeGame(GameStates.PLAY,  {
        players: [
          {
            id: "1",
            name: "1",
            color: PlayerColor.RED,
          },
          {
            id: "2",
            name: "2",
            color: PlayerColor.YELLOW,
          },
        ],
        currentPlayer: "1",
        grid: [
          ["E", "E", "E", "E", "E", "E", "R"],
          ["E", "E", "E", "E", "E", "R", "Y"],
          ["E", "E", "E", "E", "E", "R", "R"],
          ["E", "E", "E", "E", "E", "R", "Y"],
          ["E", "E", "E", "E", "E", "Y", "R"],
          ["E", "E", "E", "E", "E", "Y", "Y"],
        ],
      });
    })

    it("should let me drop a token", () => {
      expect(machine.send(GameModel.events.dropToken("1", 0)).changed).toBe(true)
      expect(machine.state.context.grid[5][0]).toBe(PlayerColor.RED)
      expect(machine.state.value).toBe(GameStates.PLAY)
      expect(machine.state.context.currentPlayer).toBe("2")
    });

    it("should not let me drop a token", () => {
      expect(machine.send(GameModel.events.dropToken("1", 6)).changed).toBe(false)
    });

    it("should make me win", () => {
      expect(machine.send(GameModel.events.dropToken("1", 5)).changed).toBe(true)
      expect(machine.state.value).toBe(GameStates.VICTORY)
      expect(machine.state.context.winningPositions).toHaveLength(4)
    });

    it("should handle draw", () => {
      machine = makeGame(GameStates.PLAY, {
        ...machine.state.context,
        grid: [
          ["E", "Y", "Y", "Y", "Y", "Y", "Y"],
          ["Y", "Y", "Y", "Y", "Y", "Y", "Y"],
          ["Y", "Y", "Y", "Y", "Y", "Y", "Y"],
          ["Y", "Y", "Y", "Y", "Y", "Y", "Y"],
          ["Y", "Y", "Y", "Y", "Y", "Y", "Y"],
          ["Y", "Y", "Y", "Y", "Y", "Y", "Y"],
        ],
      })
      expect(machine.send(GameModel.events.dropToken("1", 0)).changed).toBe(true)
      expect(machine.state.value).toBe(GameStates.DRAW)
    })

    it("should not let the wrong player drop a token", () => {
      expect(machine.send(GameModel.events.dropToken("2", 0)).changed).toBe(false)
    })
  });

  describe("join (capacity)", () => {
    it("should not let a third player join", () => {
      const machine = interpret(GameMachine).start()
      machine.send(GameModel.events.join("1", "Alice"))
      machine.send(GameModel.events.join("2", "Bob"))
      expect(machine.send(GameModel.events.join("3", "Carol")).changed).toBe(false)
      expect(machine.state.context.players).toHaveLength(2)
    })
  })

  describe("leave", () => {
    let machine: InterpreterFrom<typeof GameMachine>

    beforeEach(() => {
      machine = interpret(GameMachine).start()
      machine.send(GameModel.events.join("1", "Alice"))
    })

    it("should let a player leave", () => {
      expect(machine.send(GameModel.events.leave("1")).changed).toBe(true)
      expect(machine.state.context.players).toHaveLength(0)
    })

    it("should not let a non-member leave", () => {
      expect(machine.send(GameModel.events.leave("99")).changed).toBe(false)
    })
  })

  describe("chooseColor", () => {
    let machine: InterpreterFrom<typeof GameMachine>

    beforeEach(() => {
      machine = interpret(GameMachine).start()
      machine.send(GameModel.events.join("1", "Alice"))
      machine.send(GameModel.events.join("2", "Bob"))
    })

    it("should let a player choose a color", () => {
      expect(machine.send(GameModel.events.chooseColor("1", PlayerColor.RED)).changed).toBe(true)
      expect(machine.state.context.players.find(p => p.id === "1")?.color).toBe(PlayerColor.RED)
    })

    it("should not let two players pick the same color", () => {
      machine.send(GameModel.events.chooseColor("1", PlayerColor.RED))
      expect(machine.send(GameModel.events.chooseColor("2", PlayerColor.RED)).changed).toBe(false)
    })

    it("should let a player change their color", () => {
      machine.send(GameModel.events.chooseColor("1", PlayerColor.RED))
      expect(machine.send(GameModel.events.chooseColor("1", PlayerColor.YELLOW)).changed).toBe(true)
      expect(machine.state.context.players.find(p => p.id === "1")?.color).toBe(PlayerColor.YELLOW)
    })

    it("should not let a non-player choose a color", () => {
      expect(machine.send(GameModel.events.chooseColor("99", PlayerColor.RED)).changed).toBe(false)
    })
  })

  describe("start", () => {
    it("should transition to PLAY when both players have colors", () => {
      const machine = interpret(GameMachine).start()
      machine.send(GameModel.events.join("1", "Alice"))
      machine.send(GameModel.events.join("2", "Bob"))
      machine.send(GameModel.events.chooseColor("1", PlayerColor.RED))
      machine.send(GameModel.events.chooseColor("2", PlayerColor.YELLOW))
      expect(machine.send(GameModel.events.start("1")).changed).toBe(true)
      expect(machine.state.value).toBe(GameStates.PLAY)
    })

    it("should not start when a player has no color", () => {
      const machine = interpret(GameMachine).start()
      machine.send(GameModel.events.join("1", "Alice"))
      machine.send(GameModel.events.join("2", "Bob"))
      machine.send(GameModel.events.chooseColor("1", PlayerColor.RED))
      expect(machine.send(GameModel.events.start("1")).changed).toBe(false)
      expect(machine.state.value).toBe(GameStates.LOBBY)
    })

    it("should set the yellow player as the first to move", () => {
      const machine = interpret(GameMachine).start()
      machine.send(GameModel.events.join("1", "Alice"))
      machine.send(GameModel.events.join("2", "Bob"))
      machine.send(GameModel.events.chooseColor("1", PlayerColor.RED))
      machine.send(GameModel.events.chooseColor("2", PlayerColor.YELLOW))
      machine.send(GameModel.events.start("1"))
      expect(machine.state.context.currentPlayer).toBe("2")
    })
  })

  describe("restart", () => {
    const players = [
      { id: "1", name: "Alice", color: PlayerColor.RED },
      { id: "2", name: "Bob", color: PlayerColor.YELLOW },
    ]

    it("should return to LOBBY from VICTORY and reset the board", () => {
      const machine = makeGame(GameStates.VICTORY, {
        players,
        currentPlayer: "1",
        winningPositions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
      })
      expect(machine.send(GameModel.events.restart("1")).changed).toBe(true)
      expect(machine.state.value).toBe(GameStates.LOBBY)
      expect(machine.state.context.winningPositions).toHaveLength(0)
      expect(machine.state.context.currentPlayer).toBeNull()
      expect(machine.state.context.grid).toEqual(GameModel.initialContext.grid)
    })

    it("should return to LOBBY from DRAW and reset the board", () => {
      const machine = makeGame(GameStates.DRAW, { players, currentPlayer: "1" })
      expect(machine.send(GameModel.events.restart("1")).changed).toBe(true)
      expect(machine.state.value).toBe(GameStates.LOBBY)
      expect(machine.state.context.grid).toEqual(GameModel.initialContext.grid)
    })
  })
});
